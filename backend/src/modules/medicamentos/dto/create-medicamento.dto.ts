import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { RestricaoVenda } from '../../../common/enums/restricao-venda.enum';

/**
 * Payload de `POST /medicamentos`. Enviado como `multipart/form-data`: os campos
 * abaixo chegam como texto e são convertidos via class-transformer; os arquivos
 * (`imagens[]`, `bula`) são tratados separadamente pelos interceptors.
 */
export class CreateMedicamentoDto {
  @ApiProperty({ example: 'Dipirona 500mg' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome!: string;

  @ApiProperty({ example: 'Dipirona monoidratada' })
  @IsString()
  @MaxLength(255)
  principioAtivo!: string;

  @ApiProperty({ example: 'Analgésico' })
  @IsString()
  @MaxLength(100)
  categoria!: string;

  @ApiProperty({ example: 'Medley' })
  @IsString()
  @MaxLength(255)
  fabricante!: string;

  @ApiProperty({ example: 'Oral' })
  @IsString()
  @MaxLength(100)
  viaAdministracao!: string;

  @ApiProperty({ example: 'Caixa com 10 comprimidos' })
  @IsString()
  @MaxLength(100)
  apresentacao!: string;

  @ApiProperty({ enum: RestricaoVenda, example: RestricaoVenda.VENDA_LIVRE })
  @IsEnum(RestricaoVenda)
  restricaoVenda!: RestricaoVenda;

  @ApiProperty({ example: 12.9 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco!: number;

  @ApiProperty({ example: 20, description: 'Quantidade mínima em estoque.' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estoqueMinimo!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fornecedorId?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Se informado (>0), cria o lote inicial e a entrada de estoque.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  unidadesIniciais?: number;

  @ApiPropertyOptional({
    example: '2027-05-30',
    description: 'Validade do lote inicial (obrigatório se unidadesIniciais > 0).',
  })
  @IsOptional()
  @IsISO8601()
  validadeMinima?: string;

  @ApiPropertyOptional({
    example: 'LOTE-2026-001',
    description: 'Código do lote inicial (obrigatório se unidadesIniciais > 0).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lote?: string;
}
