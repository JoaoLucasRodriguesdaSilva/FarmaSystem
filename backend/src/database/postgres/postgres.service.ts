import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { PG_POOL } from './postgres.constants';

/**
 * Acesso a dados em SQL puro (sem ORM). Decisão arquitetural para permitir
 * controle fino de transações em fluxos críticos (ex.: baixa atômica de
 * múltiplos lotes ao registrar uma venda).
 */
@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /** Executa uma consulta simples no pool. */
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params as never[]);
  }

  /**
   * Executa um callback dentro de uma transação (BEGIN/COMMIT/ROLLBACK).
   * Use para operações que precisam ser atômicas, como o registro de venda.
   */
  async transaction<T>(
    work: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
    this.logger.log('Pool PostgreSQL encerrado.');
  }
}
