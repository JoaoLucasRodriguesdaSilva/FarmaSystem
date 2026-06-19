/** Situação de uma receita médica (enum `status_receita` do PostgreSQL). */
export enum StatusReceita {
  PENDENTE = 'pendente',
  APROVADA = 'aprovada',
  REVISAO = 'revisao',
  REJEITADA = 'rejeitada',
}
