# Plano: novo campo de data "Hoje" na memória

Data: 20/11/2026
Branch de referência: `feature/validacao-reflexoes` (`MakeMyHistory.Service`, HEAD `be658d7`) + `MakeMyHistory.Web`
Escopo: **plano para revisão.** Nada foi implementado.

---

## 1. Objetivo

Hoje o usuário pode registrar a data de uma memória de quatro formas:

| Estado | O que é persistido |
|---|---|
| Sem data (checkbox "Sem data") | `dateType = null`, sem `eventDate`/`eventYear`/`age` |
| Data completa (radio) | `dateType = "FullDate"`, `eventDate` (`yyyy-MM-dd`), `eventYear` |
| Apenas ano (radio) | `dateType = "YearOnly"`, `eventYear` |
| Idade na época (radio) | `dateType = "Age"`, `age`, `eventYear` calculado |

Acrescentar um quinto estado: um checkbox **"Hoje"**, ao lado de "Sem data", que grava a data do dia em que a memória foi cadastrada.

---

## 2. A decisão de arquitetura

**"Hoje" não é um `DateType` novo. É um atalho de entrada que grava `FullDate` com a data de hoje.**

### 2.1 Por que não criar `DateType = "Today"`

Um `DateType` é um **modo** persistido, e modos são relidos muito depois de gravados. `"Today"` persistido teria um significado que muda sozinho: no dia seguinte à gravação, `"Today"` significaria "ontem", e nenhum consumidor saberia disso. Para não virar um alvo móvel, o registro teria de guardar a data real de qualquer forma — e aí o modo seria uma **flag redundante** que todo consumidor novo precisaria aprender a ignorar.

O custo concreto de `"Today"` no código atual, arquivo por arquivo:

| Arquivo | O que `"Today"` obrigaria a fazer |
|---|---|
| `DateValidation.cs` | nova constante + novo braço no `switch` + regra "não validar como data completa" |
| `UpdateMemory.cs` | novo braço na cadeia `if/else if` que decide quais campos sobrevivem |
| `StoryContentValidator.GetEventSortKey` | decidir se ordena pela data gravada ou por `CreatedAt` |
| `PromptBuilder.cs` | novo braço na cadeia que imprime `Idade na época:` / `Quando aconteceu:` |
| `formatDateTag.ts` | novo `case`, porque `default` devolve `null` e a tag do card desapareceria |
| `Memory.cs` / banco | nada (a coluna é `string?`), mas o valor passa a existir em produção sem validação de enum |

Seis pontos de decisão para entregar exatamente o mesmo resultado que `FullDate` entrega. **Nenhum ganho de produto**: a memória continua sendo de uma data específica, e é isso que o usuário quis dizer.

### 2.2 O que "Hoje" significa depois de gravado

Gravado como `FullDate`, o registro significa "o evento aconteceu em 20/11/2026". Se o usuário abrir a memória em 2027, verá **Data completa — 20/11/2026**. Isso está correto: o "hoje" era o dia do cadastro, e esse dia não muda mais.

### 2.3 Consequência de escopo

**Nenhuma mudança de backend, nenhuma migration, nenhuma alteração de contrato de API.** `dateType: "FullDate"` + `eventDate` já é o caminho mais exercitado do sistema — validado por `DateValidation.ValidateFullDate`, ordenado por `GetEventSortKey`, impresso no prompt como `Quando aconteceu: dd/MM/yyyy` e exibido no card por `formatDateTag`.

Toda a mudança é de frontend: `src/lib/memoryDate`, `CreateMemoryForm`, `EditMemoryModal`, `style.css` e os testes.

---

## 3. Escopo em arquivos

| Arquivo | Tipo | Mudança |
|---|---|---|
| `src/lib/memoryDate/index.ts` | front | **adiciona** `getTodayApiDate`, `getTodayDisplayDate` |
| `src/features/memories/CreateMemoryForm.tsx` | front | estado `today`, checkbox, payload, esconde os radios |
| `src/features/memories/EditMemoryModal.tsx` | front | idem, para consistência na edição |
| `src/style.css` | front | linha que comporta dois checkboxes |
| `tests/lib/memoryDate.test.ts` | teste | casos das duas funções novas |
| `../MakeMyHistory.Service/**` | back | **nada** |

---

## 4. Mudança 1 — helpers de data local

`src/lib/memoryDate/index.ts`, acrescentar ao final do arquivo:

