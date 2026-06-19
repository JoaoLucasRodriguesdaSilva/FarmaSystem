import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostgresService } from '../../database/postgres/postgres.service';
import { calcularStatusEstoque } from '../../common/enums/status-estoque.enum';
import { TipoMovimentacao } from '../../common/enums/tipo-movimentacao.enum';
import { ArquivosService } from '../arquivos/arquivos.service';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { ListMedicamentosQueryDto } from './dto/list-medicamentos-query.dto';
import {
  MedicamentoDetalheDto,
  MedicamentoResponseDto,
  MedicamentosPageDto,
} from './dto/medicamento-response.dto';
import { UpdateMedicamentoDto } from './dto/update-medicamento.dto';
import {
  MedicamentoRecord,
  MedicamentosRepository,
} from './medicamentos.repository';

interface ArquivosUpload {
  imagens?: Express.Multer.File[];
  bula?: Express.Multer.File[];
}

@Injectable()
export class MedicamentosService {
  private readonly baseUrl: string;

  constructor(
    private readonly repository: MedicamentosRepository,
    private readonly arquivos: ArquivosService,
    private readonly db: PostgresService,
    config: ConfigService,
  ) {
    this.baseUrl = config
      .get<string>('APP_PUBLIC_URL', 'http://localhost:3000/api/v1')
      .replace(/\/$/, '');
  }

