import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PerfilUsuario } from '../../../common/enums/perfil-usuario.enum';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Maria Souza' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  nome!: string;

  @ApiProperty({ example: 'maria@farmasystem.ufc.br' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'senhaSegura123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(72) // limite do bcrypt
  senha!: string;

  @ApiProperty({ enum: PerfilUsuario, example: PerfilUsuario.ATENDENTE })
  @IsEnum(PerfilUsuario)
  perfil!: PerfilUsuario;

  @ApiProperty({
    required: false,
    description: 'CRF — preenchido apenas para o perfil farmacêutico.',
    example: 'CRF-CE 12345',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  crf?: string;
}
