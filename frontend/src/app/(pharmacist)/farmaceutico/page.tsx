'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExpirationAlertsPanel } from '@/components/pharmacist/ExpirationAlertsPanel';
import { PrescriptionsSection } from '@/components/pharmacist/PrescriptionsSection';
import { StockAlertsPanel } from '@/components/pharmacist/StockAlertsPanel';
import { estoqueService } from '@/services/estoque.service';
import { receitasService } from '@/services/receitas.service';
import type { AlertaEstoque, Receita } from '@/types';

export default function PharmacistPage() {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [carregandoReceitas, setCarregandoReceitas] = useState(true);
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const [alertas, setAlertas] = useState<AlertaEstoque[]>([]);
  const [carregandoAlertas, setCarregandoAlertas] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const alertasVencimento = alertas.filter(
    (a) => a.tipo === 'vencimento_proximo',
  );
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

  useEffect(() => {
    void carregarReceitas();
    void carregarAlertas();
  }, [carregarReceitas, carregarAlertas]);

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

  async function revisar(receita: Receita) {
    const observacao = prompt(
      `Observação para revisão da receita ${receita.codigo}:`,
    );
    if (!observacao) return;
    setProcessandoId(receita.id);
    setErro(null);
    try {
      await receitasService.revisar(receita.id, observacao);
      await carregarReceitas();
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível enviar para revisão.'));
    } finally {
      setProcessandoId(null);
    }
  }

  async function resolver(alerta: AlertaEstoque) {
    setErro(null);
    try {
      await estoqueService.resolverAlerta(alerta.id);
      await carregarAlertas();
    } catch {
      setErro('Não foi possível resolver o alerta.');
    }
  }

  async function gerarReposicao(alerta: AlertaEstoque) {
    const minimo = alerta.quantidadeMinima ?? 10;
    const atual = alerta.quantidadeAtual ?? 0;
    const sugerida = Math.max(minimo * 2 - atual, minimo);
    if (
      !confirm(
        `Gerar solicitação de reposição de ${sugerida} un. para "${
          alerta.medicamentoNome ?? alerta.medicamentoId
        }"?`,
      )
    ) {
      return;
    }
    setErro(null);
    try {
      await estoqueService.criarSolicitacao({
        medicamentoId: alerta.medicamentoId,
        quantidadeSolicitada: sugerida,
        observacao: `Gerada a partir de alerta de ${alerta.tipo}.`,
      });
      alert('Solicitação de reposição criada.');
    } catch {
      setErro('Não foi possível gerar a solicitação de reposição.');
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
          onRevisar={revisar}
        />

        <div className="space-y-4">
          <StockAlertsPanel
            alertas={alertasEstoque}
            carregando={carregandoAlertas}
            onResolver={resolver}
            onGerarReposicao={gerarReposicao}
          />
          <ExpirationAlertsPanel
            alertas={alertasVencimento}
            carregando={carregandoAlertas}
            onResolver={resolver}
          />
        </div>
      </div>
    </div>
  );
}

function mensagemDeErro(e: unknown, padrao: string): string {
  return (
    (e as { response?: { data?: { mensagem?: string } } }).response?.data
      ?.mensagem ?? padrao
  );
}
