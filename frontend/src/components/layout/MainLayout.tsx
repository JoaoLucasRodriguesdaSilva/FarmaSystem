'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { carregarUsuarioAtual } from '@/redux/slices/authSlice';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

/**
 * Estrutura compartilhada das telas autenticadas: Sidebar + Header + conteúdo.
 * Ao montar, recupera o usuário a partir do token (necessário após refresh da
 * página, quando o estado do Redux foi perdido).
 */
export function MainLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { usuario, status } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!usuario && status === 'idle') {
      void dispatch(carregarUsuarioAtual())
        .unwrap()
        .catch(() => router.replace('/login'));
    }
  }, [usuario, status, dispatch, router]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
