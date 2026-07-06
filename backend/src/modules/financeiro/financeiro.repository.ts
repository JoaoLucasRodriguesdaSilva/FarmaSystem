import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../database/postgres/postgres.service';
import { Periodo, periodoParaSql } from '../../common/enums/periodo.enum';
import {
  DesempenhoFuncionarioDto,
  MargemCategoriaDto,
  PontoReceitaDespesaDto,
} from './dto/financeiro-response.dto';

/**
 * Fallback de custo: quando um medicamento vendido ainda não possui lote com
 * `custo_unitario` informado, estimamos o custo como uma fração do preço de
 * venda. Lotes com custo informado usam o valor real de aquisição.
 */
export const CUSTO_ESTIMADO_RATIO = 0.6; // 60% de custo → 40% de margem bruta.

/**
 * Custo médio de aquisição por medicamento (média dos `custo_unitario` dos
 * lotes que o possuem). Usado como base do custo das mercadorias vendidas.
 */
const CUSTO_CTE = `custo AS (
  SELECT medicamento_id, AVG(custo_unitario) AS custo_unit
  FROM lotes
  WHERE custo_unitario IS NOT NULL
  GROUP BY medicamento_id
)`;

/**
 * Custo (COGS) de um item de venda: quantidade × custo de aquisição do lote,
 * caindo para a estimativa (preço de venda × ratio) quando não há custo real.
 */
const CUSTO_ITEM_EXPR = `iv.quantidade * COALESCE(c.custo_unit, iv.preco_unitario * ${CUSTO_ESTIMADO_RATIO})`;

/** Unidade de DATE_TRUNC da série receita×despesas, por período. */
const BUCKET_RECEITA_DESPESAS: Record<Periodo, string> = {
  [Periodo.HOJE]: 'hour',
  [Periodo.SEMANA]: 'day',
  [Periodo.MES]: 'day',
  [Periodo.ANO]: 'month',
};

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
    const { unidade, total: passo } = periodoParaSql(periodo);
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

  /** Custo das mercadorias vendidas no período atual e no anterior. */
  async custoAtualEAnterior(
    periodo: Periodo,
  ): Promise<{ atual: number; anterior: number }> {
    const { unidade, total: passo } = periodoParaSql(periodo);
    const { rows } = await this.db.query<{ atual: string; anterior: string }>(
      `WITH p AS (
         SELECT DATE_TRUNC($1, now()) AS ini,
                DATE_TRUNC($1, now()) + $2::interval AS fim,
                DATE_TRUNC($1, now()) - $2::interval AS ini_ant
       ),
       ${CUSTO_CTE}
       SELECT
         COALESCE(SUM(${CUSTO_ITEM_EXPR}) FILTER (WHERE v.criada_em >= p.ini AND v.criada_em < p.fim), 0) AS atual,
         COALESCE(SUM(${CUSTO_ITEM_EXPR}) FILTER (WHERE v.criada_em >= p.ini_ant AND v.criada_em < p.ini), 0) AS anterior
       FROM itens_venda iv
       JOIN vendas v ON v.id = iv.venda_id AND v.status = 'concluida'
       LEFT JOIN custo c ON c.medicamento_id = iv.medicamento_id, p
       WHERE v.criada_em >= p.ini_ant AND v.criada_em < p.fim`,
      [unidade, passo],
    );
    return {
      atual: Number(rows[0]?.atual ?? 0),
      anterior: Number(rows[0]?.anterior ?? 0),
    };
  }

  async receitaDespesas(periodo: Periodo): Promise<PontoReceitaDespesaDto[]> {
    const { unidade, total: passo } = periodoParaSql(periodo);
    // Granularidade do agrupamento da série financeira (mantida por período).
    const bucket = BUCKET_RECEITA_DESPESAS[periodo];
    // Receita vem das vendas (líquida de desconto); despesas vêm do custo real
    // dos itens vendidos. Combinamos por bucket via FULL JOIN.
    const { rows } = await this.db.query<{
      bucket: Date;
      receita: string;
      despesas: string;
    }>(
      `WITH p AS (
         SELECT DATE_TRUNC($1, now()) AS ini,
                DATE_TRUNC($1, now()) + $2::interval AS fim
       ),
       ${CUSTO_CTE},
       receita AS (
         SELECT DATE_TRUNC($3, v.criada_em) AS bucket, COALESCE(SUM(v.total), 0) AS receita
         FROM vendas v, p
         WHERE v.status = 'concluida'
           AND v.criada_em >= p.ini AND v.criada_em < p.fim
         GROUP BY bucket
       ),
       despesa AS (
         SELECT DATE_TRUNC($3, v.criada_em) AS bucket,
                COALESCE(SUM(${CUSTO_ITEM_EXPR}), 0) AS despesas
         FROM itens_venda iv
         JOIN vendas v ON v.id = iv.venda_id AND v.status = 'concluida'
         LEFT JOIN custo c ON c.medicamento_id = iv.medicamento_id, p
         WHERE v.criada_em >= p.ini AND v.criada_em < p.fim
         GROUP BY bucket
       )
       SELECT COALESCE(r.bucket, d.bucket) AS bucket,
              COALESCE(r.receita, 0) AS receita,
              COALESCE(d.despesas, 0) AS despesas
       FROM receita r
       FULL JOIN despesa d ON r.bucket = d.bucket
       ORDER BY bucket ASC`,
      [unidade, passo, bucket],
    );
    return rows.map((r) => ({
      data: r.bucket.toISOString(),
      receita: this.arredondar(Number(r.receita)),
      despesas: this.arredondar(Number(r.despesas)),
    }));
  }

  async margemPorCategoria(periodo: Periodo): Promise<MargemCategoriaDto[]> {
    const { unidade, total: passo } = periodoParaSql(periodo);
    const { rows } = await this.db.query<{
      categoria: string;
      faturamento: string;
      custo: string;
    }>(
      `WITH p AS (
         SELECT DATE_TRUNC($1, now()) AS ini,
                DATE_TRUNC($1, now()) + $2::interval AS fim
       ),
       ${CUSTO_CTE}
       SELECT m.categoria,
              COALESCE(SUM(iv.subtotal), 0) AS faturamento,
              COALESCE(SUM(${CUSTO_ITEM_EXPR}), 0) AS custo
       FROM itens_venda iv
       JOIN vendas v ON v.id = iv.venda_id AND v.status = 'concluida'
       JOIN medicamentos m ON m.id = iv.medicamento_id
       LEFT JOIN custo c ON c.medicamento_id = iv.medicamento_id, p
       WHERE v.criada_em >= p.ini AND v.criada_em < p.fim
       GROUP BY m.categoria
       ORDER BY faturamento DESC`,
      [unidade, passo],
    );
    return rows.map((r) => {
      const faturamento = Number(r.faturamento);
      const custo = Number(r.custo);
      return {
        categoria: r.categoria,
        faturamento: this.arredondar(faturamento),
        margem: this.arredondar(faturamento - custo),
      };
    });
  }

  async desempenhoFuncionarios(
    periodo: Periodo,
  ): Promise<DesempenhoFuncionarioDto[]> {
    const { unidade, total: passo } = periodoParaSql(periodo);
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
