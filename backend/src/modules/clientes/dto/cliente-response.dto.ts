import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClienteResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Maria da Silva' })
  nome!: string;

  @ApiProperty({ example: '123.456.789-00' })
  cpf!: string;

  @ApiPropertyOptional({ example: '(85) 99999-0000' })
  telefone?: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  email?: string;
}

export class ClientesPageDto {
  @ApiProperty({ type: [ClienteResponseDto] })
  dados!: ClienteResponseDto[];

  @ApiProperty({ example: 5 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}
