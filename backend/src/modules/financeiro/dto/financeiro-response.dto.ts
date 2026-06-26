import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValorVariacaoDto {
  @ApiProperty({ example: 18400.5 })
  valor!: number;

  @ApiPropertyOptional({ example: 9.3, nullable: true })
  variacao!: number | null;
}

export class FinanceiroKpisDto {
  @ApiProperty({ type: ValorVariacaoDto })
  receitaTotal!: ValorVariacaoDto;

  @ApiProperty({ type: ValorVariacaoDto })
  despesas!: ValorVariacaoDto;

  @ApiProperty({ type: ValorVariacaoDto })
  lucroLiquido!: ValorVariacaoDto;

  @ApiProperty({ example: 40, description: 'Margem de lucro estimada (%).' })
  margemLucro!: number;
}

export class PontoReceitaDespesaDto {
  @ApiProperty({ example: '2026-06-18' })
  data!: string;

  @ApiProperty({ example: 1840.9 })
  receita!: number;

  @ApiProperty({ example: 1104.54 })
  despesas!: number;
}

export class MargemCategoriaDto {
  @ApiProperty({ example: 'Analgésico' })
  categoria!: string;

  @ApiProperty({ example: 12500.5 })
  faturamento!: number;

  @ApiProperty({ example: 5000.2, description: 'Margem estimada no período.' })
  margem!: number;
}

export class DesempenhoFuncionarioDto {
  @ApiProperty({ example: 3 })
  funcionarioId!: number;

  @ApiProperty({ example: 'Carlos Atendente' })
  nome!: string;

  @ApiProperty({ example: 9800.5 })
  totalVendido!: number;

  @ApiProperty({ example: 64 })
  quantidadeVendas!: number;

  @ApiProperty({ example: 153.13 })
  ticketMedio!: number;
}
