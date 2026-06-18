import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../database/postgres/postgres.service';

/**
 * Lista de tokens JWT invalidados no logout. Um token só fica registrado até a
 * sua expiração natural; depois disso pode ser limpo.
 */
@Injectable()
export class TokensRevogadosRepository {
  constructor(private readonly db: PostgresService) {}

  async revogar(token: string, expiracao: Date): Promise<void> {
    await this.db.query(
      `INSERT INTO tokens_revogados (token, expiracao) VALUES ($1, $2)`,
      [token, expiracao],
    );
  }

  async estaRevogado(token: string): Promise<boolean> {
    const { rows } = await this.db.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM tokens_revogados
         WHERE token = $1 AND expiracao > CURRENT_TIMESTAMP
       ) AS exists`,
      [token],
    );
    return rows[0]?.exists ?? false;
  }
}
