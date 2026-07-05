'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { NovoLoteInput } from '@/services/estoque.service';

interface NewBatchModalProps {
  aberto: boolean;
  medicamentoId: number | null;
  medicamentoNome?: string;
  salvando?: boolean;
  erro?: string | null;
  onClose: () => void;
  onSubmit: (input: NovoLoteInput) => void;
}

interface FormState {
  codigoLote: string;
  quantidade: string;
  dataValidade: string;
}

const VAZIO: FormState = {
  codigoLote: '',
  quantidade: '',
  dataValidade: '',
};

export function NewBatchModal({
  aberto,
  medicamentoId,
  medicamentoNome,
  salvando,
  erro,
  onClose,
  onSubmit,
}: NewBatchModalProps) {
  const [form, setForm] = useState<FormState>(VAZIO);

  useEffect(() => {
    if (aberto) setForm(VAZIO);
  }, [aberto]);

  if (!aberto || medicamentoId == null) return null;

  function atualizar(campo: keyof FormState, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (medicamentoId == null) return;
    onSubmit({
      medicamentoId,
      codigoLote: form.codigoLote,
      quantidade: Number(form.quantidade),
      dataValidade: form.dataValidade,
    });
  }

  const campo =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="mb-1 text-lg font-bold text-gray-800">Novo lote</h3>
        {medicamentoNome && (
          <p className="mb-4 text-sm text-gray-500">{medicamentoNome}</p>
        )}

        {erro && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {erro}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className={campo}
            placeholder="Código do lote *"
            required
            value={form.codigoLote}
            onChange={(e) => atualizar('codigoLote', e.target.value)}
          />
          <input
            className={campo}
            placeholder="Quantidade *"
            type="number"
            min={1}
            required
            value={form.quantidade}
            onChange={(e) => atualizar('quantidade', e.target.value)}
          />
          <label className="flex flex-col gap-1 text-sm text-gray-600">
            Validade *
            <input
              className={campo}
              type="date"
              required
              value={form.dataValidade}
              onChange={(e) => atualizar('dataValidade', e.target.value)}
            />
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {salvando ? 'Salvando…' : 'Registrar lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
