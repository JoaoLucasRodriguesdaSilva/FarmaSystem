import { Module } from '@nestjs/common';
import { FornecedoresController } from './fornecedores.controller';
import { FornecedoresRepository } from './fornecedores.repository';
import { FornecedoresService } from './fornecedores.service';

@Module({
  controllers: [FornecedoresController],
  providers: [FornecedoresService, FornecedoresRepository],
  exports: [FornecedoresService, FornecedoresRepository],
})
export class FornecedoresModule {}
