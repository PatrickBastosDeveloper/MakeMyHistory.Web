# H9 — Auditoria Técnica de Robustez do MVP

Documento de auditoria, implementação e testes dos três pontos levantados na revisão
técnica externa do MakeMyHistory.

- Repositório frontend: `MakeMyHistory.Web`
- Repositório backend: `MakeMyHistory.Service`
- Branch (ambos): `feat/h9-robustez-mvp`

---

## Etapa 1 — Auditoria

### Item 1 — Service Worker e Cache

| Campo | Resultado |
| --- | --- |
| Implementado | Sim |
| Necessita correção | Sim (parcial — ver abaixo) |

**Perguntas da auditoria**

| Pergunta | Resposta |
| --- | --- |
| Existe Service Worker ativo? | Sim. Registrado em `src/main.tsx` no evento `load`. |
| Existe cache de requisições? | Sim. `public/sw.js` mantém o cache `mmh-static-v2`. |
| Existe cache de histórias? | Não. `/api/*` nunca é cacheado — sempre vai à rede. |
| Existe invalidação após gerar/atualizar história? | Não é necessária para a história: a API nunca é cacheada. Caches de versões antigas são removidos no `activate`. |
| Risco de exibir versão antiga da história? | Não. `sw.js` responde `/api/*` com `fetch` direto e `httpClient` usa `cache: 'no-store'`. |

**Evidência encontrada**

- `public/sw.js` — handler de `fetch` com três estratégias:
  1. `/api/*` → **sempre rede**, nunca lido nem gravado em cache.
  2. `/assets/*` (nome com hash de build) → **cache-first** (imutável).
  3. Arquivos públicos de nome fixo e navegação → **network-first** com fallback
     para o cache quando offline.
- `activate` remove todo cache cujo nome difere do atual.
- `install` pré-carrega o app shell e chama `skipWaiting()`; `activate` chama
  `clients.claim()` — a nova versão assume sem exigir hard refresh.
- `src/services/httpClient.ts` — todas as chamadas saem com `cache: 'no-store'`.

**Gap encontrado e corrigido**

A versão anterior tratava *todos* os estáticos como `cache-first`, incluindo arquivos
de `/public` com **nome fixo** (`favicon.svg`, `pwa-icon.svg`, `logo.png`). Como esses
arquivos não recebem hash de build, um deploy novo continuaria servindo a versão antiga
do cache até o usuário limpar os dados do site.

Correção: apenas `/assets/*` permanece `cache-first`. Arquivos públicos de nome fixo
passaram a usar `network-first` com fallback offline — atualizam sozinhos e continuam
disponíveis sem rede.

**Fluxos validados**

1. Gerar história — `/api/stories/me` sempre vem da rede.
2. Atualizar história — a leitura seguinte refaz a chamada de rede.
3. Recarregar página — assets versionados vêm do cache; a história vem da rede.
4. Fechar e abrir o app — cache antigo é descartado no `activate`.
5. Offline/online — navegação e arquivos públicos caem no cache; API falha em vez de
   servir conteúdo velho.

---

### Item 2 — Limites de Backend

| Campo | Resultado |
| --- | --- |
| Implementado | Sim |
| Necessita correção | Não |

**Memórias**

| Campo | Regra | Onde |
| --- | --- | --- |
| Título | Opcional; máximo 120 caracteres | `CreateMemory.MaxTitleLength`, `UpdateMemory.MaxTitleLength` |
| Conteúdo | Obrigatório; máximo 500 caracteres | `CreateMemory.MaxContentLength`, `UpdateMemory.MaxContentLength` |

**Perfil**

| Campo | Regra | Onde |
| --- | --- | --- |
| Nome | Obrigatório; máximo 100 caracteres | `SaveUserProfile.MaxNameLength` |
| Data de nascimento | A partir de 01/01/1900 e não futura | `SaveUserProfile` |

**Feedback**

| Campo | Regra | Onde |
| --- | --- | --- |
| Tipo | Obrigatório; restrito a `Problema`, `Sugestão`, `Dúvida`, `Outro` | `RecordFeedback` + `FeedbackTypes.All` |
| Mensagem | Obrigatória; máximo 1000 caracteres | `RecordFeedback.MaxMessageLength` |

**Payloads inválidos**

`ApiExceptionHandlingMiddleware` garante que todo erro saia no contrato
`{ "error": "mensagem" }`, inclusive os 400 sem corpo produzidos pelo binding de
minimal APIs (JSON malformado, tipo incorreto, data impossível no JSON).

**Evidência encontrada**

