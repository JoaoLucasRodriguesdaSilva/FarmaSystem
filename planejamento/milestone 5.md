# Milestone 5: Painel do Farmacêutico e Receitas

Este plano detalha o penúltimo grande marco do projeto FarmaSystem. O foco exclusivo deste marco é o fluxo do profissional Farmacêutico: validação clínica/legal de receitas médicas e a visibilidade ativa sobre vencimento de lotes e níveis críticos de estoque.

## Decisões Arquiteturais Definidas

> [!NOTE]
> 1. **Geração de Alertas:** Utilizaremos um Cron Job diário (via pacote `@nestjs/schedule`) no backend para ler a validade dos lotes e popular fisicamente a tabela `alertas_estoque` com status não resolvido, garantindo o registro histórico.
> 2. **Fluxo da Receita Médica:** A aprovação de uma receita no painel do Farmacêutico tem objetivo meramente clínico/legal, mudando seu status para "aprovada". O **débito real do estoque ocorrerá apenas no PDV**, no momento em que a venda ao paciente for efetivada.
> 3. **Permissões Exclusivas:** As ações de aprovação e revisão de receitas são restritas estritamente ao perfil Farmacêutico.

## Proposed Changes

### Backend: Módulo de Receitas
---
Gestão e auditoria de receitas controladas.

#### [NEW] `backend/src/modules/receitas/receitas.module.ts`
Módulo responsável por gerenciar as receitas médicas.
#### [NEW] `backend/src/modules/receitas/receitas.repository.ts`
Repositório central para lidar com a tabela `receitas` e a tabela associativa `receita_medicamentos` usando transações SQL simples para inserção simultânea.
#### [NEW] `backend/src/modules/receitas/receitas.service.ts`
Regras de transição de estado da receita (`pendente` → `aprovada` | `revisao` | `rejeitada`). Apenas aprovar a receita irá salvar o `farmaceutico_id` de quem realizou a validação (para auditoria). O estoque não é manipulado aqui.
#### [NEW] `backend/src/modules/receitas/receitas.controller.ts`
Endpoints base: `GET /receitas` (com filtros por status e urgência), `GET /receitas/{id}`, `POST /receitas`.
Endpoints exclusivos Farmacêutico: `POST /receitas/{id}/aprovar` e `POST /receitas/{id}/revisar`.

### Backend: Módulo de Estoque (Extensão de Alertas e Schedule)
---
Ampliação do módulo de estoque para dar suporte aos alertas físicos e geração via Jobs diários.

#### [NEW] `backend/src/modules/estoque/repositories/alertas.repository.ts`
Repositório para lidar com inserção, resolução (`resolvido = true`) e busca na tabela `alertas_estoque`.
#### [NEW] `backend/src/modules/estoque/repositories/solicitacoes.repository.ts`
Repositório para a tabela `solicitacoes_reposicao`.
#### [MODIFY] `backend/src/modules/estoque/estoque.service.ts`
Adicionar métodos de negócio para as rotas de alertas (`getAlertasAtivos`, `resolverAlerta`, `criarSolicitacaoReposicao`).
Disparar alerta automático de `estoque_baixo` sempre que o registro de uma venda/movimentação fizer o saldo cair abaixo do `estoque_minimo`.
#### [NEW] `backend/src/modules/estoque/jobs/alertas-cron.service.ts`
Serviço decorado com `@Cron` agendado para rodar diariamente, varrendo os lotes e inserindo os de vencimento próximo na tabela `alertas_estoque`.
#### [MODIFY] `backend/src/modules/estoque/estoque.controller.ts`
Expor os endpoints: `GET /estoque/alertas`, `POST /estoque/alertas/{id}/resolver`, `GET /estoque/solicitacoes-reposicao`, `POST /estoque/solicitacoes-reposicao`.

### Frontend: Painel do Farmacêutico
---
Construção do Dashboard operacional exclusivo do Farmacêutico.

#### [NEW] `frontend/src/app/(pharmacist)/dashboard/page.tsx` (ou `PharmacistPage`)
Página inicial do perfil Farmacêutico unificando os componentes de receitas e alertas em uma visão gerencial de tela única.

#### [NEW] `frontend/src/components/pharmacist/PrescriptionsSection.tsx`
Lista de receitas pendentes com indicativo visual de urgência. Inclui a lógica de aprovar/revisar via chamadas API.

#### [NEW] `frontend/src/components/pharmacist/ExpirationAlertsPanel.tsx`
Painel que lista os alertas de produtos com vencimento próximo (lotes).

#### [NEW] `frontend/src/components/pharmacist/StockAlertsPanel.tsx`
Painel focado exclusivamente em alertas do tipo `estoque_baixo` e `esgotado`, com um botão para gerar automaticamente uma `Solicitação de Reposição` a partir do alerta.

#### [NEW] `frontend/src/services/receitas.service.ts`
Axios instanciado para o módulo de receitas (`/receitas`).

#### [MODIFY] `frontend/src/services/estoque.service.ts`
Adicionar os métodos que faltam para lidar com as chamadas de `/estoque/alertas` e reposição.

## Verification Plan

### Manual Verification
1.  **Bloqueio de RBAC:** Tentar acionar `POST /receitas/{id}/aprovar` utilizando o token do Administrador; a API deve bloquear com código `403 Forbidden`. Apenas o Farmacêutico pode realizar a ação.
2.  **Cron Job de Validade:** Rodar a API, alterar a expressão Cron para rodar a cada 10 segundos temporariamente, e verificar se os alertas de vencimento são gerados para lotes com validade próxima na tabela `alertas_estoque`.
3.  **Geração de Alertas de Estoque:** Realizar uma venda de forma que o estoque caia para menos do limite. Verificar se um registro no Painel de Alerta de Estoque Baixo apareceu em tempo real.
4.  **Transição de Receita:** Como Administrador, registrar uma nova Receita. Como Farmacêutico, visualizar a receita na aba de Pendentes e clicar em "Aprovar". Conferir se ela mudou de aba e se o banco salvou quem a aprovou sem deduzir o estoque prematuramente.
5.  **Resolução de Alerta:** No painel de alertas, clicar em "Resolver" num alerta e checar se ele some da visualização dos ativos.
