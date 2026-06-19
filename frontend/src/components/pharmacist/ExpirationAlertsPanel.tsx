'use client';

import type { AlertaEstoque } from '@/types';

interface ExpirationAlertsPanelProps {
  alertas: AlertaEstoque[];
  carregando?: boolean;
  onResolver?: (alerta: AlertaEstoque) => void;
}

const data = new Intl.DateTimeFormat('pt-BR');

export function ExpirationAlertsPanel({
  alertas,
  carregando,
  onResolver,
}: ExpirationAlertsPanelProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-lg font-bold text-gray-800">
        Vencimentos próximos
      </h3>

      {carregando ? (
        <p className="py-6 text-center text-sm text-gray-500">Carregando…</p>
      ) : alertas.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Nenhum lote próximo do vencimento.
        </p>
      ) : (
        <ul className="space-y-2">
          {alertas.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {a.medicamentoNome ?? `Medicamento ${a.medicamentoId}`}
                </p>
                <p className="text-xs text-amber-700">
                  Vence em {a.dataValidade ? data.format(new Date(a.dataValidade)) : '—'}
                  {typeof a.diasParaVencimento === 'number' &&
                    ` (${a.diasParaVencimento} dia(s))`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onResolver?.(a)}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Resolver
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