- `src/MakeMyHistory.API/Middleware/ApiExceptionHandlingMiddleware.cs`
- `src/MakeMyHistory.API/Endpoints/MemoryEndpoints.cs`, `UserEndpoints.cs`, `FeedbackEndpoints.cs`
- `src/MakeMyHistory.Application/UseCases/Memories/CreateMemory/CreateMemory.cs`
- `src/MakeMyHistory.Application/UseCases/Memories/UpdateMemory/UpdateMemory.cs`
- `src/MakeMyHistory.Application/UseCases/Users/SaveUserProfile/SaveUserProfile.cs`
- `src/MakeMyHistory.Application/UseCases/Feedbacks/RecordFeedback/RecordFeedback.cs`

O backend valida tudo de forma independente do frontend. A validação do frontend
permanece apenas como UX.

---

### Item 3 — Validação de Datas

| Campo | Resultado |
| --- | --- |
| Implementado | Sim |
| Necessita correção | Não |

**Regra oficial — `src/MakeMyHistory.Application/UseCases/Memories/DateValidation.cs`**

`dateType` ausente → data não informada, nada a validar (campo opcional).
Qualquer outro valor de `dateType` → **rejeitado** com mensagem explícita.

| `dateType` | Regras |
| --- | --- |
| `FullDate` | Formato exato `aaaa-mm-dd` com cultura invariante; ano entre 1900 e o ano atual; não pode ser futura; não pode ser anterior à data de nascimento. |
| `YearOnly` | Ano entre 1900 e o ano atual; não pode ser anterior ao ano de nascimento. |
| `Age` | Não pode ser negativa; não pode ser superior à idade atual calculada pela data de nascimento; limite absoluto de 120. |

**Política explícita para idade = 0**

Idade `0` é **válida** e representa um evento ocorrido no ano de nascimento do usuário
(primeiro ano de vida). Está documentada no XML doc de `DateValidation` e coberta por
teste unitário e de integração.

**Consistência temporal**

Quando o perfil do usuário existe, `CreateMemory` e `UpdateMemory` buscam a data de
nascimento via `IUserProfileRepository` e passam para `DateValidation`, garantindo que
data completa, ano e idade descrevam eventos possíveis dentro da vida do usuário.

**Exemplos da auditoria**

| Entrada | Resultado |
| --- | --- |
| `31/02/2020` (`2020-02-31`) | Rejeitado — data impossível |
| `40/01/2020` (`2020-40-01`) | Rejeitado — mês impossível |
| `01/01/2100` | Rejeitado — data futura |
| Nascimento 1986, memória 1970 | Rejeitado — anterior ao nascimento |
| Idade `-1` | Rejeitado — negativa |
| Idade `500` | Rejeitado — acima de 120 |
| Nascimento 2000, idade `100` | Rejeitado — superior à idade atual |
| Idade `0` | Aceito — política explícita |

**Evidência encontrada**

- `src/MakeMyHistory.Application/UseCases/Memories/DateValidation.cs`
- `src/MakeMyHistory.Application/UseCases/Memories/CreateMemory/CreateMemory.cs`
- `src/MakeMyHistory.Application/UseCases/Memories/UpdateMemory/UpdateMemory.cs`

---

## Etapa 2 — Implementações realizadas

Nesta branch (ambos os repositórios):

**Backend (`MakeMyHistory.Service`)**

1. `DateValidation` reescrito como regra central: parse invariante, faixa de anos,
   rejeição de datas futuras, consistência com a data de nascimento, `dateType`
   desconhecido rejeitado, política documentada para idade 0.
2. `CreateMemory` e `UpdateMemory` passaram a receber `IUserProfileRepository` e a
   validar as datas contra a data de nascimento do usuário.
3. Limite de conteúdo (500) e de título (120) aplicados em criação e edição.
4. `SaveUserProfile` passou a limitar o nome (100) e a rejeitar data de nascimento futura.
5. `ApiExceptionHandlingMiddleware` criado: normaliza todo erro para `{ "error": "..." }`,
   incluindo payloads rejeitados pelo binding.
6. `Program.cs`: migrações de banco podem ser desligadas em testes
   (`MMH_SKIP_STARTUP_MIGRATIONS`) e só rodam em provider relacional.
7. Suíte de testes de integração sem PostgreSQL: `MakeMyHistoryApiFactory` +
   `InMemoryRepositoryStore` exercitam o pipeline HTTP real com persistência em memória.

**Frontend (`MakeMyHistory.Web`)**

1. `public/sw.js` — estratégia de cache explícita: API sempre na rede, assets com hash
   `cache-first`, arquivos de nome fixo e navegação `network-first` com fallback offline,
   limpeza de caches antigos no `activate`.
2. `src/services/httpClient.ts` — `cache: 'no-store'` por padrão em toda chamada de API;
   `import.meta.env` com encadeamento opcional para permitir importar o módulo fora do Vite.
3. `tests/cache/serviceWorkerCache.test.ts` — 18 casos de teste do Service Worker
   (o arquivo anterior continha apenas helpers, sem nenhuma asserção).
