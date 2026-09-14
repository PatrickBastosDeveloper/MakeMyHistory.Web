import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

/**
 * Item 1 da auditoria H9 — comportamento de cache do Service Worker.
 * O sw.js roda num sandbox com Cache Storage e fetch simulados.
 */

const SW_SOURCE = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../public/sw.js'),
  'utf8',
);

const ORIGIN = 'https://app.example.com';
const CACHE = 'mmh-static-v2';
const LEGACY_CACHE = 'mmh-static-v1';

type FakeRequest = { url: string; method: string; mode: string };
type FakeResponse = { ok: boolean; body: string; clone(): FakeResponse };
type CacheEntries = Map<string, FakeResponse>;
type CacheStore = Map<string, CacheEntries>;
type Handler = (event: Record<string, unknown>) => void;

type Harness = {
  store: CacheStore;
  fetchCalls: string[];
  entries(name: string): CacheEntries;
  install(): Promise<void>;
  activate(): Promise<void>;
  send(request: FakeRequest): Promise<FakeResponse | undefined>;
};

function response(body: string): FakeResponse {
  return { ok: true, body, clone: () => response(body) };
}

function keyOf(request: FakeRequest | string): string {
  return typeof request === 'string' ? request : request.url;
}

function request(path: string, init: { method?: string; mode?: string } = {}): FakeRequest {
  return {
    url: path.startsWith('http') ? path : `${ORIGIN}${path}`,
    method: init.method ?? 'GET',
    mode: init.mode ?? 'no-cors',
  };
}

function createHarness(options: { offline?: boolean } = {}): Harness {
  const handlers = new Map<string, Handler>();
  const store: CacheStore = new Map();
  const fetchCalls: string[] = [];

  const entries = (name: string): CacheEntries => {
    const found = store.get(name);
    if (found) return found;

    const created: CacheEntries = new Map();
    store.set(name, created);
    return created;
  };

  const sandbox: Record<string, unknown> = { URL, location: { origin: ORIGIN } };
  sandbox.self = sandbox;
  sandbox.skipWaiting = async () => {};
  sandbox.clients = { claim: async () => {} };

  sandbox.addEventListener = (type: string, handler: Handler) => {
    handlers.set(type, handler);
  };

  sandbox.caches = {
    async open(name: string) {
      const bag = entries(name);
      return {
        async addAll(requests: string[]) {
          for (const item of requests) bag.set(keyOf(item), response(`shell:${item}`));
        },
        async match(target: FakeRequest | string) {
          return bag.get(keyOf(target));
        },
        async put(target: FakeRequest | string, value: FakeResponse) {
          bag.set(keyOf(target), value);
        },
      };
    },
    async keys() {
      return [...store.keys()];
    },
    async delete(name: string) {
      return store.delete(name);
    },
  };

  sandbox.fetch = async (target: FakeRequest | string) => {
    const key = keyOf(target);
    fetchCalls.push(key);

    if (options.offline) throw new TypeError('offline');

    return response(`network:${key}`);
  };

  vm.runInNewContext(SW_SOURCE, sandbox, { filename: 'sw.js' });

  const lifecycle = async (type: string): Promise<void> => {
    const handler = handlers.get(type);
    if (!handler) {
      throw new Error(`handler "${type}" não registrado`);
    }

    let pending: Promise<unknown> | undefined;
    handler({ waitUntil: (p: Promise<unknown>) => { pending = p; } });

    if (pending) await pending;
  };

  const send = async (req: FakeRequest): Promise<FakeResponse | undefined> => {
    const handler = handlers.get('fetch');
    if (!handler) {
      throw new Error('handler "fetch" não registrado');
    }

    let pending: Promise<unknown> | undefined;
    handler({ request: req, respondWith: (p: Promise<unknown>) => { pending = p; }, waitUntil: () => {} });

    if (!pending) return undefined;

    return (await pending) as FakeResponse;
  };

  return {
    store,
    fetchCalls,
    entries,
    install: () => lifecycle('install'),
    activate: () => lifecycle('activate'),
    send,
  };
}

