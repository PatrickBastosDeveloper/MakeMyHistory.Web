# Plano de criação do frontend — MakeMyHistory

## 1. Objetivo do frontend
Criar um frontend para o MakeMyHistory focado em:
- registro rápido de memórias
- timeline simples e reativa
- geração/leitura de história pessoal
- experiência mobile-first
- possibilidade de virar PWA

## 2. Princípios do MVP
O MVP deve ser **debug-friendly**:
- poucas regras
- comportamento previsível
- logs claros
- fluxo fácil de entender
- sem inteligência excessiva de cache/merge

## 3. Premissas técnicas
- React
- Vite
- Tailwind CSS
- React Router
- React Query
- PWA
- integração com backend .NET API
- toda a experiência do usuário deve estar em português

## 4. Contrato geral do frontend
### 4.1 Identidade do usuário
- usar **apenas** `userId` no `localStorage` para o MVP
- se não existir `userId`, gerar `crypto.randomUUID()` no primeiro acesso e persistir
- usar `X-User-Id` como identidade única no MVP
- remover login e rota protegida do MVP

### 4.2 Timeline e histórias
- a timeline do MVP deve vir de `GET /api/memories?limit=50`
- a história do usuário deve vir de `GET /api/stories/me`

### 4.3 Estrutura de estado e cache
- usar React Query com `useMutation` para criar memória
- usar `setQueryData` para feedback imediato
- usar `invalidateQueries` depois para sincronizar com o backend
- manter o fluxo simples:
  1. `setQueryData` para inserir/atualizar
  2. `invalidateQueries` para reconciliação final

### 4.4 Query keys
Centralizar as query keys desde o início:
```ts
export const queryKeys = {
  memories: {
    timeline: (userId: string) => ['memories', 'timeline', userId],
  },
  story: {
    me: (userId: string) => ['story', 'me', userId],
  },
};
```

### 4.5 Ordenação da timeline
Sempre ordenar no front antes de exibir:
```ts
function sortMemories(memories: Memory[]) {
  return [...memories].sort((a, b) => {
    if (a.eventDate && b.eventDate) {
      return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
    }

    if (a.eventDate) return -1;
    if (b.eventDate) return 1;

    if (a.eventYear && b.eventYear) {
      return b.eventYear - a.eventYear;
    }

    if (a.eventYear) return -1;
    if (b.eventYear) return 1;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
```

Regras:
- sempre aplicar `sortMemories` após qualquer update de timeline
- sempre usar `sortMemories(memories).slice(0, 50)` para limitar os itens exibidos
- nunca confiar na ordem vinda do backend

### 4.6 Estados dos itens
- `pending` → opacidade reduzida + texto `Guardando...`
- `success` → normal
- `error` → vermelho leve + texto `Não foi possível guardar` + `Tentar novamente`

### 4.7 Retry e rastreio
- no retry, reutilizar o payload original
- manter o mesmo `clientRequestId` no retry
- `clientRequestId` deve existir para rastreio e futura idempotência
- evitar duplicação por `tempId`
- bloquear múltiplos submits tecnicamente com:
  ```ts
  if (mutation.isPending) return;
  ```

### 4.8 Dedupe mínimo
Adicionar uma verificação local simples para evitar segundo insert otimista com mesmo conteúdo enquanto existir item `pending`.

Regra local de dedupe:
```ts
function isDuplicate(a: MemoryUI, b: MemoryUI) {
  const sameContent = a.content.trim() === b.content.trim();
  const sameTitle = (a.title ?? '').trim() === b.title?.trim();
  const timeDiff = Math.abs(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return sameContent && sameTitle && timeDiff < 3000;
}
```

Se existir `clientRequestId` nos dois itens, ele deve ser o primeiro critério de comparação.

### 4.9 Erro padronizado
```ts
type AppError = {
  message: string;
  code?: string;
};
```

