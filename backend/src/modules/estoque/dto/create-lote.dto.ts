import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLoteDto {
  @ApiProperty({ example: 42 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  medicamentoId!: number;

  @ApiProperty({ example: 'LOTE-2026-001' })
  @IsString()
  @MaxLength(100)
  codigoLote!: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade!: number;

  @ApiProperty({ example: '2027-05-30' })
  @IsISO8601()
  dataValidade!: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Compatibilidade de contrato; o fornecedor é vinculado ao medicamento.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fornecedorId?: number;
}
