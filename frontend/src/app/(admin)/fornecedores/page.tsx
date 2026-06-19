'use client';

import { useCallback, useEffect, useState } from 'react';
import { SuppliersTable } from '@/components/fornecedores/SuppliersTable';
import { SupplierFormModal } from '@/components/fornecedores/SupplierFormModal';
import {
  fornecedoresService,
  type FornecedorInput,
} from '@/services/fornecedores.service';
import type { Fornecedor } from '@/types';

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Fornecedor | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fornecedoresService.listar({ limit: 100 });
      setFornecedores(resposta.dados);
    } catch {
      setErro('Não foi possível carregar os fornecedores.');
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

  function abrirEdicao(fornecedor: Fornecedor) {
    setEmEdicao(fornecedor);
    setModalAberto(true);
  }

  async function salvar(input: FornecedorInput) {
    setSalvando(true);
    setErro(null);
    try {
      if (emEdicao) {
        await fornecedoresService.atualizar(emEdicao.id, input);
      } else {
        await fornecedoresService.criar(input);
      }
      setModalAberto(false);
      await carregar();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { mensagem?: string } } }).response?.data
          ?.mensagem ?? 'Não foi possível salvar o fornecedor.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(fornecedor: Fornecedor) {
    if (!confirm(`Excluir o fornecedor "${fornecedor.nome}"?`)) return;
    try {
      await fornecedoresService.remover(fornecedor.id);
      await carregar();
    } catch {
      setErro('Não foi possível excluir o fornecedor.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Fornecedores</h2>
        <button
          type="button"
          onClick={abrirNovo}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Novo fornecedor
        </button>
      </div>

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {erro}
        </p>
      )}

      <SuppliersTable
        fornecedores={fornecedores}
        carregando={carregando}
        onEdit={abrirEdicao}
        onDelete={excluir}
      />

      <SupplierFormModal
        aberto={modalAberto}
        fornecedor={emEdicao}
        salvando={salvando}
        onClose={() => setModalAberto(false)}
        onSubmit={salvar}
      />
    </div>
  );
}
