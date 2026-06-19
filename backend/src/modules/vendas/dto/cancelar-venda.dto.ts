import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CancelarVendaDto {
  @ApiProperty({ example: 'Cliente desistiu da compra.' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  motivo!: string;
}
