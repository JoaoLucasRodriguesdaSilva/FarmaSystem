# Milestone 6: Dashboards, Relatórios e Financeiro

Este plano final detalha o sexto e último marco do projeto FarmaSystem. O foco é a visão estratégica do Administrador, provendo métricas, gráficos e exportação de relatórios que permitam a gestão financeira e o acompanhamento de vendas da farmácia.

## Decisões Arquiteturais Definidas

> [!NOTE]
> 1. **Gráficos:** Utilizaremos a biblioteca **`recharts`** no Frontend por ser altamente compatível com React e muito customizável para as séries temporais.
> 2. **Exportação CSV:** A exportação de dados para planilhas (`.csv`) será processada **nativamente** no Node.js (via formatação e concatenação de strings com separadores `,`), evitando a adição de bibliotecas extras ao projeto.
> 3. **Performance SQL:** As métricas financeiras serão extraídas via funções de agrupamento de datas puras do PostgreSQL (`DATE_TRUNC`, `SUM`, `COUNT`), mantendo a camada Node.js focada apenas na entrega.

## Proposed Changes

### Backend: Módulo de Dashboard
---
Lida com a agregação de dados operacionais e de vendas gerais. As rotas devem ser restritas ao perfil Administrador.

#### [NEW] `backend/src/modules/dashboard/dashboard.module.ts`
Módulo responsável pelas métricas do painel inicial.
#### [NEW] `backend/src/modules/dashboard/dashboard.repository.ts`
Repositório central de agregação usando consultas SQL puras no PostgreSQL (ex: Contar Usuários, Somar Vendas, Buscar os 5 itens_venda mais frequentes).
#### [NEW] `backend/src/modules/dashboard/dashboard.service.ts` e `dashboard.controller.ts`
Implementação das lógicas e cálculos de variação percentual vs mês/período anterior para as rotas:
- `GET /dashboard/metricas`
- `GET /dashboard/vendas` (Série Temporal)
- `GET /dashboard/receita` (Série Temporal)
- `GET /dashboard/produtos-mais-vendidos`
- `GET /dashboard/dispensacoes-semanais` (Esta rota também será acessível ao Farmacêutico).

### Backend: Módulo Financeiro e Exportação
---
Gestão de margens e KPI financeiros avançados.

#### [NEW] `backend/src/modules/financeiro/financeiro.module.ts`
Módulo focado no desempenho econômico.
#### [NEW] `backend/src/modules/financeiro/financeiro.repository.ts`
Consultas para cálculos de faturamento bruto por categoria e por funcionário (ticket médio).
#### [NEW] `backend/src/modules/financeiro/financeiro.service.ts` e `financeiro.controller.ts`
Rotas analíticas avançadas:
- `GET /financeiro/kpis`
- `GET /financeiro/receita-despesas`
- `GET /financeiro/margem-por-categoria`
- `GET /financeiro/desempenho-funcionarios`
#### [NEW] `backend/src/modules/financeiro/relatorios.service.ts`
Serviço dedicado à rota `GET /financeiro/exportar`. Recebe os dados brutos e gera buffers binários de PDF (usando o `pdfkit` já disponível) ou **CSV via montagem nativa de strings separadas por vírgula**.

### Frontend: Integração e Interface
---
Implementação visual dos gráficos e métricas.

#### [NEW] `frontend/src/services/dashboard.service.ts` e `financeiro.service.ts`
Integração Axios com os novos endpoints, incluindo suporte a `responseType: 'blob'` para os relatórios.

#### [NEW] `frontend/src/app/(admin)/dashboard/page.tsx` (Atualização)
Atualização da página de Dashboard (criada no M2 como placeholder) para renderizar os dados dinamicamente usando os componentes:
- `MetricsCardsSection.tsx` (Cartões de métricas)
- `ChartsSection.tsx` (Gráficos renderizados com **`recharts`**)

#### [NEW] `frontend/src/app/(admin)/financeiro/page.tsx`
Tela administrativa com visão financeira profunda.
- Componente `FilterBar.tsx` (Filtros de data/filial)
- Componente `ChartCard.tsx` e `BarChart.tsx` (utilizando **`recharts`**)
- Componente `KpiItem.tsx` para exibição em lista dos funcionários e suas margens de venda.

#### [MODIFY] `frontend/src/app/(pharmacist)/farmaceutico/page.tsx`
Injeção do componente `WeeklyDispensationsChartSection.tsx` no painel do farmacêutico utilizando os dados reais obtidos da API `/dashboard/dispensacoes-semanais` e os plots via **`recharts`**.

## Verification Plan

### Manual Verification
1.  **Variação Percentual:** Criar uma venda com data retroativa no banco e realizar uma venda hoje. Checar se a rota `GET /dashboard/metricas` calcula a diferença percentual corretamente e se o frontend reflete a cor verde/vermelha no card.
2.  **Exportação CSV/PDF:** No painel Financeiro, usar o botão de exportar relatórios, escolhendo "PDF" e depois "CSV". Verificar se o download em CSV funciona com o motor nativo e se os dados estão bem formatados na planilha.
3.  **Gráficos Recharts:** Validar se a biblioteca `recharts` renderiza as legendas e tooltips na ordem cronológica em ambos os gráficos (Vendas e Receitas) e se estão responsivos na tela.
4.  **Acesso Restrito:** Tentar acessar as rotas de `/financeiro` ou `/dashboard` logado como Atendente para garantir o recebimento de erro 403 (Forbidden) pela API.
