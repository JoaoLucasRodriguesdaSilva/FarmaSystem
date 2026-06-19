import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoMovimentacao } from '../../../common/enums/tipo-movimentacao.enum';

export class CreateMovimentacaoDto {
  @ApiProperty({ example: 42 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  medicamentoId!: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  loteId?: number;

  @ApiProperty({ enum: TipoMovimentacao })
  @IsEnum(TipoMovimentacao)
  tipo!: TipoMovimentacao;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade!: number;

  @ApiPropertyOptional({ example: 'Ajuste de inventário' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;
}
