'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MedicinesTable } from '@/components/medicamentos/MedicinesTable';
import { useAppSelector } from '@/redux/hooks';
import { selectUserRole } from '@/redux/slices/authSlice';
import { medicamentosService } from '@/services/medicamentos.service';
import type { Medicamento } from '@/types';

export default function MedicamentosPage() {
  const router = useRouter();
  const role = useAppSelector(selectUserRole);
  const podeCadastrar = role === 'administrador' || role === 'farmaceutico';

  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (termo: string) => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await medicamentosService.listar({
        limit: 100,
        busca: termo || undefined,
      });
      setMedicamentos(resposta.dados);
    } catch {
      setErro('Não foi possível carregar os medicamentos.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar('');
  }, [carregar]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Medicamentos</h2>
        {podeCadastrar && (
          <button
            type="button"
            onClick={() => router.push('/medicamentos/novo')}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Novo medicamento
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void carregar(busca);
        }}
        className="flex gap-2"
      >
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou princípio ativo…"
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

      <MedicinesTable
        medicamentos={medicamentos}
        carregando={carregando}
        onRowClick={(m) => router.push(`/medicamentos/${m.id}`)}
      />
    </div>
  );
}
