'use client';

import { useCallback, useEffect, useState } from 'react';
import { NewSaleSection } from '@/components/pdv/NewSaleSection';
import { ProductsSection } from '@/components/pdv/ProductsSection';
import { RecentSalesSection } from '@/components/pdv/RecentSalesSection';
import { ShiftSummaryPanel } from '@/components/pdv/ShiftSummaryPanel';
import { clientesService } from '@/services/clientes.service';
import { medicamentosService } from '@/services/medicamentos.service';
import { vendasService } from '@/services/vendas.service';
import type {
  CartItem,
  Cliente,
  FormaPagamento,
  Medicamento,
  ResumoTurno,
  Venda,
} from '@/types';

const CART_KEY = 'farmasystem.pdv.cart';

/**
 * PDV (Ponto de Venda): fonte da verdade do atendimento atual. O carrinho é
 * sincronizado com o localStorage para sobreviver a um recarregamento acidental.
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

  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [resumo, setResumo] = useState<ResumoTurno | null>(null);
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [vendasRecentes, setVendasRecentes] = useState<Venda[]>([]);

  // Evita gravar o carrinho no localStorage antes de hidratá-lo na montagem.
  // Precisa ser estado (não ref): o efeito de salvar captura o valor por render,
  // então só passa a persistir depois que a hidratação concluiu.
  const [carregado, setCarregado] = useState(false);

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

  // Carga inicial: produtos, clientes, resumo do turno e carrinho persistido.
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
    } catch {
      // ignora carrinho corrompido
    }
    setCarregado(true);
  }, [buscarProdutos, carregarResumo]);

  // Persiste o carrinho a cada alteração (somente após a hidratação).
  useEffect(() => {
    if (!carregado) return;
    localStorage.setItem(CART_KEY, JSON.stringify(itens));
  }, [itens, carregado]);

  function adicionar(medicamento: Medicamento) {
    setErro(null);
    setItens((atual) => {
      const existente = atual.find(
        (i) => i.medicamentoId === medicamento.id,
      );
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
                quantidade: Math.min(
                  Math.max(quantidade, 0),
                  i.estoqueAtual,
                ),
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
    setErro(null);
  }

  async function finalizar() {
    if (itens.length === 0) return;
    setFinalizando(true);
    setErro(null);
    try {
      const venda = await vendasService.registrar({
        clienteId: clienteId ?? undefined,
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
      const msg =
        (e as { response?: { data?: { mensagem?: string } } }).response?.data
          ?.mensagem ?? 'Não foi possível finalizar a venda.';
      setErro(msg);
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
          onChangeQuantity={alterarQuantidade}
          onRemove={remover}
          onChangeCliente={setClienteId}
          onChangeDesconto={setDesconto}
          onChangeFormaPagamento={setFormaPagamento}
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
    </div>
  );
}
