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

        let carga = await db.prepare(
            'SELECT * FROM carga_horaria WHERE usuario_id = ?'
        ).bind(usuarioId).first();

        if (!carga) {
            const result = await db.prepare(
                'INSERT INTO carga_horaria (usuario_id) VALUES (?)'
            ).bind(usuarioId).run();

            carga = {
                id: result.meta.last_row_id,
                usuario_id: parseInt(usuarioId),
                entrada: '08:00',
                ida_intervalo: '12:00',
                volta_intervalo: '13:00',
                saida: '17:00'
            };
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
        const { usuario_id, entrada, ida_intervalo, volta_intervalo, saida } = body;

        if (!usuario_id) {
            return new Response(JSON.stringify({ error: 'usuario_id é obrigatório' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const db = env.DB;

        await db.prepare(`
            INSERT INTO carga_horaria (usuario_id, entrada, ida_intervalo, volta_intervalo, saida)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(usuario_id) DO UPDATE SET
                entrada = excluded.entrada,
                ida_intervalo = excluded.ida_intervalo,
                volta_intervalo = excluded.volta_intervalo,
                saida = excluded.saida
        `).bind(usuario_id, entrada || '08:00', ida_intervalo || '12:00', volta_intervalo || '13:00', saida || '17:00').run();

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
