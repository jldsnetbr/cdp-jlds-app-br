import { validateSession } from './auth-utils.js';

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

        const registros = await env.DB.prepare(
            'SELECT * FROM registros WHERE usuario_id = ? ORDER BY data DESC'
        ).bind(user.usuarioId).all();

        return new Response(JSON.stringify(registros.results || []), {
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
        const { data, entrada, ida_intervalo, volta_intervalo, saida } = body;

        if (!data) {
            return new Response(JSON.stringify({ error: 'Data é obrigatória' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await env.DB.prepare(`
            INSERT INTO registros (usuario_id, data, entrada, ida_intervalo, volta_intervalo, saida)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(usuario_id, data) DO UPDATE SET
                entrada = excluded.entrada,
                ida_intervalo = excluded.ida_intervalo,
                volta_intervalo = excluded.volta_intervalo,
                saida = excluded.saida
        `).bind(user.usuarioId, data, entrada || null, ida_intervalo || null, volta_intervalo || null, saida || null).run();

        return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
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

export async function onRequestPut(context) {
    const { env, request } = context;

    try {
        const user = await validateSession(env.DB, request);
        if (!user) return unauthorized();

        const body = await request.json();
        const { id, entrada, ida_intervalo, volta_intervalo, saida } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: 'ID é obrigatório' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await env.DB.prepare(`
            UPDATE registros SET
                entrada = ?,
                ida_intervalo = ?,
                volta_intervalo = ?,
                saida = ?
            WHERE id = ? AND usuario_id = ?
        `).bind(entrada || null, ida_intervalo || null, volta_intervalo || null, saida || null, id, user.usuarioId).run();

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

export async function onRequestDelete(context) {
    const { env, request } = context;

    try {
        const user = await validateSession(env.DB, request);
        if (!user) return unauthorized();

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: 'ID é obrigatório' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await env.DB.prepare('DELETE FROM registros WHERE id = ? AND usuario_id = ?').bind(id, user.usuarioId).run();

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
