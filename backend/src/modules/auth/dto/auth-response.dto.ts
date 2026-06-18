import { ApiProperty } from '@nestjs/swagger';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario-response.dto';

/** Par de tokens emitido no login/refresh. */
export class TokenPairDto {
  @ApiProperty({ description: 'JWT de acesso (header Authorization).' })
  accessToken!: string;

  @ApiProperty({ description: 'Token para renovação do acesso.' })
  refreshToken!: string;

  @ApiProperty({ description: 'Validade do accessToken em segundos.', example: 900 })
  expiresIn!: number;
}

/** Resposta de `POST /auth/login` (contrato `LoginResponse`). */
export class LoginResponseDto extends TokenPairDto {
  @ApiProperty({ type: UsuarioResponseDto })
  usuario!: UsuarioResponseDto;
}
