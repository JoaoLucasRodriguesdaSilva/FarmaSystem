'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardService } from '@/services/dashboard.service';
import type { DispensacaoSemanal } from '@/types';

const diaSemana = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short' });

export function WeeklyDispensationsChartSection() {
  const [dados, setDados] = useState<DispensacaoSemanal[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    dashboardService
      .dispensacoesSemanais()
      .then(setDados)
      .catch(() => setDados([]))
      .finally(() => setCarregando(false));
  }, []);

  const grafico = dados.map((d) => ({
    dia: diaSemana(d.data),
    Dispensações: d.dispensacoes,
    Receitas: d.receitas,
  }));

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-lg font-bold text-gray-800">
        Dispensações na semana
      </h3>
      {carregando ? (
        <p className="py-12 text-center text-sm text-gray-500">Carregando…</p>
      ) : grafico.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">
          Sem dados na semana.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={grafico}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="dia" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} width={32} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Dispensações" fill="#059669" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Receitas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
