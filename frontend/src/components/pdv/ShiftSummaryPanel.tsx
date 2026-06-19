'use client';

import type { ResumoTurno } from '@/types';

interface ShiftSummaryPanelProps {
  resumo: ResumoTurno | null;
  carregando?: boolean;
}

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function ShiftSummaryPanel({
  resumo,
  carregando,
}: ShiftSummaryPanelProps) {
  const itens = [
    { rotulo: 'Total vendido', valor: moeda.format(resumo?.totalVendido ?? 0) },
    { rotulo: 'Vendas', valor: String(resumo?.quantidadeVendas ?? 0) },
    { rotulo: 'Ticket médio', valor: moeda.format(resumo?.ticketMedio ?? 0) },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {itens.map((item) => (
        <div
          key={item.rotulo}
          className="rounded-xl border border-gray-200 bg-white p-3"
        >
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {item.rotulo}
          </p>
          <p className="mt-1 text-lg font-bold text-gray-800">
            {carregando ? '…' : item.valor}
          </p>
        </div>
      ))}
    </div>
  );
}
