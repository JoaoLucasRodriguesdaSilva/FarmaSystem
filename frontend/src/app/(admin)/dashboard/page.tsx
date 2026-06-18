'use client';

import { useAppSelector } from '@/redux/hooks';

export default function DashboardPage() {
  const usuario = useAppSelector((state) => state.auth.usuario);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">
        Bem-vindo{usuario ? `, ${usuario.nome.split(' ')[0]}` : ''}!
      </h2>
      <p className="text-gray-600">
        Painel inicial do FarmaSystem. As métricas, gráficos e relatórios serão
        implementados no Milestone 6.
      </p>
    </div>
  );
}
