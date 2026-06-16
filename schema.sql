-- Schema para Cloudflare D1
-- Controle de Ponto Pessoal

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    pin TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    entrada TEXT,
    ida_intervalo TEXT,
    volta_intervalo TEXT,
    saida TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    UNIQUE(usuario_id, data)
);

CREATE TABLE IF NOT EXISTS carga_horaria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    entrada TEXT NOT NULL DEFAULT '08:00',
    ida_intervalo TEXT NOT NULL DEFAULT '12:00',
    volta_intervalo TEXT NOT NULL DEFAULT '13:00',
    saida TEXT NOT NULL DEFAULT '17:00',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_registros_usuario ON registros(usuario_id);
CREATE INDEX IF NOT EXISTS idx_registros_data ON registros(data);
CREATE INDEX IF NOT EXISTS idx_registros_usuario_data ON registros(usuario_id, data);

-- Tabela de sessões (tokens de autenticação)
CREATE TABLE IF NOT EXISTS sessoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes(token);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_expires ON sessoes(expires_at);
