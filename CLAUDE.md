# CLAUDE.md

Guidance for working in the **FarmaSystem** repository.

## What this is

A web-based pharmacy management system (academic final project, UFC). It covers
medication catalog, stock control (lots/expiry), point-of-sale, prescription review,
and managerial dashboards. Client–server with a REST API over HTTPS.

**Documentation is in Portuguese.** Match that language in user-facing strings,
DB identifiers, and domain terms (e.g. `medicamentos`, `vendas`, `estoque`,
`receitas`). Code identifiers in the frontend component spec are English
(e.g. `MedicinesTable`, `onAddProduct`) — follow each layer's existing convention.

Current state: **greenfield** — only planning docs exist, no code scaffolded yet.

## Stack (authoritative)

- **Backend**: NestJS (Node.js, TypeScript). Layered: Controllers → Services →
  Repositories → DTOs. **Raw SQL via the `pg` driver — no ORM** (deliberate, for
  atomic stock/sale transactions). `class-validator` on DTOs.
- **Frontend**: Next.js (App Router) + React + TypeScript, TailwindCSS.
  State: Redux (global), Context API (scoped flows like cart/auth), local state otherwise.
  HTTP via a single Axios instance in `services/` with auth interceptors.
- **Databases**:
  - **PostgreSQL** — all relational data, native enums, raw SQL.
  - **MongoDB (GridFS)** — only heavy media: medication images + bula PDFs.
    GridFS `_id`s are stored back in Postgres (`medicamentos.imagens` JSONB,
    `medicamentos.bula_id`).
- **Auth**: JWT (access + refresh). RBAC via a custom NestJS `RolesGuard`.

> Note: the initial proposal (`Relatório 1`) mentioned a Python backend / plain
> HTML-CSS-JS frontend. That is superseded — the actual stack is NestJS + Next.js
> as described in `architecture.md` and the components spec.

## Roles & permissions (RBAC)

Three profiles: `administrador`, `farmaceutico`, `atendente`.

| Action | Admin | Farmacêutico | Atendente |
|---|---|---|---|
| Realizar vendas | ✔ | ✔ | ✔ |
| Consultar produtos/estoque | ✔ | ✔ | ✔ |
| Cadastrar/editar medicamentos | ✔ | ✔ | ✘ |
| Controlar entradas de estoque | ✔ | ✔ | ✘ |
| **Aprovar/revisar receitas** | ✘ | ✔ | ✘ |
| Cancelar/estornar vendas | ✔ | ✔ | ✘ |
| Dashboard completo / financeiro | ✔ | ✘ | ✘ |
| Definir permissões / gerir usuários | ✔ | ✘ | ✘ |

Note: approving/reviewing prescriptions (`POST /receitas/{id}/aprovar|revisar`)
is **Farmacêutico-only — Admin cannot do it**. Registering/listing receitas is
Admin+Farmacêutico.

Enforce on **two layers**: API (`RolesGuard`, returns 403) AND frontend
(restricted routes/buttons not rendered for unauthorized roles).

## Frontend structure (`src/`)

```
app/         # routes/pages (dashboard, vendas, estoque, usuarios, ...)
components/  # layout/, ui/, [domain]/, plus formulários, tabelas, gráficos
context/     # Context API providers
hooks/       # custom hooks (useAuth, useDebounce, usePagination, ...)
redux/       # store + slices (auth, sessão, permissões, carrinho)
services/    # Axios instance + REST calls + interceptors (api.ts)
utils/       # helpers, validações, máscaras, permissões
styles/      # Tailwind global + CSS
types/       # TS entities (Medicamento, Venda, Usuario, ...)
middleware/  # auth validation, route protection (Next.js middleware)
```

Component contract convention (from the components spec): pages own page-level
state and data fetching; presentational components receive data via `props` and
emit `on*` callbacks (`onCardClick`, `onAddProduct`, `onEditUser`, ...).

### Main screens by role
- **Admin** (`AdminPage`): `MetricsCardsSection`, `ChartsSection`
  (`SalesChart`/`RevenueChart`), `RecentUsersTable`, `StockAlertsPanel`;
  Financeiro (`FinanceiroPage`, `FilterBar`, `ChartCard`, `BarChart`, `KpiItem`).
- **Farmacêutico** (`PharmacistPage`): `PrescriptionsSection`,
  `ExpirationAlertsPanel`, `MedicineStockSection`/`MedicinesTable`,
  `WeeklyDispensationsChartSection`; medication CRUD
  (`AdicionarMedicamentoPage`, `FileDropzone`) and detail
  (`MedicamentoDetalhePage`, `ImageGallery`, `TechInfoTable`, `DocSection`).
- **Atendente** (`EmployeePage` / PDV): `NewSaleSection`, `CartItem`,
  `ProductsSection`/`ProductCard`, `ShiftSummaryPanel`, `RecentSalesSection`.

