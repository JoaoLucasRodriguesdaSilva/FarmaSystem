import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MetricaCardDto {
  @ApiProperty({ example: 12500.5 })
  valor!: number;

  @ApiPropertyOptional({
    example: 12.4,
    description: 'Variação percentual vs período anterior (null se indisponível).',
    nullable: true,
  })
  variacao!: number | null;
}

export class MetricasDashboardDto {
  @ApiProperty({ type: MetricaCardDto })
  usuarios!: MetricaCardDto;

  @ApiProperty({ type: MetricaCardDto })
  receita!: MetricaCardDto;

  @ApiProperty({ type: MetricaCardDto })
  vendas!: MetricaCardDto;

  @ApiProperty({ type: MetricaCardDto })
  produtosEstoque!: MetricaCardDto;
}

export class PontoSerieDto {
  @ApiProperty({ example: '2026-06-18' })
  data!: string;

  @ApiProperty({ example: 1840.9 })
  valor!: number;
}

export class ProdutoMaisVendidoDto {
  @ApiProperty({ example: 42 })
  medicamentoId!: number;

  @ApiProperty({ example: 'Dipirona 500mg' })
  nome!: string;

  @ApiProperty({ example: 320 })
  quantidade!: number;

  @ApiProperty({ example: 4200.5 })
  total!: number;
}

export class DispensacaoSemanalDto {
  @ApiProperty({ example: '2026-06-18' })
  data!: string;

  @ApiProperty({ example: 18 })
  dispensacoes!: number;

  @ApiProperty({ example: 7 })
  receitas!: number;
}
