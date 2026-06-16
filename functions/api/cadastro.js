import { createSession, cleanExpiredSessions } from './auth-utils.js';

export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const body = await request.json();
        const { nome, pin } = body;

        if (!nome || !pin) {
            return new Response(JSON.stringify({ error: 'Nome e PIN são obrigatórios' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (pin.length !== 4 || !/^\d+$/.test(pin)) {
            return new Response(JSON.stringify({ error: 'PIN deve ter 4 dígitos' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const db = env.DB;

        const existente = await db.prepare('SELECT id FROM usuarios WHERE nome = ?').bind(nome).first();

        if (existente) {
            return new Response(JSON.stringify({ error: 'Usuário já existe' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await db.prepare('INSERT INTO usuarios (nome, pin) VALUES (?, ?)').bind(nome, pin).run();
        const usuarioId = result.meta.last_row_id;

        await db.prepare('INSERT INTO carga_horaria (usuario_id) VALUES (?)').bind(usuarioId).run();

        await cleanExpiredSessions(db);
        const sessao = await createSession(db, usuarioId);

        return new Response(JSON.stringify({
            id: usuarioId,
            nome,
            token: sessao.token
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch {
        return new Response(JSON.stringify({ error: 'Erro interno' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
