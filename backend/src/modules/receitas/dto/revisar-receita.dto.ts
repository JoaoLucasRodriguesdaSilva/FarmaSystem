import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RevisarReceitaDto {
  @ApiProperty({ example: 'Dosagem incompatível; solicitar nova prescrição.' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  observacao!: string;
}
