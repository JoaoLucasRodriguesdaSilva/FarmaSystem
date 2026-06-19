import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostgresService } from '../../database/postgres/postgres.service';
import { TipoMovimentacao } from '../../common/enums/tipo-movimentacao.enum';
import { MedicamentosRepository } from '../medicamentos/medicamentos.repository';
import { CreateLoteDto } from './dto/create-lote.dto';
import { CreateMovimentacaoDto } from './dto/create-movimentacao.dto';
import {
  ListEstoqueQueryDto,
  ListLotesQueryDto,
  ListMovimentacoesQueryDto,
} from './dto/estoque-queries.dto';
import {
  EstoquePageDto,
  MovimentacaoResponseDto,
} from './dto/estoque-response.dto';
import { LoteResponseDto } from './dto/lote-response.dto';
import { LotesRepository } from './repositories/lotes.repository';
import { MovimentacoesRepository } from './repositories/movimentacoes.repository';

@Injectable()
export class EstoqueService {
  constructor(
    private readonly db: PostgresService,
    private readonly medicamentos: MedicamentosRepository,
    private readonly lotes: LotesRepository,
    private readonly movimentacoes: MovimentacoesRepository,
  ) {}

  async listarEstoque(query: ListEstoqueQueryDto): Promise<EstoquePageDto> {
    const { dados, total } = await this.medicamentos.listarEstoque(query);
    return { dados, total, page: query.page, limit: query.limit };
  }

  async listarLotes(query: ListLotesQueryDto): Promise<LoteResponseDto[]> {
    return this.lotes.findAll(query);
  }

  async listarMovimentacoes(
    query: ListMovimentacoesQueryDto,
  ): Promise<MovimentacaoResponseDto[]> {
    return this.movimentacoes.findAll(query);
  }

  /**
   * Adiciona um lote: cria o registro em `lotes`, soma a quantidade ao
   * `estoque_atual` do medicamento e registra a `entrada` — tudo numa transação.
   */
  async adicionarLote(
    dto: CreateLoteDto,
    usuarioId: number,
  ): Promise<LoteResponseDto> {
    return this.db.transaction(async (client) => {
      const existe = await this.medicamentos.lockEstoque(
        dto.medicamentoId,
        client,
      );
      if (!existe) {
        throw new NotFoundException({
          codigo: 'MEDICAMENTO_NAO_ENCONTRADO',
          message: `Medicamento ${dto.medicamentoId} não encontrado.`,
        });
      }

      const lote = await this.lotes.create(
        {
          medicamentoId: dto.medicamentoId,
          codigoLote: dto.codigoLote,
          quantidade: dto.quantidade,
          dataValidade: dto.dataValidade,
        },
        client,
      );

      await this.medicamentos.aplicarDeltaEstoque(
        dto.medicamentoId,
        dto.quantidade,
        client,
      );

      await this.movimentacoes.create(
        {
          medicamentoId: dto.medicamentoId,
          loteId: lote.id,
          tipo: TipoMovimentacao.ENTRADA,
          quantidade: dto.quantidade,
          motivo: 'Entrada de lote',
          usuarioId,
        },
        client,
      );

      return lote;
    });
  }

  /**
   * Registra movimentação manual (entrada/saída). Saída valida estoque
   * suficiente (409). Tudo atômico, com lock do medicamento.
   */
  async registrarMovimentacao(
    dto: CreateMovimentacaoDto,
    usuarioId: number,
  ): Promise<MovimentacaoResponseDto> {
    return this.db.transaction(async (client) => {
      const estoque = await this.medicamentos.lockEstoque(
        dto.medicamentoId,
        client,
      );
      if (!estoque) {
        throw new NotFoundException({
          codigo: 'MEDICAMENTO_NAO_ENCONTRADO',
          message: `Medicamento ${dto.medicamentoId} não encontrado.`,
        });
      }

      const saida = dto.tipo === TipoMovimentacao.SAIDA;
      if (saida && estoque.estoqueAtual < dto.quantidade) {
        throw new ConflictException({
          codigo: 'ESTOQUE_INSUFICIENTE',
          message: 'Estoque insuficiente para a saída solicitada.',
          detalhes: {
            disponivel: estoque.estoqueAtual,
            solicitado: dto.quantidade,
          },
        });
      }

      const delta = saida ? -dto.quantidade : dto.quantidade;
      await this.medicamentos.aplicarDeltaEstoque(
        dto.medicamentoId,
        delta,
        client,
      );

      if (dto.loteId) {
        await this.lotes.ajustarQuantidade(dto.loteId, delta, client);
      }

      return this.movimentacoes.create(
        {
          medicamentoId: dto.medicamentoId,
          loteId: dto.loteId,
          tipo: dto.tipo,
          quantidade: dto.quantidade,
          motivo: dto.motivo,
          usuarioId,
        },
        client,
      );
    });
  }
}
