import { Module } from '@nestjs/common';
import { MedicamentosModule } from '../medicamentos/medicamentos.module';
import { EstoqueController } from './estoque.controller';
import { EstoqueService } from './estoque.service';
import { LotesRepository } from './repositories/lotes.repository';
import { MovimentacoesRepository } from './repositories/movimentacoes.repository';

@Module({
  imports: [MedicamentosModule],
  controllers: [EstoqueController],
  providers: [EstoqueService, LotesRepository, MovimentacoesRepository],
  exports: [EstoqueService, LotesRepository, MovimentacoesRepository],
})
export class EstoqueModule {}
