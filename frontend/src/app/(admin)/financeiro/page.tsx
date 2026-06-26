'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart } from '@/components/financeiro/BarChart';
import { ChartCard } from '@/components/financeiro/ChartCard';
import { FilterBar } from '@/components/financeiro/FilterBar';
import { KpiItem } from '@/components/financeiro/KpiItem';
import {
  financeiroService,
  type FormatoExportacao,
} from '@/services/financeiro.service';
import type {
  DesempenhoFuncionario,
  FinanceiroKpis,
  MargemCategoria,
  Periodo,
  PontoReceitaDespesa,
} from '@/types';

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export default function FinanceiroPage() {
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [kpis, setKpis] = useState<FinanceiroKpis | null>(null);
  const [serie, setSerie] = useState<PontoReceitaDespesa[]>([]);
  const [margem, setMargem] = useState<MargemCategoria[]>([]);
  const [funcionarios, setFuncionarios] = useState<DesempenhoFuncionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (p: Periodo) => {
    setCarregando(true);
    setErro(null);
    try {
      const [k, s, m, f] = await Promise.all([
        financeiroService.kpis(p),
        financeiroService.receitaDespesas(p),
        financeiroService.margemPorCategoria(p),
        financeiroService.desempenhoFuncionarios(p),
      ]);
      setKpis(k);
      setSerie(s);
      setMargem(m);
      setFuncionarios(f);
    } catch {
      setErro('Não foi possível carregar os dados financeiros.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar(periodo);
  }, [carregar, periodo]);

  async function exportar(formato: FormatoExportacao) {
    setExportando(true);
    setErro(null);
    try {
      await financeiroService.exportar(formato, periodo);
    } catch {
      setErro('Não foi possível exportar o relatório.');
    } finally {
      setExportando(false);
    }
  }

  const cards = [
    { rotulo: 'Receita total', valor: kpis?.receitaTotal.valor },
    { rotulo: 'Despesas (estimadas)', valor: kpis?.despesas.valor },
    { rotulo: 'Lucro líquido', valor: kpis?.lucroLiquido.valor },
  ];

  const dadosSerie = serie.map((p) => ({
    data: dataCurta(p.data),
    receita: p.receita,
    despesas: p.despesas,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Financeiro</h2>
      </div>

      <FilterBar
        periodo={periodo}
        exportando={exportando}
        onChangePeriodo={setPeriodo}
        onExportar={exportar}
      />

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {erro}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.rotulo}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {c.rotulo}
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-800">
              {carregando || c.valor === undefined ? '…' : moeda.format(c.valor)}
            </p>
          </div>
        ))}
      </div>
      {kpis && (
        <p className="text-xs text-gray-400">
          Margem de lucro estimada: {kpis.margemLucro}% (custo de mercadoria
          estimado, pois o cadastro não armazena custo de aquisição).
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          titulo="Receita vs Despesas"
          carregando={carregando}
          vazio={dadosSerie.length === 0}
        >
          <BarChart
            dados={dadosSerie}
            xKey="data"
            barras={[
              { key: 'receita', nome: 'Receita', cor: '#059669' },
              { key: 'despesas', nome: 'Despesas', cor: '#f59e0b' },
            ]}
          />
        </ChartCard>

        <ChartCard
          titulo="Margem por categoria"
          carregando={carregando}
          vazio={margem.length === 0}
        >
          <BarChart
            dados={margem.map((m) => ({
              categoria: m.categoria,
              faturamento: m.faturamento,
              margem: m.margem,
            }))}
            xKey="categoria"
            barras={[
              { key: 'faturamento', nome: 'Faturamento', cor: '#2563eb' },
              { key: 'margem', nome: 'Margem', cor: '#10b981' },
            ]}
          />
        </ChartCard>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          Desempenho por funcionário
        </h3>
        {carregando ? (
          <p className="py-6 text-center text-sm text-gray-500">Carregando…</p>
        ) : funcionarios.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            Sem vendas no período.
          </p>
        ) : (
          <ul>
            {funcionarios.map((f, i) => (
              <KpiItem key={f.funcionarioId} funcionario={f} posicao={i + 1} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
