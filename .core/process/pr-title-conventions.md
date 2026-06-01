# PR Title Conventions

> **Convenção operacional derivada da Spec 0023.** Não é decisão arquitetural — é hygiene visual sobre o lifecycle já cravado em ADR 0020 (governance precede execução) e ADR 0021 (enforcement estrutural em camadas). Sem enforcement automático nesta versão (convenção primeiro; CI valida depois se a prática justificar). Anti-patterns explicitamente rejeitados na seção final.
>
> **Refinada em 2026-05-20** em duas iterações: (i) primeira tentativa adicionou 🧭 como emoji de "transitional/pre-model" → ficou visualmente ambíguo (`[🧭🛠️➜]` aglutinava tipo + nuance num único bracket); (ii) refinamento final separa **tipo (emoji, conjunto fechado)** de **nuance (label textual, conjunto fechado)** — `[🛠️➜] [Bootstrap]` em vez de `[🧭🛠️➜]`. A Spec 0023 adicionou `🔗` + `[Integration]` como extensão deliberada para homologação/convergência final de stack.

## Por que existe

Olhar o título de um PR em uma lista do GitHub deve responder três perguntas sem clicar:

1. **Que tipo de PR é este?** Governance/thinking (contrato), execution (implementação) ou fast-track? Há alguma nuance excepcional (`[Bootstrap]`, `[Pre-model]`, `[Hotfix]`)?
2. **Esse PR pode ser mergeado isoladamente, ou é parte de uma stack pareada/sequenciada?**
3. **Se faz parte de stack, qual posição ocupa e há PRs downstream aguardando?**

O enforcement disso agora é feito em L4 pelo `governance-pr-check`, que usa a topologia declarada no `state.yml` (SSOT) para validar se o título projetado está correto.

## Padrão de título

```
[<emojis>] [<label-opcional>] [<identificador>] <título curto>
```

Brackets explícitos delimitam **dimensões semânticas independentes**: grupo de emojis (tipo + condicionais), label textual opcional para nuance excepcional, identificador, título. Cada bracket carrega uma dimensão — **não aglutinar tipo com nuance num único bracket**. Título curto, sem prefixo redundante.

**Identificador** aceita dois formatos:

- `[Spec NNNN]` — para PRs vinculados a uma spec (caso mais comum no projeto).
- `[<pillar>]` — para PRs vinculados a um pilar MECE não-spec (taxonomia da Spec 0021 / `WorkItem.kind`). Pilares aceitos: `fix`, `patch`, `incident`, `spike`, `experiment`, `proposal`.

A distinção visual entre os dois:

- `Spec` é capitalizado (substantivo próprio + número).
- Pilares são lowercase (alinhados com `WorkItem.kind` no `registry.yml`).

## Emojis canônicos

| Emoji    | Significado                                    | Uso                                                                                                                              |
| :------- | :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| 🧾       | Governance / planning / contrato               | PR contém spec/decision-brief/plan/tasks/research/ADR; nada de código de produto.                                                |
| 🛠️       | Execution / implementação                      | PR contém código + docs derivados; tipicamente depende de governance PR.                                                         |
| 🔗       | Integration / homologação de stack             | PR terminal de homologação/convergência; agrega evidência ponta-a-ponta sem comportamento novo.                                  |
| 🔒       | Governance contract não-mergeable isoladamente | **SÓ governance** (🧾🔒). Aguarda execution PR(s) pareada. Não usar com 🛠️.                                                      |
| 1️⃣ 2️⃣ 3️⃣ | Rollout order em execution stack               | **SÓ execution**. Posição sequencial. Governance NÃO usa número (é fundação, não posição).                                       |
| ➜        | Rollout continua downstream                    | Sufixo em execution PRs **não-terminais**. Ausência de ➜ em execution = terminal (sem PR downstream aguardando).                 |
| 🚑       | Fast-track                                     | Patch/fix/incident pequeno com accountability transferida ao reviewer humano (cf. ADR 0021 + DEC-0023-E05). Exclusivo (sozinho). |

**Convenção fechada.** Nenhum emoji adicional será introduzido para cobrir nuances (transitional, pre-model, experimental, beta, etc.). `🔗` foi adicionado pela Spec 0023 para distinguir Integration de execution comum; novas nuances continuam indo para **labels textuais** (próxima seção).

## Labels textuais para nuances excepcionais

