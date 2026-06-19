/** Tipo de alerta de estoque (enum `tipo_alerta` do PostgreSQL). */
export enum TipoAlerta {
  ESTOQUE_BAIXO = 'estoque_baixo',
  VENCIMENTO_PROXIMO = 'vencimento_proximo',
  ESGOTADO = 'esgotado',
}
