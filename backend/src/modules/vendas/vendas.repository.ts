import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { PostgresService } from '../../database/postgres/postgres.service';
import { FormaPagamento } from '../../common/enums/forma-pagamento.enum';
import { StatusVenda } from '../../common/enums/status-venda.enum';
import { TipoMovimentacao } from '../../common/enums/tipo-movimentacao.enum';
import { MedicamentosRepository } from '../medicamentos/medicamentos.repository';
import { AlertasRepository } from '../estoque/repositories/alertas.repository';
import { MovimentacoesRepository } from '../estoque/repositories/movimentacoes.repository';
import {
  ItemVendaResponseDto,
  ResumoTurnoDto,
  VendaResponseDto,
} from './dto/venda-response.dto';

interface VendaRow {
  id: number;
  codigo: string;
  funcionario_id: number;
  cliente_id: number | null;
  receita_id: number | null;
  subtotal: string;
  desconto: string;
  total: string;
  forma_pagamento: FormaPagamento;
  status: StatusVenda;
  criada_em: Date;
  cancelada_em: Date | null;
  motivo_cancelamento: string | null;
}

interface ItemRow {
  venda_id: number;
  medicamento_id: number;
  nome: string | null;
  quantidade: number;
  preco_unitario: string;
  subtotal: string;
}

export interface RegistrarVendaData {
  funcionarioId: number;
  clienteId?: number;
  receitaId?: number;
  itens: { medicamentoId: number; quantidade: number }[];
  desconto: number;
  formaPagamento: FormaPagamento;
}

interface ListarVendasFiltros {
  page: number;
  limit: number;
  funcionarioId?: number;
  status?: StatusVenda;
  dataInicio?: string;
  dataFim?: string;
}

@Injectable()
export class VendasRepository {
  constructor(
    private readonly db: PostgresService,
    private readonly medicamentos: MedicamentosRepository,
    private readonly movimentacoes: MovimentacoesRepository,
    private readonly alertas: AlertasRepository,
  ) {}

  private toResponse(
    row: VendaRow,
    itens: ItemVendaResponseDto[],
  ): VendaResponseDto {
    return {
      id: row.id,
      codigo: row.codigo,
      funcionarioId: row.funcionario_id,
      clienteId: row.cliente_id ?? undefined,
      receitaId: row.receita_id ?? undefined,
      itens,
      subtotal: Number(row.subtotal),
      desconto: Number(row.desconto),
      total: Number(row.total),
      formaPagamento: row.forma_pagamento,
      status: row.status,
      criadaEm: row.criada_em.toISOString(),
      canceladaEm: row.cancelada_em?.toISOString(),
      motivoCancelamento: row.motivo_cancelamento ?? undefined,
    };
  }

