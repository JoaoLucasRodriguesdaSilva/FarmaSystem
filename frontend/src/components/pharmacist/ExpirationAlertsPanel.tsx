'use client';

import type { Lote } from '@/types';

interface ExpirationAlertsPanelProps {
  /** Lotes com saldo (> 0) que vencem em 30 dias ou menos. */
  lotes: Lote[];
  carregando?: boolean;
  onResolver?: (lote: Lote) => void;
}

const data = new Intl.DateTimeFormat('pt-BR');

export function ExpirationAlertsPanel({
  lotes,
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
      ) : lotes.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Nenhum lote com saldo vencendo nos próximos 30 dias.
        </p>
      ) : (
        <ul className="space-y-2">
          {lotes.map((l) => {
            const vencido =
              typeof l.diasParaVencimento === 'number' &&
              l.diasParaVencimento < 0;
            return (
              <li
                key={l.id}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                  vencido
                    ? 'border-red-200 bg-red-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {l.medicamentoNome ?? `Medicamento ${l.medicamentoId}`}
                  </p>
                  <p
                    className={`text-xs ${
                      vencido ? 'text-red-700' : 'text-amber-700'
                    }`}
                  >
                    Lote {l.codigoLote} · {l.quantidade} un. · vence em{' '}
                    {data.format(new Date(l.dataValidade))}
                    {typeof l.diasParaVencimento === 'number' &&
                      ` (${
                        vencido
                          ? 'vencido'
                          : `${l.diasParaVencimento} dia(s)`
                      })`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onResolver?.(l)}
                  className="shrink-0 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Repor
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
