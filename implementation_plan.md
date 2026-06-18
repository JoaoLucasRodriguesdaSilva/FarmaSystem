# Planejamento do Projeto: FarmaSystem

Este plano detalha as etapas de implementação para o Sistema de Vendas para Farmácia (FarmaSystem), dividindo o projeto em marcos (milestones) e tarefas para o Frontend (Next.js) e Backend (Node.js/NestJS).

## Arquitetura e Tecnologias
- **Backend**: NestJS, PostgreSQL (Acesso direto via driver, sem ORM) para dados relacionais, MongoDB para armazenamento de arquivos de mídia/bulas, JWT para autenticação.
- **Frontend**: Next.js (React), Redux (estado global), Context API, TailwindCSS.

## Proposed Changes (Milestones)

Abaixo está a divisão das tarefas em grandes marcos de entrega.

---

### Milestone 1: Configuração Inicial e Infraestrutura
Configuração dos repositórios e infraestrutura base.

#### Backend
- [NEW] Inicialização do projeto NestJS.
- [NEW] Configuração de conexão ao PostgreSQL sem ORM (utilizando banco de dados via driver puro, como `pg`).
- [NEW] Configuração de conexão ao MongoDB para armazenamento de arquivos.
- [NEW] Criação de scripts SQL puros para a criação das tabelas no PostgreSQL (Usuário, Medicamento, Lote, Movimentação, Venda, Cliente, Fornecedor, Receita).
- [NEW] Configuração do Swagger/OpenAPI no NestJS para documentação.
- [NEW] Setup de filtros de exceção globais (Exception Filters) no NestJS para padronização de erros.

#### Frontend
- [NEW] Inicialização do projeto Next.js.
- [NEW] Configuração do TailwindCSS e estilos globais (`src/styles`).
- [NEW] Configuração da store do Redux (`src/redux`) e Context API (`src/context`).
- [NEW] Configuração do cliente Axios/Fetch para integração com a API (`src/services`), com interceptors.

---

### Milestone 2: Autenticação e Gestão de Usuários
Implementação de login, controle de sessão e gerenciamento de perfis de acesso.

#### Backend
- [NEW] Implementação do módulo de Autenticação (`POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/recuperar-senha`).
- [NEW] Implementação do módulo de Usuários (`GET, POST, PUT, DELETE /usuarios`, `GET /usuarios/me`).
- [NEW] Guards e Estratégias Passport: Autenticação (validação JWT) e Autorização (RolesGuard para Administrador, Farmacêutico, Atendente).

#### Frontend
- [NEW] Componente de Login e recuperação de senha.
- [NEW] Contexto de Autenticação e proteção de rotas via Middleware.
- [NEW] Layout base do Painel Administrativo (Header, Sidebar e NavItems).
- [NEW] Tela de Listagem e Cadastro/Edição de Usuários (`RecentUsersTable`).

---

### Milestone 3: Catálogo, Fornecedores e Estoque
Gestão do catálogo de medicamentos, fornecedores e entradas de estoque.

#### Backend
- [NEW] Módulo de Fornecedores (`GET, POST, PUT, DELETE /fornecedores`).
- [NEW] Módulo de Medicamentos (`GET, POST, PUT, DELETE /medicamentos`), incluindo suporte a upload de imagens/PDF e persistência dos arquivos no MongoDB.
- [NEW] Download de Bula (`GET /medicamentos/{id}/bula`) resgatando o PDF do MongoDB.
- [NEW] Módulo de Estoque (`GET /estoque`, `GET, POST /estoque/lotes`, `GET, POST /estoque/movimentacoes`).

#### Frontend
- [NEW] Telas de Gestão de Fornecedores.
- [NEW] Tela de Gestão de Medicamentos (`MedicinesTable`, `AdicionarMedicamentoPage`, incluindo `FileDropzone`).
- [NEW] Tela de Detalhes do Medicamento (`MedicamentoDetalhePage`, `ImageGallery`, `DocSection`).
- [NEW] Telas de Controle e visualização de Estoque (Lotes e Movimentações).

---

### Milestone 4: Vendas e PDV (Ponto de Venda)
Funcionalidades do Atendente para registro de vendas e gestão de clientes.

#### Backend
- [NEW] Módulo de Clientes (`GET, POST, PUT, DELETE /clientes`).
- [NEW] Módulo de Vendas (`GET, POST /vendas`, `GET /vendas/{id}`, `POST /vendas/{id}/cancelar`, `GET /vendas/minhas`, `GET /vendas/turno-atual`) executando transações no PostgreSQL de forma segura.
- [NEW] Serviço de emissão de comprovante em PDF (`GET /vendas/{id}/comprovante`).

#### Frontend
- [NEW] Tela do Atendente / PDV (`EmployeePage`).
- [NEW] Componentes de Carrinho e Checkout (`NewSaleSection`, `CartItem`).
- [NEW] Busca Rápida de Produtos e Clientes (`ProductsSection`, `ProductCard`).
- [NEW] Resumo do Turno e Histórico de Vendas (`ShiftSummaryPanel`, `RecentSalesSection`).

---

### Milestone 5: Painel do Farmacêutico e Receitas
Fluxos específicos do farmacêutico, análise de receitas médicas e alertas de estoque/validade.

#### Backend
- [NEW] Módulo de Receitas (`GET, POST /receitas`, `GET /receitas/{id}`, `POST /receitas/{id}/aprovar`, `POST /receitas/{id}/revisar`).
- [NEW] Módulo de Alertas de Estoque e Solicitações de Reposição (`GET /estoque/alertas`, `POST /estoque/alertas/{id}/resolver`, `GET, POST /estoque/solicitacoes-reposicao`).

#### Frontend
- [NEW] Painel do Farmacêutico (`PharmacistPage`).
- [NEW] Gestão de Receitas Pendentes (`PrescriptionsSection`).
- [NEW] Painel de Alertas de Validade e Estoque Baixo (`ExpirationAlertsPanel`, `StockAlertsPanel`).

---

### Milestone 6: Dashboards, Relatórios e Financeiro
Métricas gerenciais exclusivas para o perfil Administrador e painéis analíticos.

#### Backend
- [NEW] Módulo de Dashboard Administrativo (`GET /dashboard/metricas`, `/dashboard/vendas`, `/dashboard/receita`, `/dashboard/produtos-mais-vendidos`, `/dashboard/dispensacoes-semanais`).
- [NEW] Módulo Financeiro (`GET /financeiro/receita-despesas`, `/financeiro/kpis`, `/financeiro/margem-por-categoria`, `/financeiro/desempenho-funcionarios`).
- [NEW] Serviço de exportação de relatórios CSV/PDF (`GET /financeiro/exportar`).

#### Frontend
- [NEW] Dashboard Administrativo (`MetricsCardsSection`, `ChartsSection` com gráficos).
- [NEW] Dashboard Financeiro (`FinanceiroPage`, `FilterBar`, `ChartCard`, `KpiItem`).
- [NEW] Integração de gráficos estatísticos do Farmacêutico (`WeeklyDispensationsChartSection`).

## Verification Plan

### Backend
- Validação das rotas, Schemas DTO e permissões diretamente ligadas ao Swagger.
- Testes unitários / integração (e2e) usando Jest e as dependências nativas do NestJS.
- Monitoramento de Rollbacks do PostgreSQL em fluxos críticos como a finalização de uma venda (garantindo a Atomicidade).

### Frontend
- Validação de autorização no roteamento.
- Uso consistente dos padrões de estado (Redux, Contexts) garantindo que os dados não ficam obsoletos após ações como salvar, cancelar, deletar.
