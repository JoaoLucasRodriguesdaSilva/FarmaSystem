import { Module } from '@nestjs/common';
import { ReceitasController } from './receitas.controller';
import { ReceitasRepository } from './receitas.repository';
import { ReceitasService } from './receitas.service';

@Module({
  controllers: [ReceitasController],
  providers: [ReceitasService, ReceitasRepository],
  exports: [ReceitasService],
})
export class ReceitasModule {}