### 4.10 Regras de UX
- definir input principal com autofocus
- submit com Enter
- bloqueio de múltiplos submits
- limpeza após salvar
- limitar o campo principal a 500 caracteres com contador visual e bloqueio no input
- manter container base com padding mobile
- garantir o loop rápido: criar memória → atualizar timeline imediatamente
- bloquear submit quando `navigator.onLine === false`
- mostrar toast:
  - `Sem conexão. Tente novamente quando estiver online.`

### 4.11 Tracking mínimo
- `memory_created` → disparar no sucesso da mutation
- `story_generate_clicked` → disparar ao clicar no CTA de gerar história
- `app_opened` → disparar no mount inicial da app
- `retry_clicked` → disparar ao clicar em tentar novamente

### 4.12 Logs
Log padrão para debugar:
```ts
const log = (scope: string, message: string, data?: unknown) => {
  console.log(`[${scope}] ${message}`, data);
};
```

### 4.13 Saudação
- persistir a última saudação em `localStorage` com a chave `lastGreetingMessage`
- não repetir frase de saudação consecutiva entre sessões
- sincronizar saudação entre abas escutando o evento `storage`
- a escuta do evento `storage` deve apenas ler e atualizar estado local, sem regravar `localStorage`
- ao escrever a saudação nova, só persistir quando a frase realmente mudar

### 4.14 História
Fluxo da história:
- clicar CTA
- executar mutation
- mostrar loading local
- depois `refetch` de `story.me`

## 5. O que foi removido para simplificar o MVP
- merge inteligente entre servidor e cache local
- sincronização sofisticada de estado pendente
- qualquer timer global
- heurísticas excessivas que dificultem debug

## 6. Regras simples para pendências
Se um item `pending` ficar velho:
- tratar na leitura/render com uma regra local simples
- converter para `error` se estiver muito antigo
- não usar `setInterval`
- não usar timer global

## 7. Estrutura desejada
```text
src/
 ├── app/
 ├── pages/
 ├── components/
 ├── features/
 ├── services/
 ├── hooks/
 ├── lib/
 ├── styles/
 └── types/
```

---

# Fase 1 — Fundação do projeto

## 1.1 Objetivo
Inicializar o frontend com a base técnica correta.

## 1.2 Estratégia de testes
- TDD apenas para hooks, services, contratos e lógica
- componentes simples: testes leves de render e comportamento crítico apenas quando necessário

## 1.3 Entregas
- projeto React + Vite
- Tailwind configurado
- React Router configurado
- React Query configurado
- estrutura de pastas criada
- base de PWA preparada
- client HTTP base preparado
- tipos globais iniciais
- `lib/track/track.ts`
- `lib/date/formatMemoryDate.ts`
- `lib/toast/useToast.ts`
- `features/home` com `HomePage.tsx` e componentes básicos
- `queryKeys` centralizado
- `queryKeys` como fonte única para timeline e história

## 1.4 Prompt da fase 1
```text
Você vai iniciar o frontend do MakeMyHistory.

Stack obrigatória:
- React
- Vite
- Tailwind CSS
- React Router
- React Query
- PWA
- integração com backend .NET API

Antes de implementar qualquer coisa, siga TDD apenas para hooks, services e lógica pura:
1. escreva testes para client API, utils e providers mínimos
2. implemente somente após os testes guiarem a solução
3. para componentes simples, use testes leves de render e comportamento crítico apenas quando necessário

Objetivo desta fase:
- criar a fundação do projeto
- configurar providers globais
- configurar roteamento
- configurar React Query
- preparar o client HTTP com baseURL por variável de ambiente
- preparar a estrutura de pastas
- criar a base de formatação de datas
- criar a base de toast
- criar a base de tracking
- definir query keys centrais

Quero a implementação da fundação, com organização limpa e pronta para evoluir.
```

### Query keys padrão
```ts
export const queryKeys = {
  memories: {
    timeline: (userId: string) => ['memories', 'timeline', userId],
  },
  story: {
    me: (userId: string) => ['story', 'me', userId],
  },
};
```

### Tracking mínimo
```ts
export const track = (event: string, data?: unknown) => {
  console.log('[track]', event, data);
};
```

---

