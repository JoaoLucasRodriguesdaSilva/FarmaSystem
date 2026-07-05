'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { PerfilUsuario } from '@/types';
import type { CreateUsuarioDto } from '@/services/usuarios.service';

interface NewUserModalProps {
  aberto: boolean;
  salvando?: boolean;
  erro?: string | null;
  onClose: () => void;
  onSubmit: (input: CreateUsuarioDto) => void;
}

const VAZIO: CreateUsuarioDto = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'atendente',
  crf: '',
};

const PERFIS: { valor: PerfilUsuario; rotulo: string }[] = [
  { valor: 'administrador', rotulo: 'Administrador' },
  { valor: 'farmaceutico', rotulo: 'Farmacêutico' },
  { valor: 'atendente', rotulo: 'Atendente' },
];

export function NewUserModal({
  aberto,
  salvando,
  erro,
  onClose,
  onSubmit,
}: NewUserModalProps) {
  const [form, setForm] = useState<CreateUsuarioDto>(VAZIO);

  useEffect(() => {
    if (aberto) setForm(VAZIO);
  }, [aberto]);

  if (!aberto) return null;

  function atualizar<K extends keyof CreateUsuarioDto>(
    campo: K,
    valor: CreateUsuarioDto[K],
  ) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // CRF só é enviado quando o perfil é farmacêutico.
    const payload: CreateUsuarioDto = {
      nome: form.nome,
      email: form.email,
      senha: form.senha,
      perfil: form.perfil,
      ...(form.perfil === 'farmaceutico' && form.crf
        ? { crf: form.crf }
        : {}),
    };
    onSubmit(payload);
  }

  const campo =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-bold text-gray-800">Novo usuário</h3>

        {erro && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {erro}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className={campo}
            placeholder="Nome *"
            required
            minLength={3}
            value={form.nome}
            onChange={(e) => atualizar('nome', e.target.value)}
          />
          <input
            className={campo}
            placeholder="E-mail *"
            type="email"
            required
            value={form.email}
            onChange={(e) => atualizar('email', e.target.value)}
          />
          <input
            className={campo}
            placeholder="Senha *"
            type="password"
            required
            minLength={6}
            value={form.senha}
            onChange={(e) => atualizar('senha', e.target.value)}
          />
          <select
            className={campo}
            value={form.perfil}
            onChange={(e) =>
              atualizar('perfil', e.target.value as PerfilUsuario)
            }
          >
            {PERFIS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </select>

          {form.perfil === 'farmaceutico' && (
            <input
              className={campo}
              placeholder="CRF *"
              required
              value={form.crf ?? ''}
              onChange={(e) => atualizar('crf', e.target.value)}
            />
          )}

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
              {salvando ? 'Salvando…' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
