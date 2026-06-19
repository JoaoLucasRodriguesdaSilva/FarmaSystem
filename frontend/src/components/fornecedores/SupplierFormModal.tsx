'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Fornecedor } from '@/types';
import type { FornecedorInput } from '@/services/fornecedores.service';

interface SupplierFormModalProps {
  aberto: boolean;
  fornecedor?: Fornecedor | null;
  salvando?: boolean;
  onClose: () => void;
  onSubmit: (input: FornecedorInput) => void;
}

const VAZIO: FornecedorInput = {
  nome: '',
  cnpj: '',
  telefone: '',
  email: '',
  endereco: '',
};

export function SupplierFormModal({
  aberto,
  fornecedor,
  salvando,
  onClose,
  onSubmit,
}: SupplierFormModalProps) {
  const [form, setForm] = useState<FornecedorInput>(VAZIO);

  useEffect(() => {
    if (fornecedor) {
      setForm({
        nome: fornecedor.nome,
        cnpj: fornecedor.cnpj,
        telefone: fornecedor.telefone ?? '',
        email: fornecedor.email ?? '',
        endereco: fornecedor.endereco ?? '',
      });
    } else {
      setForm(VAZIO);
    }
  }, [fornecedor, aberto]);

  if (!aberto) return null;

  function atualizar(campo: keyof FornecedorInput, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(form);
  }

  const campo =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-bold text-gray-800">
          {fornecedor ? 'Editar fornecedor' : 'Novo fornecedor'}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className={campo}
            placeholder="Nome *"
            required
            value={form.nome}
            onChange={(e) => atualizar('nome', e.target.value)}
          />
          <input
            className={campo}
            placeholder="CNPJ *"
            required
            value={form.cnpj}
            onChange={(e) => atualizar('cnpj', e.target.value)}
          />
          <input
            className={campo}
            placeholder="Telefone"
            value={form.telefone}
            onChange={(e) => atualizar('telefone', e.target.value)}
          />
          <input
            className={campo}
            placeholder="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => atualizar('email', e.target.value)}
          />
          <textarea
            className={campo}
            placeholder="Endereço"
            rows={2}
            value={form.endereco}
            onChange={(e) => atualizar('endereco', e.target.value)}
          />

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
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
