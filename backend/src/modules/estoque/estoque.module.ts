import { Module } from '@nestjs/common';
import { MedicamentosModule } from '../medicamentos/medicamentos.module';
import { EstoqueController } from './estoque.controller';
import { EstoqueService } from './estoque.service';
import { AlertasCronService } from './jobs/alertas-cron.service';
import { AlertasRepository } from './repositories/alertas.repository';
import { LotesRepository } from './repositories/lotes.repository';
import { MovimentacoesRepository } from './repositories/movimentacoes.repository';
import { SolicitacoesRepository } from './repositories/solicitacoes.repository';

@Module({
  imports: [MedicamentosModule],
  controllers: [EstoqueController],
  providers: [
    EstoqueService,
    LotesRepository,
    MovimentacoesRepository,
    AlertasRepository,
    SolicitacoesRepository,
    AlertasCronService,
  ],
  exports: [
    EstoqueService,
    LotesRepository,
    MovimentacoesRepository,
    AlertasRepository,
  ],
})
export class EstoqueModule {}
