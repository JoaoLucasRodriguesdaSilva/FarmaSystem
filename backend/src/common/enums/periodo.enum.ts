/** Janela temporal para métricas de dashboard/financeiro. */
export enum Periodo {
  HOJE = 'hoje',
  SEMANA = 'semana',
  MES = 'mes',
  ANO = 'ano',
}

/**
 * Configuração de marcos (buckets) fixos do gráfico para cada período:
 * - `unidade`: unidade do DATE_TRUNC que define o início da janela.
 * - `total`: comprimento total da janela (usado nas métricas e no fim do gráfico).
 * - `step`: largura de cada marco do gráfico.
 * - `ultimo`: deslocamento do início do último marco (= (count - 1) * step),
 *   usado como fim do `generate_series` para gerar exatamente `count` marcos.
 * - `count`: quantidade fixa de marcos.
 *
 * Marcos por período:
 *   Hoje  → 12 intervalos de 2 horas (24h)
 *   Semana→ 7 intervalos de 1 dia
 *   Mês   → de 3 em 3 dias (1, 4, …, 28) + o último dia do mês (ver
 *           DashboardRepository.serie; `step`/`ultimo`/`count` abaixo não se
 *           aplicam ao gráfico do mês, mas seguem válidos para as métricas)
 *   Ano   → 12 intervalos de 1 mês
 */
export function periodoParaSql(periodo: Periodo): {
  unidade: string;
  total: string;
  step: string;
  ultimo: string;
  count: number;
} {
  switch (periodo) {
    case Periodo.HOJE:
      return {
        unidade: 'day',
        total: '1 day',
        step: '2 hours',
        ultimo: '22 hours',
        count: 12,
      };
    case Periodo.SEMANA:
      return {
        unidade: 'week',
        total: '1 week',
        step: '1 day',
        ultimo: '6 days',
        count: 7,
      };
    case Periodo.ANO:
      return {
        unidade: 'year',
        total: '1 year',
        step: '1 month',
        ultimo: '11 months',
        count: 12,
      };
    case Periodo.MES:
    default:
      return {
        unidade: 'month',
        total: '1 month',
        step: '1 week',
        ultimo: '21 days',
        count: 4,
      };
  }
}
