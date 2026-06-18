'use client';

import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logout } from '@/redux/slices/authSlice';

const ROTULO_PERFIL: Record<string, string> = {
  administrador: 'Administrador',
  farmaceutico: 'Farmacêutico',
  atendente: 'Atendente',
};

export function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const usuario = useAppSelector((state) => state.auth.usuario);

  async function handleLogout() {
    await dispatch(logout());
    router.replace('/login');
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-base font-semibold text-gray-700">Painel</h1>

      <div className="flex items-center gap-4">
        {usuario && (
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">{usuario.nome}</p>
            <p className="text-xs text-gray-500">
              {ROTULO_PERFIL[usuario.perfil] ?? usuario.perfil}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