Nuances que não cabem nos 4 tipos fixos viram **bracket textual separado** entre o tipo e o identificador da spec. Isso preserva clareza visual (cada bracket carrega uma coisa) e impede emoji creep.

| Label           | Quando usar                                                                                                                     | Frequência esperada              |
| :-------------- | :------------------------------------------------------------------------------------------------------------------------------ | :------------------------------- |
| `[Bootstrap]`   | PR que colapsa governance + execution intencionalmente antes da estabilização metodológica da spec.                             | ≤ 1 por spec (primeira iteração) |
| `[Pre-model]`   | PR criado antes do lifecycle/enforcement da spec estar cravado. Sinônimo operacional de `[Bootstrap]`.                          | ≤ 1 por spec                     |
| `[Hotfix]`      | PR de fix urgente que precisa indicação visível mas **não** se qualifica como `🚑 fast-track` formal.                           | Raro                             |
| `[Integration]` | PR de homologação/convergência final de stack governance-first; agrega evidência e valida ponta-a-ponta sem comportamento novo. | Raro; tipicamente terminal       |

**Lista é fechada.** Nova label exige decisão registrada (≥ 2 casos justificando + cross-ref em NEXT/ADR). `[Integration]` foi adicionada pela Spec 0023 para dogfooding do fechamento/homologação final via ADR 0024. Se aparecer necessidade de `[Experimental]` ou `[Beta]`, isso indica que a categoria não é "PR title hygiene" — provavelmente é decisão de release/spec própria.

## Combinações canônicas + exemplos

| Padrão               | Semântica                                                                        | Exemplo                                                     |
| :------------------- | :------------------------------------------------------------------------------- | :---------------------------------------------------------- |
| `[🧾🔒]`             | Governance pareada com execution(s); merge semanticamente inseguro isoladamente. | `[🧾🔒] [Spec 0023] Lifecycle bootstrap`                    |
| `[🛠️1️⃣➜]`            | Execution intermediária — primeira da stack, com PRs downstream.                 | `[🛠️1️⃣➜] [Spec 0023] Enforcement runtime`                   |
| `[🛠️2️⃣]`             | Execution terminal — última da stack.                                            | `[🛠️2️⃣] [Spec 0023] DX execution`                           |
| `[🛠️]`               | Execution isolada — sem stack, sem dependência.                                  | `[🛠️] [Spec 0041] Clipboard hotfix`                         |
| `[🔗] [Integration]` | Homologação/convergência final de stack; sem comportamento novo.                 | `[🔗] [Integration] [Spec 0023] Homologação final da stack` |
| `[🛠️] [<pillar>]`    | Execution isolada vinculada a pilar MECE não-spec (fix/patch/spike/etc.).        | `[🛠️] [fix] Reorganize package.json scripts`                |
| `[🛠️➜] [Bootstrap]`  | Execution transitional/pre-model + label textual de nuance.                      | `[🛠️➜] [Bootstrap] [Spec 0023] Workflow runtime`            |
| `[🚑]`               | Fast-track excepcional.                                                          | `[🚑] [Incident 0007] Emergency rollback`                   |

**Stacks longas (> 4 PRs)** sinalizam scope creep — considerar splitar em specs antes de chegar lá. A convenção não impede mas também não incentiva.

## Regras explícitas

- **Governance NÃO usa número.** 🧾 é boundary/fundação, não "posição 1 da execução". Números são reservados a execution PRs.
- **Ausência de ➜ em execution = terminal.** Comunica ao reviewer que este PR pode ser o último mergeado da stack — não há rollout downstream aguardando.
- **Ausência de número em execution = PR isolado** (sem stack).
- **Labels textuais separadas dos emojis.** `[🛠️➜] [Bootstrap] [Spec 0023]` é correto; `[🛠️➜Bootstrap]` ou `[🧭🛠️➜]` (emoji para nuance) não. Cada bracket carrega uma dimensão semântica.
- **🚑 é exclusivo:** não combina com 🧾/🛠️/🔒/números/➜. Fast-track tem accountability transferida e contorna todos os marcadores estruturais.
- **Identificador é exclusivo:** um PR é vinculado a `[Spec NNNN]` **ou** a `[<pillar>]`, nunca aos dois. Se um fix surge a partir de uma spec ativa, geralmente ele entra como execution PR da própria spec (`[Spec NNNN]`) e não precisa de pillar marker separado.
- **Pillars lowercase** (`fix`, `patch`, etc.) — alinhados com `WorkItem.kind` no `registry.yml`. Não capitalizar (`[Fix]`) — quebra alinhamento com a taxonomia MECE da Spec 0021.

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

