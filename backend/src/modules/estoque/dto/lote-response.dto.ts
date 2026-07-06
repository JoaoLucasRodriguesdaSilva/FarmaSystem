import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoteResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 42 })
  medicamentoId!: number;

  @ApiPropertyOptional({ example: 'Dipirona 500mg' })
  medicamentoNome?: string;

  @ApiProperty({ example: 'LOTE-2026-001' })
  codigoLote!: string;

  @ApiProperty({ example: 100 })
  quantidade!: number;

  @ApiProperty({ example: '2027-05-30' })
  dataValidade!: string;

  @ApiProperty({ example: '2026-06-18' })
  dataEntrada!: string;

  @ApiPropertyOptional({
    example: 12.5,
    description: 'Custo de aquisição por unidade.',
  })
  custoUnitario?: number;

  @ApiPropertyOptional({ example: 12, description: 'Dias até o vencimento.' })
  diasParaVencimento?: number;
}
