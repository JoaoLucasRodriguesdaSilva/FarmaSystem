'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { NewSaleSection } from '@/components/pdv/NewSaleSection';
import { PrescriptionModal } from '@/components/pdv/PrescriptionModal';
import { ProductsSection } from '@/components/pdv/ProductsSection';
import { RecentSalesSection } from '@/components/pdv/RecentSalesSection';
import { ShiftSummaryPanel } from '@/components/pdv/ShiftSummaryPanel';
import { clientesService } from '@/services/clientes.service';
import { medicamentosService } from '@/services/medicamentos.service';
import {
  receitasService,
  type NovaReceitaInput,
} from '@/services/receitas.service';
import { vendasService } from '@/services/vendas.service';
import type {
  CartItem,
  Cliente,
  FormaPagamento,
  Medicamento,
  ResumoTurno,
  SituacaoReceita,
  Venda,
} from '@/types';

const CART_KEY = 'farmasystem.pdv.cart';
const RECEITA_KEY = 'farmasystem.pdv.receita';

/**
 * PDV (Ponto de Venda): fonte da verdade do atendimento atual. O carrinho e a
 * receita em andamento são sincronizados com o localStorage para sobreviver a
 * um recarregamento acidental.
 */
export default function PdvPage() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [itens, setItens] = useState<CartItem[]>([]);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [desconto, setDesconto] = useState(0);
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>('dinheiro');

  // Receita vinculada quando há itens controlados no carrinho.
  const [receita, setReceita] = useState<SituacaoReceita | null>(null);
  const [modalReceita, setModalReceita] = useState(false);
  const [enviandoReceita, setEnviandoReceita] = useState(false);
  const [erroReceita, setErroReceita] = useState<string | null>(null);
  const [verificandoReceita, setVerificandoReceita] = useState(false);

  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [resumo, setResumo] = useState<ResumoTurno | null>(null);
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [vendasRecentes, setVendasRecentes] = useState<Venda[]>([]);

  // Evita gravar no localStorage antes de hidratar na montagem (ver Milestone 4).
  const [carregado, setCarregado] = useState(false);

  const itensControlados = useMemo(
    () => itens.filter((i) => i.restricaoVenda !== 'venda_livre'),
    [itens],
  );
  const exigeReceita = itensControlados.length > 0;
  const receitaAprovada = receita?.status === 'aprovada';

  const buscarProdutos = useCallback(async (termo = '') => {
    setCarregandoProdutos(true);
    try {
      const resposta = await medicamentosService.listar({
        limit: 100,
        busca: termo || undefined,
      });
      setMedicamentos(resposta.dados);
    } catch {
      setMedicamentos([]);
    } finally {
      setCarregandoProdutos(false);
    }
  }, []);

  const carregarResumo = useCallback(async () => {
    setCarregandoResumo(true);
    try {
      setResumo(await vendasService.turnoAtual());
    } catch {
      setResumo(null);
    } finally {
      setCarregandoResumo(false);
    }
  }, []);

  // Carga inicial: produtos, clientes, resumo e estado persistido (carrinho + receita).
  useEffect(() => {
    void buscarProdutos();
    void carregarResumo();
    clientesService
      .listar({ limit: 100 })
      .then((r) => setClientes(r.dados))
      .catch(() => undefined);

    try {
      const salvo = localStorage.getItem(CART_KEY);
      if (salvo) setItens(JSON.parse(salvo) as CartItem[]);
      const receitaSalva = localStorage.getItem(RECEITA_KEY);
      if (receitaSalva) setReceita(JSON.parse(receitaSalva) as SituacaoReceita);
    } catch {
      // ignora estado corrompido
    }
    setCarregado(true);
  }, [buscarProdutos, carregarResumo]);

  // Persiste carrinho e receita (somente após a hidratação).
  useEffect(() => {
    if (!carregado) return;
    localStorage.setItem(CART_KEY, JSON.stringify(itens));
  }, [itens, carregado]);

  useEffect(() => {
    if (!carregado) return;
    if (receita) localStorage.setItem(RECEITA_KEY, JSON.stringify(receita));
    else localStorage.removeItem(RECEITA_KEY);
  }, [receita, carregado]);

  function adicionar(medicamento: Medicamento) {
    setErro(null);
    setItens((atual) => {
      const existente = atual.find((i) => i.medicamentoId === medicamento.id);
      if (existente) {
        if (existente.quantidade >= medicamento.estoqueAtual) return atual;
        return atual.map((i) =>
          i.medicamentoId === medicamento.id
            ? { ...i, quantidade: i.quantidade + 1 }
            : i,
        );
      }
      if (medicamento.estoqueAtual <= 0) return atual;
      return [
        ...atual,
        {
          medicamentoId: medicamento.id,
          nome: medicamento.nome,
          precoUnitario: medicamento.preco,
          quantidade: 1,
          estoqueAtual: medicamento.estoqueAtual,
          restricaoVenda: medicamento.restricaoVenda,
        },
      ];
    });
  }

  function alterarQuantidade(medicamentoId: number, quantidade: number) {
    setItens((atual) =>
      atual
        .map((i) =>
          i.medicamentoId === medicamentoId
            ? {
                ...i,
                quantidade: Math.min(Math.max(quantidade, 0), i.estoqueAtual),
              }
            : i,
        )
        .filter((i) => i.quantidade > 0),
    );
  }

  function remover(medicamentoId: number) {
    setItens((atual) => atual.filter((i) => i.medicamentoId !== medicamentoId));
  }

  function limpar() {
    setItens([]);
    setClienteId(null);
    setDesconto(0);
    setReceita(null);
    setErro(null);
  }

  /** Cria a receita (status pendente) a partir dos dados informados no modal. */
  async function enviarReceita(input: NovaReceitaInput) {
    setEnviandoReceita(true);
    setErroReceita(null);
    try {
      const criada = await receitasService.criar(input);
      setReceita({
        id: criada.id,
        codigo: criada.codigo,
        pacienteNome: criada.pacienteNome,
        status: criada.status,
      });
      setModalReceita(false);
    } catch (e) {
      setErroReceita(mensagemDeErro(e, 'Não foi possível registrar a receita.'));
    } finally {
      setEnviandoReceita(false);
    }
  }

  /** Reconsulta o status da receita pendente (aprovação do farmacêutico). */
  async function verificarReceita(): Promise<SituacaoReceita | null> {
    if (!receita) return null;
    setVerificandoReceita(true);
    try {
      const atual = await receitasService.situacao(receita.id);
      setReceita(atual);
      return atual;
    } catch {
      setErro('Não foi possível verificar a situação da receita.');
      return receita;
    } finally {
      setVerificandoReceita(false);
    }
  }

  async function finalizar() {
    if (itens.length === 0) return;

    // Gate de receita para itens controlados.
    if (exigeReceita) {
      if (!receita) {
        setModalReceita(true);
        return;
      }
      if (receita.status !== 'aprovada') {
        const atual = await verificarReceita();
        if (atual?.status !== 'aprovada') {
          setErro(
            'A receita ainda não foi aprovada pelo farmacêutico. Aguarde a aprovação.',
          );
          return;
        }
      }
    }

    setFinalizando(true);
    setErro(null);
    try {
      const venda = await vendasService.registrar({
        clienteId: clienteId ?? undefined,
        receitaId: exigeReceita ? (receita?.id ?? undefined) : undefined,
        itens: itens.map((i) => ({
          medicamentoId: i.medicamentoId,
          quantidade: i.quantidade,
        })),
        desconto,
        formaPagamento,
      });
      setVendasRecentes((atual) => [venda, ...atual]);
      limpar();
      await Promise.all([carregarResumo(), buscarProdutos()]);
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível finalizar a venda.'));
    } finally {
      setFinalizando(false);
    }
  }

  async function imprimir(venda: Venda) {
    try {
      await vendasService.abrirComprovante(venda.id);
    } catch {
      setErro('Não foi possível gerar o comprovante.');
    }
  }

  const finalizarLabel = !exigeReceita
    ? 'Finalizar venda'
    : !receita
      ? 'Informar receita'
      : receitaAprovada
        ? 'Finalizar venda'
        : 'Verificar e finalizar';

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Ponto de Venda</h2>
      </div>

      <ShiftSummaryPanel resumo={resumo} carregando={carregandoResumo} />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-h-0 rounded-xl border border-gray-200 bg-white p-4">
          <ProductsSection
            medicamentos={medicamentos}
            carregando={carregandoProdutos}
            onBuscar={buscarProdutos}
            onAddProduct={adicionar}
          />
        </div>

        <NewSaleSection
          itens={itens}
          clientes={clientes}
          clienteId={clienteId}
          desconto={desconto}
          formaPagamento={formaPagamento}
          finalizando={finalizando}
          erro={erro}
          exigeReceita={exigeReceita}
          receita={receita}
          verificandoReceita={verificandoReceita}
          finalizarLabel={finalizarLabel}
          onChangeQuantity={alterarQuantidade}
          onRemove={remover}
          onChangeCliente={setClienteId}
          onChangeDesconto={setDesconto}
          onChangeFormaPagamento={setFormaPagamento}
          onVerificarReceita={verificarReceita}
          onFinalizar={finalizar}
          onLimpar={limpar}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">
          Vendas desta sessão
        </h3>
        <RecentSalesSection
          vendas={vendasRecentes}
          onImprimirComprovante={imprimir}
        />
      </div>

      <PrescriptionModal
        aberto={modalReceita}
        itens={itensControlados}
        salvando={enviandoReceita}
        erro={erroReceita}
        onClose={() => setModalReceita(false)}
        onSubmit={enviarReceita}
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
