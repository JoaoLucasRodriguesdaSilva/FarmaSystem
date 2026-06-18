'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemProps {
  href: string;
  label: string;
  icon?: string;
}

/** Item de navegação da Sidebar; destaca a rota ativa. */
export function NavItem({ href, label, icon }: NavItemProps) {
  const pathname = usePathname();
  const ativo = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        ativo
          ? 'bg-emerald-600 text-white'
          : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
      }`}
    >
      {icon && <span aria-hidden>{icon}</span>}
      <span>{label}</span>
    </Link>
  );
}
