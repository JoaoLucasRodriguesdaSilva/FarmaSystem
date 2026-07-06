import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusEstoque } from '../../../common/enums/status-estoque.enum';
import { TipoMovimentacao } from '../../../common/enums/tipo-movimentacao.enum';

export class EstoqueItemDto {
  @ApiProperty({ example: 42 })
  medicamentoId!: number;

  @ApiProperty({ example: 'Dipirona 500mg' })
  nome!: string;

  @ApiProperty({ example: 'Analgésico' })
  categoria!: string;

  @ApiProperty({ example: 100 })
  estoqueAtual!: number;

  @ApiProperty({ example: 20 })
  estoqueMinimo!: number;

  @ApiProperty({ enum: StatusEstoque })
  statusEstoque!: StatusEstoque;

  @ApiProperty({ example: 3 })
  totalLotes!: number;
}

export class EstoquePageDto {
  @ApiProperty({ type: [EstoqueItemDto] })
  dados!: EstoqueItemDto[];

  @ApiProperty({ example: 120 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}

export class MovimentacaoResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 42 })
  medicamentoId!: number;

  @ApiPropertyOptional({ example: 'Dipirona 500mg' })
  medicamentoNome?: string;

  @ApiPropertyOptional({ example: 7 })
  loteId?: number;

  @ApiProperty({ enum: TipoMovimentacao })
  tipo!: TipoMovimentacao;

  @ApiProperty({ example: 10 })
  quantidade!: number;

  @ApiPropertyOptional({ example: 'Ajuste de inventário' })
  motivo?: string;

  @ApiProperty({ example: 3 })
  usuarioId!: number;

  @ApiProperty({ example: '2026-06-18T12:00:00Z' })
  data!: string;
}
