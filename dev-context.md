# Dev Context — MakeMyHistory.Web

Última atualização: 2026-05-02 16:15 BRT

## Objetivo deste documento
Servir como resumo vivo do que já foi implementado no frontend e do ponto exato em que o desenvolvimento está, para que qualquer agente consiga retomar a thread sem perder contexto.

---

## Status geral por fase

- **1/7 — Fase 1:** concluída
- **2/7 — Fase 2:** concluída
- **3/7 — Fase 3:** concluída e consolidada
- **4/7 — Fase 4:** concluída e validada
- **5/7 — Fase 5:** concluída e validada
- **6/7 — Fase 6:** em andamento
- **7/7 — Fase 7:** não iniciada

> Status atual: a Fase 6 foi refinada com composição visual dos componentes compartilhados e validada em build e no navegador. O próximo trabalho deve continuar no aprimoramento da Fase 6 até sua consolidação final, antes da Fase 7.

---

## O que já foi desenvolvido

### Fundação do app
- React + Vite configurados
- React Router configurado
- React Query configurado
- `main.tsx` com providers globais
- `App.tsx` renderizando a Home
- estrutura básica de pastas existente

### Base de tipos e contratos
- `src/types/app.ts`
- `src/types/memory.ts`
- `src/types/story.ts`
- `src/types/user.ts`
- `src/lib/queryKeys.ts`

### Client HTTP e integração com backend
- `src/services/httpClient.ts`
- suporte a `VITE_API_BASE_URL`
- tratamento padronizado de erro com `AppError`
- suporte a `Authorization`
- suporte a `X-User-Id`

### Serviços
- `src/services/memoriesService.ts`
- `src/services/storyService.ts`
- ambos recebem `userId` e repassam via header

### Hooks
- `src/hooks/useMemoriesTimeline.ts`
- `src/hooks/useMyStory.ts`
- `src/hooks/useCreateMemory.ts`

### Utilitários
- `src/lib/date/formatMemoryDate.ts`
- `src/lib/date/sortMemories.ts`
- `src/lib/track/track.ts`
- `src/lib/toast/useToast.ts`

### Auth mínima
- `src/features/auth/AuthProvider.tsx`
- `useAuth`
- geração/persistência de `userId` no `localStorage`
- escuta do evento `storage`
- provider integrado no `main.tsx`

### Home / Fases 3 e 4
- `src/features/home/HomePage.tsx` com:
  - criação de memória
  - timeline
  - história
  - estados loading / empty / error
  - retry por item na timeline
  - retry de história
  - tracking de eventos
  - bloqueio offline
  - contador de caracteres
  - ordenação e limite de 50 memórias
- fluxo otimista de memória implementado:
  - `pending`
  - `success`
  - `error`
- dedupe simples para evitar insert duplicado pendente
- estado de história com loading local de geração

### Fase 6 — componentes compartilhados
- `src/components/Button.tsx`
- `src/components/Input.tsx`
- `src/components/TextArea.tsx`
- `src/components/Card.tsx`
- `src/components/Container.tsx`
- `src/components/LoadingState.tsx`
- `src/components/EmptyState.tsx`
- `src/components/Header.tsx`
- `src/components/Badge.tsx`
- estilos base adicionados em `src/style.css` para:
  - `.button`
  - `.card`
  - `.input`
  - `.input--textarea`
  - `.container`
  - `.loading-state`
  - `.empty-state`
  - `.header`
  - `.badge`
- Home já começou a usar os componentes base
- `npm run build` passou após a integração inicial dos componentes
- `npm run build` passou novamente após a adição do `TextArea` e do refinamento do CSS
- bundle CSS atual consolidado com os novos componentes

---

## Regras já consolidadas

### Memórias
- `GET /api/memories?limit=50`
- `POST /api/memories`
- ordenar no front antes de exibir
- limitar em 50 itens
- otimista com `pending`
- erro preservado na timeline
- retry por item reutiliza payload original
- evitar múltiplos submits

### História
- `GET /api/stories/me`
- retry recarrega a própria história
- loading local ao gerar história

### Auth
- usar apenas `userId` no `localStorage`
- gerar `crypto.randomUUID()` no primeiro acesso
- sem login formal no MVP

### Tracking
- `app_opened`
- `memory_created`
- `story_generate_clicked`
- `retry_clicked`

---

## Arquivos principais a olhar primeiro quando retomar

- `src/features/home/HomePage.tsx`
- `src/hooks/useCreateMemory.ts`
- `src/hooks/useMemoriesTimeline.ts`
- `src/hooks/useMyStory.ts`
- `src/services/httpClient.ts`
- `src/services/memoriesService.ts`
- `src/services/storyService.ts`
- `src/features/auth/AuthProvider.tsx`
- `src/main.tsx`
- `src/components/Button.tsx`
- `src/components/Input.tsx`
- `src/components/TextArea.tsx`
- `src/components/Card.tsx`
- `src/components/Container.tsx`
- `src/components/LoadingState.tsx`
- `src/components/EmptyState.tsx`
- `src/components/Header.tsx`
- `src/components/Badge.tsx`
- `src/style.css`

---

## Validações já executadas

- `npm run build` passou com sucesso várias vezes após as mudanças
- a Fase 2 foi fechada de fato
- a Fase 3 foi validada
- a Fase 4 foi validada
- a Fase 5 foi validada
- a Fase 6 já iniciou com componentes compartilhados e compilação bem-sucedida após a integração inicial
- a Fase 6 segue em andamento com os componentes base e estilos compartilhados consolidados
- a Home já está consumindo melhor a base visual compartilhada
- build validado com sucesso após o refinamento recente
- validação no navegador feita com sucesso

---

## Próximo foco imediato
- seguir refinando a Fase 6 com composição visual dos componentes compartilhados
- revisar a Home para aproveitar melhor a nova base visual
- concluir a Fase 6 antes de avançar para a Fase 7