```ts
/**
 * Data de hoje no fuso do dispositivo, no formato da API (aaaa-mm-dd).
 *
 * NÃO use `toISOString().slice(0, 10)`: ele devolve a data em UTC, e no Brasil
 * (UTC-3) isso já é o dia seguinte a partir das 21:00 — a memória seria gravada
 * com a data de amanhã e o backend a rejeitaria como futura.
 */
export function getTodayApiDate(reference: Date = new Date()): string {
  const year = reference.getFullYear();
  const month = String(reference.getMonth() + 1).padStart(2, '0');
  const day = String(reference.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Data de hoje no fuso do dispositivo, no formato de exibição (dd/mm/aaaa). */
export function getTodayDisplayDate(reference: Date = new Date()): string {
  return formatStoredDateToInput(getTodayApiDate(reference));
}
```

`formatStoredDateToInput` já existe no mesmo arquivo e faz `aaaa-mm-dd → dd/mm/aaaa`, então as duas funções nunca divergem.

O parâmetro `reference` não é decoração: é o que permite testar o comportamento com uma data fixa, sem depender do relógio da máquina que roda o teste.

---

## 5. Mudança 2 — `CreateMemoryForm.tsx`

### 5.1 Estado

Ao lado de `noDate`:

```ts
const [today, setToday] = useState(false);
```

### 5.2 Estado derivado

```ts
const todayDisplay = getTodayDisplayDate();
const todayApi = getTodayApiDate();
const todayError = today ? validateFullDate(todayDisplay, birthDate) : null;

const dateError = getDateError(dateType, dateValues, birthDate);
const hasDateError = dateType !== null && dateError !== null;
const currentDateValue = dateType ? dateValues[dateType] : '';
const canSubmit =
  Boolean(content.trim()) &&
  !isPending &&
  !hasDateError &&
  todayError === null &&
  (today || dateType === null || currentDateValue !== '');
```

Três detalhes que não são cosméticos:

1. `todayError` reusa `validateFullDate`, que é o espelho local de `DateValidation`. Se o perfil tiver uma data de nascimento inconsistente (por exemplo posterior a hoje), a mensagem aparece **antes** de o usuário enviar, em vez de virar um 400.
2. A condição `(today || ...)` permite salvar sem radio selecionado — sem isso o botão fica desabilitado e o campo novo não funciona.
3. `hasDateError` permanece como está porque, com "Hoje" marcado, `dateType` é `null` e `getDateError` devolve `null`.

### 5.3 Payload — o braço novo vem primeiro

Em `handleSubmit`, **antes** do primeiro `if (!noDate && ...)`:

```ts
if (today) {
  payload.dateType = 'FullDate';
  payload.eventDate = todayApi;
  payload.eventYear = Number(todayApi.slice(0, 4));
} else if (!noDate && dateType === 'FullDate' && dateValues.FullDate) {
  // ... resto inalterado
```

A ordem importa: hoje `noDate` é testado por último (`if (!noDate && dateType === 'FullDate')`). Com `today` no topo, um estado inconsistente (`today` e `noDate` ambos verdadeiros) resolve para "Hoje" em vez de silenciosamente não enviar data nenhuma.

### 5.4 UI

Substituir o bloco atual:

```tsx
<div className="date-type-selector">
  <label className="date-type-checkbox">
    <input type="checkbox" checked={noDate} onChange={...} />
    <span>Sem data</span>
  </label>

  {!noDate && ( ...
```

por:

```tsx
<div className="date-type-selector">
  <div className="date-type-checks">
    <label className="date-type-checkbox" title="A memória fica sem nenhuma data">
      <input
        type="checkbox"
        checked={noDate}
        onChange={(e) => {
          const checked = e.target.checked;
          setNoDate(checked);
          if (checked) {
            setToday(false);
            setDateType(null);
            setDateValues(EMPTY_DATE_VALUES);
          }
        }}
      />
      <span>Sem data</span>
    </label>

    <label className="date-type-checkbox" title="Grava a data de hoje para este acontecimento">
      <input
        type="checkbox"
        checked={today}
        onChange={(e) => {
          const checked = e.target.checked;
          setToday(checked);
          if (checked) {
            setNoDate(false);
            setDateType(null);
            setDateValues(EMPTY_DATE_VALUES);
          }
        }}
      />
      <span>Hoje</span>
    </label>
  </div>

  {today && (
    <p className="date-type-hint">
      Será salvo: <strong>{todayDisplay}</strong>
    </p>
  )}
  {today && todayError ? <span className="date-value-error">{todayError}</span> : null}

  {!noDate && !today && ( ...
```

Pontos:

