export function generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

export async function createSession(db, usuarioId) {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await db.prepare(
        'INSERT INTO sessoes (usuario_id, token, expires_at) VALUES (?, ?, ?)'
    ).bind(usuarioId, token, expiresAt).run();

    return { token, expiresAt };
}

export async function validateSession(db, request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7);
    const now = new Date().toISOString();

    const sessao = await db.prepare(
        'SELECT s.*, u.id as uid, u.nome FROM sessoes s JOIN usuarios u ON s.usuario_id = u.id WHERE s.token = ? AND s.expires_at > ?'
    ).bind(token, now).first();

    return sessao ? { usuarioId: sessao.usuario_id, nome: sessao.nome } : null;
}

export async function cleanExpiredSessions(db) {
    const now = new Date().toISOString();
    await db.prepare('DELETE FROM sessoes WHERE expires_at < ?').bind(now).run();
}
