import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PerfilUsuario } from '../../../common/enums/perfil-usuario.enum';
import { StatusUsuario } from '../../../common/enums/status-usuario.enum';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ example: 'Maria Souza' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  nome?: string;

  @ApiPropertyOptional({ example: 'maria@farmasystem.ufc.br' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ enum: PerfilUsuario })
  @IsOptional()
  @IsEnum(PerfilUsuario)
  perfil?: PerfilUsuario;

  @ApiPropertyOptional({ enum: StatusUsuario })
  @IsOptional()
  @IsEnum(StatusUsuario)
  status?: StatusUsuario;

  @ApiPropertyOptional({ example: 'CRF-CE 12345' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  crf?: string;
}
