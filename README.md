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

- **Node.js** >= 20 (inclui o npm)
- **PostgreSQL** >= 14 — banco relacional primário
- **MongoDB** >= 6 — armazenamento de mídias (imagens/bulas) via GridFS

Confira que os serviços estão instalados e no `PATH`:

```bash
node -v        # v20+
psql --version # 14+
mongod --version
```

---

## 1. Configurar o PostgreSQL

1. Garanta que o serviço do PostgreSQL está em execução.
   - **Windows**: o instalador oficial já registra o serviço "postgresql-x64-1x"
     (inicia automaticamente). Verifique em *Serviços* ou com
     `pg_ctl status`.
   - **Linux/macOS**: `sudo service postgresql start` ou `brew services start postgresql`.

2. Crie o banco de dados usado pela aplicação (`farmasystem`). Ajuste usuário/senha
   conforme a sua instalação (o padrão dos exemplos abaixo é `postgres` / `postgres`):

   ```bash
   # Cria o banco (usa o superusuário 'postgres')
   createdb -U postgres farmasystem

   # Alternativa via SQL, caso 'createdb' não esteja disponível:
   psql -U postgres -c "CREATE DATABASE farmasystem;"
   ```

   > No Windows, se `createdb`/`psql` não forem reconhecidos, use o caminho completo,
   > ex.: `"C:\Program Files\PostgreSQL\16\bin\psql.exe"`.

## 2. Configurar o MongoDB

1. Garanta que o serviço do MongoDB está em execução.
   - **Windows**: o serviço "MongoDB" é registrado pelo instalador e inicia sozinho.
   - **Linux/macOS**: `sudo service mongod start` ou `brew services start mongodb-community`.

2. **Não é necessário criar** o banco/coleções manualmente: o backend cria o banco
   `farmasystem_files` e os buckets do GridFS automaticamente no primeiro upload de mídia.
   Confirme apenas que o Mongo aceita conexões em `mongodb://localhost:27017`.

## 3. Instalar dependências

Na raiz do repositório (instala backend e frontend via workspaces):

```bash
npm install
```

## 4. Variáveis de ambiente (`.env`)

### `backend/.env`

Crie o arquivo a partir do exemplo e ajuste conforme sua instalação:

```bash
cp backend/.env.example backend/.env
```

Exemplo funcional para desenvolvimento local:

```dotenv
# Aplicação
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# CORS — origem do frontend
FRONTEND_ORIGIN=http://localhost:3001

# URL pública da API (usada para montar links de mídia: imagens/bula)
APP_PUBLIC_URL=http://localhost:3000/api/v1

# PostgreSQL (banco relacional primário)
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=farmasystem
# Alternativamente, uma única connection string (tem precedência se definida):
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/farmasystem

# MongoDB (mídias via GridFS)
MONGO_URI=mongodb://localhost:27017
MONGO_DB=farmasystem_files

# JWT — troque por segredos aleatórios longos
JWT_ACCESS_SECRET=troque-este-segredo-de-acesso
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=troque-este-segredo-de-refresh
JWT_REFRESH_EXPIRES_IN=7d
```

### `frontend/.env.local`

```bash
cp frontend/.env.local.example frontend/.env.local
```

Exemplo funcional:

```dotenv
# URL base da API REST do backend
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## 5. Inicializar o banco de dados (schema PostgreSQL)

Aplique o schema (tabelas, enums e índices) ao banco criado no passo 1. O script é
**idempotente** — pode ser reexecutado sem erro.

```bash
# Usando as variáveis do .env (usuário/senha/host)
psql -U postgres -d farmasystem -f backend/db/schema.sql

# Ou, se você definiu DATABASE_URL:
psql "postgresql://postgres:postgres@localhost:5432/farmasystem" -f backend/db/schema.sql
```

> **Usuário administrador inicial**: na primeira vez que o backend sobe, se não
> houver nenhum usuário cadastrado, ele cria automaticamente um administrador para
> você conseguir entrar:
>
> | Campo | Valor |
> | --- | --- |
> | E-mail | `adm@gmail.com` |
> | Senha  | `adminadmin` |
>
> Troque essa senha após o primeiro login.

## 6. Executar em desenvolvimento

Abra **dois terminais** (ou rode em background) — um para o backend, outro para o frontend:

```bash
# Terminal 1 — API
npm run dev:backend
# API em http://localhost:3000/api/v1  (Swagger em /api/v1/docs)

# Terminal 2 — Web
npm run dev:frontend
# Web em http://localhost:3001
```

Acesse http://localhost:3001 e faça login com o administrador inicial (passo 5).

## Build de produção

```bash
npm run build            # compila backend e frontend
npm run build:backend    # apenas backend
npm run build:frontend   # apenas frontend

# Executar após o build:
npm run start:prod --workspace backend   # node dist/main.js
npm run start --workspace frontend       # next start -p 3001
```

## Solução de problemas

- **`ECONNREFUSED` no PostgreSQL/MongoDB**: o serviço correspondente não está rodando
  ou as credenciais/host no `backend/.env` estão incorretas.
- **`database "farmasystem" does not exist`**: rode o passo 1 (`createdb`).
- **Tabelas inexistentes / erro de `relation`**: rode o passo 5 (aplicar `schema.sql`).
- **CORS bloqueado no navegador**: confira que `FRONTEND_ORIGIN` no backend bate com a
  URL do frontend (`http://localhost:3001`).

## Documentação

| Arquivo | Conteúdo |
| --- | --- |
| `CLAUDE.md` | Guia técnico consolidado (stack, RBAC, estrutura, regras de negócio) |
| `architecture.md` | Arquitetura de backend e frontend |
| `database_schema.md` | Modelagem PostgreSQL + GridFS |
| `swagger_api.md` | Contrato da API REST (OpenAPI 3.0) |
| `implementation_plan.md` | Marcos de implementação |
