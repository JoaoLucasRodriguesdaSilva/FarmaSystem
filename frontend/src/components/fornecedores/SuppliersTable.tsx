'use client';

import type { Fornecedor } from '@/types';

interface SuppliersTableProps {
  fornecedores: Fornecedor[];
  carregando?: boolean;
  onEdit?: (fornecedor: Fornecedor) => void;
  onDelete?: (fornecedor: Fornecedor) => void;
}

export function SuppliersTable({
  fornecedores,
  carregando,
  onEdit,
  onDelete,
}: SuppliersTableProps) {
  if (carregando) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Carregando fornecedores…
      </div>
    );
  }

  if (fornecedores.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Nenhum fornecedor cadastrado.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">CNPJ</th>
            <th className="px-4 py-3 font-medium">Telefone</th>
            <th className="px-4 py-3 font-medium">E-mail</th>
            <th className="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {fornecedores.map((f) => (
            <tr key={f.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">{f.nome}</td>
              <td className="px-4 py-3 text-gray-600">{f.cnpj}</td>
              <td className="px-4 py-3 text-gray-600">{f.telefone ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">{f.email ?? '—'}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onEdit?.(f)}
                  className="mr-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(f)}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
