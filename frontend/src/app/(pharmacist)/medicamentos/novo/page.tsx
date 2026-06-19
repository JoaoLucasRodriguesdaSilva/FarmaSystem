'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileDropzone } from '@/components/medicamentos/FileDropzone';
import { medicamentosService } from '@/services/medicamentos.service';
import { fornecedoresService } from '@/services/fornecedores.service';
import type { Fornecedor } from '@/types';

const RESTRICOES = [
  { valor: 'venda_livre', rotulo: 'Venda livre' },
  { valor: 'controlado', rotulo: 'Controlado' },
  { valor: 'uso_hospitalar', rotulo: 'Uso hospitalar' },
];

export default function AdicionarMedicamentoPage() {
  const router = useRouter();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [imagens, setImagens] = useState<File[]>([]);
  const [bula, setBula] = useState<File[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: '',
    principioAtivo: '',
    categoria: '',
    fabricante: '',
    viaAdministracao: '',
    apresentacao: '',
    restricaoVenda: 'venda_livre',
    preco: '',
    estoqueMinimo: '',
    fornecedorId: '',
    unidadesIniciais: '',
    lote: '',
    validadeMinima: '',
  });

  useEffect(() => {
    fornecedoresService
      .listar({ limit: 100 })
      .then((r) => setFornecedores(r.dados))
      .catch(() => undefined);
  }, []);

  function atualizar(campo: keyof typeof form, valor: string) {
    setForm((s) => ({ ...s, [campo]: valor }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const criado = await medicamentosService.criar({
        nome: form.nome,
        principioAtivo: form.principioAtivo,
        categoria: form.categoria,
        fabricante: form.fabricante,
        viaAdministracao: form.viaAdministracao,
        apresentacao: form.apresentacao,
        restricaoVenda: form.restricaoVenda,
        preco: Number(form.preco),
        estoqueMinimo: Number(form.estoqueMinimo),
        fornecedorId: form.fornecedorId ? Number(form.fornecedorId) : undefined,
        unidadesIniciais: form.unidadesIniciais
          ? Number(form.unidadesIniciais)
          : undefined,
        lote: form.lote || undefined,
        validadeMinima: form.validadeMinima || undefined,
        imagens,
        bula: bula[0] ?? null,
      });
      router.push(`/medicamentos/${criado.id}`);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { mensagem?: string } } }).response?.data
          ?.mensagem ?? 'Não foi possível cadastrar o medicamento.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  const campo =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Novo medicamento</h2>

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {erro}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
      >
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className={campo} placeholder="Nome *" required value={form.nome} onChange={(e) => atualizar('nome', e.target.value)} />
          <input className={campo} placeholder="Princípio ativo *" required value={form.principioAtivo} onChange={(e) => atualizar('principioAtivo', e.target.value)} />
          <input className={campo} placeholder="Categoria *" required value={form.categoria} onChange={(e) => atualizar('categoria', e.target.value)} />
          <input className={campo} placeholder="Fabricante *" required value={form.fabricante} onChange={(e) => atualizar('fabricante', e.target.value)} />
          <input className={campo} placeholder="Via de administração *" required value={form.viaAdministracao} onChange={(e) => atualizar('viaAdministracao', e.target.value)} />
          <input className={campo} placeholder="Apresentação *" required value={form.apresentacao} onChange={(e) => atualizar('apresentacao', e.target.value)} />
          <select className={campo} value={form.restricaoVenda} onChange={(e) => atualizar('restricaoVenda', e.target.value)}>
            {RESTRICOES.map((r) => (
              <option key={r.valor} value={r.valor}>{r.rotulo}</option>
            ))}
          </select>
          <select className={campo} value={form.fornecedorId} onChange={(e) => atualizar('fornecedorId', e.target.value)}>
            <option value="">Fornecedor (opcional)</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
          <input className={campo} placeholder="Preço (R$) *" required type="number" step="0.01" min="0" value={form.preco} onChange={(e) => atualizar('preco', e.target.value)} />
          <input className={campo} placeholder="Estoque mínimo *" required type="number" min="0" value={form.estoqueMinimo} onChange={(e) => atualizar('estoqueMinimo', e.target.value)} />
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Estoque inicial (opcional)
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input className={campo} placeholder="Unidades iniciais" type="number" min="0" value={form.unidadesIniciais} onChange={(e) => atualizar('unidadesIniciais', e.target.value)} />
            <input className={campo} placeholder="Código do lote" value={form.lote} onChange={(e) => atualizar('lote', e.target.value)} />
            <input className={campo} type="date" value={form.validadeMinima} onChange={(e) => atualizar('validadeMinima', e.target.value)} />
          </div>
          <p className="text-xs text-gray-500">
            Se informar unidades iniciais, o lote e a validade são obrigatórios.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FileDropzone label="Imagens" accept="image/*" multiple files={imagens} onChange={setImagens} />
          <FileDropzone label="Bula (PDF)" accept="application/pdf" files={bula} onChange={setBula} />
        </section>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
            {salvando ? 'Salvando…' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
