# Milestone 3: Catálogo, Fornecedores e Estoque

Este plano detalha a implementação do terceiro marco do projeto FarmaSystem. O foco agora é a gestão do núcleo da farmácia: fornecedores, medicamentos (com upload de mídias pesadas) e o controle rigoroso de estoque e lotes.

## Decisões Arquiteturais Definidas

> [!NOTE]
> 1. **Visualização de Imagens/Bulas:** O endpoint para buscar arquivos não será genérico. A responsabilidade de servir as mídias recairá sobre o módulo de Medicamentos, gerando URLs no formato `GET /medicamentos/{id}/imagens/{imageId}` e `GET /medicamentos/{id}/bula`. O `ArquivosService` funcionará apenas internamente servindo os streams.
> 2. **Telas de Fornecedores:** Utilizaremos um layout de CRUD padrão (Tabela com lista e Modal para criação/edição), mantendo a coesão visual com a tela de Usuários já desenvolvida.

## Proposed Changes

### Backend: Módulo de Fornecedores
---
CRUD simples focado no PostgreSQL.

#### [NEW] `backend/src/modules/fornecedores/fornecedores.module.ts`
Módulo responsável por gerenciar os fornecedores.
#### [NEW] `backend/src/modules/fornecedores/fornecedores.repository.ts`
Consultas SQL para Inserir, Atualizar, Deletar e Listar Fornecedores.
#### [NEW] `backend/src/modules/fornecedores/fornecedores.service.ts`
Regras de negócio e validação de duplicidade (CNPJ).
#### [NEW] `backend/src/modules/fornecedores/fornecedores.controller.ts`
Endpoints `/fornecedores` restritos a Administrador e Farmacêutico.

### Backend: Módulo de Mídia (GridFS Backend Interno)
---
Gerenciamento da comunicação com o MongoDB para arquivos. O acesso será estritamente interno.

#### [NEW] `backend/src/modules/arquivos/arquivos.module.ts`
Módulo especializado para upload e download de arquivos (apenas exports de Services).
#### [NEW] `backend/src/modules/arquivos/arquivos.service.ts`
Serviço para converter buffers/streams em arquivos GridFS e resgatá-los. Terá métodos `uploadImagem`, `uploadPdf` e `getFileStream`. Não haverá um `Controller` público.

### Backend: Módulo de Medicamentos
---
Cadastro completo integrando PostgreSQL e MongoDB (como provedor de mídia).

#### [NEW] `backend/src/modules/medicamentos/medicamentos.module.ts`
Módulo de Medicamentos (depende de `ArquivosModule`).
#### [NEW] `backend/src/modules/medicamentos/medicamentos.repository.ts`
Persistência dos dados relacionais do medicamento (campos texto, preço, etc) e das referências de imagem/bula no PostgreSQL (array de strings ObjectID).
#### [NEW] `backend/src/modules/medicamentos/medicamentos.service.ts`
Orquestração: recebe o payload JSON e os arquivos via `multipart/form-data`. Repassa os arquivos para o `ArquivosService` salvar no GridFS e usa os `ObjectIds` gerados para salvar o registro no PostgreSQL via `repository`.
#### [NEW] `backend/src/modules/medicamentos/medicamentos.controller.ts`
Endpoints de CRUD. Criação utiliza `Interceptors` do NestJS para extração de `file` (bula) e `files` (imagens).
**Endpoints de Download Estritos:**
- `GET /medicamentos/:id/bula`
- `GET /medicamentos/:id/imagens/:imageId`

### Backend: Módulo de Estoque (Lotes e Movimentações)
---
Rastreio de entradas, saídas e controle de validade.

#### [NEW] `backend/src/modules/estoque/estoque.module.ts`
Agrupa Lotes e Movimentações.
#### [NEW] `backend/src/modules/estoque/repositories/lotes.repository.ts` e `movimentacoes.repository.ts`
Acesso SQL focado nas tabelas `lotes` e `movimentacoes_estoque`.
#### [NEW] `backend/src/modules/estoque/estoque.service.ts`
Gerencia a lógica de adicionar um novo Lote (somando ao `estoque_atual` do Medicamento via SQL Transaction) e registrar a Movimentação correspondente.
#### [NEW] `backend/src/modules/estoque/estoque.controller.ts`
Endpoints `/estoque`, `/estoque/lotes` e `/estoque/movimentacoes`.

### Frontend: Integração e Gerenciamento
---
Telas do catálogo e controle de estoque.

#### [NEW] `frontend/src/services/medicamentos.service.ts`, `estoque.service.ts` e `fornecedores.service.ts`
Instâncias Axios para chamadas à API, incluindo tratamento de envio de formulários do tipo `multipart/form-data` para os arquivos de mídia.

#### [NEW] `frontend/src/app/(admin)/fornecedores/page.tsx`
Tela de CRUD de Fornecedores, adotando o layout padrão (Listagem e Modal de edição).

#### [NEW] `frontend/src/app/(admin)/estoque/page.tsx`
Tela do estoque para visualização consolidada de lotes, produtos e movimentações.

#### [NEW] `frontend/src/app/(pharmacist)/medicamentos/novo/page.tsx`
Página `AdicionarMedicamentoPage` contendo o formulário gigante e o componente `FileDropzone` para upload das imagens e da bula.

#### [NEW] `frontend/src/app/(pharmacist)/medicamentos/[id]/page.tsx`
Página `MedicamentoDetalhePage` com os subcomponentes de visualização: `ImageGallery`, `DocSection` (para download do PDF), `TechInfoTable` e tabela de lotes vinculados.

#### [NEW] Componentes Reutilizáveis Relacionados
- `frontend/src/components/medicamentos/MedicinesTable.tsx`
- `frontend/src/components/medicamentos/FileDropzone.tsx`
- `frontend/src/components/medicamentos/ImageGallery.tsx`
- `frontend/src/components/estoque/StockTable.tsx`
- `frontend/src/components/fornecedores/SuppliersTable.tsx`
- `frontend/src/components/fornecedores/SupplierFormModal.tsx`

## Verification Plan

### Manual Verification
1.  **CRUD de Fornecedor:** Criar, editar, listar e deletar fornecedores pela interface.
2.  **Upload de Medicamentos:** Enviar um medicamento preenchendo os dados e anexando 2 imagens e 1 bula em PDF.
3.  **Checagem do GridFS:** Inspecionar o MongoDB e confirmar se a imagem e a bula foram fragmentadas no GridFS.
4.  **Download de Arquivos:** Clicar na miniatura da imagem (acionará a rota `GET /medicamentos/:id/imagens/:imageId`) e verificar se a imagem carrega no `<img src="...">`. Fazer o mesmo no botão de baixar bula.
5.  **Entrada de Estoque:** Adicionar um lote a um medicamento e verificar:
    - Se a tabela `lotes` recebeu o registro.
    - Se a tabela `movimentacoes_estoque` registrou a `entrada`.
    - Se a coluna `estoque_atual` do `medicamentos` foi atualizada de forma atômica no Postgres.
