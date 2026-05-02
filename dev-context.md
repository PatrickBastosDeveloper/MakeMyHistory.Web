# Dev Context — MakeMyHistory.Web

Última atualização: 2026-05-02 16:31 BRT

## Objetivo deste documento
Servir como resumo vivo do que já foi implementado no frontend e do ponto exato em que o desenvolvimento está, para que qualquer agente consiga retomar a thread sem perder contexto.

---

## Status geral por fase

- **1/7 — Fase 1:** concluída
- **2/7 — Fase 2:** concluída
- **3/7 — Fase 3:** concluída e consolidada
- **4/7 — Fase 4:** concluída e validada
- **5/7 — Fase 5:** concluída e validada
- **6/7 — Fase 6:** concluída e validada
- **7/7 — Fase 7:** não iniciada

> Status atual: a Fase 6 foi refinada com composição visual dos componentes compartilhados, validada em build e no navegador, integrada com o `userId` real da auth mínima e protegida contra renderização prematura enquanto a auth prepara o estado inicial. A Home agora também possui título opcional de memória com contador visual e tracking de abertura sem duplicação em dev. A Fase 6 está concluída e validada; o próximo trabalho deve avançar para a Fase 7.

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
- Home agora consome o `userId` real da auth mínima
- Home espera `isReady` da auth antes de renderizar o conteúdo principal
- Home possui título opcional de memória no fluxo de criação
- Home possui contador visual para o título opcional
- `npm run build` passou após a integração inicial dos componentes
- `npm run build` passou novamente após a adição do `TextArea` e do refinamento do CSS
- `npm run build` passou após a integração com `userId` real
- `npm run build` passou após a proteção de renderização inicial com `isReady`
- `npm run build` passou após a adição do título opcional na Home
- `npm run build` passou após a adição do contador visual do título
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
- a Fase 6 foi validada e consolidada
- a Home já está consumindo melhor a base visual compartilhada
- a Home já está integrada ao `userId` real da auth mínima
- a Home só exibe conteúdo principal após a auth mínima ficar pronta
- a Home agora oferece criação de memória com título opcional
- a Home agora mostra contador visual do título opcional
- build validado com sucesso após o refinamento recente
- validação no navegador feita com sucesso

---

## Próximo foco imediato
- iniciar a Fase 7
- revisar o que falta para PWA, manifesto e ícones
- preparar a camada de instalação do app
- manter a base atual estável enquanto avançamos
