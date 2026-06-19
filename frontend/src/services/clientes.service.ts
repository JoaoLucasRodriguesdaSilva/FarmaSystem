import { api } from './api';
import type { Cliente, Paginated } from '@/types';

export interface ClienteInput {
  nome: string;
  cpf: string;
  telefone?: string;
  email?: string;
}

export const clientesService = {
  async listar(
    params: { page?: number; limit?: number; busca?: string } = {},
  ): Promise<Paginated<Cliente>> {
    const { data } = await api.get<Paginated<Cliente>>('/clientes', { params });
    return data;
  },

  async obter(id: number): Promise<Cliente> {
    const { data } = await api.get<Cliente>(`/clientes/${id}`);
    return data;
  },

  async criar(input: ClienteInput): Promise<Cliente> {
    const { data } = await api.post<Cliente>('/clientes', input);
    return data;
  },

  async atualizar(id: number, input: Partial<ClienteInput>): Promise<Cliente> {
    const { data } = await api.put<Cliente>(`/clientes/${id}`, input);
    return data;
  },

  async remover(id: number): Promise<void> {
    await api.delete(`/clientes/${id}`);
  },
};
