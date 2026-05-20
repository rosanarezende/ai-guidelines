# PR Title Conventions

> **Convenção operacional derivada da Spec 0023.** Não é decisão arquitetural — é hygiene visual sobre o lifecycle já cravado em ADR 0020 (governance precede execução) e ADR 0021 (enforcement estrutural em camadas). Sem enforcement automático nesta versão (convenção primeiro; CI valida depois se a prática justificar). Anti-patterns explicitamente rejeitados na seção final.
>
> **Refinada em 2026-05-20** após observação empírica de que o PR #18 não encaixava honestamente nem como governance nem como execution; surgiu necessidade de marcadores específicos para (a) ordering de execution stacks, (b) downstream dependencies, e (c) PRs transitional/pre-model.

## Por que existe

Olhar o título de um PR em uma lista do GitHub deve responder três perguntas sem clicar:

1. **Que tipo de PR é este?** Governance/thinking (contrato), execution (implementação), fast-track ou transitional?
2. **Esse PR pode ser mergeado isoladamente, ou é parte de uma stack pareada/sequenciada?**
3. **Se faz parte de stack, qual posição ocupa e há PRs downstream aguardando?**

GitHub native states (Draft / Ready / Merged / Closed) cobrem **lifecycle operacional** mas não cobrem **contrato arquitetural** — especificamente, não distinguem governance contract pendente, posição em rollout sequencial, ou execution dependente. É essa lacuna que esta convenção fecha.

## Padrão de título

```
[<emojis>] [Spec <NNNN>] <título curto>
```

Brackets explícitos delimitam grupo de emojis e identificador de spec. Título curto, sem prefixo tipo/escopo redundante (já capturado pelos emojis).

## Emojis canônicos

| Emoji    | Significado                                    | Uso                                                                                                                              |
| :------- | :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| 🧾       | Governance / planning / contrato               | PR contém spec/decision-brief/plan/tasks/research/ADR; nada de código de produto.                                                |
| 🛠️       | Execution / implementação                      | PR contém código + docs derivados; tipicamente depende de governance PR.                                                         |
| 🔒       | Governance contract não-mergeable isoladamente | **SÓ governance** (🧾🔒). Aguarda execution PR(s) pareada. Não usar com 🛠️.                                                      |
| 1️⃣ 2️⃣ 3️⃣ | Rollout order em execution stack               | **SÓ execution**. Posição sequencial. Governance NÃO usa número (é fundação, não posição).                                       |
| ➜        | Rollout continua downstream                    | Sufixo em execution PRs **não-terminais**. Ausência de ➜ em execution = terminal (sem PR downstream aguardando).                 |
| 🧭       | Transitional / pre-model / bridge histórica    | **Uso EXCEPCIONAL**. Reservado a PRs que precedem a estabilização metodológica de uma spec. ≤ 1 por spec, idealmente.            |
| 🚑       | Fast-track                                     | Patch/fix/incident pequeno com accountability transferida ao reviewer humano (cf. ADR 0021 + DEC-0023-E05). Exclusivo (sozinho). |

## Combinações canônicas + exemplos

| Padrão    | Semântica                                                                             | Exemplo                                   |
| :-------- | :------------------------------------------------------------------------------------ | :---------------------------------------- |
| `[🧾🔒]`  | Governance pareada com execution(s); merge semanticamente inseguro isoladamente.      | `[🧾🔒] [Spec 0023] Lifecycle bootstrap`  |
| `[🛠️1️⃣➜]` | Execution intermediária — primeira da stack, com PRs downstream.                      | `[🛠️1️⃣➜] [Spec 0023] Enforcement runtime` |
| `[🛠️2️⃣]`  | Execution terminal — última (ou única depois das anteriores) da stack.                | `[🛠️2️⃣] [Spec 0023] DX execution`         |
| `[🛠️]`    | Execution isolada — sem stack, sem dependência.                                       | `[🛠️] [Spec 0041] Clipboard hotfix`       |
| `[🧭🛠️➜]` | Transitional/pre-model — colapsa governance+execution antes da estabilização da spec. | `[🧭🛠️➜] [Spec 0023] Workflow runtime`    |
| `[🚑]`    | Fast-track excepcional.                                                               | `[🚑] [Incident 0007] Emergency rollback` |

## Regras explícitas

- **Governance NÃO usa número.** 🧾 é boundary/fundação, não "posição 1 da execução". Números são reservados a execution PRs.
- **Ausência de ➜ em execution = terminal.** Comunica ao reviewer que este PR pode ser o último mergeado da stack — não há rollout downstream aguardando.
- **Ausência de número em execution = PR isolado** (sem stack).
- **🧭 é uso EXCEPCIONAL.** Default: NÃO usar. Se em dúvida, use 🛠️ + nota no body opening explicando excepcionalidade. Idealmente ≤ 1 PR com 🧭 por spec.
- **🚑 é exclusivo:** não combina com 🧾/🛠️/🔒/números/➜/🧭. Fast-track tem accountability transferida e contorna todos os marcadores estruturais.

## Padrão de opening line do body

Primeira linha (ou bloco) do body do PR, antes de `## Resumo`. Curta. Sem repetir o que o título já carrega.

### Governance pareada (`[🧾🔒]`)

