import { api } from './api';
import type {
  DispensacaoSemanal,
  MetricasDashboard,
  Periodo,
  PontoSerie,
  ProdutoMaisVendido,
} from '@/types';

export const dashboardService = {
  async metricas(periodo: Periodo = 'mes'): Promise<MetricasDashboard> {
    const { data } = await api.get<MetricasDashboard>('/dashboard/metricas', {
      params: { periodo },
    });
    return data;
  },

  async vendas(periodo: Periodo = 'mes'): Promise<PontoSerie[]> {
    const { data } = await api.get<PontoSerie[]>('/dashboard/vendas', {
      params: { periodo },
    });
    return data;
  },

  async receita(periodo: Periodo = 'mes'): Promise<PontoSerie[]> {
    const { data } = await api.get<PontoSerie[]>('/dashboard/receita', {
      params: { periodo },
    });
    return data;
  },

  async produtosMaisVendidos(): Promise<ProdutoMaisVendido[]> {
    const { data } = await api.get<ProdutoMaisVendido[]>(
      '/dashboard/produtos-mais-vendidos',
    );
    return data;
  },

  async dispensacoesSemanais(): Promise<DispensacaoSemanal[]> {
    const { data } = await api.get<DispensacaoSemanal[]>(
      '/dashboard/dispensacoes-semanais',
    );
    return data;
  },
};
