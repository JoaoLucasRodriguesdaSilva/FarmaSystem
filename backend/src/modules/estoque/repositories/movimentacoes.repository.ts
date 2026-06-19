import { Injectable } from '@nestjs/common';
import { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { PostgresService } from '../../../database/postgres/postgres.service';
import { TipoMovimentacao } from '../../../common/enums/tipo-movimentacao.enum';
import { MovimentacaoResponseDto } from '../dto/estoque-response.dto';

type Executor = Pick<PoolClient, 'query'> | null;

interface MovimentacaoRow {
  id: number;
  medicamento_id: number;
  lote_id: number | null;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo: string | null;
  usuario_id: number;
  data: Date;
}

export interface CreateMovimentacaoData {
  medicamentoId: number;
  loteId?: number;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo?: string;
  usuarioId: number;
}

@Injectable()
export class MovimentacoesRepository {
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

  private toResponse(row: MovimentacaoRow): MovimentacaoResponseDto {
    return {
      id: row.id,
      medicamentoId: row.medicamento_id,
      loteId: row.lote_id ?? undefined,
      tipo: row.tipo,
      quantidade: row.quantidade,
      motivo: row.motivo ?? undefined,
      usuarioId: row.usuario_id,
      data: row.data.toISOString(),
    };
  }

  async create(
    data: CreateMovimentacaoData,
    client: Executor = null,
  ): Promise<MovimentacaoResponseDto> {
    const { rows } = await this.run<MovimentacaoRow>(
      client,
      `INSERT INTO movimentacoes_estoque
        (medicamento_id, lote_id, tipo, quantidade, motivo, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.medicamentoId,
        data.loteId ?? null,
        data.tipo,
        data.quantidade,
        data.motivo ?? null,
        data.usuarioId,
      ],
    );
    return this.toResponse(rows[0]);
  }

  async findAll(params: {
    tipo?: TipoMovimentacao;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<MovimentacaoResponseDto[]> {
    const cond: string[] = [];
    const valores: unknown[] = [];
    if (params.tipo) {
      valores.push(params.tipo);
      cond.push(`tipo = $${valores.length}`);
    }
    if (params.dataInicio) {
      valores.push(params.dataInicio);
      cond.push(`data >= $${valores.length}`);
    }
    if (params.dataFim) {
      valores.push(params.dataFim);
      cond.push(`data <= $${valores.length}`);
    }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const { rows } = await this.db.query<MovimentacaoRow>(
      `SELECT * FROM movimentacoes_estoque ${where} ORDER BY data DESC`,
      valores,
    );
    return rows.map((r) => this.toResponse(r));
  }
}
