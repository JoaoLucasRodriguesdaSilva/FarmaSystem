# Schema do Banco de Dados: FarmaSystem

Este documento descreve a modelagem de dados do sistema, dividida entre o banco relacional principal (PostgreSQL) e o banco de arquivos e mídias (MongoDB).

## 1. PostgreSQL (Relacional)

O banco PostgreSQL será criado utilizando schemas puros e enums nativos, sem abstrações de ORM, a fim de garantir a maior eficiência na transação das vendas e de controle de estoque. 

### Enums
Para padronizar e restringir os valores, utilizaremos tipos ENUM do PostgreSQL.
```sql
CREATE TYPE perfil_usuario AS ENUM ('administrador', 'farmaceutico', 'atendente');
CREATE TYPE status_usuario AS ENUM ('ativo', 'inativo');
CREATE TYPE restricao_venda AS ENUM ('venda_livre', 'controlado', 'uso_hospitalar');
CREATE TYPE status_estoque AS ENUM ('normal', 'baixo', 'critico', 'esgotado');
CREATE TYPE tipo_movimentacao AS ENUM ('entrada', 'saida');
CREATE TYPE tipo_alerta AS ENUM ('estoque_baixo', 'vencimento_proximo', 'esgotado');
CREATE TYPE forma_pagamento AS ENUM ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix');
CREATE TYPE status_venda AS ENUM ('concluida', 'cancelada');
CREATE TYPE status_receita AS ENUM ('pendente', 'aprovada', 'revisao', 'rejeitada');
CREATE TYPE urgencia_receita AS ENUM ('normal', 'urgente');
```

### Estrutura das Tabelas

#### 1. Usuários
```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil perfil_usuario NOT NULL,
    status status_usuario DEFAULT 'ativo',
    crf VARCHAR(50), -- Opcional, apenas para perfil farmacêutico
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Fornecedores
```sql
CREATE TABLE fornecedores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT
);
```

#### 3. Medicamentos
```sql
CREATE TABLE medicamentos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    principio_ativo VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    fabricante VARCHAR(255) NOT NULL,
    via_administracao VARCHAR(100) NOT NULL,
    apresentacao VARCHAR(100) NOT NULL,
    restricao_venda restricao_venda NOT NULL,
    preco NUMERIC(10, 2) NOT NULL,
    estoque_atual INTEGER DEFAULT 0,
    estoque_minimo INTEGER NOT NULL,
    status_estoque status_estoque DEFAULT 'normal',
    fornecedor_id INTEGER REFERENCES fornecedores(id) ON DELETE SET NULL,
    imagens JSONB DEFAULT '[]', -- Array com ObjectIds referentes ao MongoDB
    bula_id VARCHAR(255) -- ObjectId referente ao PDF da bula no MongoDB (GridFS)
);
```

#### 4. Lotes
```sql
CREATE TABLE lotes (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    codigo_lote VARCHAR(100) NOT NULL,
    quantidade INTEGER NOT NULL,
    data_validade DATE NOT NULL,
    data_entrada DATE DEFAULT CURRENT_DATE,
    custo_unitario NUMERIC(10, 2) -- custo de aquisição por unidade (base do custo no financeiro)
);
```

#### 5. Movimentações de Estoque
```sql
CREATE TABLE movimentacoes_estoque (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    lote_id INTEGER REFERENCES lotes(id) ON DELETE SET NULL,
    tipo tipo_movimentacao NOT NULL,
    quantidade INTEGER NOT NULL,
    motivo VARCHAR(255),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. Alertas de Estoque
```sql
CREATE TABLE alertas_estoque (
    id SERIAL PRIMARY KEY,
    tipo tipo_alerta NOT NULL,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    quantidade_atual INTEGER,
    quantidade_minima INTEGER,
    data_validade DATE,
    dias_para_vencimento INTEGER,
    resolvido BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. Clientes
```sql
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255)
);
```

#### 8. Vendas
```sql
CREATE TABLE vendas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    funcionario_id INTEGER NOT NULL REFERENCES usuarios(id),
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    desconto NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,
    forma_pagamento forma_pagamento NOT NULL,
    status status_venda DEFAULT 'concluida',
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelada_em TIMESTAMP,
    motivo_cancelamento VARCHAR(255)
);
```

#### 9. Itens da Venda
```sql
CREATE TABLE itens_venda (
    id SERIAL PRIMARY KEY,
    venda_id INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id),
    quantidade INTEGER NOT NULL,
    preco_unitario NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);
```

#### 10. Receitas
```sql
CREATE TABLE receitas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    paciente_nome VARCHAR(255) NOT NULL,
    prescritor VARCHAR(255) NOT NULL,
    status status_receita DEFAULT 'pendente',
    urgencia urgencia_receita DEFAULT 'normal',
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analisada_em TIMESTAMP,
    farmaceutico_id INTEGER REFERENCES usuarios(id),
    observacao TEXT
);
```

#### 11. Receitas - Medicamentos Prescritos
*(Tabela de relacionamento Many-to-Many entre Receitas e Medicamentos)*
```sql
CREATE TABLE receita_medicamentos (
    id SERIAL PRIMARY KEY,
    receita_id INTEGER NOT NULL REFERENCES receitas(id) ON DELETE CASCADE,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id),
    posologia TEXT NOT NULL
);
```

---

## 2. MongoDB (Armazenamento de Arquivos)

O MongoDB será dedicado inteiramente ao armazenamento da mídia binária, aliviando o banco relacional dessa carga utilizando o padrão **GridFS** (ideal para limites que excedem o tamanho máximo de documentos BSON como PDFs pesados).

### Collections do GridFS

No GridFS, o Mongo gerencia automaticamente duas coleções base:
1. `fs.files`: Armazena os metadados do arquivo.
2. `fs.chunks`: Armazena os blocos de bytes divididos do arquivo.

#### Imagens de Medicamentos
- As fotos enviadas na API `/medicamentos` (multipart) serão processadas no NestJS e subidas para o GridFS.
- Em `fs.files` para Imagens, salvaremos um metadado adicional apontando para o Medicamento:
  ```json
  {
    "_id": "ObjectId",
    "filename": "dipirona-caixa.png",
    "contentType": "image/png",
    "length": 150000,
    "uploadDate": "2026-06-18T12:00:00Z",
    "metadata": {
      "tipo": "imagem_medicamento",
      "medicamento_id": 42
    }
  }
  ```
- O identificador `_id` gerado pelo GridFS será retornado para o PostgreSQL e armazenado no array `imagens` em JSONB da tabela `medicamentos`.

#### Bulas de Medicamentos
- Os PDFs passarão pelo mesmo processo do GridFS, devido à propensão das bulas pesarem mais de 1MB.
- Metadados:
  ```json
  {
    "_id": "ObjectId",
    "filename": "bula-dipirona-500mg.pdf",
    "contentType": "application/pdf",
    "length": 1048576,
    "uploadDate": "2026-06-18T12:05:00Z",
    "metadata": {
      "tipo": "bula_medicamento",
      "medicamento_id": 42
    }
  }
  ```
- O identificador `_id` será mapeado na coluna `bula_id` do PostgreSQL para download fácil e direto via endpoint.
