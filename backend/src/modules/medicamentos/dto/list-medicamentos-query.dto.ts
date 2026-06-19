import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { StatusEstoque } from '../../../common/enums/status-estoque.enum';

export class ListMedicamentosQueryDto {
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

  @ApiPropertyOptional({ description: 'Busca por nome ou princípio ativo.' })
  @IsOptional()
  @IsString()
  busca?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ enum: StatusEstoque })
  @IsOptional()
  @IsEnum(StatusEstoque)
  statusEstoque?: StatusEstoque;
}
