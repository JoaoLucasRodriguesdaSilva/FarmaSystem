import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../database/postgres/postgres.service';
import { PerfilUsuario } from '../../common/enums/perfil-usuario.enum';
import { StatusUsuario } from '../../common/enums/status-usuario.enum';
import { UsuarioResponseDto } from './dto/usuario-response.dto';

/** Linha bruta da tabela `usuarios` (snake_case). */
interface UsuarioRow {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  perfil: PerfilUsuario;
  status: StatusUsuario;
  crf: string | null;
  criado_em: Date;
  atualizado_em: Date;
}

export interface CreateUsuarioData {
  nome: string;
  email: string;
  senhaHash: string;
  perfil: PerfilUsuario;
  crf?: string;
}

export interface UpdateUsuarioData {
  nome?: string;
  email?: string;
  perfil?: PerfilUsuario;
  status?: StatusUsuario;
  crf?: string;
}

/**
 * Acesso à tabela `usuarios` em SQL puro. Mapeia colunas snake_case do Postgres
 * para o contrato camelCase da API e nunca expõe `senha_hash`, exceto no método
 * dedicado de autenticação.
 */
@Injectable()
export class UsuariosRepository {
  private readonly colunasPublicas =
    'id, nome, email, perfil, status, crf, criado_em, atualizado_em';

  constructor(private readonly db: PostgresService) {}

  private toResponse(row: Omit<UsuarioRow, 'senha_hash'>): UsuarioResponseDto {
    return {
      id: row.id,
      nome: row.nome,
      email: row.email,
      perfil: row.perfil,
      status: row.status,
      crf: row.crf ?? undefined,
      criadoEm: row.criado_em.toISOString(),
      atualizadoEm: row.atualizado_em.toISOString(),
    };
  }

  async findAll(params: {
    page: number;
    limit: number;
    perfil?: PerfilUsuario;
    status?: StatusUsuario;
  }): Promise<{ dados: UsuarioResponseDto[]; total: number }> {
    const condicoes: string[] = [];
    const valores: unknown[] = [];

    if (params.perfil) {
      valores.push(params.perfil);
      condicoes.push(`perfil = $${valores.length}`);
    }
    if (params.status) {
      valores.push(params.status);
      condicoes.push(`status = $${valores.length}`);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const offset = (params.page - 1) * params.limit;

    const totalResult = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM usuarios ${where}`,
      valores,
    );

    const dadosResult = await this.db.query<Omit<UsuarioRow, 'senha_hash'>>(
      `SELECT ${this.colunasPublicas} FROM usuarios ${where}
       ORDER BY criado_em DESC
       LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, params.limit, offset],
    );

    return {
      dados: dadosResult.rows.map((row) => this.toResponse(row)),
      total: Number(totalResult.rows[0]?.total ?? 0),
    };
  }

  async findById(id: number): Promise<UsuarioResponseDto | null> {
    const { rows } = await this.db.query<Omit<UsuarioRow, 'senha_hash'>>(
      `SELECT ${this.colunasPublicas} FROM usuarios WHERE id = $1`,
      [id],
    );
    return rows[0] ? this.toResponse(rows[0]) : null;
  }

  /** Inclui `senha_hash` — uso exclusivo do fluxo de autenticação. */
  async findByEmailComHash(email: string): Promise<UsuarioRow | null> {
    const { rows } = await this.db.query<UsuarioRow>(
      `SELECT * FROM usuarios WHERE email = $1`,
      [email],
    );
    return rows[0] ?? null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const { rows } = await this.db.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM usuarios WHERE email = $1) AS exists`,
      [email],
    );
    return rows[0]?.exists ?? false;
  }

  async count(): Promise<number> {
    const { rows } = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM usuarios`,
    );
    return Number(rows[0]?.total ?? 0);
  }

  async create(data: CreateUsuarioData): Promise<UsuarioResponseDto> {
    const { rows } = await this.db.query<Omit<UsuarioRow, 'senha_hash'>>(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, crf)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${this.colunasPublicas}`,
      [data.nome, data.email, data.senhaHash, data.perfil, data.crf ?? null],
    );
    return this.toResponse(rows[0]);
  }

  async update(
    id: number,
    data: UpdateUsuarioData,
  ): Promise<UsuarioResponseDto | null> {
    const campos: string[] = [];
    const valores: unknown[] = [];

    const mapa: Record<string, unknown> = {
      nome: data.nome,
      email: data.email,
      perfil: data.perfil,
      status: data.status,
      crf: data.crf,
    };

    for (const [coluna, valor] of Object.entries(mapa)) {
      if (valor !== undefined) {
        valores.push(valor);
        campos.push(`${coluna} = $${valores.length}`);
      }
    }

    // Nada a atualizar além do timestamp: apenas retorna o estado atual.
    if (campos.length === 0) {
      return this.findById(id);
    }

    campos.push('atualizado_em = CURRENT_TIMESTAMP');
    valores.push(id);

    const { rows } = await this.db.query<Omit<UsuarioRow, 'senha_hash'>>(
      `UPDATE usuarios SET ${campos.join(', ')}
       WHERE id = $${valores.length}
       RETURNING ${this.colunasPublicas}`,
      valores,
    );
    return rows[0] ? this.toResponse(rows[0]) : null;
  }

  /** Soft-delete: inativa o usuário em vez de removê-lo. */
  async softDelete(id: number): Promise<boolean> {
    const { rowCount } = await this.db.query(
      `UPDATE usuarios
       SET status = 'inativo', atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id],
    );
    return (rowCount ?? 0) > 0;
  }
}
