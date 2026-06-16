const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'ponto.db');
let db = null;

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function all(sql, params = []) {
  const results = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL');

  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    pin TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sessoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`);

  db.run('CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes(token)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id)');

  db.run(`CREATE TABLE IF NOT EXISTS registros (
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
  )`);

  db.run('CREATE INDEX IF NOT EXISTS idx_registros_usuario ON registros(usuario_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_registros_data ON registros(data)');

  db.run(`CREATE TABLE IF NOT EXISTS carga_horaria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    entrada TEXT NOT NULL DEFAULT '08:00',
    ida_intervalo TEXT NOT NULL DEFAULT '12:00',
    volta_intervalo TEXT NOT NULL DEFAULT '13:00',
    saida TEXT NOT NULL DEFAULT '17:00',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`);

  saveDb();
}

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
  return token;
}

function cleanExpiredSessions() {
  run('DELETE FROM sessoes WHERE expires_at < datetime("now")');
}

function criarSessao(usuarioId) {
  cleanExpiredSessions();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  run('INSERT INTO sessoes (usuario_id, token, expires_at) VALUES (?, ?, ?)', [usuarioId, token, expiresAt]);
  return { token, expiresAt };
}

function validarSessao(token) {
  if (!token) return null;
  const sessao = get(
    `SELECT s.usuario_id, u.nome FROM sessoes s
     JOIN usuarios u ON s.usuario_id = u.id
     WHERE s.token = ? AND s.expires_at > datetime('now')`,
    [token]
  );
  return sessao ? { usuarioId: sessao.usuario_id, nome: sessao.nome } : null;
}

module.exports = { initDb, run, get, all, criarSessao, validarSessao };
