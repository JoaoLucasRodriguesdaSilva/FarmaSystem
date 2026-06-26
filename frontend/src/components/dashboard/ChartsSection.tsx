'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PontoSerie } from '@/types';

interface ChartsSectionProps {
  vendas: PontoSerie[];
  receita: PontoSerie[];
  carregando?: boolean;
}

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const moeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function ChartBox({
  titulo,
  children,
  vazio,
  carregando,
}: {
  titulo: string;
  children: React.ReactElement;
  vazio: boolean;
  carregando?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{titulo}</h3>
      {carregando ? (
        <p className="py-12 text-center text-sm text-gray-500">Carregando…</p>
      ) : vazio ? (
        <p className="py-12 text-center text-sm text-gray-500">
          Sem dados no período.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function ChartsSection({
  vendas,
  receita,
  carregando,
}: ChartsSectionProps) {
  const dadosVendas = vendas.map((p) => ({ data: dataCurta(p.data), valor: p.valor }));
  const dadosReceita = receita.map((p) => ({
    data: dataCurta(p.data),
    valor: p.valor,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartBox titulo="Vendas" vazio={dadosVendas.length === 0} carregando={carregando}>
        <LineChart data={dadosVendas}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="data" fontSize={12} />
          <YAxis allowDecimals={false} fontSize={12} width={32} />
          <Tooltip formatter={(v: number) => [v, 'Vendas']} />
          <Line
            type="monotone"
            dataKey="valor"
            stroke="#059669"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartBox>

      <ChartBox
        titulo="Receita"
        vazio={dadosReceita.length === 0}
        carregando={carregando}
      >
        <LineChart data={dadosReceita}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="data" fontSize={12} />
          <YAxis
            fontSize={12}
            width={56}
            tickFormatter={(v: number) => `R$${Math.round(v)}`}
          />
          <Tooltip formatter={(v: number) => [moeda(v), 'Receita']} />
          <Line
            type="monotone"
            dataKey="valor"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartBox>
    </div>
  );
}
