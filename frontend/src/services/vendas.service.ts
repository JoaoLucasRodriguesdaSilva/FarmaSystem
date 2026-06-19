import { api } from './api';
import type { FormaPagamento, Paginated, ResumoTurno, Venda } from '@/types';

export interface ItemVendaInput {
  medicamentoId: number;
  quantidade: number;
}

export interface NovaVendaInput {
  clienteId?: number;
  itens: ItemVendaInput[];
  desconto?: number;
  formaPagamento: FormaPagamento;
}

export interface ListarVendasParams {
  page?: number;
  limit?: number;
  dataInicio?: string;
  dataFim?: string;
  funcionarioId?: number;
  status?: string;
}

export const vendasService = {
  async registrar(input: NovaVendaInput): Promise<Venda> {
    const { data } = await api.post<Venda>('/vendas', input);
    return data;
  },

  async listar(params: ListarVendasParams = {}): Promise<Paginated<Venda>> {
    const { data } = await api.get<Paginated<Venda>>('/vendas', { params });
    return data;
  },

  async minhas(params: ListarVendasParams = {}): Promise<Paginated<Venda>> {
    const { data } = await api.get<Paginated<Venda>>('/vendas/minhas', {
      params,
    });
    return data;
  },

  async turnoAtual(): Promise<ResumoTurno> {
    const { data } = await api.get<ResumoTurno>('/vendas/turno-atual');
    return data;
  },

  async obter(id: number): Promise<Venda> {
    const { data } = await api.get<Venda>(`/vendas/${id}`);
    return data;
  },

  async cancelar(id: number, motivo: string): Promise<Venda> {
    const { data } = await api.post<Venda>(`/vendas/${id}/cancelar`, { motivo });
    return data;
  },

  /** Baixa o comprovante (PDF) e dispara a abertura em nova aba do navegador. */
  async abrirComprovante(id: number): Promise<void> {
    const { data } = await api.get<Blob>(`/vendas/${id}/comprovante`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(data);
    window.open(url, '_blank');
    // Libera a URL após um intervalo para não cancelar a abertura da aba.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
