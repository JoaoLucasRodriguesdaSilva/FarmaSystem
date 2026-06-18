# Documentação da API REST: FarmaSystem

Este documento descreve a API REST do FarmaSystem em conformidade com a especificação original do Swagger/OpenAPI 3.0.

## 1. Visão Geral

- **Ambiente de Desenvolvimento:** `http://localhost:3000/api/v1`
- **Ambiente de Produção:** `https://farmasystem.ufc.br/api/v1`

### 1.1 Arquitetura e Convenções
- Todas as rotas têm o prefixo `/api/v1`
- Comunicação via API REST via HTTPS, com JSON como formato padrão.
- Datas seguem o formato ISO 8601 (`YYYY-MM-DD` para datas, `YYYY-MM-DDTHH:mm:ssZ` para datetimes).
- Valores monetários são números decimais (float) em reais.
- Listagens são paginadas (padrão 20 itens por página, máximo 100).
- Erros seguem o schema Error padronizado.

### 1.2 Formato de Erro Padrão
Erros seguem o schema Error abaixo. Erros de validação (422) incluem o campo adicional `detalhes` com a lista de validações que falharam.

```json
{
 "codigo": "VENDA_ESTOQUE_INSUFICIENTE",
 "mensagem": "Estoque insuficiente para Amoxicilina 500mg",
 "detalhes": { "medicamentoId": 42, "disponivel": 3, "solicitado": 10 }
}
```

---

## 2. Autenticação e Autorização

A API utiliza autenticação baseada em JWT. Após o login bem-sucedido em `POST /auth/login`, o cliente recebe um `accessToken` que deve ser enviado em todas as requisições subsequentes no header Authorization.

```text
Authorization: Bearer <accessToken>
```

### 2.1 Matriz de Permissões

| Funcionalidade | Admin | Farmacêutico | Atendente |
| :--- | :---: | :---: | :---: |
| Realizar vendas | ✓ | ✓ | ✓ |
| Consultar produtos/estoque | ✓ | ✓ | ✓ |
| Cadastrar/editar medicamentos | ✓ | ✓ | ✗ |
| Controlar entradas de estoque | ✓ | ✓ | ✗ |
| Aprovar/revisar receitas | ✗ | ✓ | ✗ |
| Cancelar/estornar vendas | ✓ | ✓ | ✗ |
| Acessar dashboard completo | ✓ | ✗ | ✗ |
| Acessar módulo financeiro | ✓ | ✗ | ✗ |
| Cadastrar/editar usuários | ✓ | ✗ | ✗ |
| Definir permissões de acesso | ✓ | ✗ | ✗ |

---

## 3. Endpoints

### 3.1 Autenticação

#### `POST /auth/login`
Autenticar usuário. Retorna accessToken (JWT), refreshToken e dados do usuário autenticado.
- **Acesso:** Pública
- **Body:** `{ "email": "string", "senha": "string" }`
- **Response 200:** Retorna `LoginResponse`
- **Response 401/422:** Credenciais ou dados inválidos.

#### `POST /auth/logout`
Encerrar sessão. Invalida o token JWT atual no servidor.
- **Acesso:** Todos os perfis autenticados
- **Response 204:** Logout realizado

#### `POST /auth/refresh`
Renovar token JWT. Recebe um refreshToken e devolve um novo par de tokens.
- **Acesso:** Pública (requer refreshToken válido)
- **Body:** `{ "refreshToken": "string" }`
- **Response 200:** Novo TokenPair gerado.

#### `POST /auth/recuperar-senha`
Solicitar recuperação de senha. Envia e-mail de recuperação.
- **Acesso:** Pública
- **Body:** `{ "email": "string" }`
- **Response 202:** Solicitação aceita.

---

### 3.2 Usuários

#### `GET /usuarios`
Listar usuários paginado.
- **Acesso:** Administrador
- **Query:** `page`, `limit`, `perfil` (enum), `status` (enum)
- **Response 200:** `UsuariosPage`

#### `POST /usuarios`
Cadastrar usuário. Apenas farmacêuticos podem ter o campo CRF preenchido.
- **Acesso:** Administrador
- **Body:** `{ nome, email, senha, perfil, crf? }`
- **Response 201:** Usuário criado.

