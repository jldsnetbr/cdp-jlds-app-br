function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '*';
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
    };
}

export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: getCorsHeaders(context.request) });
    }

    const response = await context.next();

    const newResponse = new Response(response.body, response);
    const corsHeaders = getCorsHeaders(context.request);
    Object.entries(corsHeaders).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
    });

    return newResponse;
}
