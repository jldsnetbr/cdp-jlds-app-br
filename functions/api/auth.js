function generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

async function createSession(db, usuarioId) {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await db.prepare('INSERT INTO sessoes (usuario_id, token, expires_at) VALUES (?, ?, ?)').bind(usuarioId, token, expiresAt).run();
    return { token, expiresAt };
}

async function cleanExpiredSessions(db) {
    const now = new Date().toISOString();
    await db.prepare('DELETE FROM sessoes WHERE expires_at < ?').bind(now).run();
}

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

        const db = env.DB;

        const usuario = await db.prepare(
            'SELECT id, nome FROM usuarios WHERE nome = ? AND pin = ?'
        ).bind(nome, pin).first();

        if (!usuario) {
            return new Response(JSON.stringify({ error: 'Usuário ou PIN incorretos' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await cleanExpiredSessions(db);
        const sessao = await createSession(db, usuario.id);

        return new Response(JSON.stringify({
            id: usuario.id,
            nome: usuario.nome,
            token: sessao.token
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch {
        return new Response(JSON.stringify({ error: 'Erro interno' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