  /** Gera um código de venda legível e suficientemente único. */
  private gerarCodigo(): string {
    const base = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 1296)
      .toString(36)
      .toUpperCase()
      .padStart(2, '0');
    return `VND-${base}${rand}`;
  }

  /**
   * Registra a venda de forma atômica (BEGIN/COMMIT/ROLLBACK):
   * trava cada medicamento (FOR UPDATE), valida saldo (409), congela o preço,
   * grava `vendas` + `itens_venda`, debita `estoque_atual`, consome lotes por
   * validade mais próxima (FEFO) e registra as `movimentacoes_estoque` de saída.
   * Retorna o id da venda criada.
   */
  async registrarVendaComTransacao(data: RegistrarVendaData): Promise<number> {
    return this.db.transaction(async (client) => {
      // Consolida itens repetidos do mesmo medicamento.
      const consolidados = new Map<number, number>();
      for (const item of data.itens) {
        consolidados.set(
          item.medicamentoId,
          (consolidados.get(item.medicamentoId) ?? 0) + item.quantidade,
        );
      }

      let subtotalGeral = 0;
      const itensCalc: {
        medicamentoId: number;
        quantidade: number;
        precoUnitario: number;
        subtotal: number;
      }[] = [];

      for (const [medicamentoId, quantidade] of consolidados) {
        const med = await this.medicamentos.lockParaVenda(medicamentoId, client);
        if (!med) {
          throw new NotFoundException({
            codigo: 'MEDICAMENTO_NAO_ENCONTRADO',
            message: `Medicamento ${medicamentoId} não encontrado.`,
          });
        }
        if (med.estoqueAtual < quantidade) {
          throw new ConflictException({
            codigo: 'VENDA_ESTOQUE_INSUFICIENTE',
            message: `Estoque insuficiente para ${med.nome}`,
            detalhes: {
              medicamentoId,
              disponivel: med.estoqueAtual,
              solicitado: quantidade,
            },
          });
        }
        const subtotal = this.arredondar(med.preco * quantidade);
        subtotalGeral += subtotal;
        itensCalc.push({
          medicamentoId,
          quantidade,
          precoUnitario: med.preco,
          subtotal,
        });
      }

      subtotalGeral = this.arredondar(subtotalGeral);
      const desconto = this.arredondar(Math.min(data.desconto, subtotalGeral));
      const total = this.arredondar(subtotalGeral - desconto);

      const { rows: vendaRows } = await client.query<{ id: number }>(
        `INSERT INTO vendas
          (codigo, funcionario_id, cliente_id, receita_id, subtotal, desconto,
           total, forma_pagamento, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'concluida')
         RETURNING id`,
        [
          this.gerarCodigo(),
          data.funcionarioId,
          data.clienteId ?? null,
          data.receitaId ?? null,
          subtotalGeral,
          desconto,
          total,
          data.formaPagamento,
        ],
      );
      const vendaId = vendaRows[0].id;

      for (const item of itensCalc) {
        await client.query(
          `INSERT INTO itens_venda
            (venda_id, medicamento_id, quantidade, preco_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            vendaId,
            item.medicamentoId,
            item.quantidade,
            item.precoUnitario,
            item.subtotal,
          ],
        );

        await this.medicamentos.aplicarDeltaEstoque(
          item.medicamentoId,
          -item.quantidade,
          client,
        );

        const consumo = await this.consumirLotesFefo(
          client,
          item.medicamentoId,
          item.quantidade,
        );

        // Uma movimentação de saída por lote consumido (com lote_id); o
        // eventual saldo sem lote vinculado gera uma saída com lote nulo.
        for (const parcela of consumo) {
          await this.movimentacoes.create(
            {
              medicamentoId: item.medicamentoId,
              loteId: parcela.loteId,
              tipo: TipoMovimentacao.SAIDA,
              quantidade: parcela.quantidade,
              motivo: `Venda ${vendaId}`,
              usuarioId: data.funcionarioId,
            },
            client,
          );
        }

        // A saída pode derrubar o saldo abaixo do mínimo: gera o alerta físico.
        await this.alertas.gerarAlertaEstoque(item.medicamentoId, client);
      }

      return vendaId;
    });
  }

  /**
   * Consome `quantidade` dos lotes do medicamento priorizando a validade mais
   * próxima (FEFO). Trava as linhas (FOR UPDATE) e retorna o consumo por lote.
   * Se os lotes não cobrirem tudo, o restante volta como uma parcela sem lote
   * (`loteId` indefinido) — `estoque_atual` permanece a fonte de verdade.
   */
  private async consumirLotesFefo(
    client: PoolClient,
    medicamentoId: number,
    quantidade: number,
  ): Promise<{ loteId?: number; quantidade: number }[]> {
    const { rows } = await client.query<{ id: number; quantidade: number }>(
      `SELECT id, quantidade FROM lotes
       WHERE medicamento_id = $1 AND quantidade > 0
       ORDER BY data_validade ASC, id ASC
       FOR UPDATE`,
      [medicamentoId],
    );

    const consumo: { loteId?: number; quantidade: number }[] = [];
    let restante = quantidade;

    for (const lote of rows) {
      if (restante <= 0) break;
      const usar = Math.min(lote.quantidade, restante);
      await client.query(`UPDATE lotes SET quantidade = quantidade - $2 WHERE id = $1`, [
        lote.id,
        usar,
      ]);
      consumo.push({ loteId: lote.id, quantidade: usar });
      restante -= usar;
    }

    if (restante > 0) {
      consumo.push({ quantidade: restante });
    }
    return consumo;
  }

  /**
   * Cancela a venda e reverte o estoque atomicamente: marca como `cancelada`,
   * credita de volta `estoque_atual` e registra movimentações de entrada
   * (estorno) por item. Retorna a venda atualizada.
   */
  async cancelarComTransacao(
    id: number,
    motivo: string,
    usuarioId: number,
  ): Promise<VendaResponseDto> {
    return this.db.transaction(async (client) => {
      const { rows } = await client.query<VendaRow>(
        `SELECT * FROM vendas WHERE id = $1 FOR UPDATE`,
        [id],
      );
      const venda = rows[0];
      if (!venda) {
        throw new NotFoundException({
          codigo: 'VENDA_NAO_ENCONTRADA',
          message: `Venda ${id} não encontrada.`,
        });
      }
      if (venda.status === StatusVenda.CANCELADA) {
        throw new ConflictException({
          codigo: 'VENDA_JA_CANCELADA',
          message: 'Esta venda já foi cancelada.',
        });
      }

      const { rows: itens } = await client.query<ItemRow>(
        `SELECT venda_id, medicamento_id, quantidade, preco_unitario, subtotal
         FROM itens_venda WHERE venda_id = $1`,
        [id],
      );

      for (const item of itens) {
        await this.medicamentos.aplicarDeltaEstoque(
          item.medicamento_id,
          item.quantidade,
          client,
        );
        await this.movimentacoes.create(
          {
            medicamentoId: item.medicamento_id,
            tipo: TipoMovimentacao.ENTRADA,
            quantidade: item.quantidade,
            motivo: `Estorno da venda ${id}`,
            usuarioId,
          },
          client,
        );
      }

      const { rows: atualizada } = await client.query<VendaRow>(
        `UPDATE vendas
         SET status = 'cancelada', cancelada_em = CURRENT_TIMESTAMP,
             motivo_cancelamento = $2
         WHERE id = $1
         RETURNING *`,
        [id, motivo],
      );

      const itensDto = await this.itensDaVenda(id);
      return this.toResponse(atualizada[0], itensDto);
    });
  }

  async findById(id: number): Promise<VendaResponseDto | null> {
    const { rows } = await this.db.query<VendaRow>(
      `SELECT * FROM vendas WHERE id = $1`,
      [id],
    );
    if (!rows[0]) return null;
    const itens = await this.itensDaVenda(id);
    return this.toResponse(rows[0], itens);
  }

  private async itensDaVenda(vendaId: number): Promise<ItemVendaResponseDto[]> {
    const { rows } = await this.db.query<ItemRow>(
      `SELECT i.venda_id, i.medicamento_id, m.nome, i.quantidade,
              i.preco_unitario, i.subtotal
       FROM itens_venda i
       LEFT JOIN medicamentos m ON m.id = i.medicamento_id
       WHERE i.venda_id = $1
       ORDER BY i.id ASC`,
      [vendaId],
    );
    return rows.map((r) => ({
      medicamentoId: r.medicamento_id,
      nome: r.nome ?? undefined,
      quantidade: r.quantidade,
      precoUnitario: Number(r.preco_unitario),
      subtotal: Number(r.subtotal),
    }));
  }

  async findAll(
    filtros: ListarVendasFiltros,
  ): Promise<{ dados: VendaResponseDto[]; total: number }> {
    const cond: string[] = [];
    const valores: unknown[] = [];
    if (filtros.funcionarioId) {
      valores.push(filtros.funcionarioId);
      cond.push(`funcionario_id = $${valores.length}`);
    }
    if (filtros.status) {
      valores.push(filtros.status);
      cond.push(`status = $${valores.length}`);
    }
    if (filtros.dataInicio) {
      valores.push(filtros.dataInicio);
      cond.push(`criada_em >= $${valores.length}`);
    }
    if (filtros.dataFim) {
      valores.push(filtros.dataFim);
      cond.push(`criada_em <= ($${valores.length}::date + INTERVAL '1 day')`);
    }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const offset = (filtros.page - 1) * filtros.limit;

    const total = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM vendas ${where}`,
      valores,
    );
    const { rows } = await this.db.query<VendaRow>(
      `SELECT * FROM vendas ${where}
       ORDER BY criada_em DESC
       LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, filtros.limit, offset],
    );

    const dados = await this.anexarItens(rows);
    return { dados, total: Number(total.rows[0]?.total ?? 0) };
  }

  /** Carrega os itens de várias vendas em uma única consulta (evita N+1). */
  private async anexarItens(rows: VendaRow[]): Promise<VendaResponseDto[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const { rows: itens } = await this.db.query<ItemRow>(
      `SELECT i.venda_id, i.medicamento_id, m.nome, i.quantidade,
              i.preco_unitario, i.subtotal
       FROM itens_venda i
       LEFT JOIN medicamentos m ON m.id = i.medicamento_id
       WHERE i.venda_id = ANY($1::int[])
       ORDER BY i.id ASC`,
      [ids],
    );

    const porVenda = new Map<number, ItemVendaResponseDto[]>();
    for (const r of itens) {
      const lista = porVenda.get(r.venda_id) ?? [];
      lista.push({
        medicamentoId: r.medicamento_id,
        nome: r.nome ?? undefined,
        quantidade: r.quantidade,
        precoUnitario: Number(r.preco_unitario),
        subtotal: Number(r.subtotal),
      });
      porVenda.set(r.venda_id, lista);
    }

    return rows.map((r) => this.toResponse(r, porVenda.get(r.id) ?? []));
  }

  /** Resumo do turno (hoje) do funcionário: total, quantidade e ticket médio. */
  async resumoTurno(funcionarioId: number): Promise<ResumoTurnoDto> {
    const { rows } = await this.db.query<{
      total_vendido: string | null;
      quantidade_vendas: string;
    }>(
      `SELECT COALESCE(SUM(total), 0) AS total_vendido,
              COUNT(*)::int AS quantidade_vendas
       FROM vendas
       WHERE funcionario_id = $1
         AND status = 'concluida'
         AND criada_em::date = CURRENT_DATE`,
      [funcionarioId],
    );
    const totalVendido = Number(rows[0]?.total_vendido ?? 0);
    const quantidadeVendas = Number(rows[0]?.quantidade_vendas ?? 0);
    const ticketMedio = quantidadeVendas
      ? this.arredondar(totalVendido / quantidadeVendas)
      : 0;
    return {
      totalVendido: this.arredondar(totalVendido),
      quantidadeVendas,
      ticketMedio,
    };
  }

  private arredondar(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }
}