async function requireResponse(harness: Harness, req: FakeRequest): Promise<FakeResponse> {
  const result = await harness.send(req);
  if (!result) {
    throw new Error(`o service worker deveria responder ${req.url}`);
  }

  return result;
}

function seed(harness: Harness, name: string, key: string, body: string): void {
  harness.entries(name).set(key, response(body));
}

// App shell esperado em cache após o install (contrato do sw.js).
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/pwa-icon.svg', '/logo.png'];

// ── Ciclo de vida ────────────────────────────────────────────

test('install pré-carrega o app shell', async () => {
  const harness = createHarness();

  await harness.install();

  const cached = harness.entries(CACHE);
  for (const entry of APP_SHELL) {
    assert.ok(cached.has(entry), `app shell deve conter ${entry}`);
  }
});

test('activate descarta caches de versões antigas', async () => {
  const harness = createHarness();
  seed(harness, LEGACY_CACHE, `${ORIGIN}/`, 'shell-antigo');
  seed(harness, CACHE, `${ORIGIN}/`, 'shell-atual');

  await harness.activate();

  assert.equal(harness.store.has(LEGACY_CACHE), false, 'cache antigo deve ser removido');
  assert.equal(harness.store.has(CACHE), true, 'cache atual deve ser preservado');
});

// ── Item 1: nenhuma história antiga pode vir do cache ─────────

test('resposta de API nunca é servida a partir do cache', async () => {
  const harness = createHarness();
  const apiUrl = `${ORIGIN}/api/stories/me`;

  // Simula uma versão antiga da história já presente em qualquer cache.
  seed(harness, CACHE, apiUrl, 'historia-antiga');

  const result = await requireResponse(harness, request('/api/stories/me'));

  assert.equal(result.body, `network:${apiUrl}`, 'deve vir sempre da rede');
  assert.notEqual(result.body, 'historia-antiga');
});

test('resposta de API não é gravada em cache', async () => {
  const harness = createHarness();

  await requireResponse(harness, request('/api/stories/me'));

  assert.equal(
    harness.entries(CACHE).has(`${ORIGIN}/api/stories/me`),
    false,
    'chamadas de API não devem poluir o cache',
  );
});

test('atualizar história mostra o conteúdo novo sem hard refresh', async () => {
  const harness = createHarness();
  const apiUrl = `${ORIGIN}/api/stories/me`;

  // Primeira leitura: rede responde a versão 1 e nada é cacheado.
  await requireResponse(harness, request('/api/stories/me'));

  // Segunda leitura após atualização: precisa refletir a rede novamente.
  const second = await requireResponse(harness, request('/api/stories/me'));

  assert.equal(second.body, `network:${apiUrl}`);
  assert.equal(harness.fetchCalls.length, 2, 'cada leitura de API deve ir à rede');
});

test('API em outra origem também não é cacheada', async () => {
  const harness = createHarness();

  const result = await requireResponse(harness, request('http://localhost:5000/api/stories/me'));

  assert.equal(result.body, 'network:http://localhost:5000/api/stories/me');
  assert.equal(harness.store.size, 0, 'nenhum cache deve ser criado');
});

test('com a rede fora, API rejeita em vez de servir versão antiga', async () => {
  const harness = createHarness({ offline: true });
  const apiUrl = `${ORIGIN}/api/stories/me`;

  // Mesmo com uma história antiga disponível, ela não pode ser servida.
  seed(harness, CACHE, apiUrl, 'historia-antiga');

  await assert.rejects(harness.send(request('/api/stories/me')));
});

// ── Requisições que não devem ser interceptadas ──────────────

