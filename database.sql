-- Database: conversaomoedas

-- DROP DATABASE IF EXISTS conversaomoedas;

CREATE DATABASE conversaomoedas
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Portuguese_Brazil.1252'
    LC_CTYPE = 'Portuguese_Brazil.1252'
    LOCALE_PROVIDER = 'libc'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

CREATE TABLE IF NOT EXISTS moedas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(3) NOT NULL UNIQUE,
    nome VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id),
    moeda_padrao_id INTEGER NOT NULL REFERENCES moedas(id),
    idioma VARCHAR(10) DEFAULT 'pt-BR'
);

CREATE TABLE IF NOT EXISTS carteiras (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    visibilidade VARCHAR(20) NOT NULL DEFAULT 'privada' CHECK (visibilidade IN ('privada', 'publica')),
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuario_carteiras (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    carteira_id INTEGER NOT NULL REFERENCES carteiras(id),
    papel VARCHAR(20) NOT NULL CHECK (papel IN ('dono', 'operador', 'comentador', 'leitor')),
    criado_em TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (usuario_id, carteira_id)
);

CREATE TABLE IF NOT EXISTS carteira_moedas (
    carteira_id INTEGER NOT NULL REFERENCES carteiras(id),
    moeda_id INTEGER NOT NULL REFERENCES moedas(id),
    saldo NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (saldo >= 0),
    PRIMARY KEY (carteira_id, moeda_id)
);

CREATE TABLE IF NOT EXISTS taxas_cambio (
    id SERIAL PRIMARY KEY,
    moeda_origem_id INTEGER NOT NULL REFERENCES moedas(id),
    moeda_destino_id INTEGER NOT NULL REFERENCES moedas(id),
    valor NUMERIC(15, 6) NOT NULL CHECK (valor > 0),
    data_referencia TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operacoes (
    id SERIAL PRIMARY KEY,
    carteira_id INTEGER NOT NULL REFERENCES carteiras(id),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    moeda_origem_id INTEGER NOT NULL REFERENCES moedas(id),
    moeda_destino_id INTEGER NOT NULL REFERENCES moedas(id),
    valor NUMERIC(15, 2) NOT NULL CHECK (valor > 0),
    taxa_utilizada NUMERIC(15, 6) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'confirmada')),
    aprovado_por INTEGER REFERENCES usuarios(id),
    criado_em TIMESTAMP DEFAULT NOW()
);