- **Mutuamente exclusivos.** Marcar um desmarca o outro e limpa os radios. Dois checkboxes marcados ao mesmo tempo não teriam significado.
- **Os radios somem quando "Hoje" está marcado**, exatamente como acontece com "Sem data". A data já está determinada; oferecer os três formatos seria convidar ao conflito.
- **`Será salvo: 20/11/2026`** é obrigatório, não enfeite. Um checkbox que grava um valor invisível é a diferença entre "o app decidiu por mim" e "eu vi o que seria gravado".
- O `title` do checkbox usa o texto pedido e explica a ação no hover.

### 5.5 Reset

O formulário é remontado por `key={formKey}` em `HomePage` após cada criação bem-sucedida, então `today` volta a `false` sem código adicional.
---

## 6. Mudança 3 — `EditMemoryModal.tsx`

Mesmo padrão, com duas diferenças deliberadas.

```ts
const [today, setToday] = useState(false);

useEffect(() => {
  if (memory) {
    setNoDate(!memory.dateType);
    setToday(false); // ver §6.1
  }
}, [memory]);
```

No `handleSave`, antes do braço de `FullDate`:

```ts
if (today) {
  payload.dateType = 'FullDate';
  payload.eventDate = getTodayApiDate();
  payload.eventYear = new Date().getFullYear();
} else if (noDate) {
  payload.clearDateInformation = true;
} else if (dateType === 'FullDate' && dateValues.FullDate) {
  // ... resto inalterado
```

E o checkbox, com o mesmo `onChange` do formulário de criação, e `{!noDate && !today && (...)}` envolvendo o grupo de radios.

### 6.1 Por que "Hoje" nunca vem pré-marcado ao abrir

Uma memória criada ontem com "Hoje" tem `dateType = "FullDate"` e `eventDate = 19/11/2026`. Ao abrir o modal, ela deve mostrar **Data completa / 19/11/2026** — não "Hoje" marcado, e não "Hoje" marcado gravando 20/11/2026 por baixo dos panos sem o usuário notar.

`setToday(false)` é a regra, sempre. "Hoje" é uma **ação do usuário sobre o formulário**, não um estado lido do registro. Se um dia alguém quiser o atalho pré-marcado, o critério teria de ser `memory.eventDate === getTodayApiDate()` — e mesmo assim seria enganoso, porque confundiria "foi gravado hoje" com "aconteceu hoje".

### 6.2 Um detalhe de `UpdateMemory` que a mudança usa a favor

`UpdateMemory.ExecuteAsync` já trata `targetDateType == DateValidation.FullDate` zerando `age` e preenchendo `eventYear` a partir do `eventDate` quando `request.EventYear` vem nulo. Enviar `dateType: "FullDate"` a partir de uma memória que era `Age` converte corretamente: `eventDate` passa a existir, `age` é descartado. Nenhum ajuste necessário no backend.

---

## 7. Mudança 4 — CSS

`src/style.css`, junto do bloco `.date-type-checkbox`:

```css
.date-type-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.date-type-hint {
  margin: 0;
  font-size: 0.85rem;
  color: #5d5247;
}
```

`.date-type-checks` precisa existir porque `.date-type-selector` é `display: grid` — dois `<label class="date-type-checkbox">` como filhos diretos ficariam empilhados em duas linhas. Com `flex` + `flex-wrap`, ficam lado a lado no desktop e quebram para duas linhas em telas estreitas, que é o comportamento desejado.

`.date-type-hint` reusa a paleta de `.date-type-selector__label` (`#5d5247`), sem negrito no texto corrido — o negrito fica só na data.

---

## 8. Fuso horário — o risco que precisa estar escrito

### 8.1 O lado do front

`getTodayApiDate` monta a data a partir de `getFullYear/getMonth/getDate`, que são **locais**. É o único jeito correto: `new Date().toISOString().slice(0, 10)` devolve a data em UTC e, para um usuário em São Paulo (UTC-3), a partir das 21:00 já devolve o dia seguinte. A memória seria gravada com a data de amanhã e rejeitada pelo backend com `"A data informada é futura."` — um bug que só aparece à noite, que é exatamente o tipo de bug que não volta do teste manual.

### 8.2 O lado do backend

`DateValidation.Today` é `DateOnly.FromDateTime(DateTime.UtcNow)`. Comparando com a data local do dispositivo:

| Fuso do usuário | Relação | Efeito |
|---|---|---|
| UTC-3 (Brasil) ou qualquer fuso negativo | data local ≤ data UTC | **seguro** — "hoje" local nunca é futuro para o backend |
| UTC ou negativo | igual | seguro |
| UTC+ (ex.: Auckland, UTC+13) | data local pode ser > data UTC | `"A data informada é futura."` entre a meia-noite local e a meia-noite UTC |

