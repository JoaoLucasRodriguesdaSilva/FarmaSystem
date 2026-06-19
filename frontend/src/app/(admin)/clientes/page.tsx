'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ClientFormModal } from '@/components/clientes/ClientFormModal';
import { ClientsTable } from '@/components/clientes/ClientsTable';
import { useAppSelector } from '@/redux/hooks';
import { selectUserRole } from '@/redux/slices/authSlice';
import {
  clientesService,
  type ClienteInput,
} from '@/services/clientes.service';
import type { Cliente } from '@/types';

export default function ClientesPage() {
  const role = useAppSelector(selectUserRole);
  const podeExcluir = role === 'administrador';

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Cliente | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async (termo = '') => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await clientesService.listar({
        limit: 100,
        busca: termo || undefined,
      });
      setClientes(resposta.dados);
    } catch {
      setErro('Não foi possível carregar os clientes.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function abrirNovo() {
    setEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(cliente: Cliente) {
    setEmEdicao(cliente);
    setModalAberto(true);
  }

  async function salvar(input: ClienteInput) {
    setSalvando(true);
    setErro(null);
    try {
      if (emEdicao) {
        await clientesService.atualizar(emEdicao.id, input);
      } else {
        await clientesService.criar(input);
      }
      setModalAberto(false);
      await carregar(busca);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { mensagem?: string } } }).response?.data
          ?.mensagem ?? 'Não foi possível salvar o cliente.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(cliente: Cliente) {
    if (!confirm(`Excluir o cliente "${cliente.nome}"?`)) return;
    try {
      await clientesService.remover(cliente.id);
      await carregar(busca);
    } catch {
      setErro('Não foi possível excluir o cliente.');
    }
  }

  function handleBusca(event: FormEvent) {
    event.preventDefault();
    void carregar(busca);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Clientes</h2>
        <button
          type="button"
          onClick={abrirNovo}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Novo cliente
        </button>
      </div>

      <form onSubmit={handleBusca} className="flex gap-2">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou CPF…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Buscar
        </button>
      </form>

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {erro}
        </p>
      )}

      <ClientsTable
        clientes={clientes}
        carregando={carregando}
        podeExcluir={podeExcluir}
        onEdit={abrirEdicao}
        onDelete={excluir}
      />

      <ClientFormModal
        aberto={modalAberto}
        cliente={emEdicao}
        salvando={salvando}
        onClose={() => setModalAberto(false)}
        onSubmit={salvar}
      />
    </div>
  );
}
