import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../database/postgres/postgres.service';
import { FornecedorResponseDto } from './dto/fornecedor-response.dto';

interface FornecedorRow {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
}

export interface FornecedorData {
  nome: string;
  cnpj: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

@Injectable()
export class FornecedoresRepository {
  constructor(private readonly db: PostgresService) {}

  private toResponse(row: FornecedorRow): FornecedorResponseDto {
    return {
      id: row.id,
      nome: row.nome,
      cnpj: row.cnpj,
      telefone: row.telefone ?? undefined,
      email: row.email ?? undefined,
      endereco: row.endereco ?? undefined,
    };
  }

  async findAll(params: {
    page: number;
    limit: number;
    busca?: string;
  }): Promise<{ dados: FornecedorResponseDto[]; total: number }> {
    const valores: unknown[] = [];
    let where = '';
    if (params.busca) {
      valores.push(`%${params.busca}%`);
      where = `WHERE nome ILIKE $1 OR cnpj ILIKE $1`;
    }

    const offset = (params.page - 1) * params.limit;

    const total = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM fornecedores ${where}`,
      valores,
    );
    const dados = await this.db.query<FornecedorRow>(
      `SELECT * FROM fornecedores ${where}
       ORDER BY nome ASC
       LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, params.limit, offset],
    );

    return {
      dados: dados.rows.map((r) => this.toResponse(r)),
      total: Number(total.rows[0]?.total ?? 0),
    };
  }

  async findById(id: number): Promise<FornecedorResponseDto | null> {
    const { rows } = await this.db.query<FornecedorRow>(
      `SELECT * FROM fornecedores WHERE id = $1`,
      [id],
    );
    return rows[0] ? this.toResponse(rows[0]) : null;
  }

  async findIdByCnpj(cnpj: string): Promise<number | null> {
    const { rows } = await this.db.query<{ id: number }>(
      `SELECT id FROM fornecedores WHERE cnpj = $1`,
      [cnpj],
    );
    return rows[0]?.id ?? null;
  }

  async create(data: FornecedorData): Promise<FornecedorResponseDto> {
    const { rows } = await this.db.query<FornecedorRow>(
      `INSERT INTO fornecedores (nome, cnpj, telefone, email, endereco)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.nome,
        data.cnpj,
        data.telefone ?? null,
        data.email ?? null,
        data.endereco ?? null,
      ],
    );
    return this.toResponse(rows[0]);
  }

  async update(
    id: number,
    data: Partial<FornecedorData>,
  ): Promise<FornecedorResponseDto | null> {
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
    const { rows } = await this.db.query<FornecedorRow>(
      `UPDATE fornecedores SET ${campos.join(', ')}
       WHERE id = $${valores.length} RETURNING *`,
      valores,
    );
    return rows[0] ? this.toResponse(rows[0]) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await this.db.query(
      `DELETE FROM fornecedores WHERE id = $1`,
      [id],
    );
    return (rowCount ?? 0) > 0;
  }
}
