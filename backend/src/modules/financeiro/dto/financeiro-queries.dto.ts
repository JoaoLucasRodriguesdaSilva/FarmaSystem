import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Periodo } from '../../../common/enums/periodo.enum';

export enum FormatoExportacao {
  CSV = 'csv',
  PDF = 'pdf',
  XLSX = 'xlsx',
}

export class FinanceiroPeriodoQueryDto {
  @ApiPropertyOptional({ enum: Periodo, default: Periodo.MES })
  @IsOptional()
  @IsEnum(Periodo)
  periodo: Periodo = Periodo.MES;
}

export class ExportarQueryDto {
  @ApiPropertyOptional({ enum: FormatoExportacao, default: FormatoExportacao.CSV })
  @IsOptional()
  @IsEnum(FormatoExportacao)
  formato: FormatoExportacao = FormatoExportacao.CSV;

  @ApiPropertyOptional({ enum: Periodo, default: Periodo.MES })
  @IsOptional()
  @IsEnum(Periodo)
  periodo: Periodo = Periodo.MES;
}
