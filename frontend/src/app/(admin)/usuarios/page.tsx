'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { selectUserRole } from '@/redux/slices/authSlice';
import { RecentUsersTable } from '@/components/usuarios/RecentUsersTable';
import { NewUserModal } from '@/components/usuarios/NewUserModal';
import {
  usuariosService,
  type CreateUsuarioDto,
} from '@/services/usuarios.service';
import type { Usuario } from '@/types';

const LIMIT = 20;

export default function UsuariosPage() {
  const role = useAppSelector(selectUserRole);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await usuariosService.listar({ page, limit: LIMIT });
      setUsuarios(resposta.dados);
      setTotal(resposta.total);
    } catch {
      setErro('Não foi possível carregar os usuários.');
    } finally {
      setCarregando(false);
    }
  }, [page]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function criarUsuario(input: CreateUsuarioDto) {
    setSalvando(true);
    setErroModal(null);
    try {
      await usuariosService.criar(input);
      setModalAberto(false);
      // Um novo cadastro aparece na primeira página (ordenada por mais recentes).
      if (page === 1) {
        await carregar();
      } else {
        setPage(1);
      }
    } catch (e) {
      setErroModal(
        mensagemDeErro(e, 'Não foi possível cadastrar o usuário.'),
      );
    } finally {
      setSalvando(false);
    }
  }

  // Defesa de UI; a API também bloqueia via RolesGuard (403).
  if (role && role !== 'administrador') {
    return (
      <p className="text-sm text-gray-600">
        Você não tem permissão para acessar a gestão de usuários.
      </p>
    );
  }

  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Usuários</h2>
          <p className="text-sm text-gray-500">
            {total} usuário(s) cadastrado(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setErroModal(null);
            setModalAberto(true);
          }}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Novo usuário
        </button>
      </div>

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {erro}
        </p>
      )}

      <RecentUsersTable usuarios={usuarios} carregando={carregando} />

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={page <= 1 || carregando}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-600">
          Página {page} de {totalPaginas}
        </span>
        <button
          type="button"
          disabled={page >= totalPaginas || carregando}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          Próxima
        </button>
      </div>

      <NewUserModal
        aberto={modalAberto}
        salvando={salvando}
        erro={erroModal}
        onClose={() => setModalAberto(false)}
        onSubmit={criarUsuario}
      />
    </div>
  );
}

function mensagemDeErro(e: unknown, padrao: string): string {
  return (
    (e as { response?: { data?: { mensagem?: string } } }).response?.data
      ?.mensagem ?? padrao
  );
}
