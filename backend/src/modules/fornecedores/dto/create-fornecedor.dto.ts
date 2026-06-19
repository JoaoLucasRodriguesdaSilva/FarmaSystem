import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateFornecedorDto {
  @ApiProperty({ example: 'Distribuidora Farma Ltda' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome!: string;

  @ApiProperty({ example: '12.345.678/0001-90' })
  @IsString()
  @Matches(/^[\d./-]{14,20}$/, {
    message: 'cnpj deve conter apenas dígitos e os separadores . / -',
  })
  cnpj!: string;

  @ApiPropertyOptional({ example: '(85) 3232-0000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @ApiPropertyOptional({ example: 'contato@distribuidora.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'Av. Central, 1000 - Fortaleza/CE' })
  @IsOptional()
  @IsString()
  endereco?: string;
}
