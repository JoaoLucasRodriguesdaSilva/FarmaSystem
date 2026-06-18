import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PostgresModule } from './database/postgres/postgres.module';
import { MongoModule } from './database/mongo/mongo.module';
import { HealthController } from './health/health.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PostgresModule,
    MongoModule,
    UsuariosModule,
    AuthModule,
    // Os demais módulos de domínio (medicamentos, estoque, vendas, clientes,
    // fornecedores, receitas, dashboard, financeiro) serão adicionados aqui
    // conforme os marcos do implementation_plan.md.
  ],
  controllers: [HealthController],
  providers: [
    // JwtAuthGuard global: toda rota exige autenticação, exceto as marcadas
    // com @Public() (login, refresh, recuperar-senha e o health check).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
