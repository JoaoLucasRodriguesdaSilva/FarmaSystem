/** Restrição de venda do medicamento (enum `restricao_venda` do PostgreSQL). */
export enum RestricaoVenda {
  VENDA_LIVRE = 'venda_livre',
  CONTROLADO = 'controlado',
  USO_HOSPITALAR = 'uso_hospitalar',
}
