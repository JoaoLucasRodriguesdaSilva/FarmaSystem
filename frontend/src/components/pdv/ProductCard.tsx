'use client';

import type { Medicamento } from '@/types';

interface ProductCardProps {
  medicamento: Medicamento;
  onAddProduct?: (medicamento: Medicamento) => void;
}

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function ProductCard({ medicamento, onAddProduct }: ProductCardProps) {
  const semEstoque = medicamento.estoqueAtual <= 0;

  return (
    <button
      type="button"
      disabled={semEstoque}
      onClick={() => onAddProduct?.(medicamento)}
      className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-emerald-400 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="line-clamp-2 text-sm font-semibold text-gray-800">
        {medicamento.nome}
      </span>
      <span className="text-xs text-gray-500">{medicamento.apresentacao}</span>
      <span className="mt-2 text-sm font-bold text-emerald-600">
        {moeda.format(medicamento.preco)}
      </span>
      <span className="text-xs text-gray-400">
        {semEstoque ? 'Sem estoque' : `Estoque: ${medicamento.estoqueAtual}`}
      </span>
    </button>
  );
}
