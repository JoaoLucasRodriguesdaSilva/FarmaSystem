import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FornecedorResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Distribuidora Farma Ltda' })
  nome!: string;

  @ApiProperty({ example: '12.345.678/0001-90' })
  cnpj!: string;

  @ApiPropertyOptional({ example: '(85) 3232-0000' })
  telefone?: string;

  @ApiPropertyOptional({ example: 'contato@distribuidora.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'Av. Central, 1000 - Fortaleza/CE' })
  endereco?: string;
}

export class FornecedoresPageDto {
  @ApiProperty({ type: [FornecedorResponseDto] })
  dados!: FornecedorResponseDto[];

  @ApiProperty({ example: 5 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}
