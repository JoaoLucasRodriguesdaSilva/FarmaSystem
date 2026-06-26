/** Janela temporal para métricas de dashboard/financeiro. */
export enum Periodo {
  HOJE = 'hoje',
  SEMANA = 'semana',
  MES = 'mes',
  ANO = 'ano',
}

/** Unidade de DATE_TRUNC e passo de intervalo para cada período. */
export function periodoParaSql(periodo: Periodo): {
  unidade: string;
  passo: string;
  bucket: string;
} {
  switch (periodo) {
    case Periodo.HOJE:
      return { unidade: 'day', passo: '1 day', bucket: 'hour' };
    case Periodo.SEMANA:
      return { unidade: 'week', passo: '1 week', bucket: 'day' };
    case Periodo.ANO:
      return { unidade: 'year', passo: '1 year', bucket: 'month' };
    case Periodo.MES:
    default:
      return { unidade: 'month', passo: '1 month', bucket: 'day' };
  }
}