4. `tests/tsconfig.json`, `@types/node` e scripts `test` / `typecheck` — o projeto não
   tinha nenhum runner de teste configurado.

---

## Etapa 3 — Testes

### Frontend — `npm test` (node:test, 19 casos, 0 falhas)

**Service Worker (`tests/cache/serviceWorkerCache.test.ts`, 18 casos)**

Ciclo de vida

- `install` pré-carrega o app shell
- `activate` descarta caches de versões antigas

Frescor da história

- resposta de API nunca é servida a partir do cache
- resposta de API não é gravada em cache
- atualizar história mostra o conteúdo novo sem hard refresh
- API em outra origem também não é cacheada
- com a rede fora, API rejeita em vez de servir versão antiga

Interceptação

- métodos diferentes de GET não são interceptados
- assets de outra origem não são interceptados

Assets estáticos

- asset com hash é buscado na rede na primeira vez e no cache depois
- arquivo público de nome fixo é atualizado pela rede a cada carga
- arquivo público de nome fixo é guardado para uso offline
- arquivo público de nome fixo usa o cache quando offline
- arquivo público de nome fixo offline sem cache falha

Navegação

- navegação busca na rede e guarda o shell para uso offline
- navegação offline usa o shell em cache
- navegação offline sem shell em cache falha
- recarregar a página não serve história antiga do cache de assets

**Probe (`tests/probe.test.ts`, 1 caso)**

- o runner executa TypeScript nativamente

### Backend — `dotnet test` (123 casos, 0 falhas)

| Projeto | Casos | Falhas |
| --- | --- | --- |
| `MakeMyHistory.UnitTests` | 68 | 0 |
| `MakeMyHistory.IntegrationTests` | 55 | 0 |

**Datas**

- `DateValidationTests` (unitário): válidas, impossíveis, futuras, anteriores ao
  nascimento, tipo desconhecido, idade negativa, idade acima da atual, idade absurda,
  idade zero.
- `MemoryDateApiTests` (integração): os mesmos cenários exercitados via HTTP real, com
  perfil salvo antes de cada requisição.

**Limites**

- `MemoryLimitsApiTests`: conteúdo exatamente no limite, acima do limite, vazio e em
  branco; título exatamente no limite e acima; os mesmos limites no `PUT`.
- `CreateMemoryTests` e `UpdateMemoryTests` (unitário): os mesmos cenários na camada de
  aplicação, incluindo a ausência de persistência quando a validação falha.
- `ProfileApiTests` e `SaveUserProfileTests`: nome exatamente no limite, acima, vazio;
  nascimento anterior a 1900 e futuro.
- `FeedbackApiTests` e `RecordFeedbackTests`: tipo ausente, tipo fora da whitelist,
  mensagem ausente, mensagem exatamente no limite e acima.
- `MalformedPayloadApiTests`: JSON malformado, corpo vazio, tipo incorreto e data
  impossível — todos retornando 400 com o contrato `{ "error": "..." }`.

**Cache / integração HTTP**

- `MemoriesFlowTests`: criação, leitura da história, idempotência por `clientRequestId`
  e, sobretudo, atualizar uma memória e reler a timeline retornando o conteúdo novo e
  não o antigo — a garantia de "nunca servir versão antiga" no nível da API.

### Comandos

```
# Backend
dotnet test MakeMyHistory.sln

# Frontend
npm test
npm run typecheck
npm run build
```

---

## Resultado final

- Service Worker e cache foram auditados — estratégia implementada e coberta por
  18 testes automatizados.
- Limites de backend foram auditados — memórias, perfil e feedback validados no backend,
  independentemente do frontend, com cobertura de limite / no limite / acima do limite.
- Validações de datas foram auditadas — datas impossíveis, futuras, anos incompatíveis
  com o nascimento e idades inválidas são rejeitados; a política para idade 0 está
  documentada e testada.
- Todos os gaps encontrados foram corrigidos: cache de arquivos de nome fixo,
  validação de datas contra a data de nascimento, limites de título/conteúdo/nome/mensagem,
  contrato de erro para payloads inválidos, teste do Service Worker (era stub) e ausência
  de runner de testes no frontend.

**Estado das verificações:** `dotnet test` 123/123 · `npm test` 19/19 ·
`npm run typecheck` sem erros · `npm run build` concluído.

### Observações

- A branch do backend foi criada a partir de `feat/feedback-button`, pois o H9 exercita a
  infraestrutura de feedback introduzida no H6 (ainda não mesclada em `main`). Quando o H6
  for integrado, esta branch pode ser rebaseada sobre `main`.
- O nome do cache (`mmh-static-v2`) é versionado: um novo valor em `CACHE_NAME` invalida
  todo o cache anterior no próximo `activate`, mecanismo disponível caso seja necessário
  forçar a renovação de assets.
