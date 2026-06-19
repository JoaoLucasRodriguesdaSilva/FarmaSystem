import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormaPagamento } from '../../../common/enums/forma-pagamento.enum';
import { StatusVenda } from '../../../common/enums/status-venda.enum';

export class ItemVendaResponseDto {
  @ApiProperty({ example: 42 })
  medicamentoId!: number;

  @ApiPropertyOptional({ example: 'Dipirona 500mg' })
  nome?: string;

  @ApiProperty({ example: 2 })
  quantidade!: number;

  @ApiProperty({ example: 12.5 })
  precoUnitario!: number;

  @ApiProperty({ example: 25 })
  subtotal!: number;
}

export class VendaResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'VND-000001' })
  codigo!: string;

  @ApiProperty({ example: 3 })
  funcionarioId!: number;

  @ApiPropertyOptional({ example: 7 })
  clienteId?: number;

  @ApiPropertyOptional({ example: 9 })
  receitaId?: number;

  @ApiProperty({ type: [ItemVendaResponseDto] })
  itens!: ItemVendaResponseDto[];

  @ApiProperty({ example: 25 })
  subtotal!: number;

  @ApiProperty({ example: 0 })
  desconto!: number;

  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ enum: FormaPagamento })
  formaPagamento!: FormaPagamento;

  @ApiProperty({ enum: StatusVenda })
  status!: StatusVenda;

  @ApiProperty({ example: '2026-06-18T12:00:00Z' })
  criadaEm!: string;

  @ApiPropertyOptional({ example: '2026-06-18T13:00:00Z' })
  canceladaEm?: string;

  @ApiPropertyOptional({ example: 'Cliente desistiu da compra.' })
  motivoCancelamento?: string;
}

export class VendasPageDto {
  @ApiProperty({ type: [VendaResponseDto] })
  dados!: VendaResponseDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}

export class ResumoTurnoDto {
  @ApiProperty({ example: 1250.5, description: 'Total vendido no turno (hoje).' })
  totalVendido!: number;

  @ApiProperty({ example: 8 })
  quantidadeVendas!: number;

  @ApiProperty({ example: 156.31 })
  ticketMedio!: number;
}
