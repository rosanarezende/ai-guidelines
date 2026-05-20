# PR Title Conventions

> **Convenção operacional derivada da Spec 0023.** Não é decisão arquitetural — é hygiene visual sobre o lifecycle já cravado em ADR 0020 (governance precede execução) e ADR 0021 (enforcement estrutural em camadas). Sem enforcement automático nesta versão (convenção primeiro; CI valida depois se a prática justificar). Anti-patterns explicitamente rejeitados na seção final.

## Por que existe

Olhar o título de um PR em uma lista do GitHub deve responder duas perguntas sem clicar:

1. **Que tipo de PR é este?** Governance/thinking (contrato) ou execution (implementação)?
2. **Esse PR pode ser mergeado isoladamente, ou é parte de uma stack pareada?**

GitHub native states (Draft / Ready / Merged / Closed) cobrem **lifecycle operacional** mas não cobrem **contrato arquitetural** — especificamente, não distinguem um governance PR Ready que está aguardando execution PR pareada. É essa lacuna que esta convenção fecha.

## Emojis canônicos

| Emoji | Significado                                        | Aplicação                                                                                                                                                                              |
| :---- | :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🧾    | Governance / thinking / contrato                   | PR contém spec/decision-brief/plan/tasks/research/ADR; nada de código de produto.                                                                                                      |
| 🛠️    | Execution / implementação                          | PR contém código + docs derivados; tipicamente depende de governance PR.                                                                                                               |
| 🔒    | Contrato arquitetural — não-mergeable isoladamente | **Não é estado**; é declaração de que o PR sozinho **não entrega integridade operacional ponta-a-ponta**. Usado em governance PRs que dependem de execution PR pareada para ter valor. |
| 🚑    | Fast-track                                         | Patch/fix/incident pequeno com accountability explicitamente transferida ao reviewer humano (cf. ADR 0021 + DEC-0023-E05).                                                             |

**Combinações comuns:**

- `🧾🔒 ...` — governance PR stacked sobre execution pareada (caso mais frequente em specs com lifecycle completo).
- `🧾 ...` — governance PR mergeable sozinho (caso raro; ex.: spec puramente documental sem execução).
- `🛠️ ...` — execution PR (não usa 🔒 porque um execution PR mergeable sozinho não faz sentido sem o governance PR pareado já mergeado).
- `🚑 ...` — fast-track (exclusivo; não combina com 🧾/🛠️).

## Padrão de título

```
<emoji(s)> Spec <NNNN> — <título curto>
```

Exemplos reais (deste repo):

- `🛠️ Spec 0023 — Workflow runtime (pre-model bootstrap)` — execution PR; pre-model declarado.
- `🧾🔒 Spec 0023 — Lifecycle bootstrap` — governance PR não-mergeable sozinho.
- `🛠️ Spec 0023 — Enforcement runtime` — execution PR pareado com a governance acima.
- `🚑 fix: hotfix em <componente>` — fast-track.

## Padrão de opening section (body)

Primeira linha do body do PR, antes de `## Resumo`. Curta. Sem repetir o que o título já carrega.

**Governance PR com 🔒:**

```md
🔒 Merge bloqueado: este PR só pode ser mergeado junto/após PR(s) de execução relacionados.

Execution PR(s):

- PR<N>-<slug> (open / planned / merged)
```

**Execution PR:**

```md
Implements governance contract defined in #<N>.
```

**Fast-track:**

```md
🚑 Fast-track: accountability explicitamente transferida ao reviewer humano.
[fast-track: <razão curta>]
```

## Anti-patterns explícitos

- **Não combinar emoji de tipo com emoji de estado.** GitHub já tem Draft/Ready/Merged/Closed. Duplicar via emoji invariavelmente gera drift manual.
- **Não inventar emojis adicionais.** Se um PR não couber em 🧾/🛠️/🚑, é caso especial — registrar em comentário no PR, não cunhar emoji novo. Reabrir esta convenção se ≥ 3 casos especiais aparecerem.
- **Não usar 🔒 em execution PRs.** Execution PR sem governance PR pareado é o próprio anti-pattern que ADR 0020 evita; declarar `🔒` em execution PR não faz sentido (o lock implícito é "este PR depende de #N", já capturado por `Depends on`).
- **Não duplicar no body o que já está no título.** O título carrega tipo + lock; o body opening apenas explicita a stack ou o contrato pareado.

## Enforcement

Esta convenção é **L1 (convenção textual)** apenas. `governance-pr-check` (L4 CI) **não** valida prefixos de título nesta versão. Reabrir como decisão própria em DEC futura se ≥ 2 casos de drift aparecerem na prática.

## Cross-refs

- ADR 0020 — Governance precede e protege execução.
- ADR 0021 — Enforcement estrutural precede consciência comportamental.
- DEC-0023-E05 — Fast-track strictness.
- `.github/pull_request_template.md` — checkboxes operacionais que materializam a convenção no fluxo de criação de PR.
