import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientesRepository } from '../clientes/clientes.repository';
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
  ) {}

  async registrar(
    dto: CreateVendaDto,
    funcionarioId: number,
  ): Promise<VendaResponseDto> {
    const vendaId = await this.repository.registrarVendaComTransacao({
      funcionarioId,
      clienteId: dto.clienteId,
      itens: dto.itens,
      desconto: dto.desconto ?? 0,
      formaPagamento: dto.formaPagamento,
    });
    return this.findById(vendaId);
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
