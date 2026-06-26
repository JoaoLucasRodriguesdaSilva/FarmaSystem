import { Module } from '@nestjs/common';
import { FinanceiroController } from './financeiro.controller';
import { FinanceiroRepository } from './financeiro.repository';
import { FinanceiroService } from './financeiro.service';
import { RelatoriosService } from './relatorios.service';

@Module({
  controllers: [FinanceiroController],
  providers: [FinanceiroService, FinanceiroRepository, RelatoriosService],
})
export class FinanceiroModule {}
