import { api } from './api';
import type { Fornecedor, Paginated } from '@/types';

export interface FornecedorInput {
  nome: string;
  cnpj: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export const fornecedoresService = {
  async listar(
    params: { page?: number; limit?: number; busca?: string } = {},
  ): Promise<Paginated<Fornecedor>> {
    const { data } = await api.get<Paginated<Fornecedor>>('/fornecedores', {
      params,
    });
    return data;
  },

  async criar(input: FornecedorInput): Promise<Fornecedor> {
    const { data } = await api.post<Fornecedor>('/fornecedores', input);
    return data;
  },

  async atualizar(
    id: number,
    input: Partial<FornecedorInput>,
  ): Promise<Fornecedor> {
    const { data } = await api.put<Fornecedor>(`/fornecedores/${id}`, input);
    return data;
  },

  async remover(id: number): Promise<void> {
    await api.delete(`/fornecedores/${id}`);
  },
};
