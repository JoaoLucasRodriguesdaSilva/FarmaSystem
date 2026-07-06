'use client';

import type { Medicamento } from '@/types';
import { StatusEstoqueBadge } from '@/components/ui/StatusEstoqueBadge';

interface MedicinesTableProps {
  medicamentos: Medicamento[];
  carregando?: boolean;
  onRowClick?: (medicamento: Medicamento) => void;
  /** Quando fornecido, exibe a coluna de ações com o botão Remover. */
  onRemove?: (medicamento: Medicamento) => void;
  removendoId?: number | null;
}

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function MedicinesTable({
  medicamentos,
  carregando,
  onRowClick,
  onRemove,
  removendoId,
}: MedicinesTableProps) {
  if (carregando) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Carregando medicamentos…
      </div>
    );
  }

  if (medicamentos.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Nenhum medicamento encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">Categoria</th>
            <th className="px-4 py-3 font-medium">Preço</th>
            <th className="px-4 py-3 font-medium">Estoque</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {onRemove && <th className="px-4 py-3 font-medium text-right">Ações</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {medicamentos.map((m) => (
            <tr
              key={m.id}
              onClick={() => onRowClick?.(m)}
              className={`${onRowClick ? 'cursor-pointer' : ''} hover:bg-gray-50`}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-gray-800">{m.nome}</div>
                <div className="text-xs text-gray-500">{m.principioAtivo}</div>
              </td>
              <td className="px-4 py-3 text-gray-600">{m.categoria}</td>
              <td className="px-4 py-3 text-gray-600">{moeda.format(m.preco)}</td>
              <td className="px-4 py-3 text-gray-600">
                {m.estoqueAtual} / mín. {m.estoqueMinimo}
              </td>
              <td className="px-4 py-3">
                <StatusEstoqueBadge status={m.statusEstoque} />
              </td>
              {onRemove && (
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={removendoId === m.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(m);
                    }}
                    className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {removendoId === m.id ? 'Removendo…' : 'Remover'}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
