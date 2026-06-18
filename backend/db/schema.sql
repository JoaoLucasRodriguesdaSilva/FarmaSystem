-- =====================================================================
-- FarmaSystem — Schema PostgreSQL (SQL puro, sem ORM)
-- Fonte: database_schema.md. Execute com:
--   psql "$DATABASE_URL" -f backend/db/schema.sql
-- =====================================================================

-- ----------------------------------------------------------------------
-- Enums (idempotente)
-- ----------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perfil_usuario') THEN
    CREATE TYPE perfil_usuario AS ENUM ('administrador', 'farmaceutico', 'atendente');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_usuario') THEN
    CREATE TYPE status_usuario AS ENUM ('ativo', 'inativo');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'restricao_venda') THEN
    CREATE TYPE restricao_venda AS ENUM ('venda_livre', 'controlado', 'uso_hospitalar');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_estoque') THEN
    CREATE TYPE status_estoque AS ENUM ('normal', 'baixo', 'critico', 'esgotado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_movimentacao') THEN
    CREATE TYPE tipo_movimentacao AS ENUM ('entrada', 'saida');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_alerta') THEN
    CREATE TYPE tipo_alerta AS ENUM ('estoque_baixo', 'vencimento_proximo', 'esgotado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'forma_pagamento') THEN
    CREATE TYPE forma_pagamento AS ENUM ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_venda') THEN
    CREATE TYPE status_venda AS ENUM ('concluida', 'cancelada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_receita') THEN
    CREATE TYPE status_receita AS ENUM ('pendente', 'aprovada', 'revisao', 'rejeitada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'urgencia_receita') THEN
    CREATE TYPE urgencia_receita AS ENUM ('normal', 'urgente');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_solicitacao') THEN
    CREATE TYPE status_solicitacao AS ENUM ('pendente', 'atendida', 'cancelada');
  END IF;
END$$;

-- ----------------------------------------------------------------------
-- Tabelas
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
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

CREATE TABLE IF NOT EXISTS fornecedores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT
);

CREATE TABLE IF NOT EXISTS medicamentos (
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
    imagens JSONB DEFAULT '[]', -- Array de ObjectIds (GridFS) das imagens
    bula_id VARCHAR(255)        -- ObjectId (GridFS) do PDF da bula
);

CREATE TABLE IF NOT EXISTS lotes (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    codigo_lote VARCHAR(100) NOT NULL,
    quantidade INTEGER NOT NULL,
    data_validade DATE NOT NULL,
    data_entrada DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    lote_id INTEGER REFERENCES lotes(id) ON DELETE SET NULL,
    tipo tipo_movimentacao NOT NULL,
    quantidade INTEGER NOT NULL,
    motivo VARCHAR(255),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alertas_estoque (
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

CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS vendas (
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

CREATE TABLE IF NOT EXISTS itens_venda (
    id SERIAL PRIMARY KEY,
    venda_id INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id),
    quantidade INTEGER NOT NULL,
    preco_unitario NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS receitas (
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

CREATE TABLE IF NOT EXISTS receita_medicamentos (
    id SERIAL PRIMARY KEY,
    receita_id INTEGER NOT NULL REFERENCES receitas(id) ON DELETE CASCADE,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id),
    posologia TEXT NOT NULL
);

-- Referenciada pela API (GET/POST /estoque/solicitacoes-reposicao); não constava
-- no database_schema.md original. Ajuste conforme necessário.
CREATE TABLE IF NOT EXISTS solicitacoes_reposicao (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    quantidade_solicitada INTEGER NOT NULL,
    observacao TEXT,
    status status_solicitacao DEFAULT 'pendente',
    solicitante_id INTEGER REFERENCES usuarios(id),
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atendida_em TIMESTAMP
);

-- Tabela auxiliar para invalidar tokens JWT no logout (token blacklist).
-- Um token continua criptograficamente válido até expirar; ao deslogar,
-- gravamos seu hash/valor aqui e a JwtStrategy o rejeita enquanto não vencido.
CREATE TABLE IF NOT EXISTS tokens_revogados (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    expiracao TIMESTAMP NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------
-- Índices auxiliares
-- ----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_lotes_medicamento ON lotes(medicamento_id);
CREATE INDEX IF NOT EXISTS idx_lotes_validade ON lotes(data_validade);
CREATE INDEX IF NOT EXISTS idx_mov_medicamento ON movimentacoes_estoque(medicamento_id);
CREATE INDEX IF NOT EXISTS idx_alertas_medicamento ON alertas_estoque(medicamento_id);
CREATE INDEX IF NOT EXISTS idx_alertas_resolvido ON alertas_estoque(resolvido);
CREATE INDEX IF NOT EXISTS idx_vendas_funcionario ON vendas(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_vendas_criada_em ON vendas(criada_em);
CREATE INDEX IF NOT EXISTS idx_itens_venda_venda ON itens_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_receitas_status ON receitas(status);
CREATE INDEX IF NOT EXISTS idx_tokens_revogados_token ON tokens_revogados(token);
CREATE INDEX IF NOT EXISTS idx_tokens_revogados_expiracao ON tokens_revogados(expiracao);
