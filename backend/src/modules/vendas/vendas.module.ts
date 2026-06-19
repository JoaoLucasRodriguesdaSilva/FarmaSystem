import { Module } from '@nestjs/common';
import { ClientesModule } from '../clientes/clientes.module';
import { EstoqueModule } from '../estoque/estoque.module';
import { MedicamentosModule } from '../medicamentos/medicamentos.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PdfReceiptService } from './pdf-receipt.service';
import { VendasController } from './vendas.controller';
import { VendasRepository } from './vendas.repository';
import { VendasService } from './vendas.service';

@Module({
  imports: [MedicamentosModule, EstoqueModule, ClientesModule, UsuariosModule],
  controllers: [VendasController],
  providers: [VendasService, VendasRepository, PdfReceiptService],
  exports: [VendasService],
})
export class VendasModule {}