test('métodos diferentes de GET não são interceptados', async () => {
  const harness = createHarness();

  const result = await harness.send(request('/api/memories', { method: 'POST' }));

  assert.equal(result, undefined, 'POST deve seguir o caminho padrão do navegador');
});

test('assets de outra origem não são interceptados', async () => {
  const harness = createHarness();

  const result = await harness.send(request('https://cdn.example.com/logo.png'));

  assert.equal(result, undefined);
});

// ── Assets estáticos: cache-first ────────────────────────────

test('asset estático é buscado na rede na primeira vez e no cache depois', async () => {
  const harness = createHarness();
  const asset = request('/assets/index-abc123.js');

  const first = await requireResponse(harness, asset);
  const second = await requireResponse(harness, asset);

  assert.equal(first.body, `network:${asset.url}`);
  assert.equal(second.body, first.body, 'segunda leitura deve vir do cache');
  assert.equal(harness.fetchCalls.length, 1, 'a rede deve ser chamada apenas uma vez');
});

// ── Navegação: network-first com fallback offline ────────────

test('navegação busca na rede e guarda o shell para uso offline', async () => {
  const harness = createHarness();

  const result = await requireResponse(harness, request('/', { mode: 'navigate' }));

  assert.equal(result.body, `network:${ORIGIN}/`);
  assert.ok(harness.entries(CACHE).has('/index.html'), 'shell deve ficar disponível offline');
});

test('navegação offline usa o shell em cache', async () => {
  const harness = createHarness({ offline: true });
  seed(harness, CACHE, '/index.html', 'shell-em-cache');

  const result = await requireResponse(harness, request('/qualquer-rota', { mode: 'navigate' }));

  assert.equal(result.body, 'shell-em-cache');
});

test('navegação offline sem shell em cache falha', async () => {
  const harness = createHarness({ offline: true });

  await assert.rejects(harness.send(request('/', { mode: 'navigate' })));
});

test('recarregar a página não serve história antiga do cache de assets', async () => {
  const harness = createHarness();
  const asset = request('/assets/story-viewer.js');

  // Primeira carga popular o cache de assets.
  await requireResponse(harness, asset);

  // Recarga: o asset continua vindo do cache (é versionado), mas a história
  // é buscada de novo na API.
  const reloadAsset = await requireResponse(harness, asset);
  const reloadStory = await requireResponse(harness, request('/api/stories/me'));

  assert.equal(reloadAsset.body, `network:${asset.url}`);
  assert.equal(reloadStory.body, `network:${ORIGIN}/api/stories/me`);
  assert.equal(harness.fetchCalls.length, 2, 'asset cacheado + história na rede');
});

// ── Arquivos públicos de nome estável: network-first ─────────

test('arquivo público de nome estável é atualizado pela rede a cada carga', async () => {
  const harness = createHarness();
  const icon = request('/favicon.svg');

  // Versão antiga do arquivo presente em cache.
  seed(harness, CACHE, icon.url, 'icone-antigo');

  const result = await requireResponse(harness, icon);

  assert.equal(result.body, `network:${icon.url}`, 'a rede deve vencer o cache');
  assert.equal(harness.fetchCalls.length, 1);
});

test('arquivo público de nome estável é guardado para uso offline', async () => {
  const harness = createHarness();
  const icon = request('/pwa-icon.svg');

  const result = await requireResponse(harness, icon);

  assert.equal(harness.entries(CACHE).get(icon.url)?.body, result.body);
});

test('arquivo público de nome estável usa o cache quando offline', async () => {
  const harness = createHarness({ offline: true });
  const icon = request('/favicon.svg');
  seed(harness, CACHE, icon.url, 'icone-em-cache');

  const result = await requireResponse(harness, icon);

  assert.equal(result.body, 'icone-em-cache');
});

test('arquivo público de nome estável offline sem cache falha', async () => {
  const harness = createHarness({ offline: true });

  await assert.rejects(harness.send(request('/logo.png')));
});