### Integration (`[🔗] [Integration]`)

```md
Integration PR — homologação/convergência final da stack. Não cria comportamento novo.

Stack validada:

- #<N> → #<M> → #<K>

Merge authorization: pendente até owner autorizar merge atômico ponta-a-ponta.
```

### Transitional / pre-model (`[🛠️➜] [Bootstrap]` ou `[🛠️➜] [Pre-model]`)

```md
Bootstrap PR — colapsa governance + execution intencionalmente antes da estabilização metodológica da spec.

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
- **Labels textuais (`[Bootstrap]`, `[Pre-model]`, `[Hotfix]`, `[Integration]`)** — não são removidas. Registro histórico permanente do PR.
- **🚑** — não é removido. Fast-track é registro permanente.

## Anti-patterns explícitos

- **Não combinar emoji de tipo com emoji de estado.** GitHub já tem Draft/Ready/Merged/Closed. Duplicar via emoji invariavelmente gera drift manual.
- **Não inventar emojis adicionais.** Conjunto de emojis é fechado: 🧾, 🛠️, 🔗, 🔒, 1️⃣2️⃣3️⃣, ➜, 🚑. Nuances vão para **labels textuais** (`[Bootstrap]`, `[Pre-model]`, `[Hotfix]`, `[Integration]`); lista de labels também fechada. Se um PR não couber em nenhuma combinação, registrar em comentário do PR — não cunhar emoji ou label novos.
- **Não emoji-pack para nuances.** `[🛠️➜] [Bootstrap]` é a forma correta; `[🛠️➜Bootstrap]` ou `[🧭🛠️➜]` (emoji-pack representando nuance) destroem a clareza visual e geram ambiguidade categórica.
- **Não usar 🔒 em execution PRs.** 🔒 é exclusivo de governance. Execution dependente usa 1️⃣N➜ + body opening listando upstream.
- **Não usar números em governance.** 🧾 é fundação, não posição. Tentar `[🧾1️⃣]` é categoria-erro.
- **Não duplicar no body o que já está no título.** O título carrega tipo + lock/posição/downstream + label de nuance; o body opening apenas explicita a stack ou o contrato pareado.
- **Não usar `[Bootstrap]` ou `[Pre-model]` como rota de escape.** Se em dúvida entre execução normal e bootstrap, default para `[🛠️]` + nota explicativa. Bootstrap/Pre-model são reservados a PRs genuinamente transitional.
- **Não usar stacks > 4 PRs sem revisão de escopo.** Sinal de scope creep — considerar splitar em specs.

## Anti-DAG guardrail

🔒, ➜, números (1️⃣2️⃣3️⃣), e labels textuais são **sinalização humana L1** — leitura por olhos humanos em uma lista de PRs. **Eles SÃO projeções validadas pelo CI, mas NUNCA a fonte de verdade**.

Se você está pensando em alguma destas opções, **pare e abra DEC**:

- parser automático que lê emojis/números para ordering ou inferir topologia;
- DAG tooling que monta grafo de dependências a partir dos títulos;
- merge orchestration baseada em emojis ou labels.

A topologia vive em `state.yml`. O CI lê a topologia e valida se o título é uma projeção fiel dela. Nunca o inverso. O título não comanda o CI; a topologia comanda o CI e o título.

## Enforcement

Esta convenção é **enforced** pelo `governance-pr-check` (L4 CI). O CI carrega a topologia do `state.yml` associado à spec ativa e verifica se:

1. O título do PR começa com os emojis corretos (tipo, sequence, terminality) e o identificador correto (`[Spec NNNN]`).
2. O template de body utilizado é o adequado e preenchido corretamente de acordo com a posição da stack.

## Cross-refs

- ADR 0020 — Governance precede e protege execução.
- ADR 0021 — Enforcement estrutural precede consciência comportamental.
- DEC-0023-D04 — PR pre-model declarado (precedente para uso de 🧭).
- DEC-0023-E05 — Fast-track strictness.
- `.github/pull_request_template.md` — checkboxes operacionais que materializam a convenção no fluxo de criação de PR.
- `.governance/specs/0023-workflow-runtime/NEXT.md` insight 8 — registro de convenção como derivada (operational hygiene, não decisão estrutural).
