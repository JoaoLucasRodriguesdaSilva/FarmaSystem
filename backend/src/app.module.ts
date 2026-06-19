import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { PostgresModule } from './database/postgres/postgres.module';
import { MongoModule } from './database/mongo/mongo.module';
import { HealthController } from './health/health.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { FornecedoresModule } from './modules/fornecedores/fornecedores.module';
import { ArquivosModule } from './modules/arquivos/arquivos.module';
import { MedicamentosModule } from './modules/medicamentos/medicamentos.module';
import { EstoqueModule } from './modules/estoque/estoque.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { VendasModule } from './modules/vendas/vendas.module';
import { ReceitasModule } from './modules/receitas/receitas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Habilita os Cron Jobs (ex.: geração diária de alertas de vencimento).
    ScheduleModule.forRoot(),
    PostgresModule,
    MongoModule,
    UsuariosModule,
    AuthModule,
    FornecedoresModule,
    ArquivosModule,
    MedicamentosModule,
    EstoqueModule,
    ClientesModule,
    VendasModule,
    ReceitasModule,
    // Os demais módulos de domínio (dashboard, financeiro) serão adicionados
    // aqui conforme o implementation_plan.md.
  ],
  controllers: [HealthController],
  providers: [
    // JwtAuthGuard global: toda rota exige autenticação, exceto as marcadas
    // com @Public() (login, refresh, recuperar-senha e o health check).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
