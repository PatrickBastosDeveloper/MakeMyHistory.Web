# Metabase — Dashboard MVP (Fase D)

> **Papel deste documento:** guia operacional do dashboard de analytics.
> Passo a passo para subir o Metabase e criar as SQL Questions aprovadas no roadmap.
> Não versionado — documento local de apoio.

---

## 1. Subir o Metabase

### Opção A — Docker local (docker-compose do backend)

O repositório `MakeMyHistory.Service` (branch `feat/analytics-phase-d`) inclui o serviço `metabase` no `docker-compose.yml`:

```bash
cd c:\projects\MakeMyHistory.Service
docker compose up -d metabase
```

Acesso: http://localhost:3000

- Primeira execução: criar a conta admin (e-mail + senha).
- O Metabase usa o Postgres local (`makemyhistory`) para metadados (MB_DB_*).

### Opção B — Conectar ao Postgres de produção (Railway)

1. Obtenha a `DATABASE_URL` do serviço Postgres no Railway.
2. Suba o Metabase apontando para esse banco OU use a UI:
   - **Settings → Admin → Databases → Add database**
   - Tipo: PostgreSQL
   - Host/Port/DB/User/Password: da `DATABASE_URL` (ex.: `postgres://user:pass@host:5432/db`)
   - **Importante em produção:** o Postgres do Railway já é o banco da aplicação — o Metabase deve ter acesso somente-leitura via usuário/delegação, e o acesso ao painel protegido por autenticação do próprio Metabase.

---

## 2. Conectar o banco de dados

No Metabase:

1. **Settings → Admin settings → Databases → Add a database**
2. Type: `PostgreSQL`
3. Preencher com as credenciais (local: db `makemyhistory`, user `postgres`, senha `postgres`, host `localhost:5432`).
4. **Save**.

---

## 3. SQL Questions (coleção "Analytics MVP")

Criar em **+ New → SQL question** e salvar. A tabela de eventos tem as colunas:

`"Id"`, `"UserId"`, `"EventName"`, `"Payload"` (jsonb), `"OccurredAt"`.

### 3.1 — Card: Usuários criados

```sql
SELECT DATE("OccurredAt") AS dia, COUNT(DISTINCT "UserId") AS usuarios_criados
FROM analytics_events
WHERE "EventName" = 'user_created'
GROUP BY dia
ORDER BY dia DESC;
```

### 3.2 — Card: Memórias criadas

```sql
SELECT DATE("OccurredAt") AS dia, COUNT(*) AS memorias_criadas
FROM analytics_events
WHERE "EventName" = 'memory_created'
GROUP BY dia
ORDER BY dia DESC;
```

### 3.3 — Card: Histórias geradas/regeneradas

```sql
SELECT
  DATE("OccurredAt") AS dia,
  COUNT(*) FILTER (WHERE "EventName" = 'story_generated')   AS geradas,
  COUNT(*) FILTER (WHERE "EventName" = 'story_regenerated') AS regeneradas
FROM analytics_events
WHERE "EventName" IN ('story_generated', 'story_regenerated')
GROUP BY dia
ORDER BY dia DESC;
```

### 3.4 — Card: Cópias e compartilhamentos

```sql
SELECT
  DATE("OccurredAt") AS dia,
  COUNT(*) FILTER (WHERE "EventName" = 'story_copied') AS copias,
  COUNT(*) FILTER (WHERE "EventName" = 'story_shared') AS compartilhamentos
FROM analytics_events
WHERE "EventName" IN ('story_copied', 'story_shared')
GROUP BY dia
ORDER BY dia DESC;
```

### 3.5 — Card: Recuperações de conta

```sql
SELECT DATE("OccurredAt") AS dia, COUNT(*) AS recuperacoes
FROM analytics_events
WHERE "EventName" = 'account_recovered'
GROUP BY dia
ORDER BY dia DESC;
```

### 3.6 — Funil: usuário → 1ª memória → 3ª memória → 1ª história

```sql
WITH mem_count AS (
  SELECT "UserId", COUNT(*) AS total_memorias
  FROM analytics_events
  WHERE "EventName" = 'memory_created'
  GROUP BY "UserId"
),
first_story AS (
  SELECT "UserId"
  FROM analytics_events
  WHERE "EventName" = 'story_generated'
  GROUP BY "UserId"
)
SELECT
  (SELECT COUNT(*) FROM analytics_events WHERE "EventName" = 'user_created') AS usuarios,
  (SELECT COUNT(*) FROM mem_count WHERE total_memorias >= 1) AS criaram_1_memoria,
  (SELECT COUNT(*) FROM mem_count WHERE total_memorias >= 3) AS criaram_3_memorias,
  (SELECT COUNT(*) FROM first_story) AS geraram_historia;
```

### 3.7 — Média de memórias por usuário

```sql
SELECT AVG(total_memorias)::numeric(10,2) AS media_memorias_por_usuario
FROM (
  SELECT "UserId", COUNT(*) AS total_memorias
  FROM analytics_events
  WHERE "EventName" = 'memory_created'
  GROUP BY "UserId"
) t;
```

### 3.8 — Retenção D1 / D7 / D30

Usuários com `app_opened` (ou qualquer evento) em janelas sucessivas após o 1º uso:

```sql
WITH first_seen AS (
  SELECT "UserId", MIN("OccurredAt")::date AS primeiro_dia
  FROM analytics_events
  GROUP BY "UserId"
),
returns AS (
  SELECT DISTINCT a."UserId",
         (a."OccurredAt"::date - f.primeiro_dia) AS dias_desde_primeiro
  FROM analytics_events a
  JOIN first_seen f ON f."UserId" = a."UserId"
)
SELECT
  (SELECT COUNT(*) FROM first_seen) AS usuarios,
  COUNT(DISTINCT "UserId") FILTER (WHERE dias_desde_primeiro BETWEEN 1 AND 1)  AS d1,
  COUNT(DISTINCT "UserId") FILTER (WHERE dias_desde_primeiro BETWEEN 1 AND 7)  AS d7,
  COUNT(DISTINCT "UserId") FILTER (WHERE dias_desde_primeiro BETWEEN 1 AND 30) AS d30
FROM returns;
```

---

## 4. Dashboard

1. **+ New → Dashboard** — nome: "Analytics MVP".
2. Adicionar cada question salva acima.
3. Opcional: filtro por período de `OccurredAt` compartilhado no dashboard.

---

## 5. Proteção de acesso

- O Metabase exige login (conta admin criada no 1º acesso).
- Em produção, o Postgres não deve ser exposto publicamente — o Metabase acessa o banco internamente (Railway link/plugin ou máquina com acesso ao banco).
- Usuários do painel: criar apenas via convite no Metabase (Settings → People), sem expor a senha do banco.
