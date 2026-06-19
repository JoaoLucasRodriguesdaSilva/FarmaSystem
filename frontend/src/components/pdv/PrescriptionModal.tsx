'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { CartItem, UrgenciaReceita } from '@/types';
import type { NovaReceitaInput } from '@/services/receitas.service';

interface PrescriptionModalProps {
  aberto: boolean;
  /** Itens do carrinho que exigem receita (controlado/uso hospitalar). */
  itens: CartItem[];
  salvando?: boolean;
  erro?: string | null;
  onClose: () => void;
  onSubmit: (input: NovaReceitaInput) => void;
}

export function PrescriptionModal({
  aberto,
  itens,
  salvando,
  erro,
  onClose,
  onSubmit,
}: PrescriptionModalProps) {
  const [pacienteNome, setPacienteNome] = useState('');
  const [prescritor, setPrescritor] = useState('');
  const [urgencia, setUrgencia] = useState<UrgenciaReceita>('normal');
  const [posologias, setPosologias] = useState<Record<number, string>>({});

  useEffect(() => {
    if (aberto) {
      setPacienteNome('');
      setPrescritor('');
      setUrgencia('normal');
      setPosologias({});
    }
  }, [aberto]);

  if (!aberto) return null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      pacienteNome,
      prescritor,
      urgencia,
      medicamentos: itens.map((i) => ({
        medicamentoId: i.medicamentoId,
        posologia: posologias[i.medicamentoId]?.trim() || 'Conforme prescrição',
      })),
    });
  }

  const campo =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800">Dados da receita</h3>
        <p className="mb-4 mt-1 text-sm text-gray-500">
          Há itens controlados no carrinho. Informe os dados da receita física;
          ela ficará pendente até a aprovação de um farmacêutico.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className={campo}
            placeholder="Nome do paciente *"
            required
            value={pacienteNome}
            onChange={(e) => setPacienteNome(e.target.value)}
          />
          <input
            className={campo}
            placeholder="Prescritor (médico/CRM) *"
            required
            value={prescritor}
            onChange={(e) => setPrescritor(e.target.value)}
          />
          <select
            className={campo}
            value={urgencia}
            onChange={(e) => setUrgencia(e.target.value as UrgenciaReceita)}
          >
            <option value="normal">Urgência: normal</option>
            <option value="urgente">Urgência: urgente</option>
          </select>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              Posologia por item controlado
            </p>
            {itens.map((i) => (
              <div key={i.medicamentoId}>
                <label className="text-xs text-gray-500">{i.nome}</label>
                <input
                  className={`${campo} w-full`}
                  placeholder="Ex.: 1 comprimido a cada 8h por 7 dias"
                  value={posologias[i.medicamentoId] ?? ''}
                  onChange={(e) =>
                    setPosologias((s) => ({
                      ...s,
                      [i.medicamentoId]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>

          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {erro}
            </p>
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
              {salvando ? 'Enviando…' : 'Enviar receita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
