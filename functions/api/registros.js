export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const usuarioId = url.searchParams.get('usuario_id');

        if (!usuarioId) {
            return new Response(JSON.stringify({ error: 'usuario_id é obrigatório' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const db = env.DB;

        const registros = await db.prepare(
            'SELECT * FROM registros WHERE usuario_id = ? ORDER BY data DESC'
        ).bind(usuarioId).all();

        return new Response(JSON.stringify(registros.results || []), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const body = await request.json();
        const { usuario_id, data, entrada, ida_intervalo, volta_intervalo, saida } = body;

        if (!usuario_id || !data) {
            return new Response(JSON.stringify({ error: 'usuario_id e data são obrigatórios' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const db = env.DB;

        const result = await db.prepare(`
            INSERT INTO registros (usuario_id, data, entrada, ida_intervalo, volta_intervalo, saida)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(usuario_id, data) DO UPDATE SET
                entrada = excluded.entrada,
                ida_intervalo = excluded.ida_intervalo,
                volta_intervalo = excluded.volta_intervalo,
                saida = excluded.saida
        `).bind(usuario_id, data, entrada || null, ida_intervalo || null, volta_intervalo || null, saida || null).run();

        return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPut(context) {
    const { env, request } = context;

    try {
        const body = await request.json();
        const { id, entrada, ida_intervalo, volta_intervalo, saida } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: 'id é obrigatório' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const db = env.DB;

        await db.prepare(`
            UPDATE registros SET
                entrada = ?,
                ida_intervalo = ?,
                volta_intervalo = ?,
                saida = ?
            WHERE id = ?
        `).bind(entrada || null, ida_intervalo || null, volta_intervalo || null, saida || null, id).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete(context) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: 'id é obrigatório' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const db = env.DB;

        await db.prepare('DELETE FROM registros WHERE id = ?').bind(id).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
