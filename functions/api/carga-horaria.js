async function validateSession(db, request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const now = new Date().toISOString();
    const sessao = await db.prepare(
        'SELECT s.usuario_id, u.nome FROM sessoes s JOIN usuarios u ON s.usuario_id = u.id WHERE s.token = ? AND s.expires_at > ?'
    ).bind(token, now).first();
    return sessao ? { usuarioId: sessao.usuario_id, nome: sessao.nome } : null;
}

function unauthorized() {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function onRequestGet(context) {
    const { env, request } = context;
    try {
        const user = await validateSession(env.DB, request);
        if (!user) return unauthorized();

        let carga = await env.DB.prepare(
            'SELECT * FROM carga_horaria WHERE usuario_id = ?'
        ).bind(user.usuarioId).first();

        if (!carga) {
            await env.DB.prepare('INSERT INTO carga_horaria (usuario_id) VALUES (?)').bind(user.usuarioId).run();
            carga = { entrada: '08:00', ida_intervalo: '12:00', volta_intervalo: '13:00', saida: '17:00' };
        }

        return new Response(JSON.stringify({
            entrada: carga.entrada,
            idaIntervalo: carga.ida_intervalo,
            voltaIntervalo: carga.volta_intervalo,
            saida: carga.saida
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

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const user = await validateSession(env.DB, request);
        if (!user) return unauthorized();

        const body = await request.json();
        const { entrada, ida_intervalo, volta_intervalo, saida } = body;

        await env.DB.prepare(`
            INSERT INTO carga_horaria (usuario_id, entrada, ida_intervalo, volta_intervalo, saida)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(usuario_id) DO UPDATE SET
                entrada = excluded.entrada,
                ida_intervalo = excluded.ida_intervalo,
                volta_intervalo = excluded.volta_intervalo,
                saida = excluded.saida
        `).bind(user.usuarioId, entrada || '08:00', ida_intervalo || '12:00', volta_intervalo || '13:00', saida || '17:00').run();

        return new Response(JSON.stringify({ success: true }), {
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
