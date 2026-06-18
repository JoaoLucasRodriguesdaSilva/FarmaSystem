'use client';

import { useAppSelector } from '@/redux/hooks';
import { selectUserRole } from '@/redux/slices/authSlice';
import type { PerfilUsuario } from '@/types';
import { NavItem } from './NavItem';

interface NavConfig {
  href: string;
  label: string;
  icon: string;
  /** Perfis autorizados; vazio = todos os perfis autenticados. */
  perfis: PerfilUsuario[];
}

// Menu base do painel. Itens são filtrados pelo perfil do usuário logado —
// a proteção definitiva continua na API (RolesGuard).
const NAV: NavConfig[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', perfis: ['administrador'] },
  { href: '/vendas', label: 'Vendas (PDV)', icon: '🛒', perfis: [] },
  { href: '/estoque', label: 'Estoque', icon: '📦', perfis: [] },
  {
    href: '/usuarios',
    label: 'Usuários',
    icon: '👥',
    perfis: ['administrador'],
  },
];

export function Sidebar() {
  const role = useAppSelector(selectUserRole);

  const itens = NAV.filter(
    (item) => item.perfis.length === 0 || (role && item.perfis.includes(role)),
  );

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-5">
        <span className="text-xl">💊</span>
        <span className="text-lg font-bold text-emerald-700">FarmaSystem</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {itens.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </nav>
    </aside>
  );
}
