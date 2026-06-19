'use client';

import type { CartItem as CartItemType } from '@/types';

interface CartItemProps {
  item: CartItemType;
  onChangeQuantity?: (medicamentoId: number, quantidade: number) => void;
  onRemove?: (medicamentoId: number) => void;
}

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function CartItem({ item, onChangeQuantity, onRemove }: CartItemProps) {
  const subtotal = item.precoUnitario * item.quantidade;

  return (
    <div className="flex items-center gap-2 border-b border-gray-100 py-2">
      <div className="flex-1">
        <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
          {item.nome}
          {item.restricaoVenda !== 'venda_livre' && (
            <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-purple-700">
              Receita
            </span>
          )}
        </p>
        <p className="text-xs text-gray-500">{moeda.format(item.precoUnitario)} un.</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() =>
            onChangeQuantity?.(item.medicamentoId, item.quantidade - 1)
          }
          className="h-7 w-7 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
          aria-label="Diminuir quantidade"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-medium">
          {item.quantidade}
        </span>
        <button
          type="button"
          disabled={item.quantidade >= item.estoqueAtual}
          onClick={() =>
            onChangeQuantity?.(item.medicamentoId, item.quantidade + 1)
          }
          className="h-7 w-7 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40"
          aria-label="Aumentar quantidade"
        >
          +
        </button>
      </div>

      <span className="w-20 text-right text-sm font-semibold text-gray-800">
        {moeda.format(subtotal)}
      </span>

      <button
        type="button"
        onClick={() => onRemove?.(item.medicamentoId)}
        className="text-gray-400 hover:text-red-600"
        aria-label="Remover item"
      >
        ✕
      </button>
    </div>
  );
}
