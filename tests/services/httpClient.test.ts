import { test } from 'node:test';
import assert from 'node:assert/strict';
import { httpClient } from '../../src/services/httpClient.ts';

/**
 * H9 — Item 1. A estratégia de cache que impede exibir história antiga depende
 * de duas garantias: o Service Worker nunca serve `/api/*` do cache e o
 * `httpClient` pede `no-store` ao navegador. Aqui verificamos a segunda.
 */

type FetchCall = { url: string; init: RequestInit };

function stubFetch(): { calls: FetchCall[]; restore: () => void } {
  const original = globalThis.fetch;
  const calls: FetchCall[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

test('httpClient envia cache no-store por padrão', async () => {
  const stub = stubFetch();

  try {
    await httpClient('/api/stories/me', { userId: 'user-1' });

    assert.equal(stub.calls.length, 1);
    assert.equal(stub.calls[0].init.cache, 'no-store');
  } finally {
    stub.restore();
  }
});

test('httpClient permite sobrescrever explicitamente o cache', async () => {
  const stub = stubFetch();

  try {
    await httpClient('/api/stories/me', { cache: 'reload' });

    assert.equal(stub.calls[0].init.cache, 'reload');
  } finally {
    stub.restore();
  }
});

test('httpClient envia o header de usuário', async () => {
  const stub = stubFetch();

  try {
    await httpClient('/api/memories', { userId: 'user-abc' });

    const headers = new Headers(stub.calls[0].init.headers);
    assert.equal(headers.get('X-User-Id'), 'user-abc');
  } finally {
    stub.restore();
  }
});

test('httpClient envia o token de autenticação quando informado', async () => {
  const stub = stubFetch();

  try {
    await httpClient('/api/memories', { authToken: 'token-123', userId: 'user-abc' });

    const headers = new Headers(stub.calls[0].init.headers);
    assert.equal(headers.get('Authorization'), 'Bearer token-123');
  } finally {
    stub.restore();
  }
});
