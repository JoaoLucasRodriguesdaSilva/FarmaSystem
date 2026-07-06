import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../database/postgres/postgres.service';
import { Periodo, periodoParaSql } from '../../common/enums/periodo.enum';
import {
  DispensacaoSemanalDto,
  MetricasDashboardDto,
  PontoSerieDto,
  ProdutoMaisVendidoDto,
} from './dto/dashboard-response.dto';

@Injectable()
export class DashboardRepository {
  constructor(private readonly db: PostgresService) {}

  /** Variação percentual entre o período atual e o anterior. */
  private variacao(atual: number, anterior: number): number | null {
    if (anterior === 0) return atual > 0 ? 100 : null;
    return Math.round(((atual - anterior) / anterior) * 1000) / 10;
  }

  async metricas(periodo: Periodo): Promise<MetricasDashboardDto> {
    const { unidade, total: passo } = periodoParaSql(periodo);

    const vendas = await this.db.query<{
      receita_atual: string;
      receita_ant: string;
      vendas_atual: string;
      vendas_ant: string;
    }>(
      `WITH p AS (
         SELECT DATE_TRUNC($1, now()) AS ini,
                DATE_TRUNC($1, now()) + $2::interval AS fim,
                DATE_TRUNC($1, now()) - $2::interval AS ini_ant
       )
       SELECT
         COALESCE(SUM(v.total) FILTER (WHERE v.criada_em >= p.ini AND v.criada_em < p.fim), 0) AS receita_atual,
         COALESCE(SUM(v.total) FILTER (WHERE v.criada_em >= p.ini_ant AND v.criada_em < p.ini), 0) AS receita_ant,
         COUNT(v.id) FILTER (WHERE v.criada_em >= p.ini AND v.criada_em < p.fim) AS vendas_atual,
         COUNT(v.id) FILTER (WHERE v.criada_em >= p.ini_ant AND v.criada_em < p.ini) AS vendas_ant
       FROM p
       LEFT JOIN vendas v
         ON v.status = 'concluida'
        AND v.criada_em >= p.ini_ant AND v.criada_em < p.fim`,
      [unidade, passo],
    );

    const usuarios = await this.db.query<{
      total_ativos: string;
      criados_atual: string;
      criados_ant: string;
    }>(
      `WITH p AS (
         SELECT DATE_TRUNC($1, now()) AS ini,
                DATE_TRUNC($1, now()) - $2::interval AS ini_ant
       )
       SELECT
         (SELECT COUNT(*) FROM usuarios WHERE status = 'ativo') AS total_ativos,
         COUNT(u.id) FILTER (WHERE u.criado_em >= p.ini) AS criados_atual,
         COUNT(u.id) FILTER (WHERE u.criado_em >= p.ini_ant AND u.criado_em < p.ini) AS criados_ant
       FROM p
       LEFT JOIN usuarios u ON u.criado_em >= p.ini_ant`,
      [unidade, passo],
    );

    const produtos = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM medicamentos
       WHERE ativo = TRUE AND estoque_atual > 0`,
    );

    const v = vendas.rows[0];
    const u = usuarios.rows[0];

    return {
      usuarios: {
        valor: Number(u?.total_ativos ?? 0),
        variacao: this.variacao(
          Number(u?.criados_atual ?? 0),
          Number(u?.criados_ant ?? 0),
        ),
      },
      receita: {
        valor: Number(v?.receita_atual ?? 0),
        variacao: this.variacao(
          Number(v?.receita_atual ?? 0),
          Number(v?.receita_ant ?? 0),
        ),
      },
      vendas: {
        valor: Number(v?.vendas_atual ?? 0),
        variacao: this.variacao(
          Number(v?.vendas_atual ?? 0),
          Number(v?.vendas_ant ?? 0),
        ),
      },
      produtosEstoque: {
        valor: Number(produtos.rows[0]?.total ?? 0),
        variacao: null,
      },
    };
  }

  /**
   * Série temporal de vendas (quantidade) ou receita (soma) no período,
   * com marcos (buckets) fixos: cada intervalo aparece mesmo sem vendas
   * (valor 0). Ver {@link periodoParaSql} para a grade de cada período.
   */
  async serie(
    periodo: Periodo,
    medida: 'quantidade' | 'receita',
  ): Promise<PontoSerieDto[]> {
    const { unidade, total, step, ultimo } = periodoParaSql(periodo);
    const expr =
      medida === 'receita' ? 'COALESCE(SUM(v.total), 0)' : 'COUNT(v.id)';

    // A grade de marcos (bucket_ini) muda conforme o período. No mês, exibimos
    // de 3 em 3 dias (1, 4, …, 28) e sempre o último dia do mês (28/29/30/31);
    // o UNION deduplica quando o último dia já cai na grade (ex.: fevereiro).
    let fonteMarcos: string;
    let params: unknown[];
    if (periodo === Periodo.MES) {
      fonteMarcos = `
         SELECT gs AS bucket_ini
           FROM generate_series(
                  (SELECT ini FROM p),
                  (SELECT ini FROM p) + INTERVAL '27 days',
                  INTERVAL '3 days'
                ) AS gs
         UNION
         SELECT (SELECT ini FROM p) + INTERVAL '1 month' - INTERVAL '1 day'`;
      params = [unidade, total];
    } else {
      fonteMarcos = `
         SELECT gs AS bucket_ini
           FROM generate_series(
                  (SELECT ini FROM p),
                  (SELECT ini FROM p) + $3::interval,
                  $4::interval
                ) AS gs`;
      params = [unidade, total, ultimo, step];
    }

    const { rows } = await this.db.query<{ bucket: Date; valor: string }>(
      `WITH p AS (
         SELECT DATE_TRUNC($1, now()) AS ini,
                DATE_TRUNC($1, now()) + $2::interval AS fim
       ),
       buckets AS (
         SELECT bucket_ini,
                COALESCE(
                  LEAD(bucket_ini) OVER (ORDER BY bucket_ini),
                  (SELECT fim FROM p)
                ) AS bucket_fim
         FROM ( ${fonteMarcos} ) AS src
       )
       SELECT b.bucket_ini AS bucket, ${expr} AS valor
       FROM buckets b
       LEFT JOIN vendas v
         ON v.status = 'concluida'
        AND v.criada_em >= b.bucket_ini
        AND v.criada_em <  b.bucket_fim
       GROUP BY b.bucket_ini
       ORDER BY b.bucket_ini ASC`,
      params,
    );

    return rows.map((r) => ({
      data: r.bucket.toISOString(),
      valor: Number(r.valor),
    }));
  }

  async produtosMaisVendidos(limite = 5): Promise<ProdutoMaisVendidoDto[]> {
    const { rows } = await this.db.query<{
      medicamento_id: number;
      nome: string;
      quantidade: string;
      total: string;
    }>(
      `SELECT iv.medicamento_id, m.nome,
              SUM(iv.quantidade) AS quantidade,
              SUM(iv.subtotal) AS total
       FROM itens_venda iv
       JOIN vendas v ON v.id = iv.venda_id AND v.status = 'concluida'
       JOIN medicamentos m ON m.id = iv.medicamento_id
       GROUP BY iv.medicamento_id, m.nome
       ORDER BY quantidade DESC
       LIMIT $1`,
      [limite],
    );
    return rows.map((r) => ({
      medicamentoId: r.medicamento_id,
      nome: r.nome,
      quantidade: Number(r.quantidade),
      total: Number(r.total),
    }));
  }

  /** Comparativo diário (últimos 7 dias) de dispensações x receitas processadas. */
  async dispensacoesSemanais(): Promise<DispensacaoSemanalDto[]> {
    const vendas = await this.db.query<{ dia: Date; total: string }>(
      `SELECT DATE_TRUNC('day', criada_em) AS dia, COUNT(*) AS total
       FROM vendas
       WHERE status = 'concluida'
         AND criada_em >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY dia`,
    );
    const receitas = await this.db.query<{ dia: Date; total: string }>(
      `SELECT DATE_TRUNC('day', analisada_em) AS dia, COUNT(*) AS total
       FROM receitas
       WHERE analisada_em IS NOT NULL
         AND analisada_em >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY dia`,
    );

    const chave = (d: Date) => d.toISOString().slice(0, 10);
    const mapaVendas = new Map(
      vendas.rows.map((r) => [chave(r.dia), Number(r.total)]),
    );
    const mapaReceitas = new Map(
      receitas.rows.map((r) => [chave(r.dia), Number(r.total)]),
    );

    const resultado: DispensacaoSemanalDto[] = [];
    const hoje = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      resultado.push({
        data: k,
        dispensacoes: mapaVendas.get(k) ?? 0,
        receitas: mapaReceitas.get(k) ?? 0,
      });
    }
    return resultado;
  }
}
