import { describe, it, expect } from 'vitest';

const BASE = 'http://127.0.0.1:3000';

describe('API /api/cadastro', () => {
  it('cria novo usuario e retorna token', async () => {
    const res = await fetch(`${BASE}/api/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: `Teste_${Date.now()}`, pin: '1234' })
    });
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('nome');
    expect(data).toHaveProperty('token');
    expect(data.token.length).toBe(64);
  });

  it('recusa nome duplicado', async () => {
    const nome = `Duplicado_${Date.now()}`;
    await fetch(`${BASE}/api/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, pin: '1234' })
    });

    const res = await fetch(`${BASE}/api/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, pin: '1234' })
    });
    expect(res.status).toBe(409);
  });
});

describe('API /api/auth', () => {
  it('login com credenciais validas', async () => {
    const nome = `Auth_${Date.now()}`;
    await fetch(`${BASE}/api/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, pin: '1234' })
    });

    const res = await fetch(`${BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, pin: '1234' })
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('token');
  });

  it('login falha com pin errado', async () => {
    const nome = `AuthFail_${Date.now()}`;
    await fetch(`${BASE}/api/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, pin: '1234' })
    });

    const res = await fetch(`${BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, pin: '0000' })
    });
    expect(res.status).toBe(401);
  });
});

describe('API /api/registros (protegida)', () => {
  it('retorna 401 sem token', async () => {
    const res = await fetch(`${BASE}/api/registros`);
    expect(res.status).toBe(401);
  });

  it('cria e retorna registros', async () => {
    const nome = `Reg_${Date.now()}`;
    const cadastro = await fetch(`${BASE}/api/cadastro`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, pin: '1234' })
    });
    const { token } = await cadastro.json();

    const criar = await fetch(`${BASE}/api/registros`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ data: '2026-06-16', entrada: '08:00', ida_intervalo: '12:00', volta_intervalo: '13:00', saida: '17:00' })
    });
    expect(criar.status).toBe(200);

    const listar = await fetch(`${BASE}/api/registros`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(listar.status).toBe(200);
    const registros = await listar.json();
    expect(registros.length).toBeGreaterThanOrEqual(1);
  });
});

describe('API /api/carga-horaria (protegida)', () => {
  it('retorna carga padrao para novo usuario', async () => {
    const nome = `Carga_${Date.now()}`;
    const cadastro = await fetch(`${BASE}/api/cadastro`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, pin: '1234' })
    });
    const { token } = await cadastro.json();

    const res = await fetch(`${BASE}/api/carga-horaria`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.entrada).toBe('08:00');
    expect(data.saida).toBe('17:00');
  });
});
