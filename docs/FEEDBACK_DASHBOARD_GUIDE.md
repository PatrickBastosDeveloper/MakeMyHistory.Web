# Metabase — Dashboard de Feedback dos Testadores (H7)

> **Papel deste documento:** guia operacional para criar o dashboard dedicado aos feedbacks enviados pelo botão flutuante da aplicação.
> Passo a passo para conectar a tabela `feedbacks` e criar as SQL Questions das KPIs aprovadas.
> Segue o mesmo padrão do `docs/METABASE_GUIDE.md` (Fase D).

---

## 1. Pré-requisitos

- Metabase no ar: `https://metabase-production-d106.up.railway.app`
- Banco `Analytics MakeMyHistory` já conectado (mesmo Postgres do Railway)
- A tabela `feedbacks` **já deve existir** no banco (criada pela migration `AddFeedbacks` do backend)
- Acesso de admin no Metabase

> **Importante:** as colunas da tabela `feedbacks` são **snake_case**:
> `id`, `user_id`, `type`, `message`, `created_at`, `status`, `app_version`, `user_agent`, `screen_width`, `screen_height`

---

## 2. Criar as SQL Questions

No Metabase: **+ New → SQL question** → selecione a database **Analytics MakeMyHistory** → cole a query → **Salvar**.

Sugestão de nomes (todos em snake_case, sem acento, para consistência com as Questions de analytics):

### KPI 1 — Total de Feedbacks

```sql
SELECT COUNT(*) AS total_feedbacks
FROM feedbacks;
```

**Tipo de card:** scalar

---

### KPI 2 — Feedbacks por Tipo

```sql
SELECT type, COUNT(*) AS total
FROM feedbacks
GROUP BY type
ORDER BY total DESC;
```

**Tipo de card:** bar (ou pie)
**Cores sugeridas:** Problema = vermelho, Sugestão = azul, Dúvida = amarelo, Outro = cinza

---

### KPI 3 — Feedbacks ao Longo do Tempo

```sql
SELECT DATE(created_at) AS dia, COUNT(*) AS feedbacks
FROM feedbacks
GROUP BY dia
ORDER BY dia;
```

**Tipo de card:** line

---

### KPI 4 — Usuários que Enviaram Feedback

```sql
SELECT COUNT(DISTINCT user_id) AS usuarios_feedback
FROM feedbacks;
```

**Tipo de card:** scalar

---

### KPI 5 — Taxa de Participação

Usuários que enviaram feedback ÷ Usuários ativos (usuários com qualquer evento em `analytics_events`, mesmo critério de retenção já usado).

```sql
WITH feedback_users AS (
  SELECT DISTINCT user_id FROM feedbacks
),
active_users AS (
  SELECT DISTINCT user_id FROM analytics_events
)
SELECT
  (SELECT COUNT(*) FROM feedback_users)                          AS usuarios_feedback,
  (SELECT COUNT(*) FROM active_users)                            AS usuarios_ativos,
  ROUND(
    (SELECT COUNT(*) FROM feedback_users)::numeric
    / NULLIF((SELECT COUNT(*) FROM active_users), 0)
    * 100, 1
  ) AS taxa_participacao_pct;
```

**Tipo de card:** scalar (exibir a taxa; os dois contadores como referência)

---

### KPI 6 — Feedbacks por Usuário

```sql
SELECT user_id, COUNT(*) AS total_feedbacks
FROM feedbacks
GROUP BY user_id
ORDER BY total_feedbacks DESC;
```

**Tipo de card:** table

---

### KPI 7 — Últimos Feedbacks Recebidos

```sql
SELECT created_at, user_id, type, message, status
FROM feedbacks
ORDER BY created_at DESC
LIMIT 50;
```

**Tipo de card:** table
**Ordenação:** mais recentes primeiro (já na query)

---

### KPI 8 — Feedbacks por Status

```sql
SELECT status, COUNT(*) AS total
FROM feedbacks
GROUP BY status
ORDER BY total DESC;
```

**Tipo de card:** bar (ou pie)
**Estados esperados:** `Novo` (padrão), `Em análise`, `Resolvido`

---

### KPI 9 — Problemas Mais Reportados

Lista simples dos feedbacks do tipo Problema, com contagem de ocorrências semelhantes.

```sql
SELECT type, message, COUNT(*) AS ocorrencias
FROM feedbacks
WHERE type = 'Problema'
GROUP BY type, message
ORDER BY ocorrencias DESC
LIMIT 20;
```

**Tipo de card:** table

> **Observação:** agrupamentos inteligentes (clusterização de mensagens semelhantes) ficam para uma evolução futura. No MVP basta a listagem dos problemas.

---

## 3. Dashboard — "Feedback dos Testadores (MVP)"

1. **+ New → Dashboard** — nome: **Feedback dos Testadores (MVP)**
2. Adicione as 9 Questions (arrastando do menu lateral ou "Add a question")
3. Organize na ordem das KPIs (1 → 9)

### Filtros globais do dashboard

Adicione um filtro compartilhado no dashboard:

| Filtro | Campo |
|---|---|
| Período | `created_at` |
| Tipo de feedback | `type` |
| Status | `status` |
| Usuário | `user_id` |

> Para o filtro funcionar, as Questions devem ter a coluna correspondente retornada (ou usar "Field filter" vinculado à coluna da tabela `feedbacks`). No Metabase, use **Dashboard → Edit → Add filter → Field** e vincule à pergunta correspondente.

---

## 4. Integração ao Dashboard Principal do MVP

Adicionar os cards de **Qualidade** ao dashboard principal **"Analytics MVP"**:

### Estrutura recomendada do dashboard principal

| Seção | Cards |
|---|---|
| **Aquisição** | Usuários criados por dia |
| **Ativação** | Usuários que criaram pelo menos uma memória · Tempo até primeira memória |
| **Engajamento** | Memórias criadas por dia · Histórias geradas · Média de memórias por usuário |
| **Qualidade** | Total de feedbacks · Feedbacks por tipo · Usuários que enviaram feedback · Últimos feedbacks recebidos |
| **Retenção** | Usuários ativos nos últimos 7 dias · Usuários ativos nos últimos 30 dias |

> Os cards de Qualidade usam as Questions criadas acima. Para os itens ainda não existentes (tela de usuários ativos 7/30 dias e tempo até primeira memória), manter no backlog conforme roadmap.

---

## 5. Proteção de acesso

- O dashboard herda a proteção do Metabase (login obrigatório)
- Criar acesso apenas via convite (Settings → People)
- O Postgres **não** deve ser exposto publicamente (Metabase acessa o host interno `postgres.railway.internal`)

---

## 6. Checklist de validação

- [ ] Tabela `feedbacks` existe no Postgres (migration `AddFeedbacks`)
- [ ] As 9 SQL Questions criadas e salvando corretamente
- [ ] Dashboard **"Feedback dos Testadores (MVP)"** criado com as 9 KPIs
- [ ] Filtros globais (período, tipo, status, usuário) funcionando
- [ ] Cards de Qualidade adicionados ao dashboard principal **"Analytics MVP"**
- [ ] Acesso restrito por login do Metabase
