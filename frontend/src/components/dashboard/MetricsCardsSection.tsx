'use client';

import type { MetricaCard, MetricasDashboard } from '@/types';

interface MetricsCardsSectionProps {
  metricas: MetricasDashboard | null;
  carregando?: boolean;
}

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});
const numero = new Intl.NumberFormat('pt-BR');

function Variacao({ card }: { card: MetricaCard }) {
  if (card.variacao === null) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  const positiva = card.variacao >= 0;
  return (
    <span
      className={`text-xs font-medium ${
        positiva ? 'text-emerald-600' : 'text-red-600'
      }`}
    >
      {positiva ? '▲' : '▼'} {Math.abs(card.variacao)}%
    </span>
  );
}

export function MetricsCardsSection({
  metricas,
  carregando,
}: MetricsCardsSectionProps) {
  const cards = [
    {
      rotulo: 'Receita no período',
      card: metricas?.receita,
      formato: (v: number) => moeda.format(v),
    },
    {
      rotulo: 'Vendas no período',
      card: metricas?.vendas,
      formato: (v: number) => numero.format(v),
    },
    {
      rotulo: 'Usuários ativos',
      card: metricas?.usuarios,
      formato: (v: number) => numero.format(v),
    },
    {
      rotulo: 'Produtos em estoque',
      card: metricas?.produtosEstoque,
      formato: (v: number) => numero.format(v),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ rotulo, card, formato }) => (
        <div
          key={rotulo}
          className="rounded-xl border border-gray-200 bg-white p-4"
        >
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {rotulo}
          </p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-2xl font-bold text-gray-800">
              {carregando || !card ? '…' : formato(card.valor)}
            </p>
            {card && !carregando && <Variacao card={card} />}
          </div>
        </div>
      ))}
    </div>
  );
}