# Fase 2 — Camada de API e contratos

## 2.1 Objetivo
Criar a camada de integração com o backend.

## 2.2 Estratégia de testes
- TDD apenas para hooks, services, contratos e lógica
- componentes simples: testes leves de render e comportamento crítico apenas quando necessário

## 2.3 Entregas
- `services/api.ts`
- tipos `memory`, `story`, `user`
- client HTTP com `baseURL`
- tratamento padronizado de erro
- mapeamento dos endpoints
- suporte para header `X-User-Id`
- suporte para autenticação futura via JWT, se necessário
- mapeadores de DTO para UI
- `mapMemoryResponse.ts`

## 2.4 API do MVP
- `GET /api/memories?limit=50`
- `POST /api/memories`
- `GET /api/stories/me`

## 2.5 Prompt da fase 2
```text
Você vai criar a camada de integração com o backend do MakeMyHistory.

Antes de implementar qualquer código, siga TDD apenas para hooks, services e lógica pura:
1. escreva testes para o client HTTP, tratamento de erro e contratos
2. implemente somente depois dos testes guiarem a solução
3. para componentes simples, use testes leves de render e comportamento crítico apenas quando necessário

O backend expõe uma API .NET e o frontend deve consumir:
- GET /api/memories?limit=50
- POST /api/memories
- GET /api/stories/me

Requisitos:
- criar client HTTP centralizado
- ler base URL de variável de ambiente
- padronizar tratamento de erros
- preparar headers para X-User-Id
- deixar pronto para JWT futuramente
- criar tipos compartilhados para memória, usuário e história
- mapear DTOs do backend para modelos de UI

Mantenha a arquitetura simples, previsível e fácil de expandir.
```

---

# Fase 3 — Features de memórias

## 3.1 Objetivo
Implementar o fluxo principal do produto.

## 3.2 Estratégia de testes
- TDD apenas para hooks, services, lógica e contratos
- componentes críticos com testes leves de render e comportamento
- evitar snapshot pesado e UI trivial

## 3.3 Entregas
- criar memória
- listar timeline
- visualização de itens de memória
- loading, empty state e error state
- React Query para sincronização automática
- estado do item com `pending | success | error`
- filtro de importantes

## 3.4 Excluído do MVP atual
- exclusão de memória

## 3.5 Prompt da fase 3
```text
Você vai implementar a feature principal de memórias do MakeMyHistory.

Antes de implementar qualquer coisa, siga TDD apenas para hooks, services e lógica pura:
1. escreva testes para hooks, services e componentes críticos da feature
2. implemente apenas após os testes guiarem a solução
3. não gaste tempo com snapshot e UI trivial

Fluxos necessários:
- criar memória
- listar timeline
- atualizar a timeline após criação
- exibir loading, empty state e erro
- filtrar importantes

Estrutura esperada:
- features/memories/components
- features/memories/hooks
- features/memories/services
- features/memories/mappers

Regras:
- UI simples, rápida e mobile-first
- não usar estado global desnecessário
- usar React Query para dados da API
- manter a experiência focada em reduzir atrito

Implemente somente o essencial para o usuário registrar memórias rapidamente.
```

### Fluxo otimista e retry
- criar item com `temp-...`
- aplicar `status: 'pending'`
- ao sucesso, atualizar com os dados reais e reordenar usando a regra do backend
- ao erro, marcar como `error`
- retry deve reutilizar o payload original
- retry pode manter o mesmo `tempId` como referência de rastreio
- evitar duplicação por `tempId`
- `clientRequestId` deve ser enviado no payload
- o retry deve preservar exatamente o mesmo `clientRequestId`
- se o backend ainda não suportar idempotência, usar fallback local por conteúdo + janela temporal de 5 segundos
- após qualquer update, reaplicar `sortMemories`
- ordenar e limitar sempre com `sortMemories(memories).slice(0, 50)`
- se existir item pendente com mesmo conteúdo, bloquear novo insert otimista antes de atualizar estado
- se um item `pending` ficar muito velho, converter para `error` na leitura/render/merge, sem timer global

