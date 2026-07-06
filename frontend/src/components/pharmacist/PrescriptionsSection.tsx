'use client';

import type { Receita } from '@/types';

interface PrescriptionsSectionProps {
  receitas: Receita[];
  carregando?: boolean;
  processandoId?: number | null;
  onAprovar?: (receita: Receita) => void;
  onRejeitar?: (receita: Receita) => void;
}

export function PrescriptionsSection({
  receitas,
  carregando,
  processandoId,
  onAprovar,
  onRejeitar,
}: PrescriptionsSectionProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-lg font-bold text-gray-800">
        Receitas pendentes
      </h3>

      {carregando ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Carregando receitas…
        </p>
      ) : receitas.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Nenhuma receita pendente. 🎉
        </p>
      ) : (
        <ul className="space-y-3">
          {receitas.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-gray-200 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 font-semibold text-gray-800">
                    {r.pacienteNome}
                    {r.urgencia === 'urgente' && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Urgente
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {r.codigo} · {r.prescritor}
                  </p>
                </div>
              </div>

              <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                {r.medicamentos.map((m, i) => (
                  <li key={i}>
                    {m.nome ?? `Medicamento ${m.medicamentoId}`} — {m.posologia}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={processandoId === r.id}
                  onClick={() => onRejeitar?.(r)}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {processandoId === r.id ? 'Processando…' : 'Rejeitar'}
                </button>
                <button
                  type="button"
                  disabled={processandoId === r.id}
                  onClick={() => onAprovar?.(r)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {processandoId === r.id ? 'Processando…' : 'Aprovar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
