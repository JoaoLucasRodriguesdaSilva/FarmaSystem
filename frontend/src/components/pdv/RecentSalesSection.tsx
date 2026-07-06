'use client';

import type { Venda } from '@/types';

interface RecentSalesSectionProps {
  vendas: Venda[];
  onImprimirComprovante?: (venda: Venda) => void;
}

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const hora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

export function RecentSalesSection({
  vendas,
  onImprimirComprovante,
}: RecentSalesSectionProps) {
  if (vendas.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        Nenhuma venda registrada nesta sessão ainda.
      </div>
    );
  }

  return (
    // max-h-36 (144px) exibe ~3 linhas + cabeçalho; o excedente vira scroll.
    <div className="max-h-36 overflow-y-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-2 font-medium">Código</th>
            <th className="px-4 py-2 font-medium">Hora</th>
            <th className="px-4 py-2 font-medium">Total</th>
            <th className="px-4 py-2 font-medium text-right">Comprovante</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {vendas.map((v) => (
            <tr key={v.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-medium text-gray-800">{v.codigo}</td>
              <td className="px-4 py-2 text-gray-600">
                {hora.format(new Date(v.criadaEm))}
              </td>
              <td className="px-4 py-2 text-gray-600">
                {moeda.format(v.total)}
              </td>
              <td className="px-4 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onImprimirComprovante?.(v)}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Imprimir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