---

# Fase 4 — Story e leitura da narrativa

## 4.1 Objetivo
Exibir a narrativa gerada pelo backend.

## 4.2 Estratégia de testes
- TDD apenas para hooks, services, lógica e contratos
- componentes críticos com testes leves de render e comportamento
- evitar snapshot pesado e UI trivial

## 4.3 Entregas
- tela de história
- leitura de história
- geração de história
- tratamento de estados de carregamento e ausência de história

## 4.4 Prompt da fase 4
```text
Você vai implementar a feature de história do MakeMyHistory.

Antes de implementar, siga TDD apenas para hooks, services e lógica pura:
1. escreva testes para os hooks, services e componentes críticos
2. implemente somente depois dos testes definirem o comportamento esperado
3. para componentes simples, use testes leves de render e comportamento crítico apenas quando necessário

Fluxos necessários:
- gerar história
- ler história gerada
- exibir resultado de forma clara
- tratar estados de loading, vazio e erro

Objetivo de UX:
- mostrar a história de forma legível e humana
- manter a interface simples
- evitar complexidade visual desnecessária

Implemente com React Query, serviços da feature e componentes reutilizáveis.
```

---

# Fase 5 — Estrutura de auth mínima

## 5.1 Objetivo
Preparar a navegação e a base mínima de identificação do usuário.

## 5.2 Estratégia de testes
- TDD apenas para hooks, services, lógica e contratos
- componentes simples: testes leves de render e comportamento crítico apenas quando necessário

## 5.3 Entregas
- `features/auth/AuthProvider.tsx`
- `features/auth/useAuth.ts`
- geração e persistência de `userId`
- fluxo sem login formal
- identificação automática do usuário

## 5.4 Prompt da fase 5
```text
Você vai organizar a base mínima de identificação do usuário do MakeMyHistory.

Antes de implementar, siga TDD apenas para hooks, services e lógica pura:
1. escreva testes de roteamento, hooks de auth e proteção de rotas
2. implemente somente depois dos testes guiarem a solução
3. para componentes simples, use testes leves de render e comportamento crítico apenas quando necessário

Requisitos:
- usar somente userId no localStorage
- se não existir userId, gerar `crypto.randomUUID()` no primeiro acesso
- manter essa identificação para todo o fluxo do MVP
- não usar login formal no MVP
- preparar a base para migração futura para JWT
- manter a navegação simples

Implemente apenas o necessário para estruturar a experiência do usuário.
```

---

# Fase 6 — UI e components compartilhados

## 6.1 Objetivo
Criar consistência visual e reduzir repetição.

## 6.2 Estratégia de testes
- testes leves de render e comportamento crítico
- sem snapshot excessivo
- sem TDD rígido para UI trivial

## 6.3 Entregas
- Button
- Input
- Card
- Container
- Header
- componentes reutilizáveis para estados vazios e loading
- `HomePage.tsx` composto por:
  - `Greeting`
  - `MemoryForm`
  - `Timeline`
  - `StoryCard`

## 6.4 Prompt da fase 6
```text
Você vai criar os componentes compartilhados do MakeMyHistory.

Antes de implementar qualquer coisa, siga TDD apenas para hooks, services e lógica pura:
1. escreva testes para os componentes base somente quando houver comportamento crítico
2. implemente apenas depois dos testes guiarem a solução
3. não use snapshot excessivo

Componentes esperados:
- Button
- Input
- Card
- Container
- Header
- componentes de loading e empty state

Componentes da Home:
- Greeting
- MemoryForm
- Timeline
- StoryCard

Regras:
- visual simples
- responsivo
- consistente
- reutilizável
- otimizado para mobile-first

Mantenha a implementação enxuta e sem abstrações excessivas.
```

---

# Fase 7 — PWA e finalização

## 7.1 Objetivo
Transformar o frontend em comportamento de app instalável.

## 7.2 Estratégia de testes
- TDD apenas para hooks, services e lógica
- offline adiado para fase futura
- foco em instalável e manifesto

