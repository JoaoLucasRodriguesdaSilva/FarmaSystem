import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { StatusEstoque } from '../../../common/enums/status-estoque.enum';
import { TipoMovimentacao } from '../../../common/enums/tipo-movimentacao.enum';

export class ListEstoqueQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ enum: StatusEstoque })
  @IsOptional()
  @IsEnum(StatusEstoque)
  statusEstoque?: StatusEstoque;
}

export class ListLotesQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por medicamento.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  medicamentoId?: number;

  @ApiPropertyOptional({ description: 'Lotes que vencem nos próximos N dias.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  vencimentoEm?: number;

  @ApiPropertyOptional({
    description: 'Somente lotes com saldo (quantidade > 0).',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : value === 'true' || value === true,
  )
  @IsBoolean()
  comEstoque?: boolean;
}

export class ListMovimentacoesQueryDto {
  @ApiPropertyOptional({ enum: TipoMovimentacao })
  @IsOptional()
  @IsEnum(TipoMovimentacao)
  tipo?: TipoMovimentacao;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsISO8601()
  dataInicio?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsISO8601()
  dataFim?: string;
}