**O produto é pt-BR e o público está em UTC-3, então hoje o caso não ocorre.** Mas ele não é hipotético, e o campo "Hoje" o tornaria sistemático para qualquer usuário em fuso positivo — todo começo de dia, até o UTC alcançar.

Mitigação recomendada, **fora do escopo desta entrega**: trocar `DateTime.UtcNow` por um fuso de aplicação (`America/Sao_Paulo`) em `DateValidation`, o que exige uma opção de configuração e afeta também data completa e ano. Registro aqui para não virar surpresa: enquanto isso não for feito, o campo "Hoje" é seguro para o público atual e incorreto para fusos positivos.

---

## 9. Bug adjacente que a mudança torna visível

`HomePage.handleRetryMemory` reenvia a memória após erro de rede assim:

```ts
createMemoryMutation.mutate({
  userId,
  title: memory.title,
  content: memory.content,
  eventDate: memory.eventDate,
  eventYear: memory.eventYear,
  clientRequestId: memory.clientRequestId ?? crypto.randomUUID(),
});
```

`dateType`, `age` e `isImportant` **não são reenviados**. Consequências, todas anteriores a este plano:

- memória `Age` volta como `dateType = null` e perde a idade;
- memória `YearOnly` volta com `eventYear` preenchido mas sem `dateType`;
- como `formatDateTag` retorna `null` quando `!dateType`, o card perde a tag de data depois de um retry.

Com "Hoje" isso passa a atingir um fluxo comum: a memória é `FullDate`, o retry preserva `eventDate` mas grava `dateType = null` — a data continua aparecendo no prompt (`Quando aconteceu:` sai pelo `EventDate.HasValue`), mas **desaparece do card**.

Correção de uma linha, no mesmo commit:

```ts
  dateType: memory.dateType,
  age: memory.age,
  isImportant: memory.isImportant ?? false,
```

Não é escopo do campo "Hoje", mas entregar o campo sem isso significa que o primeiro usuário com rede instável vê a funcionalidade "perder" a data. Recomendo incluir.

---

## 10. Testes

### 10.1 Frontend — `tests/lib/memoryDate.test.ts`

Acrescentar (mesmo padrão `node:test` do arquivo):

```ts
import {
  getTodayApiDate,
  getTodayDisplayDate,
} from '../../src/lib/memoryDate/index.ts';

test('getTodayApiDate devolve aaaa-mm-dd no fuso local', () => {
  assert.equal(getTodayApiDate(new Date(2026, 10, 20)), '2026-11-20');
  assert.equal(getTodayApiDate(new Date(2026, 0, 5)), '2026-01-05');
});

test('getTodayApiDate não desloca o dia no fim da noite (UTC-3)', () => {
  // 20/11/2026 22:30 local = 21/11 01:30 UTC
  const lateNight = new Date(2026, 10, 20, 22, 30);
  assert.equal(getTodayApiDate(lateNight), '2026-11-20');
  assert.notEqual(lateNight.toISOString().slice(0, 10), '2026-11-20');
});

test('getTodayDisplayDate devolve dd/mm/aaaa', () => {
  assert.equal(getTodayDisplayDate(new Date(2026, 10, 20)), '20/11/2026');
});

test('a data de hoje passa na validação que o backend aplica', () => {
  assert.equal(validateFullDate(getTodayDisplayDate(), '1986-01-01'), null);
});
```

O segundo teste é o que prende o bug de UTC: ele falha se alguém trocar a implementação por `toISOString().slice(0, 10)`, e a asserção `notEqual` documenta por que a troca é errada em vez de apenas proibi-la.

### 10.2 Backend — `DateValidationTests.cs`

Verificação feita no arquivo: **não existe hoje nenhum teste que aceite explicitamente a data de hoje como `FullDate`.** O que existe é o inverso:

| Teste | O que cobre |
|---|---|
| `Validate_FullDate_WhenValid_ShouldReturnNull` | `2020-06-15` — passado, não a fronteira |
| `Validate_FullDate_WhenInTheFuture_ShouldReturnError` | `UtcNow + 1 dia` — o lado de lá da fronteira |
| `Validate_FullDate_WhenBeforeBirthDate_ShouldReturnError` | data anterior ao nascimento |

A fronteira `hoje` é exatamente o valor que o campo "Hoje" envia, e ela só é exercitada por omissão. Acrescentar o teste é barato e prende a regra:

