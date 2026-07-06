'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ImageGallery } from '@/components/medicamentos/ImageGallery';
import { StatusEstoqueBadge } from '@/components/ui/StatusEstoqueBadge';
import { medicamentosService } from '@/services/medicamentos.service';
import { useAppSelector } from '@/redux/hooks';
import { selectUserRole } from '@/redux/slices/authSlice';
import type { MedicamentoDetalhe } from '@/types';

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const RESTRICAO_ROTULO: Record<string, string> = {
  venda_livre: 'Venda livre',
  controlado: 'Controlado',
  uso_hospitalar: 'Uso hospitalar',
};

export default function MedicamentoDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const role = useAppSelector(selectUserRole);
  const id = Number(params.id);

  const [med, setMed] = useState<MedicamentoDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    medicamentosService
      .obter(id)
      .then(setMed)
      .catch(() => setErro('Medicamento não encontrado.'))
      .finally(() => setCarregando(false));
  }, [id]);

  async function excluir() {
    if (
      !med ||
      !confirm(
        `Remover o medicamento "${med.nome}"? Todos os lotes atrelados a ele serão apagados.`,
      )
    ) {
      return;
    }
    try {
      await medicamentosService.remover(med.id);
      router.push('/medicamentos');
    } catch {
      setErro('Não foi possível remover o medicamento.');
    }
  }

  if (carregando) {
    return <p className="text-sm text-gray-500">Carregando…</p>;
  }
  if (erro || !med) {
    return <p className="text-sm text-red-600">{erro ?? 'Erro.'}</p>;
  }

  const techInfo: [string, string][] = [
    ['Princípio ativo', med.principioAtivo],
    ['Categoria', med.categoria],
    ['Fabricante', med.fabricante],
    ['Via de administração', med.viaAdministracao],
    ['Apresentação', med.apresentacao],
    ['Restrição de venda', RESTRICAO_ROTULO[med.restricaoVenda] ?? med.restricaoVenda],
    ['Preço', moeda.format(med.preco)],
    ['Estoque mínimo', String(med.estoqueMinimo)],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push('/medicamentos')}
            className="mb-1 text-sm text-emerald-600 hover:text-emerald-700"
          >
            ← Voltar
          </button>
          <h2 className="text-2xl font-bold text-gray-800">{med.nome}</h2>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
            <span>Estoque atual: {med.estoqueAtual}</span>
            <StatusEstoqueBadge status={med.statusEstoque} />
          </div>
        </div>
        {role === 'administrador' && (
          <button
            onClick={excluir}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Remover
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ImageGallery imagens={med.imagens} />

        {/* TechInfoTable */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <tbody className="divide-y divide-gray-100">
              {techInfo.map(([rotulo, valor]) => (
                <tr key={rotulo}>
                  <td className="px-4 py-2.5 font-medium text-gray-500">
                    {rotulo}
                  </td>
                  <td className="px-4 py-2.5 text-gray-800">{valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DocSection: bula */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Bula</h3>
        {med.bulaUrl ? (
          <a
            href={med.bulaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            📄 Abrir bula (PDF)
          </a>
        ) : (
          <p className="text-sm text-gray-500">Sem bula cadastrada.</p>
        )}
      </div>

      {/* Lotes vinculados */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <h3 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
          Lotes
        </h3>
        {med.lotes.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">
            Nenhum lote registrado.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Quantidade</th>
                <th className="px-4 py-3 font-medium">Validade</th>
                <th className="px-4 py-3 font-medium">Entrada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {med.lotes.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {l.codigoLote}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.quantidade}</td>
                  <td className="px-4 py-3 text-gray-600">{l.dataValidade}</td>
                  <td className="px-4 py-3 text-gray-600">{l.dataEntrada}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
