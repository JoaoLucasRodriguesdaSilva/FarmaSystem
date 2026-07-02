# FarmaSystem

Sistema de Vendas para Farmácia — gestão de catálogo de medicamentos, controle de
estoque (lotes/validade), ponto de venda (PDV), análise de receitas e dashboards
gerenciais. Arquitetura cliente-servidor com API REST.

> Projeto final de disciplina (UFC). Documentação em português; ver os arquivos
> `*.md` na raiz e `CLAUDE.md` para o guia técnico.

## Stack

- **Backend**: [NestJS](https://nestjs.com) (TypeScript) + PostgreSQL via driver `pg`
  (SQL puro, sem ORM) + MongoDB/GridFS (mídias) + JWT/RBAC.
- **Frontend**: [Next.js](https://nextjs.org) (App Router) + React + TailwindCSS +
  Redux + Context API + Axios.

## Estrutura (monorepo, npm workspaces)

```
backend/    # API NestJS — Controllers → Services → Repositories (SQL puro) → DTOs
frontend/   # Aplicação Next.js
*.md        # Documentação: arquitetura, schema, API (swagger), plano de implementação
```

## Pré-requisitos

- Node.js >= 20
- PostgreSQL >= 14
- MongoDB >= 6

Ou, alternativamente, apenas **Docker** + **Docker Compose** (ver
[Executar com Docker](#executar-com-docker)).

## Setup

```bash
# Instalar dependências de todos os workspaces
npm install

# Backend
cp backend/.env.example backend/.env      # e ajuste as variáveis
# Criar o schema do banco (PostgreSQL):
psql "$DATABASE_URL" -f backend/db/schema.sql

# Frontend
cp frontend/.env.local.example frontend/.env.local
```

## Executar em desenvolvimento

```bash
npm run dev:backend    # API em http://localhost:3000/api/v1 (Swagger em /api/v1/docs)
npm run dev:frontend   # Web em http://localhost:3001
```

## Executar com Docker

Sobe tudo (PostgreSQL + MongoDB + API + Web) com um comando — não precisa de
Node/Postgres/Mongo instalados localmente, apenas Docker.

```bash
# (opcional) sobrescrever segredos/variáveis:
cp .env.docker.example .env    # e ajuste, principalmente os segredos JWT

docker compose up -d --build
```

Serviços expostos:

| Serviço | URL |
| --- | --- |
| API (NestJS) | http://localhost:3000/api/v1 (Swagger em `/api/v1/docs`) |
| Web (Next.js) | http://localhost:3001 |
| PostgreSQL | `localhost:5432` |
| MongoDB | `localhost:27017` |

O schema do PostgreSQL (`backend/db/schema.sql`) é aplicado automaticamente na
primeira subida. Os dados persistem nos volumes `pgdata` e `mongodata`.

```bash
docker compose logs -f            # acompanhar logs
docker compose down               # parar (mantém os dados)
docker compose down -v            # parar e apagar os volumes (zera os bancos)
```

## Documentação

| Arquivo | Conteúdo |
| --- | --- |
| `CLAUDE.md` | Guia técnico consolidado (stack, RBAC, estrutura, regras de negócio) |
| `architecture.md` | Arquitetura de backend e frontend |
| `database_schema.md` | Modelagem PostgreSQL + GridFS |
| `swagger_api.md` | Contrato da API REST (OpenAPI 3.0) |
| `implementation_plan.md` | Marcos de implementação |
