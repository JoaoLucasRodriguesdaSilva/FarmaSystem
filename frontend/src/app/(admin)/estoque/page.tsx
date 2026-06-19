'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { StockTable } from '@/components/estoque/StockTable';
import { estoqueService } from '@/services/estoque.service';
import type { EstoqueItem, Lote, Movimentacao } from '@/types';

type Aba = 'estoque' | 'lotes' | 'movimentacoes';

export default function EstoquePage() {
  const [aba, setAba] = useState<Aba>('estoque');
  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [novoLote, setNovoLote] = useState({
    medicamentoId: '',
    codigoLote: '',
    quantidade: '',
    dataValidade: '',
  });
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [estoque, listaLotes, mov] = await Promise.all([
        estoqueService.listarEstoque({ limit: 100 }),
        estoqueService.listarLotes(),
        estoqueService.listarMovimentacoes(),
      ]);
      setItens(estoque.dados);
      setLotes(listaLotes);
      setMovimentacoes(mov);
    } catch {
      setErro('Não foi possível carregar os dados de estoque.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function adicionarLote(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await estoqueService.criarLote({
        medicamentoId: Number(novoLote.medicamentoId),
        codigoLote: novoLote.codigoLote,
        quantidade: Number(novoLote.quantidade),
        dataValidade: novoLote.dataValidade,
      });
      setNovoLote({
        medicamentoId: '',
        codigoLote: '',
        quantidade: '',
        dataValidade: '',
      });
      await carregar();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { mensagem?: string } } }).response?.data
          ?.mensagem ?? 'Não foi possível registrar o lote.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  const campo =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

  const abas: { id: Aba; rotulo: string }[] = [
    { id: 'estoque', rotulo: 'Estoque' },
    { id: 'lotes', rotulo: 'Lotes' },
    { id: 'movimentacoes', rotulo: 'Movimentações' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Estoque</h2>

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {erro}
        </p>
      )}

      {/* Entrada de lote */}
      <form
        onSubmit={adicionarLote}
        className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-5"
      >
        <input
          className={campo}
          placeholder="ID do medicamento *"
          required
          type="number"
          value={novoLote.medicamentoId}
          onChange={(e) =>
            setNovoLote((s) => ({ ...s, medicamentoId: e.target.value }))
          }
        />
        <input
          className={campo}
          placeholder="Código do lote *"
          required
          value={novoLote.codigoLote}
          onChange={(e) =>
            setNovoLote((s) => ({ ...s, codigoLote: e.target.value }))
          }
        />
        <input
          className={campo}
          placeholder="Quantidade *"
          required
          type="number"
          min={1}
          value={novoLote.quantidade}
          onChange={(e) =>
            setNovoLote((s) => ({ ...s, quantidade: e.target.value }))
          }
        />
        <input
          className={campo}
          required
          type="date"
          value={novoLote.dataValidade}
          onChange={(e) =>
            setNovoLote((s) => ({ ...s, dataValidade: e.target.value }))
          }
        />
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {salvando ? 'Salvando…' : '+ Lote'}
        </button>
      </form>

      <div className="flex gap-2 border-b border-gray-200">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            className={`px-3 py-2 text-sm font-medium ${
              aba === a.id
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {aba === 'estoque' && (
        <StockTable itens={itens} carregando={carregando} />
      )}

      {aba === 'lotes' && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Lote</th>
                <th className="px-4 py-3 font-medium">Medicamento</th>
                <th className="px-4 py-3 font-medium">Qtd.</th>
                <th className="px-4 py-3 font-medium">Validade</th>
                <th className="px-4 py-3 font-medium">Entrada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lotes.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {l.codigoLote}
                  </td>
                  <td className="px-4 py-3 text-gray-600">#{l.medicamentoId}</td>
                  <td className="px-4 py-3 text-gray-600">{l.quantidade}</td>
                  <td className="px-4 py-3 text-gray-600">{l.dataValidade}</td>
                  <td className="px-4 py-3 text-gray-600">{l.dataEntrada}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aba === 'movimentacoes' && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Medicamento</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Qtd.</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movimentacoes.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(m.data).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-gray-600">#{m.medicamentoId}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.tipo === 'entrada'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.quantidade}</td>
                  <td className="px-4 py-3 text-gray-600">{m.motivo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
