import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PerfilUsuario } from '../enums/perfil-usuario.enum';

/** Payload do JWT, anexado em `req.user` pela JwtStrategy. */
export interface UsuarioAutenticado {
  id: number;
  email: string;
  perfil: PerfilUsuario;
}

/**
 * Injeta o usuário autenticado (ou um campo dele) no handler.
 * Ex.: `@CurrentUser() user: UsuarioAutenticado` ou `@CurrentUser('id') id`.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof UsuarioAutenticado | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: UsuarioAutenticado }>();
    const user = request.user;
    return data && user ? user[data] : user;
  },
);
