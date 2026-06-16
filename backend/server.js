const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, run, get, all, criarSessao, validarSessao } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

function auth(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  const user = validarSessao(token);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });
  req.user = user;
  next();
}

app.post('/api/auth', (req, res) => {
  try {
    const { nome, pin } = req.body;
    if (!nome || !pin) return res.status(400).json({ error: 'Nome e PIN são obrigatórios' });

    const usuario = get('SELECT id, nome FROM usuarios WHERE nome = ? AND pin = ?', [nome, pin]);
    if (!usuario) return res.status(401).json({ error: 'Usuário ou PIN incorretos' });

    const sessao = criarSessao(usuario.id);
    res.json({ id: usuario.id, nome: usuario.nome, token: sessao.token });
  } catch { res.status(500).json({ error: 'Erro interno' }); }
});

app.post('/api/cadastro', (req, res) => {
  try {
    const { nome, pin } = req.body;
    if (!nome || !pin) return res.status(400).json({ error: 'Nome e PIN são obrigatórios' });
    if (pin.length !== 4 || !/^\d+$/.test(pin)) return res.status(400).json({ error: 'PIN deve ter 4 dígitos' });

    const existente = get('SELECT id FROM usuarios WHERE nome = ?', [nome]);
    if (existente) return res.status(409).json({ error: 'Usuário já existe' });

    run('INSERT INTO usuarios (nome, pin) VALUES (?, ?)', [nome, pin]);
    const usuario = get('SELECT id FROM usuarios WHERE nome = ?', [nome]);
    const usuarioId = usuario.id;
    run('INSERT INTO carga_horaria (usuario_id) VALUES (?)', [usuarioId]);

    const sessao = criarSessao(usuarioId);
    res.status(201).json({ id: usuarioId, nome, token: sessao.token });
  } catch { res.status(500).json({ error: 'Erro interno' }); }
});

app.get('/api/registros', auth, (req, res) => {
  try {
    const registros = all('SELECT * FROM registros WHERE usuario_id = ? ORDER BY data DESC', [req.user.usuarioId]);
    res.json(registros);
  } catch { res.status(500).json({ error: 'Erro interno' }); }
});

app.post('/api/registros', auth, (req, res) => {
  try {
    const { data, entrada, ida_intervalo, volta_intervalo, saida } = req.body;
    if (!data) return res.status(400).json({ error: 'Data é obrigatória' });

    const existente = get('SELECT id FROM registros WHERE usuario_id = ? AND data = ?', [req.user.usuarioId, data]);
    if (existente) {
      run('UPDATE registros SET entrada = ?, ida_intervalo = ?, volta_intervalo = ?, saida = ? WHERE id = ?',
        [entrada || null, ida_intervalo || null, volta_intervalo || null, saida || null, existente.id]);
    } else {
      run('INSERT INTO registros (usuario_id, data, entrada, ida_intervalo, volta_intervalo, saida) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.usuarioId, data, entrada || null, ida_intervalo || null, volta_intervalo || null, saida || null]);
    }

    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Erro interno' }); }
});

app.put('/api/registros', auth, (req, res) => {
  try {
    const { id, entrada, ida_intervalo, volta_intervalo, saida } = req.body;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório' });

    run('UPDATE registros SET entrada = ?, ida_intervalo = ?, volta_intervalo = ?, saida = ? WHERE id = ? AND usuario_id = ?',
      [entrada || null, ida_intervalo || null, volta_intervalo || null, saida || null, id, req.user.usuarioId]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Erro interno' }); }
});

app.delete('/api/registros', auth, (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório' });
    run('DELETE FROM registros WHERE id = ? AND usuario_id = ?', [id, req.user.usuarioId]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Erro interno' }); }
});

app.get('/api/carga-horaria', auth, (req, res) => {
  try {
    let carga = get('SELECT * FROM carga_horaria WHERE usuario_id = ?', [req.user.usuarioId]);
    if (!carga) {
      run('INSERT INTO carga_horaria (usuario_id) VALUES (?)', [req.user.usuarioId]);
      carga = { entrada: '08:00', ida_intervalo: '12:00', volta_intervalo: '13:00', saida: '17:00' };
    }
    res.json({ entrada: carga.entrada, idaIntervalo: carga.ida_intervalo, voltaIntervalo: carga.volta_intervalo, saida: carga.saida });
  } catch { res.status(500).json({ error: 'Erro interno' }); }
});

app.post('/api/carga-horaria', auth, (req, res) => {
  try {
    const { entrada, ida_intervalo, volta_intervalo, saida } = req.body;
    const existente = get('SELECT id FROM carga_horaria WHERE usuario_id = ?', [req.user.usuarioId]);
    if (existente) {
      run('UPDATE carga_horaria SET entrada = ?, ida_intervalo = ?, volta_intervalo = ?, saida = ? WHERE usuario_id = ?',
        [entrada || '08:00', ida_intervalo || '12:00', volta_intervalo || '13:00', saida || '17:00', req.user.usuarioId]);
    } else {
      run('INSERT INTO carga_horaria (usuario_id, entrada, ida_intervalo, volta_intervalo, saida) VALUES (?, ?, ?, ?, ?)',
        [req.user.usuarioId, entrada || '08:00', ida_intervalo || '12:00', volta_intervalo || '13:00', saida || '17:00']);
    }
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Erro interno' }); }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

async function start() {
  await initDb();
  app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
}

start();
