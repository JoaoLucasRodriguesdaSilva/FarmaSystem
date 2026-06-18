import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostgresModule } from './database/postgres/postgres.module';
import { MongoModule } from './database/mongo/mongo.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PostgresModule,
    MongoModule,
    // Os módulos de domínio (auth, usuarios, medicamentos, estoque, vendas,
    // clientes, fornecedores, receitas, dashboard, financeiro) serão
    // adicionados aqui conforme os marcos do implementation_plan.md.
  ],
  controllers: [HealthController],
})
export class AppModule {}
