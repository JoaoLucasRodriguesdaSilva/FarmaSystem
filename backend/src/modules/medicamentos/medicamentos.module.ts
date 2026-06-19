import { Module } from '@nestjs/common';
import { ArquivosModule } from '../arquivos/arquivos.module';
import { MedicamentosController } from './medicamentos.controller';
import { MedicamentosRepository } from './medicamentos.repository';
import { MedicamentosService } from './medicamentos.service';

@Module({
  imports: [ArquivosModule],
  controllers: [MedicamentosController],
  providers: [MedicamentosService, MedicamentosRepository],
  exports: [MedicamentosRepository],
})
export class MedicamentosModule {}
