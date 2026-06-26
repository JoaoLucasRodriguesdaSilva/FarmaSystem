import { api } from './api';
import type {
  DesempenhoFuncionario,
  FinanceiroKpis,
  MargemCategoria,
  Periodo,
  PontoReceitaDespesa,
} from '@/types';

export type FormatoExportacao = 'csv' | 'pdf';

export const financeiroService = {
  async kpis(periodo: Periodo = 'mes'): Promise<FinanceiroKpis> {
    const { data } = await api.get<FinanceiroKpis>('/financeiro/kpis', {
      params: { periodo },
    });
    return data;
  },

  async receitaDespesas(periodo: Periodo = 'mes'): Promise<PontoReceitaDespesa[]> {
    const { data } = await api.get<PontoReceitaDespesa[]>(
      '/financeiro/receita-despesas',
      { params: { periodo } },
    );
    return data;
  },

  async margemPorCategoria(periodo: Periodo = 'mes'): Promise<MargemCategoria[]> {
    const { data } = await api.get<MargemCategoria[]>(
      '/financeiro/margem-por-categoria',
      { params: { periodo } },
    );
    return data;
  },

  async desempenhoFuncionarios(
    periodo: Periodo = 'mes',
  ): Promise<DesempenhoFuncionario[]> {
    const { data } = await api.get<DesempenhoFuncionario[]>(
      '/financeiro/desempenho-funcionarios',
      { params: { periodo } },
    );
    return data;
  },

  /** Baixa o relatório (csv|pdf) e dispara o download no navegador. */
  async exportar(
    formato: FormatoExportacao,
    periodo: Periodo = 'mes',
  ): Promise<void> {
    const { data } = await api.get<Blob>('/financeiro/exportar', {
      params: { formato, periodo },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-financeiro-${periodo}.${formato}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },
};