```csharp
[Fact]
public void Validate_FullDate_WhenToday_ShouldReturnNull()
{
    var today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
    Assert.Null(DateValidation.Validate("FullDate", today, null, null));
}
```

Esse teste roda na data real, então não tem data fixa para envelhecer. Se ele falhar em produção, o campo "Hoje" está quebrado de ponta a ponta — é exatamente o sinal que interessa.

### 10.3 Verificação manual obrigatória antes do aceite

1. Marcar "Hoje" → aparece `Será salvo: <data de hoje>`; radios somem; botão habilita com conteúdo preenchido.
2. Salvar → card da timeline mostra `📅 dd/mm/aaaa` com a data de hoje.
3. Marcar "Hoje" e depois "Sem data" → "Hoje" desmarca; salvar grava sem data.
4. Abrir a memória criada → modal mostra **Data completa** com a data de hoje; "Hoje" **não** vem marcado.
5. No modal, marcar "Hoje" salvar → data reescrita para hoje e tag do card atualizada.
6. Recarregar a página → data persiste igual.
7. Relógio do sistema às 22:30 (ou simular no devtools com `Date` mockado) → `Será salvo` mostra o dia local, não o dia UTC.
8. Testar em largura de 360 px → os dois checkboxes quebram linha sem estourar o card.

---

## 11. Critérios de aceite

- `dateType: "FullDate"` + `eventDate` de hoje são exatamente o que o request contém — verificado na aba Network.
- Nenhum arquivo de `../MakeMyHistory.Service/src` ou `../MakeMyHistory.Service/tests` alterado.
- `npm run build` e `npm test` verdes em `MakeMyHistory.Web`.
- Nenhum texto estoura em nenhum container, em 360 px e em 1200 px.
- Os 4 estados antigos continuam funcionando (Sem data, Data completa, Apenas ano, Idade).

---

## 12. Riscos

| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Alguém usa `toISOString().slice(0,10)` e grava a data de amanhã à noite | Média | Alto | Teste §10.1 que falha nessa implementação + comentário na função |
| R2 | Usuário em fuso positivo recebe 400 "data futura" | Baixa (público atual) | Médio | Declarado em §8.2; correção é trocar o fuso de `DateValidation`, fora do escopo |
| R3 | "Hoje" persistido como modo e relido amanhã com outro significado | — | — | Evitado pela decisão §2: grava-se `FullDate` |
| R4 | Os dois checkboxes marcados ao mesmo tempo | Baixa | Baixo | `onChange` desmarca o outro; payload prioriza `today` (§5.3) |
| R5 | Usuário não entende o que foi gravado | Média | Médio | Linha fixa `Será salvo: dd/mm/aaaa` (§5.4) |
| R6 | Retry perde a tag de data | **Alta** | Médio | Correção de uma linha em `handleRetryMemory` (§9) |
| R7 | Memória de hoje entra na ordenação cronológica errada | Baixa | Baixo | `GetEventSortKey` ordena por `EventDate` — comportamento correto e inalterado |

---

## 13. Fora de escopo

- `DateType = "Today"` persistido (§2.1).
- Marcar visualmente no card que a memória foi "criada hoje".
- Trocar o fuso de `DateValidation` para `America/Sao_Paulo` (§8.2).
- Alterar `PromptBuilder` — a data já sai como `Quando aconteceu: dd/MM/yyyy`.
- Qualquer mudança no `NarrativeReflectionGuard`.

---

## 14. Ordem de execução

| # | Passo | Arquivo | Reversível |
|---|---|---|---|
| 1 | helpers `getTodayApiDate` / `getTodayDisplayDate` + testes | `src/lib/memoryDate/index.ts`, `tests/lib/memoryDate.test.ts` | sim |
| 2 | checkbox "Hoje" no formulário de criação | `CreateMemoryForm.tsx` | sim |
| 3 | CSS dos dois checkboxes | `src/style.css` | sim |
| 4 | checkbox "Hoje" na edição | `EditMemoryModal.tsx` | sim |
| 5 | correção do retry (§9) | `HomePage.tsx` | sim |
| 6 | `npm run build` + `npm test` + verificação manual §10.3 | — | — |

Passos 1–3 são um commit: entregam o campo funcionando na criação. Passos 4–5 são um segundo commit: consistência na edição e o retry.

Sugestão de mensagens:

1. `feat: adiciona a opcao "Hoje" no cadastro de memoria`
2. `feat: permite marcar "Hoje" na edicao e preserva a data no retry`
