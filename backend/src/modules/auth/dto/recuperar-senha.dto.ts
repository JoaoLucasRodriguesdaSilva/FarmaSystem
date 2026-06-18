import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RecuperarSenhaDto {
  @ApiProperty({ example: 'usuario@farmasystem.ufc.br' })
  @IsEmail()
  email!: string;
}