#### `GET /usuarios/{id}`
Buscar detalhes de um usuário específico.
- **Acesso:** Administrador (ou próprio usuário)
- **Response 200:** Dados do usuário.

#### `PUT /usuarios/{id}`
Atualizar dados de um usuário.
- **Acesso:** Administrador
- **Body:** `{ nome, email, perfil, status }` (todos opcionais)
- **Response 200:** Usuário atualizado.

#### `DELETE /usuarios/{id}`
Remover usuário (ou inativar).
- **Acesso:** Administrador
- **Response 204:** Removido.

#### `GET /usuarios/me`
Retorna os dados do usuário logado a partir do token JWT.
- **Acesso:** Todos os perfis
- **Response 200:** Dados do próprio usuário.

---

### 3.3 Medicamentos

#### `GET /medicamentos`
Listar medicamentos paginado com filtros.
- **Acesso:** Todos os perfis
- **Query:** `page`, `limit`, `busca`, `categoria`, `statusEstoque`
- **Response 200:** `MedicamentosPage`

#### `POST /medicamentos`
Cadastrar medicamento. Aceita upload de imagens e PDF da bula via `multipart/form-data`.
- **Acesso:** Administrador, Farmacêutico
- **Body:** `nome, principioAtivo, categoria, fabricante, fornecedorId, viaAdministracao, unidadesIniciais, validadeMinima, lote, restricaoVenda, preco, imagens(file[]), bula(file)`
- **Response 201:** Criado.

#### `GET /medicamentos/{id}`
Detalhes do medicamento. Inclui lotes, bula e galeria de imagens.
- **Acesso:** Todos os perfis
- **Response 200:** `MedicamentoDetalhe`

#### `PUT /medicamentos/{id}`
Atualização parcial dos dados cadastrais do medicamento.
- **Acesso:** Administrador, Farmacêutico
- **Response 200:** Atualizado.

#### `DELETE /medicamentos/{id}`
Remover medicamento (soft-delete).
- **Acesso:** Administrador
- **Response 204:** Removido.

#### `GET /medicamentos/{id}/bula`
Download do PDF da bula do medicamento.
- **Acesso:** Todos os perfis
- **Response 200:** `application/pdf`

---

### 3.4 Estoque

#### `GET /estoque`
Retorna o estoque agregado por medicamento, com status.
- **Acesso:** Todos os perfis
- **Query:** `statusEstoque`
- **Response 200:** `EstoquePage`

#### `GET /estoque/lotes`
Listagem de lotes, com filtro opcional por medicamento ou janela de vencimento.
- **Acesso:** Administrador, Farmacêutico
- **Query:** `medicamentoId`, `vencimentoEm` (dias)
- **Response 200:** Array de `Lote`

#### `POST /estoque/lotes`
Registra um novo lote de medicamento.
- **Acesso:** Administrador, Farmacêutico
- **Body:** `{ medicamentoId, codigoLote, quantidade, dataValidade, fornecedorId }`
- **Response 201:** Lote criado.

#### `GET /estoque/movimentacoes`
Lista entradas e saídas de estoque com filtros por tipo e período.
- **Acesso:** Administrador, Farmacêutico
- **Query:** `tipo`, `dataInicio`, `dataFim`
- **Response 200:** Array de `Movimentacao`

#### `POST /estoque/movimentacoes`
Registra entrada ou saída manual de estoque (vendas geram automaticamente).
- **Acesso:** Administrador, Farmacêutico
- **Body:** `{ medicamentoId, loteId, tipo(entrada|saida), quantidade, motivo }`
- **Response 201:** Movimentação registrada.

#### `GET /estoque/alertas`
Alertas ativos: estoque baixo, vencimento próximo ou produto esgotado.
- **Acesso:** Administrador, Farmacêutico
- **Response 200:** Array de `AlertaEstoque`

#### `POST /estoque/alertas/{id}/resolver`
Marca um alerta como tratado.
- **Acesso:** Administrador, Farmacêutico
- **Response 204:** Alerta resolvido.

#### `GET /estoque/solicitacoes-reposicao`
Lista solicitações de reposição pendentes ou atendidas.
- **Acesso:** Administrador, Farmacêutico
- **Response 200:** Array de `SolicitacaoReposicao`

