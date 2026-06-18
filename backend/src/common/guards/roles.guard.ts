import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsuarioAutenticado } from '../decorators/current-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PerfilUsuario } from '../enums/perfil-usuario.enum';

/**
 * Autorização baseada em perfil (RBAC). Lê os perfis permitidos definidos
 * por `@Roles(...)` e compara com o perfil do usuário autenticado.
 * Rotas sem `@Roles` ficam liberadas para qualquer usuário autenticado.
 * Retorna 403 (ACESSO_NEGADO) quando o perfil não é permitido.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PerfilUsuario[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: UsuarioAutenticado }>();

    if (!user || !required.includes(user.perfil)) {
      throw new ForbiddenException({
        codigo: 'ACESSO_NEGADO',
        message: 'Você não tem permissão para acessar este recurso.',
      });
    }

    return true;
  }
}
