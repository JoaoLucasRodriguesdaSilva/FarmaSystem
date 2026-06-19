import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UrgenciaReceita } from '../../../common/enums/urgencia-receita.enum';

export class ReceitaMedicamentoInputDto {
  @ApiProperty({ example: 42 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  medicamentoId!: number;

  @ApiProperty({ example: '1 comprimido a cada 8 horas por 7 dias' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  posologia!: string;
}

export class CreateReceitaDto {
  @ApiProperty({ example: 'João Pereira' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  pacienteNome!: string;

  @ApiProperty({ example: 'Dra. Ana Lima (CRM 12345)' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  prescritor!: string;

  @ApiPropertyOptional({ enum: UrgenciaReceita, default: UrgenciaReceita.NORMAL })
  @IsOptional()
  @IsEnum(UrgenciaReceita)
  urgencia: UrgenciaReceita = UrgenciaReceita.NORMAL;

  @ApiProperty({ type: [ReceitaMedicamentoInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceitaMedicamentoInputDto)
  medicamentos!: ReceitaMedicamentoInputDto[];
}
