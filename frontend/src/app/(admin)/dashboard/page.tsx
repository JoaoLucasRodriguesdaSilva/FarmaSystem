'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChartsSection } from '@/components/dashboard/ChartsSection';
import { MetricsCardsSection } from '@/components/dashboard/MetricsCardsSection';
import { dashboardService } from '@/services/dashboard.service';
import { useAppSelector } from '@/redux/hooks';
import type {
  MetricasDashboard,
  Periodo,
  PontoSerie,
  ProdutoMaisVendido,
} from '@/types';

const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'semana', rotulo: 'Semana' },
  { valor: 'mes', rotulo: 'Mês' },
  { valor: 'ano', rotulo: 'Ano' },
];

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function DashboardPage() {
  const usuario = useAppSelector((state) => state.auth.usuario);

  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [metricas, setMetricas] = useState<MetricasDashboard | null>(null);
  const [vendas, setVendas] = useState<PontoSerie[]>([]);
  const [receita, setReceita] = useState<PontoSerie[]>([]);
  const [produtos, setProdutos] = useState<ProdutoMaisVendido[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async (p: Periodo) => {
    setCarregando(true);
    try {
      const [m, v, r, top] = await Promise.all([
        dashboardService.metricas(p),
        dashboardService.vendas(p),
        dashboardService.receita(p),
        dashboardService.produtosMaisVendidos(),
      ]);
      setMetricas(m);
      setVendas(v);
      setReceita(r);
      setProdutos(top);
    } catch {
      setMetricas(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar(periodo);
  }, [carregar, periodo]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-gray-800">
          Bem-vindo{usuario ? `, ${usuario.nome.split(' ')[0]}` : ''}!
        </h2>
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.valor}
              type="button"
              onClick={() => setPeriodo(p.valor)}
              className={`rounded-md px-3 py-1 text-sm font-medium ${
                periodo === p.valor
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      <MetricsCardsSection metricas={metricas} carregando={carregando} />

      <ChartsSection vendas={vendas} receita={receita} carregando={carregando} />

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          Top 5 produtos mais vendidos
        </h3>
        {produtos.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            Sem vendas registradas.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {produtos.map((p, i) => (
              <li
                key={p.medicamentoId}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-gray-700">
                  {i + 1}. {p.nome}
                </span>
                <span className="text-gray-500">
                  {p.quantidade} un. · {moeda.format(p.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
