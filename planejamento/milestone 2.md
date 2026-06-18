# Milestone 2: Autenticação, Gestão de Usuários e RBAC

Este plano detalha a implementação do segundo marco do projeto FarmaSystem, focando na segurança da aplicação. Vamos criar a fundação de autenticação JWT, autorização baseada em papéis (RBAC) com guards do NestJS e a gestão completa de usuários, incluindo as telas no frontend.

## Decisões Arquiteturais Definidas

> [!NOTE]
> 1. **Seed de Administrador:** Criaremos um script de seed que será executado na inicialização da aplicação. Se a tabela `usuarios` estiver vazia, ele criará automaticamente o primeiro usuário com o login `adm@gmail.com` e a senha `adminadmin` (o hash `bcrypt` será armazenado).
> 2. **Logout (Token Blacklist):** Para invalidar tokens JWT no servidor, criaremos uma tabela auxiliar `tokens_revogados` no PostgreSQL.
> 3. **Recuperação de Senha:** A rota `POST /auth/recuperar-senha` fará um mock inicial, registrando o envio do e-mail apenas no `console.log`.

## Proposed Changes

### Backend: Módulo de Usuários e Banco de Dados
---
A base para o sistema será o repositório de usuários acessando a tabela que já criamos no PostgreSQL, além da nova tabela para tokens revogados.

#### [MODIFY] [schema.sql](file:///C:/Users/LUCAS/Documents/GitHub/FarmaSystem/backend/db/schema.sql)
- Adicionar a tabela auxiliar `tokens_revogados` (campos: `id`, `token`, `expiracao`, `criado_em`).

#### [NEW] `backend/src/modules/usuarios/usuarios.module.ts`
Módulo NestJS para a gestão de usuários.

#### [NEW] `backend/src/modules/usuarios/usuarios.repository.ts`
Repositório com **SQL Puro** (usando `PostgresService`) para realizar:
- `findAll` (paginado com filtros de perfil/status)
- `findById`, `findByEmail`
- `create`, `update`, `delete` (soft-delete inativando o status)

#### [NEW] `backend/src/modules/usuarios/usuarios.service.ts`
Lógica de negócio para cadastro de usuários, aplicando hash de senhas (`bcrypt`), regras de domínio e o **script de seed automático** para o admin inicial.

#### [NEW] `backend/src/modules/usuarios/usuarios.controller.ts`
Exposição dos endpoints REST mapeados no Swagger (`GET /usuarios`, `POST /usuarios`, `GET /usuarios/me`, `PUT /usuarios/:id`, etc.).

#### [NEW] `backend/src/modules/usuarios/dto/*.dto.ts`
Classes com validações do `class-validator` para Payload: `CreateUsuarioDto` e `UpdateUsuarioDto`.

### Backend: Módulo de Autenticação e RBAC
---
Configuração de senhas e geração/validação de tokens JWT.

#### [NEW] `backend/src/modules/auth/auth.module.ts`
Configuração do `JwtModule` e `PassportModule`.

#### [NEW] `backend/src/modules/auth/auth.service.ts`
Validação de credenciais, geração de `accessToken` e `refreshToken`, lógica de logout (inserindo token na tabela `tokens_revogados`) e mock de recuperação de senha.

#### [NEW] `backend/src/modules/auth/auth.controller.ts`
Rotas de login, refresh token, logout e recuperação de senha.

#### [NEW] `backend/src/modules/auth/strategies/jwt.strategy.ts`
Estratégia do Passport para extrair o JWT do header `Authorization` e popular `req.user`. Vai verificar se o token existe na tabela `tokens_revogados`.

#### [NEW] `backend/src/common/guards/jwt-auth.guard.ts`
Guard que exige autenticação JWT válida (proteção padrão das rotas).

#### [NEW] `backend/src/common/guards/roles.guard.ts` e `backend/src/common/decorators/roles.decorator.ts`
Decorator `@Roles(PerfilUsuario.ADMINISTRADOR)` e o Guard respectivo para checar o perfil logado contra os perfis permitidos na rota.

### Frontend: Autenticação, Estado Global e Proteção
---
A fundação do Next.js para manter o usuário logado e proteger o acesso às páginas.

#### [NEW] `frontend/src/redux/slices/authSlice.ts`
Slice do Redux Toolkit para guardar os dados do usuário autenticado e seu perfil de acesso (`userRole`).

#### [MODIFY] [middleware.ts](file:///C:/Users/LUCAS/Documents/GitHub/FarmaSystem/frontend/src/middleware.ts)
Implementar a lógica de interceptação do Next.js App Router para redirecionar usuários não logados da `/dashboard` (e outras rotas protegidas) de volta para o `/login`, e caso um usuário logado tente acessar `/login`, redirecioná-lo para a tela principal de seu perfil.

#### [NEW] `frontend/src/services/auth.service.ts`
Funções envelopando as chamadas Axios para `login`, `logout` e recuperação de senha.

### Frontend: Interface Gráfica (Login e Layout Administrativo)
---
Implementação das páginas base.

#### [NEW] `frontend/src/app/(auth)/login/page.tsx`
Tela de login contendo formulário com email e senha, integrado ao Redux.

#### [NEW] `frontend/src/components/layout/MainLayout.tsx`
Layout compartilhado com Header (com botão de perfil e logout) e Sidebar.

#### [NEW] `frontend/src/components/layout/Sidebar.tsx` e `NavItem.tsx`
Menu de navegação lateral. O Sidebar lerá o `userRole` do Redux e renderizará apenas as opções de menu que o usuário tem acesso (ex: "Usuários" apenas para Administrador).

#### [NEW] `frontend/src/app/(admin)/usuarios/page.tsx`
Tela de listagem de usuários e gerenciamento (exclusiva do perfil `Administrador`).

#### [NEW] `frontend/src/components/usuarios/RecentUsersTable.tsx`
Tabela React renderizando a listagem paginada de usuários consumida do backend.

## Verification Plan

### Automated Tests
* N/A para testes E2E neste primeiro momento (foco na construção do core).

### Manual Verification
1.  **Geração do Admin**: Iniciar a API e testar login no Insomnia com `adm@gmail.com` / `adminadmin`.
2.  **Fluxo de Login**: Acessar o frontend na rota `/login`, fazer login e conferir o redirecionamento automático para a dashboard e o armazenamento dos tokens.
3.  **RBAC da API**: Tentar acessar `GET /usuarios` sem token (deve retornar 401). Tentar acessar com um token de perfil "Atendente" (deve retornar 403).
4.  **RBAC do Frontend**: Validar se o menu de navegação da esquerda esconde os menus não permitidos.
5.  **Refresh Token**: Forçar a expiração do `accessToken` (ou reduzi-la via ENV) e verificar se o interceptor do `api.ts` consegue fazer a requisição de renovação de modo transparente durante uma busca na API.
6.  **Logout**: Fazer logout e garantir que o token foi para a tabela `tokens_revogados` e que tentativas subsequentes de usar aquele token dão 401.
