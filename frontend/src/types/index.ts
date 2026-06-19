// Tipos de domínio espelhando os schemas da API (ver swagger_api.md, seção 4).
// Chaves em camelCase, conforme o contrato JSON.

export type PerfilUsuario = 'administrador' | 'farmaceutico' | 'atendente';
export type StatusUsuario = 'ativo' | 'inativo';
export type RestricaoVenda = 'venda_livre' | 'controlado' | 'uso_hospitalar';
export type StatusEstoque = 'normal' | 'baixo' | 'critico' | 'esgotado';
export type FormaPagamento =
  | 'dinheiro'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'pix';
export type StatusVenda = 'concluida' | 'cancelada';
export type StatusReceita = 'pendente' | 'aprovada' | 'revisao' | 'rejeitada';
export type UrgenciaReceita = 'normal' | 'urgente';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  status: StatusUsuario;
  crf?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  usuario: Usuario;
}

export interface Medicamento {
  id: number;
  nome: string;
  principioAtivo: string;
  categoria: string;
  fabricante: string;
  viaAdministracao: string;
  apresentacao: string;
  restricaoVenda: RestricaoVenda;
  preco: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  statusEstoque: StatusEstoque;
  fornecedorId?: number;
  imagens: string[];
}

export interface MedicamentoDetalhe extends Medicamento {
  fornecedorId?: number;
  bulaUrl?: string;
  lotes: Lote[];
}

export interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export type TipoMovimentacao = 'entrada' | 'saida';

export interface Lote {
  id: number;
  medicamentoId: number;
  codigoLote: string;
  quantidade: number;
  dataValidade: string;
  dataEntrada: string;
}

export interface EstoqueItem {
  medicamentoId: number;
  nome: string;
  categoria: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  statusEstoque: StatusEstoque;
  totalLotes: number;
}

export interface Movimentacao {
  id: number;
  medicamentoId: number;
  loteId?: number;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo?: string;
  usuarioId: number;
  data: string;
}

export interface ItemVenda {
  medicamentoId: number;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Venda {
  id: number;
  codigo: string;
  funcionarioId: number;
  clienteId?: number;
  itens: ItemVenda[];
  subtotal: number;
  desconto: number;
  total: number;
  formaPagamento: FormaPagamento;
  status: StatusVenda;
  criadaEm: string;
  canceladaEm?: string;
  motivoCancelamento?: string;
}

export interface Receita {
  id: number;
  codigo: string;
  pacienteNome: string;
  prescritor: string;
  medicamentos: { medicamentoId: number; nome: string; posologia: string }[];
  status: StatusReceita;
  urgencia: UrgenciaReceita;
  criadaEm: string;
  analisadaEm?: string;
  farmaceuticoId?: number;
  observacao?: string;
}

export interface ApiError {
  codigo: string;
  mensagem: string;
  detalhes?: unknown;
}

export interface Paginated<T> {
  dados: T[];
  total: number;
  page: number;
  limit: number;
}
