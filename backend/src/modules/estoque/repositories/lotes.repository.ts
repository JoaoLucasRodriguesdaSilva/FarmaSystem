import { Injectable } from '@nestjs/common';
import { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { PostgresService } from '../../../database/postgres/postgres.service';
import { LoteResponseDto } from '../dto/lote-response.dto';

type Executor = Pick<PoolClient, 'query'> | null;

interface LoteRow {
  id: number;
  medicamento_id: number;
  codigo_lote: string;
  quantidade: number;
  data_validade: Date;
  data_entrada: Date;
}

export interface CreateLoteData {
  medicamentoId: number;
  codigoLote: string;
  quantidade: number;
  dataValidade: string;
}

@Injectable()
export class LotesRepository {
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

  private toResponse(row: LoteRow): LoteResponseDto {
    return {
      id: row.id,
      medicamentoId: row.medicamento_id,
      codigoLote: row.codigo_lote,
      quantidade: row.quantidade,
      dataValidade: row.data_validade.toISOString().slice(0, 10),
      dataEntrada: row.data_entrada.toISOString().slice(0, 10),
    };
  }

  async create(
    data: CreateLoteData,
    client: Executor = null,
  ): Promise<LoteResponseDto> {
    const { rows } = await this.run<LoteRow>(
      client,
      `INSERT INTO lotes (medicamento_id, codigo_lote, quantidade, data_validade)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.medicamentoId, data.codigoLote, data.quantidade, data.dataValidade],
    );
    return this.toResponse(rows[0]);
  }

  async ajustarQuantidade(
    loteId: number,
    delta: number,
    client: Executor = null,
  ): Promise<void> {
    await this.run(
      client,
      `UPDATE lotes SET quantidade = GREATEST(quantidade + $2, 0) WHERE id = $1`,
      [loteId, delta],
    );
  }

  async findAll(params: {
    medicamentoId?: number;
    vencimentoEm?: number;
  }): Promise<LoteResponseDto[]> {
    const cond: string[] = [];
    const valores: unknown[] = [];
    if (params.medicamentoId) {
      valores.push(params.medicamentoId);
      cond.push(`medicamento_id = $${valores.length}`);
    }
    if (params.vencimentoEm !== undefined) {
      valores.push(params.vencimentoEm);
      cond.push(
        `data_validade <= CURRENT_DATE + ($${valores.length} || ' days')::interval`,
      );
    }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const { rows } = await this.db.query<LoteRow>(
      `SELECT * FROM lotes ${where} ORDER BY data_validade ASC`,
      valores,
    );
    return rows.map((r) => this.toResponse(r));
  }
}
