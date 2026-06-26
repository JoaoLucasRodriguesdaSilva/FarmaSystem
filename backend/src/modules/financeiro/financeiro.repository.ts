import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../database/postgres/postgres.service';
import { Periodo, periodoParaSql } from '../../common/enums/periodo.enum';
import {
  DesempenhoFuncionarioDto,
  MargemCategoriaDto,
  PontoReceitaDespesaDto,
} from './dto/financeiro-response.dto';

/**
 * Premissa de custo: o schema não armazena custo de aquisição dos
 * medicamentos (apenas o preço de venda). Para fins gerenciais, estimamos o
 * custo das mercadorias vendidas como uma fração fixa do faturamento.
 * Ajuste este valor caso o modelo de custos passe a existir.
 */
export const CUSTO_ESTIMADO_RATIO = 0.6; // 60% de custo → 40% de margem bruta.

@Injectable()
export class FinanceiroRepository {
  constructor(private readonly db: PostgresService) {}

  private arredondar(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  private variacao(atual: number, anterior: number): number | null {
    if (anterior === 0) return atual > 0 ? 100 : null;
    return Math.round(((atual - anterior) / anterior) * 1000) / 10;
  }

  /** Receita do período atual e do anterior (vendas concluídas). */
  async receitaAtualEAnterior(
    periodo: Periodo,
  ): Promise<{ atual: number; anterior: number }> {
    const { unidade, passo } = periodoParaSql(periodo);
    const { rows } = await this.db.query<{
      atual: string;
      anterior: string;
    }>(
      `WITH p AS (
         SELECT DATE_TRUNC($1, now()) AS ini,
                DATE_TRUNC($1, now()) + $2::interval AS fim,
                DATE_TRUNC($1, now()) - $2::interval AS ini_ant
       )
       SELECT
         COALESCE(SUM(v.total) FILTER (WHERE v.criada_em >= p.ini AND v.criada_em < p.fim), 0) AS atual,
         COALESCE(SUM(v.total) FILTER (WHERE v.criada_em >= p.ini_ant AND v.criada_em < p.ini), 0) AS anterior
       FROM p
       LEFT JOIN vendas v
         ON v.status = 'concluida'
        AND v.criada_em >= p.ini_ant AND v.criada_em < p.fim`,
      [unidade, passo],
    );
    return {
      atual: Number(rows[0]?.atual ?? 0),
      anterior: Number(rows[0]?.anterior ?? 0),
    };
  }

  pctVariacao(atual: number, anterior: number): number | null {
    return this.variacao(atual, anterior);
  }

  async receitaDespesas(periodo: Periodo): Promise<PontoReceitaDespesaDto[]> {
    const { unidade, passo, bucket } = periodoParaSql(periodo);
    const { rows } = await this.db.query<{ bucket: Date; receita: string }>(
      `WITH p AS (
         SELECT DATE_TRUNC($1, now()) AS ini,
                DATE_TRUNC($1, now()) + $2::interval AS fim
       )
       SELECT DATE_TRUNC($3, v.criada_em) AS bucket, COALESCE(SUM(v.total), 0) AS receita
       FROM vendas v, p
       WHERE v.status = 'concluida'
         AND v.criada_em >= p.ini AND v.criada_em < p.fim
       GROUP BY bucket
       ORDER BY bucket ASC`,
      [unidade, passo, bucket],
    );
    return rows.map((r) => {
      const receita = Number(r.receita);
      return {
        data: r.bucket.toISOString(),
        receita: this.arredondar(receita),
        despesas: this.arredondar(receita * CUSTO_ESTIMADO_RATIO),
      };
    });
  }

  async margemPorCategoria(periodo: Periodo): Promise<MargemCategoriaDto[]> {
    const { unidade, passo } = periodoParaSql(periodo);
    const { rows } = await this.db.query<{
      categoria: string;
      faturamento: string;
    }>(
      `WITH p AS (
         SELECT DATE_TRUNC($1, now()) AS ini,
                DATE_TRUNC($1, now()) + $2::interval AS fim
       )
       SELECT m.categoria, COALESCE(SUM(iv.subtotal), 0) AS faturamento
       FROM itens_venda iv
       JOIN vendas v ON v.id = iv.venda_id AND v.status = 'concluida'
       JOIN medicamentos m ON m.id = iv.medicamento_id, p
       WHERE v.criada_em >= p.ini AND v.criada_em < p.fim
       GROUP BY m.categoria
       ORDER BY faturamento DESC`,
      [unidade, passo],
    );
    return rows.map((r) => {
      const faturamento = Number(r.faturamento);
      return {
        categoria: r.categoria,
        faturamento: this.arredondar(faturamento),
        margem: this.arredondar(faturamento * (1 - CUSTO_ESTIMADO_RATIO)),
      };
    });
  }

  async desempenhoFuncionarios(
    periodo: Periodo,
  ): Promise<DesempenhoFuncionarioDto[]> {
    const { unidade, passo } = periodoParaSql(periodo);
    const { rows } = await this.db.query<{
      funcionario_id: number;
      nome: string;
      total: string;
      qtd: string;
    }>(
      `WITH p AS (
         SELECT DATE_TRUNC($1, now()) AS ini,
                DATE_TRUNC($1, now()) + $2::interval AS fim
       )
       SELECT v.funcionario_id, u.nome,
              COALESCE(SUM(v.total), 0) AS total,
              COUNT(*) AS qtd
       FROM vendas v
       JOIN usuarios u ON u.id = v.funcionario_id, p
       WHERE v.status = 'concluida'
         AND v.criada_em >= p.ini AND v.criada_em < p.fim
       GROUP BY v.funcionario_id, u.nome
       ORDER BY total DESC`,
      [unidade, passo],
    );
    return rows.map((r) => {
      const total = Number(r.total);
      const qtd = Number(r.qtd);
      return {
        funcionarioId: r.funcionario_id,
        nome: r.nome,
        totalVendido: this.arredondar(total),
        quantidadeVendas: qtd,
        ticketMedio: qtd ? this.arredondar(total / qtd) : 0,
      };
    });
  }
}
