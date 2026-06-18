import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PG_POOL } from './postgres.constants';
import { PostgresService } from './postgres.service';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Pool => {
        const connectionString = config.get<string>('DATABASE_URL');
        const pool = connectionString
          ? new Pool({ connectionString })
          : new Pool({
              host: config.get<string>('PGHOST', 'localhost'),
              port: config.get<number>('PGPORT', 5432),
              user: config.get<string>('PGUSER', 'postgres'),
              password: config.get<string>('PGPASSWORD', 'postgres'),
              database: config.get<string>('PGDATABASE', 'farmasystem'),
            });
        pool.on('error', (err) =>
          new Logger('PgPool').error('Erro inesperado no pool', err.stack),
        );
        return pool;
      },
    },
    PostgresService,
  ],
  exports: [PG_POOL, PostgresService],
})
export class PostgresModule {}
