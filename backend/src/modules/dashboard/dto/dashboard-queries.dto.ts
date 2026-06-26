import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Periodo } from '../../../common/enums/periodo.enum';

export class PeriodoQueryDto {
  @ApiPropertyOptional({ enum: Periodo, default: Periodo.MES })
  @IsOptional()
  @IsEnum(Periodo)
  periodo: Periodo = Periodo.MES;
}
