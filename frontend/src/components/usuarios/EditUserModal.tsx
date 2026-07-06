'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { PerfilUsuario, StatusUsuario, Usuario } from '@/types';
import type { UpdateUsuarioDto } from '@/services/usuarios.service';

interface EditUserModalProps {
  usuario: Usuario | null;
  salvando?: boolean;
  erro?: string | null;
  onClose: () => void;
  onSubmit: (id: number, input: UpdateUsuarioDto) => void;
}

interface FormState {
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  status: StatusUsuario;
  crf: string;
}

const PERFIS: { valor: PerfilUsuario; rotulo: string }[] = [
  { valor: 'administrador', rotulo: 'Administrador' },
  { valor: 'farmaceutico', rotulo: 'Farmacêutico' },
  { valor: 'atendente', rotulo: 'Atendente' },
];

export function EditUserModal({
  usuario,
  salvando,
  erro,
  onClose,
  onSubmit,
}: EditUserModalProps) {
  const [form, setForm] = useState<FormState>({
    nome: '',
    email: '',
    perfil: 'atendente',
    status: 'ativo',
    crf: '',
  });

  useEffect(() => {
    if (usuario) {
      setForm({
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        status: usuario.status,
        crf: usuario.crf ?? '',
      });
    }
  }, [usuario]);

  if (!usuario) return null;

  function atualizar<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!usuario) return;
    // CRF só é enviado quando o perfil é farmacêutico.
    const payload: UpdateUsuarioDto = {
      nome: form.nome,
      email: form.email,
      perfil: form.perfil,
      status: form.status,
      ...(form.perfil === 'farmaceutico' && form.crf
        ? { crf: form.crf }
        : {}),
    };
    onSubmit(usuario.id, payload);
  }

  const campo =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-bold text-gray-800">Editar usuário</h3>

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
              value={form.crf}
              onChange={(e) => atualizar('crf', e.target.value)}
            />
          )}

          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span className="font-medium">Status</span>
            <select
              className={campo}
              value={form.status}
              onChange={(e) =>
                atualizar('status', e.target.value as StatusUsuario)
              }
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo (bloqueia o login)</option>
            </select>
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
              {salvando ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
