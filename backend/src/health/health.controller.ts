import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PostgresService } from '../database/postgres/postgres.service';
import { MongoService } from '../database/mongo/mongo.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly postgres: PostgresService,
    private readonly mongo: MongoService,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Estado da API e das conexões de banco.' })
  async check(): Promise<{
    status: string;
    postgres: boolean;
    mongo: boolean;
  }> {
    let postgresOk = false;
    let mongoOk = false;

    try {
      await this.postgres.query('SELECT 1');
      postgresOk = true;
    } catch {
      postgresOk = false;
    }

    try {
      await this.mongo.database.command({ ping: 1 });
      mongoOk = true;
    } catch {
      mongoOk = false;
    }

    return {
      status: postgresOk && mongoOk ? 'ok' : 'degraded',
      postgres: postgresOk,
      mongo: mongoOk,
    };
  }
}
