import { api } from './api';
import type {
  AlertaEstoque,
  EstoqueItem,
  Lote,
  Movimentacao,
  Paginated,
  SolicitacaoReposicao,
  TipoMovimentacao,
} from '@/types';

export interface NovaSolicitacaoInput {
  medicamentoId: number;
  quantidadeSolicitada: number;
  observacao?: string;
}

export interface NovoLoteInput {
  medicamentoId: number;
  codigoLote: string;
  quantidade: number;
  dataValidade: string;
}

export interface NovaMovimentacaoInput {
  medicamentoId: number;
  loteId?: number;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo?: string;
}

export const estoqueService = {
  async listarEstoque(
    params: { page?: number; limit?: number; statusEstoque?: string } = {},
  ): Promise<Paginated<EstoqueItem>> {
    const { data } = await api.get<Paginated<EstoqueItem>>('/estoque', {
      params,
    });
    return data;
  },

  async listarLotes(
    params: { medicamentoId?: number; vencimentoEm?: number } = {},
  ): Promise<Lote[]> {
    const { data } = await api.get<Lote[]>('/estoque/lotes', { params });
    return data;
  },

  async criarLote(input: NovoLoteInput): Promise<Lote> {
    const { data } = await api.post<Lote>('/estoque/lotes', input);
    return data;
  },

  async listarMovimentacoes(
    params: { tipo?: TipoMovimentacao; dataInicio?: string; dataFim?: string } = {},
  ): Promise<Movimentacao[]> {
    const { data } = await api.get<Movimentacao[]>('/estoque/movimentacoes', {
      params,
    });
    return data;
  },

  async registrarMovimentacao(
    input: NovaMovimentacaoInput,
  ): Promise<Movimentacao> {
    const { data } = await api.post<Movimentacao>(
      '/estoque/movimentacoes',
      input,
    );
    return data;
  },

  async listarAlertas(): Promise<AlertaEstoque[]> {
    const { data } = await api.get<AlertaEstoque[]>('/estoque/alertas');
    return data;
  },

  async resolverAlerta(id: number): Promise<void> {
    await api.post(`/estoque/alertas/${id}/resolver`);
  },

  async listarSolicitacoes(): Promise<SolicitacaoReposicao[]> {
    const { data } = await api.get<SolicitacaoReposicao[]>(
      '/estoque/solicitacoes-reposicao',
    );
    return data;
  },

  async criarSolicitacao(
    input: NovaSolicitacaoInput,
  ): Promise<SolicitacaoReposicao> {
    const { data } = await api.post<SolicitacaoReposicao>(
      '/estoque/solicitacoes-reposicao',
      input,
    );
    return data;
  },
};
