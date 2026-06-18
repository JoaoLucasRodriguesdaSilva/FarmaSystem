'use client';

import type { Usuario } from '@/types';

interface RecentUsersTableProps {
  usuarios: Usuario[];
  carregando?: boolean;
  onEditUser?: (usuario: Usuario) => void;
}

const ROTULO_PERFIL: Record<string, string> = {
  administrador: 'Administrador',
  farmaceutico: 'Farmacêutico',
  atendente: 'Atendente',
};

function StatusBadge({ status }: { status: Usuario['status'] }) {
  const ativo = status === 'ativo';
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );
}

/**
 * Tabela apresentacional de usuários. Recebe dados via props e emite ações por
 * callbacks (`onEditUser`), seguindo a convenção dos componentes do projeto.
 */
export function RecentUsersTable({
  usuarios,
  carregando,
  onEditUser,
}: RecentUsersTableProps) {
  if (carregando) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Carregando usuários…
      </div>
    );
  }

  if (usuarios.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Nenhum usuário encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">E-mail</th>
            <th className="px-4 py-3 font-medium">Perfil</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {usuarios.map((usuario) => (
            <tr key={usuario.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">
                {usuario.nome}
              </td>
              <td className="px-4 py-3 text-gray-600">{usuario.email}</td>
              <td className="px-4 py-3 text-gray-600">
                {ROTULO_PERFIL[usuario.perfil] ?? usuario.perfil}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={usuario.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onEditUser?.(usuario)}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
