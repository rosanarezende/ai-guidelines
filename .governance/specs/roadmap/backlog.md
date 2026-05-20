# Backlog — `.governance/specs/` (canônico)

> **Localização canônica em diante.** Conforme [ADR 0019](../../../adrs/0019-governance-specs-root.md), novas specs e novas entradas de backlog entram aqui. O backlog legado em [`.specify/specs/roadmap/backlog.md`](../../../.specify/specs/roadmap/backlog.md) permanece como referência histórica até cutover caso-a-caso.

> **Regra de ouro.** Nada aqui entra em execução sem nova spec (`.governance/specs/<NNNN>-<slug>/`). Este arquivo é leitura obrigatória antes de abrir spec nova ou fechar uma spec existente.

> **Política repo-first, integração-friendly.** O repositório é a memória canônica. Ferramentas externas (GitHub Projects, Issues, Linear, etc.) podem ser camada colaborativa via campo opcional `tracker` nas entradas; o resumo mínimo aqui é mandatório.

Detalhes de lifecycle em [`.core/process/governance-foundation.md`](../../../.core/process/governance-foundation.md).

---

## Em execução

- **spec 0023** — `workflow-runtime` (`.governance/specs/0023-workflow-runtime/`) — **In Progress (Stage B+)** _(branch `feat/spec-0023-governance-workflow-discovery-model`)._
  - Pivotada de "discovery model" para "operational runtime". Lifecycle metodológico (ADR 0020) + enforcement estrutural (ADR 0021) cravados.

---

## Candidatas

### Refatorar boilerplates SDD para serem stack-agnostic

- **Fonte do insight:** auditoria durante reorganização de scripts (PR `fix/package-scripts-reorganization`, 2026-05-20) — minha tentativa de propagar a convenção `yarn validate` para os boilerplates `.specify/templates/*` e `.ai-guidelines/templates/*` (e os partials em `.core/governance/templates/partials/tasks-evidence-driven/`) **piorou** o problema existente.
- **Diagnóstico:** os boilerplates SDD são distribuídos para repositórios consumidores de **qualquer stack** (Python, Go, Rust, JS/TS, etc.), mas hoje carregam exemplos hard-coded com `yarn` como referência dominante (`yarn check && yarn test` no `ai-guidelines`, com `npm test`, `pnpm verify`, `cargo test`, `pytest` apenas como sufixo "substitua pelo equivalente"). Para um agente IA trabalhando em repo não-JS, a primeira leitura confunde — empurra para configurar yarn.
- **Sintoma específico identificado:**
  - Linhas `**1.A.N** Pipeline de check + test verde após o sub-bloco A` (e equivalentes) nos boilerplates `tasks-*-boilerplate.md`.
  - Linhas `**3.2** Pipeline canônico verde: ... ex. no ai-guidelines: yarn check:repo`.
  - Linhas em `plan-boilerplate.md` e `spec-boilerplate.md` com o mesmo padrão.
- **Princípio a aplicar:** boilerplates distribuídos devem referir-se a **conceitos** (pre-commit hook + pre-push hook, format-on-save, drift guard), não a **comandos concretos de um stack**. Concretizar com ferramenta análoga ao stack do consumidor é responsabilidade do agente que instancia a spec, não do template.
- **Pré-requisitos / cross-ref:** A própria Spec 0023 (`workflow-runtime`) está reformulando o lifecycle metodológico — boilerplate refactor pode ser absorvido como sub-bloco dela, ou tratado como spec própria após 0023 mergear. Decidir caso-a-caso.
- **Sinal de "está na hora":** Spec 0023 atingir estado estável; OU primeiro consumidor não-JS reportar fricção concreta com os boilerplates.
- **Riscos antecipados:** abstrair demais perde a clareza de "como na prática se faz isso?". Mitigar com: 1 frase conceitual + 1 ou 2 exemplos concretos em stacks diferentes (não dominados por JS).
- **Não-objetivo:** não criar template para cada stack — manter um boilerplate por tipo de spec, com exemplos balanceados.
- **Material reusável:** as edições aplicadas e revertidas estão na branch `fix/package-scripts-reorganization` (revertidas antes do merge); diff de referência via `git log -p`.

---

## Now (próxima fila, ordem importa)

_(populado conforme novas candidatas amadurecem)_

---

## Bloqueadores cross-spec

_(populado conforme blocos cruzam fronteiras de spec)_
