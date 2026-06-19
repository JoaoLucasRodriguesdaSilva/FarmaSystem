import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { StatusReceita } from '../../../common/enums/status-receita.enum';
import { UrgenciaReceita } from '../../../common/enums/urgencia-receita.enum';

export class ListReceitasQueryDto {
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

  @ApiPropertyOptional({ enum: StatusReceita })
  @IsOptional()
  @IsEnum(StatusReceita)
  status?: StatusReceita;

  @ApiPropertyOptional({ enum: UrgenciaReceita })
  @IsOptional()
  @IsEnum(UrgenciaReceita)
  urgencia?: UrgenciaReceita;
}
