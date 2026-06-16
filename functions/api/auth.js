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
            'SELECT id, nome, pin FROM usuarios WHERE nome = ? AND pin = ?'
        ).bind(nome, pin).first();

        if (!usuario) {
            return new Response(JSON.stringify({ error: 'Usuário ou PIN incorretos' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            id: usuario.id,
            nome: usuario.nome,
            pin: usuario.pin
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