## 7.3 Entregas
- manifest
- ícones
- configuração PWA
- revisão final de qualidade
- `vite-plugin-pwa`
- offline bloqueado no MVP

## 7.4 Prompt da fase 7
```text
Você vai preparar o frontend do MakeMyHistory para comportamento de PWA.

Antes de implementar, siga TDD apenas para hooks, services e lógica pura:
1. escreva testes para os pontos que forem testáveis da configuração
2. implemente somente após os testes guiarem a solução
3. offline suportado fica para fase futura

Requisitos:
- configurar manifest
- configurar ícones
- preparar instalação como app
- usar `vite-plugin-pwa`
- manter a navegação simples em mobile
- validar experiência final

Faça apenas o necessário para que o produto se comporte como um app leve e direto.
```

---

# 8. Passos de execução para o agent
O agent deve seguir esta ordem operacional:

1. **criar o projeto em `C:\projects`**
2. **criar o repositório / frontend**
3. **instalar dependências**
4. **implementar por fase**
5. **rodar testes durante o desenvolvimento**
6. **rodar build ao final de cada fase**
7. **corrigir falhas antes de avançar**
8. **repetir até concluir**

## 9. Regras de validação obrigatória
- rodar testes durante o desenvolvimento
- rodar build ao fim de cada fase
- não avançar se houver erro
- manter logs simples para debug
- evitar pedir confirmação desnecessária ao desenvolvedor

## 10. Critérios de sucesso do frontend
O frontend estará pronto quando:
- consumir corretamente a API .NET
- permitir registro rápido de memórias
- mostrar timeline atualizada
- exibir história pessoal
- usar estrutura limpa e escalável
- seguir TDD em hooks, services e lógica pura
- usar testes leves de comportamento em componentes críticos
- estar preparado para PWA e auth futura

## 11. Observação importante
Em cada fase:
- escrever testes apenas onde faz sentido
- depois implementar
- depois validar comportamento
- manter a solução simples e focada no MVP

## 12. Home — sessão de saudação dinâmica

### 12.1 Objetivo da sessão
Criar conexão emocional + orientar o próximo passo + reforçar progresso.

### 12.2 Estrutura da saudação
A saudação sempre terá 2 partes:
1. saudação base fixa
2. frase dinâmica variável

#### Saudação base fixa
- `Bom dia, {Nome} ☀️`
- `Boa tarde, {Nome} 🌤️`
- `Boa noite, {Nome} 🌙`

#### Frase dinâmica variável
A frase dinâmica deve ser baseada em contexto do usuário e ter no máximo uma linha.

### 12.3 Regra por horário
#### Manhã — 05:00 às 11:59
Prefixo:
- `Bom dia, {Nome} ☀️`

#### Tarde — 12:00 às 17:59
Prefixo:
- `Boa tarde, {Nome} 🌤️`

#### Noite — 18:00 às 04:59
Prefixo:
- `Boa noite, {Nome} 🌙`

### 12.4 Regra por quantidade de memórias
#### 0 memórias
Prioridade mais alta para ativação.

Frases:
- `Sua história começa com o primeiro momento.`
- `Que tal guardar seu primeiro momento?`
- `Tudo começa com uma memória.`

#### 1 a 4 memórias
Objetivo: continuidade.

Frases:
- `Você já começou sua jornada.`
- `Continue registrando seus momentos.`
- `Cada memória constrói sua história.`

#### 5+ memórias
Objetivo: progresso.

Frases:
- `Sua história está tomando forma.`
- `Sua jornada está ficando interessante.`
- `Você já tem uma bela coleção de momentos.`

### 12.5 Regra por ação recente
Se o usuário acabou de criar uma memória, isso sobrescreve todas as outras regras.

Frases:
- `Esse momento agora faz parte da sua história.`
- `Memória registrada com sucesso.`
- `Mais um capítulo adicionado à sua vida.`

### 12.6 Regra de inatividade
Se o usuário ficou mais de 3 dias sem entrar.

