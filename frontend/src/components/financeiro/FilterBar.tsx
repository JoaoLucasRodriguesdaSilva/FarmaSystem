'use client';

import type { Periodo } from '@/types';
import type { FormatoExportacao } from '@/services/financeiro.service';

interface FilterBarProps {
  periodo: Periodo;
  exportando?: boolean;
  onChangePeriodo: (periodo: Periodo) => void;
  onExportar: (formato: FormatoExportacao) => void;
}

const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'semana', rotulo: 'Semana' },
  { valor: 'mes', rotulo: 'Mês' },
  { valor: 'ano', rotulo: 'Ano' },
];

export function FilterBar({
  periodo,
  exportando,
  onChangePeriodo,
  onExportar,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
        {PERIODOS.map((p) => (
          <button
            key={p.valor}
            type="button"
            onClick={() => onChangePeriodo(p.valor)}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              periodo === p.valor
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={exportando}
          onClick={() => onExportar('csv')}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
        >
          Exportar CSV
        </button>
        <button
          type="button"
          disabled={exportando}
          onClick={() => onExportar('pdf')}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
        >
          Exportar PDF
        </button>
      </div>
    </div>
  );
}
