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
  medicamentoNome?: string;
  codigoLote: string;
  quantidade: number;
  dataValidade: string;
  dataEntrada: string;
  custoUnitario?: number;
  diasParaVencimento?: number;
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
  medicamentoNome?: string;
  loteId?: number;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo?: string;
  usuarioId: number;
  data: string;
}

export interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  telefone?: string;
  email?: string;
}

export interface ItemVenda {
  medicamentoId: number;
  nome?: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

/** Item do carrinho do PDV (estado local, antes de virar venda). */
export interface CartItem {
  medicamentoId: number;
  nome: string;
  precoUnitario: number;
  quantidade: number;
  estoqueAtual: number;
  restricaoVenda: RestricaoVenda;
}

/** Situação resumida de uma receita (acompanhamento no PDV). */
export interface SituacaoReceita {
  id: number;
  codigo: string;
  pacienteNome: string;
  status: StatusReceita;
}

export interface ResumoTurno {
  totalVendido: number;
  quantidadeVendas: number;
  ticketMedio: number;
}

export interface Venda {
  id: number;
  codigo: string;
  funcionarioId: number;
  clienteId?: number;
  receitaId?: number;
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

export type TipoAlerta = 'estoque_baixo' | 'vencimento_proximo' | 'esgotado';
export type StatusSolicitacao = 'pendente' | 'atendida' | 'cancelada';

export interface AlertaEstoque {
  id: number;
  tipo: TipoAlerta;
  medicamentoId: number;
  medicamentoNome?: string;
  quantidadeAtual?: number;
  quantidadeMinima?: number;
  dataValidade?: string;
  diasParaVencimento?: number;
  resolvido: boolean;
  dataCriacao: string;
}

export interface SolicitacaoReposicao {
  id: number;
  medicamentoId: number;
  medicamentoNome?: string;
  quantidadeSolicitada: number;
  observacao?: string;
  status: StatusSolicitacao;
  solicitanteId?: number;
  criadaEm: string;
  atendidaEm?: string;
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

// --- Dashboard & Financeiro (Milestone 6) ---

export type Periodo = 'hoje' | 'semana' | 'mes' | 'ano';

export interface MetricaCard {
  valor: number;
  variacao: number | null;
}

export interface MetricasDashboard {
  usuarios: MetricaCard;
  receita: MetricaCard;
  vendas: MetricaCard;
  produtosEstoque: MetricaCard;
}

export interface PontoSerie {
  data: string;
  valor: number;
}

export interface ProdutoMaisVendido {
  medicamentoId: number;
  nome: string;
  quantidade: number;
  total: number;
}

export interface DispensacaoSemanal {
  data: string;
  dispensacoes: number;
  receitas: number;
}

export interface FinanceiroKpis {
  receitaTotal: MetricaCard;
  despesas: MetricaCard;
  lucroLiquido: MetricaCard;
  margemLucro: number;
}

export interface PontoReceitaDespesa {
  data: string;
  receita: number;
  despesas: number;
}

export interface MargemCategoria {
  categoria: string;
  faturamento: number;
  margem: number;
}

export interface DesempenhoFuncionario {
  funcionarioId: number;
  nome: string;
  totalVendido: number;
  quantidadeVendas: number;
  ticketMedio: number;
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
