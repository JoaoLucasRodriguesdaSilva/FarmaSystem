'use client';

import type { AlertaEstoque } from '@/types';

interface StockAlertsPanelProps {
  alertas: AlertaEstoque[];
  carregando?: boolean;
  onResolver?: (alerta: AlertaEstoque) => void;
  onGerarReposicao?: (alerta: AlertaEstoque) => void;
}

const ROTULO_TIPO: Record<string, string> = {
  estoque_baixo: 'Estoque baixo',
  esgotado: 'Esgotado',
};

export function StockAlertsPanel({
  alertas,
  carregando,
  onResolver,
  onGerarReposicao,
}: StockAlertsPanelProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-lg font-bold text-gray-800">
        Alertas de estoque
      </h3>

      {carregando ? (
        <p className="py-6 text-center text-sm text-gray-500">Carregando…</p>
      ) : alertas.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Nenhum alerta de estoque baixo.
        </p>
      ) : (
        <ul className="space-y-2">
          {alertas.map((a) => {
            const esgotado = a.tipo === 'esgotado';
            return (
              <li
                key={a.id}
                className={`rounded-lg border px-3 py-2 ${
                  esgotado
                    ? 'border-red-200 bg-red-50'
                    : 'border-orange-200 bg-orange-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {a.medicamentoNome ?? `Medicamento ${a.medicamentoId}`}
                    </p>
                    <p
                      className={`text-xs ${
                        esgotado ? 'text-red-700' : 'text-orange-700'
                      }`}
                    >
                      {ROTULO_TIPO[a.tipo] ?? a.tipo}
                      {typeof a.quantidadeAtual === 'number' &&
                        ` · ${a.quantidadeAtual}/${a.quantidadeMinima ?? '—'} un.`}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => onGerarReposicao?.(a)}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Gerar reposição
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolver?.(a)}
                    className="text-sm font-medium text-gray-600 hover:text-gray-800"
                  >
                    Resolver
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
