'use client';

import type { CartItem as CartItemType, Cliente, FormaPagamento } from '@/types';
import { CartItem } from './CartItem';

interface NewSaleSectionProps {
  itens: CartItemType[];
  clientes: Cliente[];
  clienteId: number | null;
  desconto: number;
  formaPagamento: FormaPagamento;
  finalizando?: boolean;
  erro?: string | null;
  onChangeQuantity: (medicamentoId: number, quantidade: number) => void;
  onRemove: (medicamentoId: number) => void;
  onChangeCliente: (clienteId: number | null) => void;
  onChangeDesconto: (desconto: number) => void;
  onChangeFormaPagamento: (forma: FormaPagamento) => void;
  onFinalizar: () => void;
  onLimpar: () => void;
}

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const FORMAS: { valor: FormaPagamento; rotulo: string }[] = [
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'cartao_credito', rotulo: 'Cartão de crédito' },
  { valor: 'cartao_debito', rotulo: 'Cartão de débito' },
  { valor: 'pix', rotulo: 'PIX' },
];

export function NewSaleSection({
  itens,
  clientes,
  clienteId,
  desconto,
  formaPagamento,
  finalizando,
  erro,
  onChangeQuantity,
  onRemove,
  onChangeCliente,
  onChangeDesconto,
  onChangeFormaPagamento,
  onFinalizar,
  onLimpar,
}: NewSaleSectionProps) {
  const subtotal = itens.reduce(
    (acc, item) => acc + item.precoUnitario * item.quantidade,
    0,
  );
  const total = Math.max(subtotal - desconto, 0);
  const campo =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

  return (
    <section className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-lg font-bold text-gray-800">Caixa</h3>

      <div className="min-h-0 flex-1 overflow-auto">
        {itens.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Carrinho vazio. Selecione produtos à esquerda.
          </p>
        ) : (
          itens.map((item) => (
            <CartItem
              key={item.medicamentoId}
              item={item}
              onChangeQuantity={onChangeQuantity}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
        <select
          className={`${campo} w-full`}
          value={clienteId ?? ''}
          onChange={(e) =>
            onChangeCliente(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">Cliente (opcional)</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome} — {c.cpf}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <select
            className={campo}
            value={formaPagamento}
            onChange={(e) =>
              onChangeFormaPagamento(e.target.value as FormaPagamento)
            }
          >
            {FORMAS.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.rotulo}
              </option>
            ))}
          </select>
          <input
            className={campo}
            type="number"
            min="0"
            step="0.01"
            placeholder="Desconto (R$)"
            value={desconto || ''}
            onChange={(e) => onChangeDesconto(Number(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{moeda.format(subtotal)}</span>
          </div>
          {desconto > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Desconto</span>
              <span>- {moeda.format(desconto)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-gray-800">
            <span>Total</span>
            <span>{moeda.format(total)}</span>
          </div>
        </div>

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {erro}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onLimpar}
            disabled={itens.length === 0 || finalizando}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={onFinalizar}
            disabled={itens.length === 0 || finalizando}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {finalizando ? 'Finalizando…' : 'Finalizar venda'}
          </button>
        </div>
      </div>
    </section>
  );
}
