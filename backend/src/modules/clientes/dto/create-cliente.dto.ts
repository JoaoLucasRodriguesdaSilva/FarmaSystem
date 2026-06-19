import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateClienteDto {
  @ApiProperty({ example: 'Maria da Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome!: string;

  @ApiProperty({ example: '123.456.789-00' })
  @IsString()
  @Matches(/^[\d.-]{11,14}$/, {
    message: 'cpf deve conter apenas dígitos e os separadores . -',
  })
  cpf!: string;

  @ApiPropertyOptional({ example: '(85) 99999-0000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}