```md
🔒 Merge bloqueado: este PR só pode ser mergeado junto/após PR(s) de execução relacionados.

Execution PR(s):

- PR<N>-<slug> (planned / open / merged)
```

### Execution intermediária (`[🛠️N➜]`)

```md
➜ Position N na stack do rollout. Há PR(s) downstream que dependem desta.

Upstream (Merged antes deste):

- #<N> (<tipo>) — Merged ✓ / Open

Downstream (depende deste para começar):

- PR<M>-<slug> (planned / open)
```

### Execution terminal (`[🛠️N]`)

```md
Position N (terminal) na stack do rollout. Sem PRs downstream.

Upstream (Merged antes deste):

- #<N> (<tipo>) — Merged ✓ / Open
```

### Execution isolada (`[🛠️]`)

```md
Implements governance contract defined in #<N>.
```

ou (raro, sem governance pareada):

```md
Standalone execution — sem governance pareada. Justificativa: <motivo>.
```

### Transitional (`[🧭🛠️➜]`)

```md
🧭 Transitional / pre-model PR — colapsa governance + execution intencionalmente antes da estabilização metodológica da spec.

Substituído operacionalmente por: PR<M>-<slug> (governance) + stack execution downstream.
Trilha histórica preservada (sem git surgery retroativa — cf. DEC-0023-D04 análogo).
```

### Fast-track (`[🚑]`)

```md
🚑 Fast-track: accountability explicitamente transferida ao reviewer humano.
[fast-track: <razão curta>]
```

## Protocolo de remoção de marcadores condicionais

Quando um marcador deixa de fazer sentido, **o autor do PR remove via `gh pr edit`** como **último ato pre-merge train** (responsabilidade do autor, não do reviewer).

- **🔒** (governance contract pendente) — removido quando todos os execution PRs pareados estão Ready ou Merged.
- **➜** (downstream pending) — removido quando todos os PRs listados como "Downstream" no body foram Merged. Sinaliza que este PR virou terminal.
- **Números (1️⃣2️⃣3️⃣)** — manutenção:
  - Se PR mid-stack é cancelado, renumerar PRs subsequentes para manter sequência contígua.
  - Se novo PR entra mid-stack, renumerar — drift garantido aqui é o **trade-off aceito conscientemente** em troca de scan visual mais rico.
  - **Critério de stop:** se renumerar > 2 vezes na mesma spec, stack é instável — reabrir DEC própria sobre forma de rollout antes de continuar.
- **🧭** — não é removido. PRs transitional permanecem registrados como tal historicamente (parte da trilha de aprendizado da spec).
- **🚑** — não é removido. Fast-track é registro permanente.

## Anti-patterns explícitos

- **Não combinar emoji de tipo com emoji de estado.** GitHub já tem Draft/Ready/Merged/Closed. Duplicar via emoji invariavelmente gera drift manual.
- **Não inventar emojis adicionais.** Convenção atual já cobre os 6 padrões previstos (🧾, 🛠️, 🔒, 1️⃣2️⃣3️⃣, ➜, 🧭, 🚑). Se um PR não couber em nenhum, registrar em comentário do PR — não cunhar emoji novo. Reabrir esta convenção se ≥ 3 casos especiais aparecerem.
- **Não usar 🔒 em execution PRs.** 🔒 é exclusivo de governance. Execution dependente usa 1️⃣N➜ + body opening listando upstream.
- **Não usar números em governance.** 🧾 é fundação, não posição. Tentar `[🧾1️⃣]` é categoria-erro.
- **Não duplicar no body o que já está no título.** O título carrega tipo + lock/posição/downstream; o body opening apenas explicita a stack ou o contrato pareado.
- **Não usar 🧭 como rota de escape.** Se em dúvida entre 🛠️ e 🧭, default para 🛠️ + nota explicativa. 🧭 é reservado a PRs genuinamente transitional/pre-model.

## Anti-DAG guardrail

🔒, ➜, números (1️⃣2️⃣3️⃣), e 🧭 são **sinalização humana L1** — não input para automação. Se surgir necessidade de:

- parser automático de números para ordering;
- DAG tooling para grafo de dependências;
- merge orchestration baseada em emojis;
- CI que valida ordem ou completude da stack;

isso deve **reabrir DEC própria** (cf. research §8 anti-recursão guards). Convenção é convenção textual humana, não infraestrutura.

## Enforcement

Esta convenção é **L1 (convenção textual)** apenas. `governance-pr-check` (L4 CI) **não** valida prefixos de título nesta versão. Reabrir como decisão própria em DEC futura se ≥ 2 casos de drift aparecerem na prática (PRs nascendo sem prefixo ou com prefixo errado).

## Cross-refs

- ADR 0020 — Governance precede e protege execução.
- ADR 0021 — Enforcement estrutural precede consciência comportamental.
- DEC-0023-D04 — PR pre-model declarado (precedente para uso de 🧭).
- DEC-0023-E05 — Fast-track strictness.
- `.github/pull_request_template.md` — checkboxes operacionais que materializam a convenção no fluxo de criação de PR.
- `.governance/specs/0023-workflow-runtime/NEXT.md` insight 8 — registro de convenção como derivada (operational hygiene, não decisão estrutural).
