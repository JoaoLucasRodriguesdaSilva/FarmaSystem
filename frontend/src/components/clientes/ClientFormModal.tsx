'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Cliente } from '@/types';
import type { ClienteInput } from '@/services/clientes.service';

interface ClientFormModalProps {
  aberto: boolean;
  cliente?: Cliente | null;
  salvando?: boolean;
  onClose: () => void;
  onSubmit: (input: ClienteInput) => void;
}

const VAZIO: ClienteInput = {
  nome: '',
  cpf: '',
  telefone: '',
  email: '',
};

export function ClientFormModal({
  aberto,
  cliente,
  salvando,
  onClose,
  onSubmit,
}: ClientFormModalProps) {
  const [form, setForm] = useState<ClienteInput>(VAZIO);

  useEffect(() => {
    if (cliente) {
      setForm({
        nome: cliente.nome,
        cpf: cliente.cpf,
        telefone: cliente.telefone ?? '',
        email: cliente.email ?? '',
      });
    } else {
      setForm(VAZIO);
    }
  }, [cliente, aberto]);

  if (!aberto) return null;

  function atualizar(campo: keyof ClienteInput, valor: string) {
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
          {cliente ? 'Editar cliente' : 'Novo cliente'}
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
            placeholder="CPF *"
            required
            value={form.cpf}
            onChange={(e) => atualizar('cpf', e.target.value)}
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
