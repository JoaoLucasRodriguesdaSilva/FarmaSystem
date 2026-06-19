# Milestone 4: Vendas e PDV (Ponto de Venda)

Este plano detalha a implementação do quarto marco do projeto FarmaSystem. O foco é a interface do Atendente (PDV), cadastro de clientes e o processo crítico de registro de vendas com baixa atômica de estoque e geração de comprovante em PDF.

## Decisões Arquiteturais Definidas

> [!NOTE]
> 1. **Geração de PDF:** O comprovante cupom não fiscal (`GET /vendas/{id}/comprovante`) será desenhado programaticamente no backend através da biblioteca leve `pdfkit`, retornando um buffer/stream direto para o frontend.
> 2. **Estado do Carrinho:** No frontend, o carrinho de compras do PDV será sincronizado com o `localStorage`. Isso assegura que se a página for recarregada acidentalmente no meio do atendimento, os produtos continuem lá.

## Proposed Changes

### Backend: Módulo de Clientes
---
Gestão básica de cadastro de clientes para vinculação opcional às vendas.

#### [NEW] `backend/src/modules/clientes/clientes.module.ts`
Módulo responsável por gerenciar os clientes.
#### [NEW] `backend/src/modules/clientes/clientes.repository.ts`
Consultas SQL para Inserir, Atualizar, Deletar e Listar (busca textual por nome ou CPF).
#### [NEW] `backend/src/modules/clientes/clientes.service.ts` e `clientes.controller.ts`
Regras de negócio e endpoints `/clientes`.

### Backend: Módulo de Vendas (Core e PDF)
---
Registro atômico da venda, controle de estoque (saída) e recibo.

#### [NEW] `backend/src/modules/vendas/vendas.module.ts`
Módulo de Vendas.
#### [NEW] `backend/src/modules/vendas/vendas.repository.ts`
Implementará um método pesado `registrarVendaComTransacao` usando o objeto `PoolClient` do `pg` para realizar todas as atualizações de tabela com `BEGIN`, `COMMIT` e `ROLLBACK`.
#### [NEW] `backend/src/modules/vendas/vendas.service.ts`
Orquestração da venda. Verificação antecipada de disponibilidade total em estoque antes de iniciar a transação, lidando com o erro 409 (`VENDA_ESTOQUE_INSUFICIENTE`). Débito nos lotes ordenando pela validade mais próxima.
#### [NEW] `backend/src/modules/vendas/vendas.controller.ts`
Endpoints base: `POST /vendas`, `GET /vendas`, `GET /vendas/:id`, `POST /vendas/:id/cancelar`.
Endpoints específicos para o funcionário: `GET /vendas/minhas`, `GET /vendas/turno-atual`.
Endpoint do comprovante: `GET /vendas/:id/comprovante` (retornando `application/pdf`).

### Backend: Emissão de Comprovante
---
#### [NEW] `backend/src/modules/vendas/pdf-receipt.service.ts`
Serviço isolado utilizando a biblioteca de PDF `pdfkit` para desenhar o comprovante cupom não fiscal e retornar um stream para o controller.

### Frontend: Integração da API
---
#### [NEW] `frontend/src/services/clientes.service.ts` e `vendas.service.ts`
Instâncias Axios para os novos endpoints de clientes e vendas. O serviço de vendas incluirá um método que lida com `responseType: 'blob'` para o download do PDF.

### Frontend: Interface Gráfica do Atendente (PDV)
---
Construção de uma tela única e otimizada para fluxo contínuo.

#### [NEW] `frontend/src/app/(employee)/pdv/page.tsx`
Layout dividido em painéis: Catálogo Rápido (esquerda) e Caixa/Carrinho (direita).
A página será a "fonte da verdade" do estado da compra atual (`cartItems`, `clienteSelecionado`, `subtotal`, etc), persistindo automaticamente no `localStorage`.

#### [NEW] `frontend/src/components/pdv/ProductsSection.tsx` e `ProductCard.tsx`
Catálogo com barra de busca rápida para adicionar os medicamentos ao carrinho com um clique.

#### [NEW] `frontend/src/components/pdv/NewSaleSection.tsx` e `CartItem.tsx`
Visualização da lista de itens escolhidos, controle de quantidade e aplicação do desconto e forma de pagamento (`dinheiro`, `cartao_credito`, etc.). Botão finalizador que invoca o `POST /vendas` limpando o `localStorage` no sucesso.

#### [NEW] `frontend/src/components/pdv/ShiftSummaryPanel.tsx`
Painel mostrando o progresso do funcionário autenticado (`total vendido`, `quantidade de vendas`, chamando `GET /vendas/turno-atual`).

#### [NEW] `frontend/src/components/pdv/RecentSalesSection.tsx`
Visualização simples das vendas efetuadas pelo usuário na sessão, com a possibilidade de clicar em "Imprimir Comprovante".

#### [NEW] `frontend/src/app/(admin)/clientes/page.tsx` e componentes
Tela administrativa/comum para listagem e CRUD dos clientes, para que possam ser pré-cadastrados ou editados se necessário (similar a `SuppliersTable`).

## Verification Plan

### Manual Verification
1.  **Bloqueio de Venda Sem Estoque:** Tentar realizar uma venda de um produto sem saldo. A API deve retornar `409` e o carrinho no Frontend deve exibir uma mensagem clara.
2.  **Transação Atômica Perfeita:** Realizar uma venda com sucesso e verificar no PostgreSQL se todas as tabelas (`vendas`, `itens_venda`, `movimentacoes_estoque`, `medicamentos` e `lotes`) foram perfeitamente sincronizadas de uma vez.
3.  **Comprovante PDF:** Ao finalizar uma venda, acionar o botão de comprovante e verificar se o PDF de layout cupom é gerado pelo `pdfkit` e baixado no navegador.
4.  **Resumo de Turno:** Realizar duas vendas e constatar se o `ShiftSummaryPanel` no PDV contabilizou os valores do turno do atendente em tempo real.
5.  **Persistência do Carrinho:** Adicionar itens ao carrinho, recarregar a página e confirmar que os itens continuam lá.
