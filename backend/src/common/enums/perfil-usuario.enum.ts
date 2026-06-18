/**
 * Perfis de acesso (RBAC). Os valores correspondem exatamente ao enum
 * `perfil_usuario` do PostgreSQL e ao contrato da API (swagger_api.md).
 */
export enum PerfilUsuario {
  ADMINISTRADOR = 'administrador',
  FARMACEUTICO = 'farmaceutico',
  ATENDENTE = 'atendente',
}
