import type { StatusEstoque } from '@/types';

const ESTILO: Record<StatusEstoque, { rotulo: string; classe: string }> = {
  normal: { rotulo: 'Normal', classe: 'bg-emerald-100 text-emerald-700' },
  baixo: { rotulo: 'Baixo', classe: 'bg-amber-100 text-amber-700' },
  critico: { rotulo: 'Crítico', classe: 'bg-orange-100 text-orange-700' },
  esgotado: { rotulo: 'Esgotado', classe: 'bg-red-100 text-red-700' },
};

export function StatusEstoqueBadge({ status }: { status: StatusEstoque }) {
  const { rotulo, classe } = ESTILO[status];
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classe}`}
    >
      {rotulo}
    </span>
  );
}