Frases:
- `Faz um tempo… quer registrar algo novo?`
- `Sentimos sua falta por aqui.`
- `Sua história continua. Quer adicionar um novo momento?`

### 12.7 Regra de rotação
Não repetir a mesma frase consecutivamente.

Regras:
- guardar a última frase exibida em `localStorage` com a chave `lastGreetingMessage`
- sincronizar a última saudação entre abas usando o evento `storage`
- a leitura do evento `storage` deve apenas atualizar estado local, sem regravar `localStorage`
- excluir a frase anterior da seleção seguinte
- só gravar uma nova saudação quando a frase realmente mudar

### 12.8 Seleção final da frase
Ordem de prioridade:
1. ação recente
2. inatividade
3. quantidade de memórias
4. random dentro do grupo

### 12.9 Limite de complexidade
No MVP não incluir:
- análise semântica das memórias
- IA
- personalização profunda

### 12.10 Regras de UX
- máximo de 1 frase dinâmica
- texto curto
- linguagem simples e humana
- evitar frases genéricas

### 12.11 Exemplo final
Usuário novo:
- `Bom dia, Ana ☀️`
- `Sua história começa com o primeiro momento.`

Usuário ativo:
- `Boa noite, Ana 🌙`
- `Sua história está tomando forma.`

Após salvar:
- `Esse momento agora faz parte da sua história.`

### 12.12 Objetivo emocional
Fazer o usuário sentir:
- “isso é pessoal”
- “isso está crescendo”
- “vale a pena continuar”

## 13. Home — fluxo da página principal

### 13.1 Objetivo da tela
A home é o centro do app: registrar memórias, ver timeline e acessar história.

### 13.2 Fluxo da página home
1. o usuário entra já autenticado
2. vê saudação personalizada
3. encontra um card de nova memória
4. preenche título opcional e conteúdo
5. marca importância se desejar
6. envia com botão ou Enter
7. a memória é salva e aparece imediatamente na timeline
8. vê a lista das memórias recentes
9. pode filtrar ou navegar para ver tudo
10. vê o card da história pessoal e o CTA para gerar a história
11. navega pela barra inferior para Memórias, História e Perfil

### 13.3 Áreas funcionais da home
#### Cabeçalho
- menu lateral
- título da página
- avatar do usuário

#### Saudação
- saudação base por horário
- frase dinâmica contextual

#### Nova memória
- título opcional
- conteúdo principal
- importante
- botão adicionar
- autofocus
- Enter para enviar
- bloqueio de múltiplos envios
- limpar campo após salvar
- contador de caracteres `0 / 500`
- estado `pending` com opacidade reduzida e texto `Guardando...`
- estado `error` em vermelho leve com ação `Tentar novamente`
- submit bloqueado enquanto a mutation estiver pendente
- evitar segundo insert otimista se já existir `pending` com o mesmo conteúdo

#### Suas memórias
- lista cronológica reversa
- destaque para importantes
- data
- preview
- loading
- empty state
- erro simples
- exibir apenas os últimos 50 itens no front, ordenando antes com `sortMemories`

#### História
- card secundário de narrativa
- CTA para gerar minha história
- estado vazio se ainda não existir
- loading com `Estamos escrevendo sua história...`
- retry quando falhar
- ao clicar em gerar, executar mutation, mostrar loading local e depois `refetch` de `story.me`

#### Navegação inferior
- Home
- Memórias
- História
- Perfil

### 13.4 Integração com o backend
A home deve conversar com:
- `GET /api/memories?limit=50`
- `POST /api/memories`
- `GET /api/stories/me`

### 13.5 Leitura funcional
A home deve sustentar o ciclo:
1. entrar
2. saudar
3. registrar memória
4. ver na timeline
5. acessar história
6. repetir o uso diariamente

## 14. Resultado esperado do fluxo geral
O produto deve seguir este comportamento:
- o usuário entra direto na home sem login formal
- o `userId` é criado automaticamente no primeiro acesso
- a home é centrada em memória, timeline e história
- a sensação geral é de app pessoal, rápido e emocional
- o usuário entende que sua história está crescendo a cada memória
