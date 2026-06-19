import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RestricaoVenda } from '../../common/enums/restricao-venda.enum';
import { StatusReceita } from '../../common/enums/status-receita.enum';
import { ClientesRepository } from '../clientes/clientes.repository';
import { MedicamentosRepository } from '../medicamentos/medicamentos.repository';
import { ReceitasService } from '../receitas/receitas.service';
import { UsuariosRepository } from '../usuarios/usuarios.repository';
import { CancelarVendaDto } from './dto/cancelar-venda.dto';
import { CreateVendaDto } from './dto/create-venda.dto';
import { ListVendasQueryDto } from './dto/list-vendas-query.dto';
import {
  ResumoTurnoDto,
  VendaResponseDto,
  VendasPageDto,
} from './dto/venda-response.dto';
import { DadosComprovante } from './pdf-receipt.service';
import { VendasRepository } from './vendas.repository';

@Injectable()
export class VendasService {
  constructor(
    private readonly repository: VendasRepository,
    private readonly usuarios: UsuariosRepository,
    private readonly clientes: ClientesRepository,
    private readonly medicamentos: MedicamentosRepository,
    private readonly receitas: ReceitasService,
  ) {}

  async registrar(
    dto: CreateVendaDto,
    funcionarioId: number,
  ): Promise<VendaResponseDto> {
    await this.validarReceitaSeNecessario(dto);

    const vendaId = await this.repository.registrarVendaComTransacao({
      funcionarioId,
      clienteId: dto.clienteId,
      receitaId: dto.receitaId,
      itens: dto.itens,
      desconto: dto.desconto ?? 0,
      formaPagamento: dto.formaPagamento,
    });
    return this.findById(vendaId);
  }

  /**
   * Itens controlados/uso hospitalar só podem ser vendidos com uma receita
   * APROVADA que os cubra. Faz a checagem antes da transação para devolver
   * erros claros: 422 se faltar receita, 409 se não aprovada ou não cobrir.
   */
  private async validarReceitaSeNecessario(dto: CreateVendaDto): Promise<void> {
    const idsDistintos = [...new Set(dto.itens.map((i) => i.medicamentoId))];

    const controlados: number[] = [];
    for (const medicamentoId of idsDistintos) {
      const med = await this.medicamentos.findById(medicamentoId);
      if (!med) {
        throw new NotFoundException({
          codigo: 'MEDICAMENTO_NAO_ENCONTRADO',
          message: `Medicamento ${medicamentoId} não encontrado.`,
        });
      }
      if (med.restricaoVenda !== RestricaoVenda.VENDA_LIVRE) {
        controlados.push(medicamentoId);
      }
    }

    if (controlados.length === 0) return;

    if (!dto.receitaId) {
      throw new UnprocessableEntityException({
        codigo: 'VENDA_RECEITA_OBRIGATORIA',
        message:
          'Há itens controlados no carrinho. Informe uma receita aprovada.',
        detalhes: { medicamentos: controlados },
      });
    }

    const receita = await this.receitas.findById(dto.receitaId);
    if (receita.status !== StatusReceita.APROVADA) {
      throw new ConflictException({
        codigo: 'VENDA_RECEITA_NAO_APROVADA',
        message: 'A receita informada ainda não foi aprovada pelo farmacêutico.',
        detalhes: { receitaId: receita.id, status: receita.status },
      });
    }

    const cobertos = new Set(receita.medicamentos.map((m) => m.medicamentoId));
    const faltantes = controlados.filter((id) => !cobertos.has(id));
    if (faltantes.length > 0) {
      throw new ConflictException({
        codigo: 'VENDA_RECEITA_NAO_COBRE',
        message:
          'A receita não cobre todos os itens controlados do carrinho.',
        detalhes: { medicamentos: faltantes },
      });
    }
  }

  async findById(id: number): Promise<VendaResponseDto> {
    const venda = await this.repository.findById(id);
    if (!venda) {
      throw new NotFoundException({
        codigo: 'VENDA_NAO_ENCONTRADA',
        message: `Venda ${id} não encontrada.`,
      });
    }
    return venda;
  }

  async listar(query: ListVendasQueryDto): Promise<VendasPageDto> {
    const { dados, total } = await this.repository.findAll(query);
    return { dados, total, page: query.page, limit: query.limit };
  }

  async listarMinhas(
    funcionarioId: number,
    query: ListVendasQueryDto,
  ): Promise<VendasPageDto> {
    const { dados, total } = await this.repository.findAll({
      ...query,
      funcionarioId,
    });
    return { dados, total, page: query.page, limit: query.limit };
  }

  async resumoTurno(funcionarioId: number): Promise<ResumoTurnoDto> {
    return this.repository.resumoTurno(funcionarioId);
  }

  async cancelar(
    id: number,
    dto: CancelarVendaDto,
    usuarioId: number,
  ): Promise<VendaResponseDto> {
    return this.repository.cancelarComTransacao(id, dto.motivo, usuarioId);
  }

  /** Reúne os dados (com nomes resolvidos) para a emissão do comprovante. */
  async dadosComprovante(id: number): Promise<DadosComprovante> {
    const venda = await this.findById(id);
    const funcionario = await this.usuarios.findById(venda.funcionarioId);
    const cliente = venda.clienteId
      ? await this.clientes.findById(venda.clienteId)
      : null;
    return {
      venda,
      funcionarioNome: funcionario?.nome,
      clienteNome: cliente?.nome,
    };
  }
}
