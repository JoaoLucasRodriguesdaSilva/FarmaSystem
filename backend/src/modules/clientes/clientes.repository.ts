import { Injectable } from '@nestjs/common';
import { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { PostgresService } from '../../database/postgres/postgres.service';
import { ClienteResponseDto } from './dto/cliente-response.dto';

type Executor = Pick<PoolClient, 'query'> | null;

interface ClienteRow {
  id: number;
  nome: string;
  cpf: string;
  telefone: string | null;
  email: string | null;
}

export interface ClienteData {
  nome: string;
  cpf: string;
  telefone?: string;
  email?: string;
}

@Injectable()
export class ClientesRepository {
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

  private toResponse(row: ClienteRow): ClienteResponseDto {
    return {
      id: row.id,
      nome: row.nome,
      cpf: row.cpf,
      telefone: row.telefone ?? undefined,
      email: row.email ?? undefined,
    };
  }

  async findAll(params: {
    page: number;
    limit: number;
    busca?: string;
  }): Promise<{ dados: ClienteResponseDto[]; total: number }> {
    const valores: unknown[] = [];
    let where = '';
    if (params.busca) {
      valores.push(`%${params.busca}%`);
      where = `WHERE nome ILIKE $1 OR cpf ILIKE $1`;
    }

    const offset = (params.page - 1) * params.limit;

    const total = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM clientes ${where}`,
      valores,
    );
    const dados = await this.db.query<ClienteRow>(
      `SELECT * FROM clientes ${where}
       ORDER BY nome ASC
       LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, params.limit, offset],
    );

    return {
      dados: dados.rows.map((r) => this.toResponse(r)),
      total: Number(total.rows[0]?.total ?? 0),
    };
  }

  async findById(
    id: number,
    client: Executor = null,
  ): Promise<ClienteResponseDto | null> {
    const { rows } = await this.run<ClienteRow>(
      client,
      `SELECT * FROM clientes WHERE id = $1`,
      [id],
    );
    return rows[0] ? this.toResponse(rows[0]) : null;
  }

  async findIdByCpf(cpf: string): Promise<number | null> {
    const { rows } = await this.db.query<{ id: number }>(
      `SELECT id FROM clientes WHERE cpf = $1`,
      [cpf],
    );
    return rows[0]?.id ?? null;
  }

  async create(data: ClienteData): Promise<ClienteResponseDto> {
    const { rows } = await this.db.query<ClienteRow>(
      `INSERT INTO clientes (nome, cpf, telefone, email)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.nome, data.cpf, data.telefone ?? null, data.email ?? null],
    );
    return this.toResponse(rows[0]);
  }

  async update(
    id: number,
    data: Partial<ClienteData>,
  ): Promise<ClienteResponseDto | null> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    for (const [coluna, valor] of Object.entries(data)) {
      if (valor !== undefined) {
        valores.push(valor);
        campos.push(`${coluna} = $${valores.length}`);
      }
    }
    if (campos.length === 0) return this.findById(id);

    valores.push(id);
    const { rows } = await this.db.query<ClienteRow>(
      `UPDATE clientes SET ${campos.join(', ')}
       WHERE id = $${valores.length} RETURNING *`,
      valores,
    );
    return rows[0] ? this.toResponse(rows[0]) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await this.db.query(
      `DELETE FROM clientes WHERE id = $1`,
      [id],
    );
    return (rowCount ?? 0) > 0;
  }
}