  async findAll(query: ListMedicamentosQueryDto): Promise<MedicamentosPageDto> {
    const { dados, total } = await this.repository.findAll(query);
    return {
      dados: dados.map((m) => this.toResponse(m)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findDetalhe(id: number): Promise<MedicamentoDetalheDto> {
    const record = await this.buscarOuFalhar(id);
    const lotes = await this.repository.findLotes(id);
    return {
      ...this.toResponse(record),
      bulaUrl: record.bulaId ? `${this.baseUrl}/medicamentos/${id}/bula` : undefined,
      lotes,
    };
  }

  async create(
    dto: CreateMedicamentoDto,
    files: ArquivosUpload,
    usuarioId: number,
  ): Promise<MedicamentoDetalheDto> {
    const imagens = files.imagens ?? [];
    const bula = files.bula?.[0];

    this.validarTiposDeArquivo(imagens, bula);

    const criarLoteInicial = (dto.unidadesIniciais ?? 0) > 0;
    if (criarLoteInicial && (!dto.validadeMinima || !dto.lote)) {
      throw new UnprocessableEntityException({
        codigo: 'LOTE_INICIAL_INCOMPLETO',
        message:
          'Para registrar unidades iniciais, informe também o lote e a validade.',
      });
    }

    // 1) Sobe mídias ao GridFS (fora da transação relacional).
    const imagensIds: string[] = [];
    let bulaId: string | undefined;
    try {
      for (const img of imagens) {
        imagensIds.push(await this.arquivos.uploadImagem(img));
      }
      if (bula) {
        bulaId = await this.arquivos.uploadPdf(bula);
      }
    } catch (err) {
      await this.limparMidias(imagensIds, bulaId);
      throw err;
    }

    // 2) Persiste no PostgreSQL de forma atômica (medicamento + lote + entrada).
    const estoqueAtual = criarLoteInicial ? (dto.unidadesIniciais as number) : 0;
    try {
      const record = await this.db.transaction(async (client) => {
        const medicamento = await this.repository.create(
          {
            nome: dto.nome,
            principioAtivo: dto.principioAtivo,
            categoria: dto.categoria,
            fabricante: dto.fabricante,
            viaAdministracao: dto.viaAdministracao,
            apresentacao: dto.apresentacao,
            restricaoVenda: dto.restricaoVenda,
            preco: dto.preco,
            estoqueMinimo: dto.estoqueMinimo,
            estoqueAtual,
            statusEstoque: calcularStatusEstoque(estoqueAtual, dto.estoqueMinimo),
            fornecedorId: dto.fornecedorId,
            imagensIds,
            bulaId,
          },
          client,
        );

        if (criarLoteInicial) {
          const lote = await client.query<{ id: number }>(
            `INSERT INTO lotes (medicamento_id, codigo_lote, quantidade, data_validade)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [medicamento.id, dto.lote, estoqueAtual, dto.validadeMinima],
          );
          await client.query(
            `INSERT INTO movimentacoes_estoque
              (medicamento_id, lote_id, tipo, quantidade, motivo, usuario_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              medicamento.id,
              lote.rows[0].id,
              TipoMovimentacao.ENTRADA,
              estoqueAtual,
              'Estoque inicial do cadastro',
              usuarioId,
            ],
          );
        }

        return medicamento;
      });

      const lotes = await this.repository.findLotes(record.id);
      return {
        ...this.toResponse(record),
        bulaUrl: bulaId ? `${this.baseUrl}/medicamentos/${record.id}/bula` : undefined,
        lotes,
      };
    } catch (err) {
      // Rollback das mídias se o relacional falhar.
      await this.limparMidias(imagensIds, bulaId);
      throw err;
    }
  }

  async update(
    id: number,
    dto: UpdateMedicamentoDto,
  ): Promise<MedicamentoResponseDto> {
    await this.buscarOuFalhar(id);
    const atualizado = await this.repository.update(
      id,
      dto as Record<string, unknown>,
    );
    if (!atualizado) {
      throw this.naoEncontrado(id);
    }
    return this.toResponse(atualizado);
  }

  async remove(id: number): Promise<void> {
    const removido = await this.repository.softDelete(id);
    if (!removido) {
      throw this.naoEncontrado(id);
    }
  }

  async getImagem(id: number, imageId: string) {
    const record = await this.buscarOuFalhar(id);
    if (!record.imagensIds.includes(imageId)) {
      throw new NotFoundException({
        codigo: 'IMAGEM_NAO_ENCONTRADA',
        message: 'Imagem não pertence a este medicamento.',
      });
    }
    return this.arquivos.getImagemStream(imageId);
  }

  async getBula(id: number) {
    const record = await this.buscarOuFalhar(id);
    if (!record.bulaId) {
      throw new NotFoundException({
        codigo: 'BULA_NAO_ENCONTRADA',
        message: 'Este medicamento não possui bula cadastrada.',
      });
    }
    return this.arquivos.getBulaStream(record.bulaId);
  }

  private async buscarOuFalhar(id: number): Promise<MedicamentoRecord> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw this.naoEncontrado(id);
    }
    return record;
  }

  private naoEncontrado(id: number): NotFoundException {
    return new NotFoundException({
      codigo: 'MEDICAMENTO_NAO_ENCONTRADO',
      message: `Medicamento ${id} não encontrado.`,
    });
  }

  private toResponse(record: MedicamentoRecord): MedicamentoResponseDto {
    return {
      id: record.id,
      nome: record.nome,
      principioAtivo: record.principioAtivo,
      categoria: record.categoria,
      fabricante: record.fabricante,
      viaAdministracao: record.viaAdministracao,
      apresentacao: record.apresentacao,
      restricaoVenda: record.restricaoVenda,
      preco: record.preco,
      estoqueAtual: record.estoqueAtual,
      estoqueMinimo: record.estoqueMinimo,
      statusEstoque: record.statusEstoque,
      fornecedorId: record.fornecedorId,
      imagens: record.imagensIds.map(
        (objectId) => `${this.baseUrl}/medicamentos/${record.id}/imagens/${objectId}`,
      ),
    };
  }

  private validarTiposDeArquivo(
    imagens: Express.Multer.File[],
    bula?: Express.Multer.File,
  ): void {
    for (const img of imagens) {
      if (!img.mimetype.startsWith('image/')) {
        throw new UnprocessableEntityException({
          codigo: 'ARQUIVO_INVALIDO',
          message: `O arquivo "${img.originalname}" não é uma imagem válida.`,
        });
      }
    }
    if (bula && bula.mimetype !== 'application/pdf') {
      throw new UnprocessableEntityException({
        codigo: 'ARQUIVO_INVALIDO',
        message: 'A bula deve ser um arquivo PDF.',
      });
    }
  }

  private async limparMidias(
    imagensIds: string[],
    bulaId?: string,
  ): Promise<void> {
    await Promise.all(imagensIds.map((id) => this.arquivos.deleteImagem(id)));
    if (bulaId) {
      await this.arquivos.deleteBula(bulaId);
    }
  }
}
