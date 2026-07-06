import { api } from './api';
import type { Paginated, PerfilUsuario, StatusUsuario, Usuario } from '@/types';

export interface ListarUsuariosParams {
  page?: number;
  limit?: number;
  perfil?: PerfilUsuario;
  status?: StatusUsuario;
}

export interface CreateUsuarioDto {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
  /** Obrigatório apenas para o perfil farmacêutico. */
  crf?: string;
}

export interface UpdateUsuarioDto {
  nome?: string;
  email?: string;
  perfil?: PerfilUsuario;
  status?: StatusUsuario;
  /** Obrigatório apenas para o perfil farmacêutico. */
  crf?: string;
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

  async criar(data: CreateUsuarioDto): Promise<Usuario> {
    const { data: usuario } = await api.post<Usuario>('/usuarios', data);
    return usuario;
  },

  async atualizar(id: number, data: UpdateUsuarioDto): Promise<Usuario> {
    const { data: usuario } = await api.put<Usuario>(`/usuarios/${id}`, data);
    return usuario;
  },
};
