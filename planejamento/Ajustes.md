# Plano de Implementação: Ajustes Administrativos e Farmacêuticos

Este plano descreve os ajustes solicitados para a adição de usuários no painel administrativo e a remoção da funcionalidade de revisão de receitas na interface do farmacêutico.

## User Review Required

> [!IMPORTANT]
> - O formulário de "Novo Usuário" pedirá os dados obrigatórios do backend (`nome`, `email`, `senha`, `cpf`, e `perfil`). 
> - Ao remover a opção de **revisar** a receita, o farmacêutico só poderá **aprovar** ou **rejeitar** a receita, não havendo mais o estágio intermediário de mandar de volta para correção ("revisão").
> - Confirme se a rota no backend para "revisar" a receita (`PATCH /receitas/:id/revisar`) também deve ser removida, ou se apenas removeremos a interface visual (o botão) por enquanto. A proposta atual foca na remoção visual e lógica do frontend.

## Proposed Changes

### Backend: Remoção da Rota de Revisão

#### [DELETE] [revisar-receita.dto.ts](file:///c:/Users/LUCAS/Documents/GitHub/FarmaSystem/backend/src/modules/receitas/dto/revisar-receita.dto.ts)
- Excluir o arquivo DTO, já que a rota deixará de existir.

#### [MODIFY] [receitas.controller.ts](file:///c:/Users/LUCAS/Documents/GitHub/FarmaSystem/backend/src/modules/receitas/receitas.controller.ts)
- Remover o método e o decorator correspondente à rota `POST /receitas/:id/revisar`.

#### [MODIFY] [receitas.service.ts](file:///c:/Users/LUCAS/Documents/GitHub/FarmaSystem/backend/src/modules/receitas/receitas.service.ts)
- Remover a função `revisar` que trata da lógica de alteração do status da receita para "revisao".

### Frontend: Gestão de Usuários

#### [MODIFY] [usuarios.service.ts](file:///c:/Users/LUCAS/Documents/GitHub/FarmaSystem/frontend/src/services/usuarios.service.ts)
- Adição do método `criar(data: CreateUsuarioDto)` para integrar com o endpoint `POST /usuarios` que já existe no backend.

#### [NEW] [NewUserModal.tsx](file:///c:/Users/LUCAS/Documents/GitHub/FarmaSystem/frontend/src/components/usuarios/NewUserModal.tsx)
- Criação de um novo componente de modal (modal dialog) contendo um formulário para inserir `nome`, `email`, `cpf`, `senha` e escolher o `perfil` do novo usuário.

#### [MODIFY] [page.tsx](file:///c:/Users/LUCAS/Documents/GitHub/FarmaSystem/frontend/src/app/%28admin%29/usuarios/page.tsx)
- Adição do botão **"Novo Usuário"** no topo da tela de listagem.
- Inclusão do estado e renderização do componente `NewUserModal`.
- Atualização da lista de usuários assim que um novo cadastro for realizado com sucesso.

---

### Frontend: Verificação de Receita e Estoque

#### [MODIFY] [PrescriptionsSection.tsx](file:///c:/Users/LUCAS/Documents/GitHub/FarmaSystem/frontend/src/components/pharmacist/PrescriptionsSection.tsx)
- Remoção do prop `onRevisar` do componente.
- Remoção do botão de "Revisar" que aparecia ao lado de "Aprovar" e "Rejeitar".

#### [NEW] [NewBatchModal.tsx](file:///c:/Users/LUCAS/Documents/GitHub/FarmaSystem/frontend/src/components/pharmacist/NewBatchModal.tsx)
- Criação de um modal que permite registrar um novo lote (`codigoLote`, `quantidade`, `validade`, `precoCusto`) usando o `estoqueService.criarLote`.

#### [MODIFY] [page.tsx (farmaceutico)](file:///c:/Users/LUCAS/Documents/GitHub/FarmaSystem/frontend/src/app/%28pharmacist%29/farmaceutico/page.tsx)
- **Remoção de revisão**: Remoção da função `revisar(receita: Receita)` que enviava a solicitação para a API e do callback respectivo.
- **Alertas de Estoque**: Alterar o comportamento da função `resolver(alerta: AlertaEstoque)`. Ao invés de apenas marcar como resolvido silenciosamente, abrirá o modal `NewBatchModal` vinculado ao `medicamentoId` do alerta.
- Quando o modal for submetido, chama a criação do lote e, em seguida, resolve o alerta.

## Verification Plan

### Manual Verification
1. **Adição de Usuário:** 
   - Acessar o sistema com um usuário **Administrador**.
   - Navegar até a tela de Usuários, clicar em "Novo Usuário" e preencher os dados.
   - Confirmar que o usuário é listado após a criação e que é possível fazer login com o novo usuário.
2. **Remoção de Revisão:**
   - Acessar o sistema com um usuário **Farmacêutico**.
   - Visualizar a lista de receitas pendentes.
   - Confirmar que apenas os botões "Ver", "Aprovar" e "Rejeitar" estão visíveis, e que a opção de revisão foi completamente removida da interface.
3. **Resolução de Alerta (Novo Lote):**
   - Na dashboard do farmacêutico, ir até a seção de produtos vencendo ou com estoque baixo.
   - Clicar em "Resolver". Confirmar que um popup é aberto.
   - Preencher os dados do novo lote e enviar. Confirmar que o alerta desaparece/é resolvido em seguida.
