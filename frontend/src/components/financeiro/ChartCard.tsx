'use client';

interface ChartCardProps {
  titulo: string;
  vazio?: boolean;
  carregando?: boolean;
  children: React.ReactNode;
}

export function ChartCard({
  titulo,
  vazio,
  carregando,
  children,
}: ChartCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{titulo}</h3>
      {carregando ? (
        <p className="py-12 text-center text-sm text-gray-500">Carregando…</p>
      ) : vazio ? (
        <p className="py-12 text-center text-sm text-gray-500">
          Sem dados no período.
        </p>
      ) : (
        children
      )}
    </div>
  );
}
