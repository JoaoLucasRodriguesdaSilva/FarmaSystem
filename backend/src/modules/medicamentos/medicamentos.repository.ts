import { Injectable } from '@nestjs/common';
import { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { PostgresService } from '../../database/postgres/postgres.service';
import { RestricaoVenda } from '../../common/enums/restricao-venda.enum';
import {
  calcularStatusEstoque,
  StatusEstoque,
} from '../../common/enums/status-estoque.enum';
import { LoteResponseDto } from '../estoque/dto/lote-response.dto';

/** Executor de SQL: pool (padrão) ou client de transação. */
type Executor = Pick<PoolClient, 'query'> | null;

interface MedicamentoRow {
  id: number;
  nome: string;
  principio_ativo: string;
  categoria: string;
  fabricante: string;
  via_administracao: string;
  apresentacao: string;
  restricao_venda: RestricaoVenda;
  preco: string;
  estoque_atual: number;
  estoque_minimo: number;
  status_estoque: StatusEstoque;
  fornecedor_id: number | null;
  imagens: string[];
  bula_id: string | null;
}

/** Registro de medicamento já mapeado (imagens como ObjectIds crus). */
export interface MedicamentoRecord {
  id: number;
  nome: string;
  principioAtivo: string;
  categoria: string;
  fabricante: string;
  viaAdministracao: string;
  apresentacao: string;
  restricaoVenda: RestricaoVenda;
  preco: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  statusEstoque: StatusEstoque;
  fornecedorId?: number;
  imagensIds: string[];
  bulaId?: string;
}

export interface CreateMedicamentoData {
  nome: string;
  principioAtivo: string;
  categoria: string;
  fabricante: string;
  viaAdministracao: string;
  apresentacao: string;
  restricaoVenda: RestricaoVenda;
  preco: number;
  estoqueMinimo: number;
  estoqueAtual: number;
  statusEstoque: StatusEstoque;
  fornecedorId?: number;
  imagensIds: string[];
  bulaId?: string;
}

export interface EstoqueAgregadoItem {
  medicamentoId: number;
  nome: string;
  categoria: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  statusEstoque: StatusEstoque;
  totalLotes: number;
}

@Injectable()
export class MedicamentosRepository {
  private readonly colunas = `id, nome, principio_ativo, categoria, fabricante,
    via_administracao, apresentacao, restricao_venda, preco, estoque_atual,
    estoque_minimo, status_estoque, fornecedor_id, imagens, bula_id`;

  constructor(private readonly db: PostgresService) {}

  private run<T extends QueryResultRow>(
    client: Executor,
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return client
      ? (client.query(text, params as never[]) as Promise<QueryResult<T>>)
      : this.db.query<T>(text, params);
  }

  private toRecord(row: MedicamentoRow): MedicamentoRecord {
    return {
      id: row.id,
      nome: row.nome,
      principioAtivo: row.principio_ativo,
      categoria: row.categoria,
      fabricante: row.fabricante,
      viaAdministracao: row.via_administracao,
      apresentacao: row.apresentacao,
      restricaoVenda: row.restricao_venda,
      preco: Number(row.preco),
      estoqueAtual: row.estoque_atual,
      estoqueMinimo: row.estoque_minimo,
      statusEstoque: row.status_estoque,
      fornecedorId: row.fornecedor_id ?? undefined,
      imagensIds: Array.isArray(row.imagens) ? row.imagens : [],
      bulaId: row.bula_id ?? undefined,
    };
  }

  async findAll(params: {
    page: number;
    limit: number;
    busca?: string;
    categoria?: string;
    statusEstoque?: StatusEstoque;
  }): Promise<{ dados: MedicamentoRecord[]; total: number }> {
    const cond: string[] = ['ativo = TRUE'];
    const valores: unknown[] = [];

    if (params.busca) {
      valores.push(`%${params.busca}%`);
      cond.push(`(nome ILIKE $${valores.length} OR principio_ativo ILIKE $${valores.length})`);
    }
    if (params.categoria) {
      valores.push(params.categoria);
      cond.push(`categoria = $${valores.length}`);
    }
    if (params.statusEstoque) {
      valores.push(params.statusEstoque);
      cond.push(`status_estoque = $${valores.length}`);
    }

    const where = `WHERE ${cond.join(' AND ')}`;
    const offset = (params.page - 1) * params.limit;

    const total = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM medicamentos ${where}`,
      valores,
    );
    const dados = await this.db.query<MedicamentoRow>(
      `SELECT ${this.colunas} FROM medicamentos ${where}
       ORDER BY nome ASC
       LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, params.limit, offset],
    );

    return {
      dados: dados.rows.map((r) => this.toRecord(r)),
      total: Number(total.rows[0]?.total ?? 0),
    };
  }

  async findById(id: number): Promise<MedicamentoRecord | null> {
    const { rows } = await this.db.query<MedicamentoRow>(
      `SELECT ${this.colunas} FROM medicamentos WHERE id = $1 AND ativo = TRUE`,
      [id],
    );
    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async findLotes(medicamentoId: number): Promise<LoteResponseDto[]> {
    const { rows } = await this.db.query<{
      id: number;
      medicamento_id: number;
      codigo_lote: string;
      quantidade: number;
      data_validade: Date;
      data_entrada: Date;
    }>(
      `SELECT * FROM lotes WHERE medicamento_id = $1 ORDER BY data_validade ASC`,
      [medicamentoId],
    );
    return rows.map((r) => ({
      id: r.id,
      medicamentoId: r.medicamento_id,
      codigoLote: r.codigo_lote,
      quantidade: r.quantidade,
      dataValidade: r.data_validade.toISOString().slice(0, 10),
      dataEntrada: r.data_entrada.toISOString().slice(0, 10),
    }));
  }

  async create(
    data: CreateMedicamentoData,
    client: Executor = null,
  ): Promise<MedicamentoRecord> {
    const { rows } = await this.run<MedicamentoRow>(
      client,
      `INSERT INTO medicamentos
        (nome, principio_ativo, categoria, fabricante, via_administracao,
         apresentacao, restricao_venda, preco, estoque_minimo, estoque_atual,
         status_estoque, fornecedor_id, imagens, bula_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14)
       RETURNING ${this.colunas}`,
      [
        data.nome,
        data.principioAtivo,
        data.categoria,
        data.fabricante,
        data.viaAdministracao,
        data.apresentacao,
        data.restricaoVenda,
        data.preco,
        data.estoqueMinimo,
        data.estoqueAtual,
        data.statusEstoque,
        data.fornecedorId ?? null,
        JSON.stringify(data.imagensIds),
        data.bulaId ?? null,
      ],
    );
    return this.toRecord(rows[0]);
  }

  async update(
    id: number,
    data: Record<string, unknown>,
  ): Promise<MedicamentoRecord | null> {
    const mapa: Record<string, unknown> = {
      nome: data.nome,
      principio_ativo: data.principioAtivo,
      categoria: data.categoria,
      fabricante: data.fabricante,
      via_administracao: data.viaAdministracao,
      apresentacao: data.apresentacao,
      restricao_venda: data.restricaoVenda,
      preco: data.preco,
      fornecedor_id: data.fornecedorId,
    };

    const campos: string[] = [];
    const valores: unknown[] = [];
    for (const [coluna, valor] of Object.entries(mapa)) {
      if (valor !== undefined) {
        valores.push(valor);
        campos.push(`${coluna} = $${valores.length}`);
      }
    }

    // estoque_minimo recalcula o status_estoque.
    if (data.estoqueMinimo !== undefined) {
      valores.push(data.estoqueMinimo);
      campos.push(`estoque_minimo = $${valores.length}`);
      campos.push(`status_estoque = CASE
        WHEN estoque_atual <= 0 THEN 'esgotado'::status_estoque
        WHEN estoque_atual <= $${valores.length} THEN 'critico'::status_estoque
        WHEN estoque_atual <= $${valores.length} * 1.5 THEN 'baixo'::status_estoque
        ELSE 'normal'::status_estoque END`);
    }

    if (campos.length === 0) return this.findById(id);

    valores.push(id);
    const { rows } = await this.db.query<MedicamentoRow>(
      `UPDATE medicamentos SET ${campos.join(', ')}
       WHERE id = $${valores.length} AND ativo = TRUE
       RETURNING ${this.colunas}`,
      valores,
    );
    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async setImagens(id: number, imagensIds: string[]): Promise<void> {
    await this.db.query(
      `UPDATE medicamentos SET imagens = $2::jsonb WHERE id = $1`,
      [id, JSON.stringify(imagensIds)],
    );
  }

  async softDelete(id: number): Promise<boolean> {
    const { rowCount } = await this.db.query(
      `UPDATE medicamentos SET ativo = FALSE WHERE id = $1 AND ativo = TRUE`,
      [id],
    );
    return (rowCount ?? 0) > 0;
  }

  /**
   * Aplica um delta ao estoque atual e recalcula o status de forma atômica.
   * Retorna o novo estoque ou null se o medicamento não existir.
   */
  async aplicarDeltaEstoque(
    id: number,
    delta: number,
    client: Executor = null,
  ): Promise<number | null> {
    const { rows } = await this.run<{ estoque_atual: number }>(
      client,
      `UPDATE medicamentos
       SET estoque_atual = estoque_atual + $2,
           status_estoque = CASE
             WHEN estoque_atual + $2 <= 0 THEN 'esgotado'::status_estoque
             WHEN estoque_atual + $2 <= estoque_minimo THEN 'critico'::status_estoque
             WHEN estoque_atual + $2 <= estoque_minimo * 1.5 THEN 'baixo'::status_estoque
             ELSE 'normal'::status_estoque END
       WHERE id = $1 AND ativo = TRUE
       RETURNING estoque_atual`,
      [id, delta],
    );
    return rows[0] ? rows[0].estoque_atual : null;
  }

  /** Quantidade atual travada para atualização (FOR UPDATE) dentro de transação. */
  async lockEstoque(
    id: number,
    client: Executor,
  ): Promise<{ estoqueAtual: number } | null> {
    const { rows } = await this.run<{ estoque_atual: number }>(
      client,
      `SELECT estoque_atual FROM medicamentos
       WHERE id = $1 AND ativo = TRUE FOR UPDATE`,
      [id],
    );
    return rows[0] ? { estoqueAtual: rows[0].estoque_atual } : null;
  }

  /**
   * Trava o medicamento (FOR UPDATE) retornando estoque, preço e nome —
   * usado ao registrar uma venda para validar saldo e congelar o preço.
   */
  async lockParaVenda(
    id: number,
    client: Executor,
  ): Promise<{ estoqueAtual: number; preco: number; nome: string } | null> {
    const { rows } = await this.run<{
      estoque_atual: number;
      preco: string;
      nome: string;
    }>(
      client,
      `SELECT estoque_atual, preco, nome FROM medicamentos
       WHERE id = $1 AND ativo = TRUE FOR UPDATE`,
      [id],
    );
    return rows[0]
      ? {
          estoqueAtual: rows[0].estoque_atual,
          preco: Number(rows[0].preco),
          nome: rows[0].nome,
        }
      : null;
  }

  async listarEstoque(params: {
    page: number;
    limit: number;
    statusEstoque?: StatusEstoque;
  }): Promise<{ dados: EstoqueAgregadoItem[]; total: number }> {
    const cond: string[] = ['m.ativo = TRUE'];
    const valores: unknown[] = [];
    if (params.statusEstoque) {
      valores.push(params.statusEstoque);
      cond.push(`m.status_estoque = $${valores.length}`);
    }
    const where = `WHERE ${cond.join(' AND ')}`;
    const offset = (params.page - 1) * params.limit;

    const total = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM medicamentos m ${where}`,
      valores,
    );
    const dados = await this.db.query<{
      medicamento_id: number;
      nome: string;
      categoria: string;
      estoque_atual: number;
      estoque_minimo: number;
      status_estoque: StatusEstoque;
      total_lotes: string;
    }>(
      `SELECT m.id AS medicamento_id, m.nome, m.categoria, m.estoque_atual,
              m.estoque_minimo, m.status_estoque,
              COUNT(l.id)::int AS total_lotes
       FROM medicamentos m
       LEFT JOIN lotes l ON l.medicamento_id = m.id
       ${where}
       GROUP BY m.id
       ORDER BY m.nome ASC
       LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, params.limit, offset],
    );

    return {
      dados: dados.rows.map((r) => ({
        medicamentoId: r.medicamento_id,
        nome: r.nome,
        categoria: r.categoria,
        estoqueAtual: r.estoque_atual,
        estoqueMinimo: r.estoque_minimo,
        statusEstoque: r.status_estoque,
        totalLotes: Number(r.total_lotes),
      })),
      total: Number(total.rows[0]?.total ?? 0),
    };
  }

  /** Recalcula status com base no estoque atual (usado após mudanças). */
  statusPara(estoqueAtual: number, estoqueMinimo: number): StatusEstoque {
    return calcularStatusEstoque(estoqueAtual, estoqueMinimo);
  }
}
