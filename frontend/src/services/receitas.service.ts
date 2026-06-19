import { api } from './api';
import type {
  Paginated,
  Receita,
  SituacaoReceita,
  UrgenciaReceita,
} from '@/types';

export interface ReceitaMedicamentoInput {
  medicamentoId: number;
  posologia: string;
}

export interface NovaReceitaInput {
  pacienteNome: string;
  prescritor: string;
  urgencia?: UrgenciaReceita;
  medicamentos: ReceitaMedicamentoInput[];
}

export interface ListarReceitasParams {
  page?: number;
  limit?: number;
  status?: string;
  urgencia?: string;
}

export const receitasService = {
  async listar(params: ListarReceitasParams = {}): Promise<Paginated<Receita>> {
    const { data } = await api.get<Paginated<Receita>>('/receitas', { params });
    return data;
  },

  async obter(id: number): Promise<Receita> {
    const { data } = await api.get<Receita>(`/receitas/${id}`);
    return data;
  },

  /** Andamento (status) — acessível a todos os perfis, usado pelo PDV. */
  async situacao(id: number): Promise<SituacaoReceita> {
    const { data } = await api.get<SituacaoReceita>(`/receitas/${id}/situacao`);
    return data;
  },

  async criar(input: NovaReceitaInput): Promise<Receita> {
    const { data } = await api.post<Receita>('/receitas', input);
    return data;
  },

  async aprovar(id: number): Promise<Receita> {
    const { data } = await api.post<Receita>(`/receitas/${id}/aprovar`);
    return data;
  },

  async revisar(id: number, observacao: string): Promise<Receita> {
    const { data } = await api.post<Receita>(`/receitas/${id}/revisar`, {
      observacao,
    });
    return data;
  },
};
