'use client';

import type { DesempenhoFuncionario } from '@/types';

interface KpiItemProps {
  funcionario: DesempenhoFuncionario;
  posicao: number;
}

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function KpiItem({ funcionario, posicao }: KpiItemProps) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-gray-100 py-2 last:border-0">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
          {posicao}
        </span>
        <div>
          <p className="text-sm font-medium text-gray-800">{funcionario.nome}</p>
          <p className="text-xs text-gray-500">
            {funcionario.quantidadeVendas} venda(s) · ticket{' '}
            {moeda.format(funcionario.ticketMedio)}
          </p>
        </div>
      </div>
      <span className="text-sm font-semibold text-gray-800">
        {moeda.format(funcionario.totalVendido)}
      </span>
    </li>
  );
}