#### `POST /estoque/solicitacoes-reposicao`
Cria uma nova solicitação a partir de um alerta de estoque mínimo.
- **Acesso:** Administrador, Farmacêutico
- **Body:** `{ medicamentoId, quantidadeSolicitada, observacao }`
- **Response 201:** Solicitação criada.

---

### 3.5 Vendas

#### `GET /vendas`
Listagem global de vendas, com filtros por período, funcionário e status.
- **Acesso:** Administrador, Farmacêutico
- **Query:** `dataInicio`, `dataFim`, `funcionarioId`, `status`
- **Response 200:** `VendasPage`

#### `POST /vendas`
Registrar venda. Dá baixa no estoque atomicamente e emite comprovante.
- **Acesso:** Todos os perfis
- **Body:** `{ clienteId?, itens[{medicamentoId, quantidade}], desconto, formaPagamento }`
- **Response 201:** Venda registrada.
- **Response 409:** Estoque insuficiente.

#### `GET /vendas/{id}`
Retorna a venda completa, com itens, totais e forma de pagamento.
- **Acesso:** Todos os perfis
- **Response 200:** Detalhes da venda.

#### `POST /vendas/{id}/cancelar`
Estorna a venda e reverte a movimentação de estoque.
- **Acesso:** Administrador, Farmacêutico
- **Body:** `{ motivo: string }`
- **Response 200:** Venda cancelada.

#### `GET /vendas/{id}/comprovante`
Retorna o comprovante da venda em PDF.
- **Acesso:** Todos os perfis
- **Response 200:** `application/pdf`

#### `GET /vendas/minhas`
Histórico de vendas realizadas pelo próprio usuário autenticado.
- **Acesso:** Todos os perfis
- **Response 200:** `VendasPage`

#### `GET /vendas/turno-atual`
Resumo do turno do funcionário autenticado: total vendido, quantidade, ticket médio.
- **Acesso:** Todos os perfis
- **Response 200:** `ResumoTurno`

---

### 3.6 Clientes

#### `GET /clientes`
Lista paginada com busca textual.
- **Acesso:** Todos os perfis
- **Query:** `busca`
- **Response 200:** `ClientesPage`

#### `POST /clientes`
Cria um novo cliente.
- **Acesso:** Todos os perfis
- **Body:** `{ nome, cpf, telefone, email? }`
- **Response 201:** Cliente criado.

#### `GET /clientes/{id}`
Detalhes de um cliente.
- **Acesso:** Todos os perfis
- **Response 200:** Cliente.

#### `PUT /clientes/{id}`
Atualizar cliente.
- **Acesso:** Todos os perfis
- **Response 200:** Atualizado.

#### `DELETE /clientes/{id}`
Remover cliente.
- **Acesso:** Administrador
- **Response 204:** Removido.

---

### 3.7 Fornecedores

#### `GET /fornecedores`
Lista paginada de fornecedores.
- **Acesso:** Administrador, Farmacêutico
- **Response 200:** `FornecedoresPage`

#### `POST /fornecedores`
Cadastrar fornecedor.
- **Acesso:** Administrador, Farmacêutico
- **Body:** `{ nome, cnpj, telefone, email, endereco }`
- **Response 201:** Fornecedor criado.

#### `GET /fornecedores/{id}` e `PUT /fornecedores/{id}`
Busca e atualização de dados do fornecedor.
- **Acesso:** Administrador, Farmacêutico

#### `DELETE /fornecedores/{id}`
Remove o fornecedor.
- **Acesso:** Administrador

---

### 3.8 Receitas

#### `GET /receitas`
Lista paginada com filtros por status e urgência.
- **Acesso:** Administrador, Farmacêutico
- **Query:** `status`, `urgencia`
- **Response 200:** `ReceitasPage`

#### `POST /receitas`
Registrar receita.
- **Acesso:** Administrador, Farmacêutico
- **Body:** `{ pacienteNome, prescritor, urgencia, medicamentos[{medicamentoId, posologia}] }`
- **Response 201:** Receita registrada.

#### `GET /receitas/{id}`
Detalhes da receita.
- **Acesso:** Administrador, Farmacêutico

#### `POST /receitas/{id}/aprovar`
Marca a receita como aprovada.
- **Acesso:** Farmacêutico
- **Response 200:** Receita aprovada.

