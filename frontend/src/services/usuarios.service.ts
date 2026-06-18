import { api } from './api';
import type { Paginated, PerfilUsuario, StatusUsuario, Usuario } from '@/types';

export interface ListarUsuariosParams {
  page?: number;
  limit?: number;
  perfil?: PerfilUsuario;
  status?: StatusUsuario;
}

export const usuariosService = {
  async listar(
    params: ListarUsuariosParams = {},
  ): Promise<Paginated<Usuario>> {
    const { data } = await api.get<Paginated<Usuario>>('/usuarios', {
      params,
    });
    return data;
  },
};
