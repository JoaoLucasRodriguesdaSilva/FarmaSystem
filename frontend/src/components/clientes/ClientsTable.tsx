'use client';

import type { Cliente } from '@/types';

interface ClientsTableProps {
  clientes: Cliente[];
  carregando?: boolean;
  podeExcluir?: boolean;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (cliente: Cliente) => void;
}

export function ClientsTable({
  clientes,
  carregando,
  podeExcluir,
  onEdit,
  onDelete,
}: ClientsTableProps) {
  if (carregando) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Carregando clientes…
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Nenhum cliente cadastrado.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">CPF</th>
            <th className="px-4 py-3 font-medium">Telefone</th>
            <th className="px-4 py-3 font-medium">E-mail</th>
            <th className="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {clientes.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">{c.nome}</td>
              <td className="px-4 py-3 text-gray-600">{c.cpf}</td>
              <td className="px-4 py-3 text-gray-600">{c.telefone ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">{c.email ?? '—'}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onEdit?.(c)}
                  className="mr-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Editar
                </button>
                {podeExcluir && (
                  <button
                    type="button"
                    onClick={() => onDelete?.(c)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Excluir
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
