/** Estado do estoque de um medicamento (enum `status_estoque` do PostgreSQL). */
export enum StatusEstoque {
  NORMAL = 'normal',
  BAIXO = 'baixo',
  CRITICO = 'critico',
  ESGOTADO = 'esgotado',
}

/**
 * Deriva o status do estoque a partir da quantidade atual e do mínimo.
 * - esgotado: sem unidades
 * - critico: no nível mínimo ou abaixo
 * - baixo: até 1,5x o mínimo
 * - normal: acima disso
 */
export function calcularStatusEstoque(
  estoqueAtual: number,
  estoqueMinimo: number,
): StatusEstoque {
  if (estoqueAtual <= 0) return StatusEstoque.ESGOTADO;
  if (estoqueAtual <= estoqueMinimo) return StatusEstoque.CRITICO;
  if (estoqueAtual <= estoqueMinimo * 1.5) return StatusEstoque.BAIXO;
  return StatusEstoque.NORMAL;
}