#### `POST /receitas/{id}/revisar`
Marca a receita como pendente de revisão.
- **Acesso:** Farmacêutico
- **Body:** `{ observacao: string }`
- **Response 200:** Marcada para revisão.

---

### 3.9 Dashboard

#### `GET /dashboard/metricas`
Cards do dashboard: usuários, receita, vendas e produtos em estoque, com variação percentual.
- **Acesso:** Administrador
- **Query:** `periodo` (hoje, semana, mes, ano)
- **Response 200:** `MetricasDashboard`

#### `GET /dashboard/vendas` e `GET /dashboard/receita`
Dados do gráfico temporal de vendas/receitas.
- **Acesso:** Administrador
- **Response 200:** `SerieTemporal`

#### `GET /dashboard/produtos-mais-vendidos`
Lista os medicamentos mais vendidos no período.
- **Acesso:** Administrador

#### `GET /dashboard/dispensacoes-semanais`
Comparativo entre dispensações realizadas e receitas processadas (Dashboard do Farmacêutico).
- **Acesso:** Farmacêutico, Administrador

---

### 3.10 Financeiro

#### `GET /financeiro/receita-despesas`
Série temporal comparando receita e despesas.
- **Acesso:** Administrador
- **Query:** `periodo`, `filial`, `categoria`

#### `GET /financeiro/kpis`
KPIs financeiros: Receita total, despesas, lucro líquido e variação percentual.
- **Acesso:** Administrador

#### `GET /financeiro/margem-por-categoria` e `GET /financeiro/desempenho-funcionarios`
Métricas granulares de margem e desempenho de vendas por funcionário.
- **Acesso:** Administrador

#### `GET /financeiro/exportar`
Exporta relatório financeiro.
- **Acesso:** Administrador
- **Query:** `formato` (csv | xlsx | pdf), `periodo`
- **Response 200:** Arquivo binário (`application/octet-stream`)

---

## 4. Schemas / Modelos de Dados Principais

### `LoginResponse`
- `accessToken` (string): JWT de acesso
- `refreshToken` (string): Token para renovação
- `expiresIn` (integer): Validade
- `usuario` (Usuario): Dados do usuário

### `Usuario`
- `id` (integer)
- `nome` (string)
- `email` (string)
- `perfil` (enum: administrador, farmaceutico, atendente)
- `status` (enum: ativo, inativo)
- `crf` (string, opcional)
- `criadoEm` (datetime)
- `atualizadoEm` (datetime)

### `Medicamento`
- `id` (integer)
- `nome` (string)
- `principioAtivo` (string)
- `categoria` (string)
- `fabricante` (string)
- `viaAdministracao` (string)
- `apresentacao` (string)
- `restricaoVenda` (enum: venda_livre, controlado, uso_hospitalar)
- `preco` (float)
- `estoqueAtual` (integer)
- `estoqueMinimo` (integer)
- `statusEstoque` (enum: normal, baixo, critico, esgotado)
- `imagens` (array de strings: URLs)

### `Lote`
- `id` (integer)
- `medicamentoId` (integer)
- `codigoLote` (string)
- `quantidade` (integer)
- `dataValidade` (date)
- `dataEntrada` (date)

### `Venda`
- `id` (integer)
- `codigo` (string)
- `funcionarioId` (integer)
- `clienteId` (integer, opcional)
- `itens` (array de ItemVenda)
- `subtotal` (float)
- `desconto` (float)
- `total` (float)
- `formaPagamento` (enum: dinheiro, cartao_credito, cartao_debito, pix)
- `status` (enum: concluida, cancelada)
- `criadaEm` (datetime)
- `canceladaEm` (datetime, opcional)
- `motivoCancelamento` (string, opcional)

### `Receita`
- `id` (integer)
- `codigo` (string)
- `pacienteNome` (string)
- `prescritor` (string)
- `medicamentos` (array com medicamentoId, nome, posologia)
- `status` (enum: pendente, aprovada, revisao, rejeitada)
- `urgencia` (enum: normal, urgente)
- `criadaEm` (datetime)
- `analisadaEm` (datetime, opcional)
- `farmaceuticoId` (integer, opcional)
- `observacao` (string, opcional)
