'use client';

import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SerieBarra {
  key: string;
  nome: string;
  cor: string;
}

interface BarChartProps {
  dados: Record<string, string | number>[];
  xKey: string;
  barras: SerieBarra[];
  altura?: number;
}

const moeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function BarChart({ dados, xKey, barras, altura = 260 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <ReBarChart data={dados}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey={xKey} fontSize={12} />
        <YAxis
          fontSize={12}
          width={56}
          tickFormatter={(v: number) => `R$${Math.round(v)}`}
        />
        <Tooltip formatter={(v: number) => moeda(v)} />
        <Legend />
        {barras.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.nome} fill={b.cor} radius={[4, 4, 0, 0]} />
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  );
}
