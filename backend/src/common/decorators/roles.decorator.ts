import { SetMetadata } from '@nestjs/common';
import { PerfilUsuario } from '../enums/perfil-usuario.enum';

export const ROLES_KEY = 'roles';

/**
 * Restringe uma rota aos perfis informados. Usado em conjunto com o
 * `RolesGuard`. Ex.: `@Roles(PerfilUsuario.ADMINISTRADOR)`.
 */
export const Roles = (...roles: PerfilUsuario[]) =>
  SetMetadata(ROLES_KEY, roles);
