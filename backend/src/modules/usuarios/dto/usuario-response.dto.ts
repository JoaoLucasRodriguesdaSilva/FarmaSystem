import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PerfilUsuario } from '../../../common/enums/perfil-usuario.enum';
import { StatusUsuario } from '../../../common/enums/status-usuario.enum';

/** Representação pública de um usuário (sem o hash da senha). */
export class UsuarioResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Maria Souza' })
  nome!: string;

  @ApiProperty({ example: 'maria@farmasystem.ufc.br' })
  email!: string;

  @ApiProperty({ enum: PerfilUsuario })
  perfil!: PerfilUsuario;

  @ApiProperty({ enum: StatusUsuario })
  status!: StatusUsuario;

  @ApiPropertyOptional({ example: 'CRF-CE 12345' })
  crf?: string;

  @ApiProperty({ example: '2026-01-10T12:00:00Z' })
  criadoEm!: string;

  @ApiProperty({ example: '2026-01-10T12:00:00Z' })
  atualizadoEm!: string;
}

/** Página de usuários (contrato `UsuariosPage`). */
export class UsuariosPageDto {
  @ApiProperty({ type: [UsuarioResponseDto] })
  dados!: UsuarioResponseDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}