Shared layout: `MainLayout` → `Header` + `Sidebar` (`NavItem`) + page content.

## Data model (PostgreSQL)

11 tables + native enums. Full DDL in `database_schema.md`. Tables:
`usuarios`, `fornecedores`, `medicamentos`, `lotes`, `movimentacoes_estoque`,
`alertas_estoque`, `clientes`, `vendas`, `itens_venda`, `receitas`,
`receita_medicamentos`.

Key enums: `perfil_usuario`, `status_estoque` (normal/baixo/critico/esgotado),
`restricao_venda` (venda_livre/controlado/uso_hospitalar), `tipo_movimentacao`,
`forma_pagamento`, `status_venda`, `status_receita`, `urgencia_receita`.

### Critical business rules
- **Sales are transactional**: registering a venda must atomically debit stock
  across one or more `lotes` and write `itens_venda` + `movimentacoes_estoque`.
  Use explicit `BEGIN`/`COMMIT`/`ROLLBACK` — this is the main reason for raw SQL.
- Lots carry expiry (`data_validade`); dispensing/alerts favor earliest expiry.
- `medicamentos.status_estoque` and `alertas_estoque` derive from
  `estoque_atual` vs `estoque_minimo` and upcoming expiry (30/60/90 days).
- Media never goes in Postgres — upload to GridFS, store the `_id` reference.

## REST API (contract: `swagger_api.md`)

OpenAPI 3.0. **Always check `swagger_api.md` before implementing an endpoint** —
it is the source of truth for paths, access roles, payloads, and status codes.

### Conventions
- Base path: `/api/v1` (dev `http://localhost:3000/api/v1`).
- JSON; dates ISO 8601 (`YYYY-MM-DD` / `YYYY-MM-DDTHH:mm:ssZ`); money = decimal.
- Lists are paginated: `page` + `limit` (default 20, max 100), return `*Page` schemas.
- **JSON keys are camelCase** (`principioAtivo`, `estoqueAtual`, `funcionarioId`)
  even though Postgres columns are snake_case Portuguese — map at the repository/DTO boundary.
- Standard error schema: `{ codigo, mensagem, detalhes? }`. Validation errors → **422**
  with `detalhes` listing failures. Insufficient stock on sale → **409**
  (`VENDA_ESTOQUE_INSUFICIENTE`).
- `medicamentos.imagens` is GridFS ObjectIds in the DB but the API returns them as
  **URL strings** — translate in the service layer.

### Endpoint groups
- **auth**: `/auth/login` (public), `/logout`, `/refresh` (public+refreshToken),
  `/recuperar-senha` (public).
- **usuarios** (Admin): CRUD + `/usuarios/me` (all roles), `/usuarios/{id}` (own user allowed).
- **medicamentos**: list/detail/`{id}/bula` (all roles); create (`multipart/form-data`
  with `imagens(file[])`, `bula(file)`)/update (Admin+Farm); delete = soft-delete (Admin).
- **estoque**: `/estoque` + lotes + movimentacoes + alertas + solicitacoes-reposicao
  (Admin+Farm; `GET /estoque` all roles). Manual movements only — sales auto-generate `saida`.
- **vendas**: `POST /vendas` (all roles, atomic stock debit, 409 on shortage),
  `/{id}`, `/{id}/comprovante` (PDF), `/minhas`, `/turno-atual` (all roles);
  list-all + `/{id}/cancelar` (Admin+Farm, reverses stock).
- **clientes**: CRUD (all roles; delete = Admin).
- **fornecedores**: CRUD (Admin+Farm; delete = Admin).
- **receitas**: list/create/detail (Admin+Farm); `/aprovar`, `/revisar` (**Farm only**).
- **dashboard** (Admin; `dispensacoes-semanais` also Farm).
- **financeiro** (Admin only): KPIs, receita-despesas, margem, desempenho, `/exportar`
  (`formato=csv|xlsx|pdf`).

## Implementation roadmap

6 milestones (see `implementation_plan.md`): (1) infra + SQL schema + Swagger
+ exception filters, (2) auth + users + guards, (3) catalog/suppliers/stock +
media upload, (4) sales/PDV + receipt PDF, (5) prescriptions + alerts, (6)
dashboards + financial + CSV/PDF export.

## Reference docs

- `architecture.md` — layers, DB rationale, frontend state strategy, interceptors.
- `database_schema.md` — full PostgreSQL DDL + GridFS metadata shapes.
- `implementation_plan.md` — milestones and per-module task breakdown.
- `componentes (1).pdf` — per-component spec (state/props/callbacks) for every UI component.
- `Mapa do Site (1).pdf` — navigation/site map.
- `swagger_api.md` — **the REST API contract** (OpenAPI 3.0): all endpoints,
  access roles, payloads, status codes, and core schemas. Source of truth for the API.
  (Also as `FarmaSystem Documentacao Swagger.pdf`, the original Swagger export.)
```
