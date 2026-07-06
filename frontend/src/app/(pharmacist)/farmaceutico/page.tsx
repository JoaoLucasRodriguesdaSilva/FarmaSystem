'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExpirationAlertsPanel } from '@/components/pharmacist/ExpirationAlertsPanel';
import { NewBatchModal } from '@/components/pharmacist/NewBatchModal';
import { PrescriptionsSection } from '@/components/pharmacist/PrescriptionsSection';
import { StockAlertsPanel } from '@/components/pharmacist/StockAlertsPanel';
import { WeeklyDispensationsChartSection } from '@/components/pharmacist/WeeklyDispensationsChartSection';
import { estoqueService, type NovoLoteInput } from '@/services/estoque.service';
import { receitasService } from '@/services/receitas.service';
import type { AlertaEstoque, Lote, Receita } from '@/types';

/** Alvo do modal de reposição de lote (por alerta de estoque ou lote a vencer). */
interface ReporAlvo {
  medicamentoId: number;
  medicamentoNome?: string;
  /** Quando vem de um alerta de estoque, ele é resolvido após repor. */
  alertaId?: number;
}

export default function PharmacistPage() {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [carregandoReceitas, setCarregandoReceitas] = useState(true);
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const [alertas, setAlertas] = useState<AlertaEstoque[]>([]);
  const [carregandoAlertas, setCarregandoAlertas] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Vencimentos próximos: lotes com saldo que vencem em 30 dias ou menos.
  const [lotesVencendo, setLotesVencendo] = useState<Lote[]>([]);
  const [carregandoLotes, setCarregandoLotes] = useState(true);

  // Reposição em andamento: abre o modal de novo lote vinculado ao medicamento.
  const [reporAlvo, setReporAlvo] = useState<ReporAlvo | null>(null);
  const [salvandoLote, setSalvandoLote] = useState(false);
  const [erroLote, setErroLote] = useState<string | null>(null);

  const alertasEstoque = alertas.filter(
    (a) => a.tipo === 'estoque_baixo' || a.tipo === 'esgotado',
  );

  const carregarReceitas = useCallback(async () => {
    setCarregandoReceitas(true);
    try {
      const resposta = await receitasService.listar({
        status: 'pendente',
        limit: 100,
      });
      setReceitas(resposta.dados);
    } catch {
      setErro('Não foi possível carregar as receitas.');
    } finally {
      setCarregandoReceitas(false);
    }
  }, []);

  const carregarAlertas = useCallback(async () => {
    setCarregandoAlertas(true);
    try {
      setAlertas(await estoqueService.listarAlertas());
    } catch {
      setErro('Não foi possível carregar os alertas.');
    } finally {
      setCarregandoAlertas(false);
    }
  }, []);

  // Busca os lotes que ainda têm saldo e vencem em até 30 dias.
  const carregarLotesVencendo = useCallback(async () => {
    setCarregandoLotes(true);
    try {
      setLotesVencendo(
        await estoqueService.listarLotes({
          vencimentoEm: 30,
          comEstoque: true,
        }),
      );
    } catch {
      setErro('Não foi possível carregar os lotes próximos do vencimento.');
    } finally {
      setCarregandoLotes(false);
    }
  }, []);

  useEffect(() => {
    void carregarReceitas();
    void carregarAlertas();
    void carregarLotesVencendo();
  }, [carregarReceitas, carregarAlertas, carregarLotesVencendo]);

  async function aprovar(receita: Receita) {
    setProcessandoId(receita.id);
    setErro(null);
    try {
      await receitasService.aprovar(receita.id);
      await carregarReceitas();
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível aprovar a receita.'));
    } finally {
      setProcessandoId(null);
    }
  }

  async function rejeitar(receita: Receita) {
    setProcessandoId(receita.id);
    setErro(null);
    try {
      await receitasService.rejeitar(receita.id);
      await carregarReceitas();
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível rejeitar a receita.'));
    } finally {
      setProcessandoId(null);
    }
  }

  // Resolver um alerta de estoque passa pelo registro de um novo lote:
  // abrimos o modal vinculado ao medicamento (e resolvemos o alerta ao salvar).
  function resolverEstoque(alerta: AlertaEstoque) {
    setErroLote(null);
    setReporAlvo({
      medicamentoId: alerta.medicamentoId,
      medicamentoNome: alerta.medicamentoNome,
      alertaId: alerta.id,
    });
  }

  // Repor um lote próximo do vencimento: mesmo modal, sem alerta a resolver.
  function reporLote(lote: Lote) {
    setErroLote(null);
    setReporAlvo({
      medicamentoId: lote.medicamentoId,
      medicamentoNome: lote.medicamentoNome,
    });
  }

  async function registrarLote(input: NovoLoteInput) {
    if (!reporAlvo) return;
    setSalvandoLote(true);
    setErroLote(null);
    try {
      await estoqueService.criarLote(input);
      if (reporAlvo.alertaId !== undefined) {
        await estoqueService.resolverAlerta(reporAlvo.alertaId);
      }
      setReporAlvo(null);
      await Promise.all([carregarAlertas(), carregarLotesVencendo()]);
    } catch (e) {
      setErroLote(mensagemDeErro(e, 'Não foi possível registrar o lote.'));
    } finally {
      setSalvandoLote(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Painel do Farmacêutico</h2>

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {erro}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <PrescriptionsSection
          receitas={receitas}
          carregando={carregandoReceitas}
          processandoId={processandoId}
          onAprovar={aprovar}
          onRejeitar={rejeitar}
        />

        <div className="space-y-4">
          <StockAlertsPanel
            alertas={alertasEstoque}
            carregando={carregandoAlertas}
            onResolver={resolverEstoque}
          />
          <ExpirationAlertsPanel
            lotes={lotesVencendo}
            carregando={carregandoLotes}
            onResolver={reporLote}
          />
        </div>
      </div>

      <WeeklyDispensationsChartSection />

      <NewBatchModal
        aberto={reporAlvo !== null}
        medicamentoId={reporAlvo?.medicamentoId ?? null}
        medicamentoNome={reporAlvo?.medicamentoNome}
        salvando={salvandoLote}
        erro={erroLote}
        onClose={() => setReporAlvo(null)}
        onSubmit={registrarLote}
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
