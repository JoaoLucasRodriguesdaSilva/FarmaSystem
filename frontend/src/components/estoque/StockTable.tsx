'use client';

import type { EstoqueItem } from '@/types';
import { StatusEstoqueBadge } from '@/components/ui/StatusEstoqueBadge';

interface StockTableProps {
  itens: EstoqueItem[];
  carregando?: boolean;
}

export function StockTable({ itens, carregando }: StockTableProps) {
  if (carregando) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Carregando estoque…
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Nenhum item em estoque.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Medicamento</th>
            <th className="px-4 py-3 font-medium">Categoria</th>
            <th className="px-4 py-3 font-medium">Atual</th>
            <th className="px-4 py-3 font-medium">Mínimo</th>
            <th className="px-4 py-3 font-medium">Lotes</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {itens.map((item) => (
            <tr key={item.medicamentoId} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">
                {item.nome}
              </td>
              <td className="px-4 py-3 text-gray-600">{item.categoria}</td>
              <td className="px-4 py-3 text-gray-600">{item.estoqueAtual}</td>
              <td className="px-4 py-3 text-gray-600">{item.estoqueMinimo}</td>
              <td className="px-4 py-3 text-gray-600">{item.totalLotes}</td>
              <td className="px-4 py-3">
                <StatusEstoqueBadge status={item.statusEstoque} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
