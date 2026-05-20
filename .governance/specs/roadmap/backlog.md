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

### Arquitetura de regras portáveis vs. contexto framework-interno — "como ai-guidelines não vira nova fonte de repetição"

- **Fonte do insight:** sessão de trabalho em 2026-05-20 (PR `fix/package-scripts-reorganization`). Owner observou que, ao longo da conversa, eu (IA) salvei vários _memory feedbacks_ em `~/.claude/projects/.../memory/` — utilizáveis apenas no Claude Code local desta máquina. Para Codex, Gemini, Cursor (ou Claude Code em outra máquina), esse contexto desaparece.
- **Diagnóstico — o gap dogfooding:** o `ai-guidelines` nasceu para **eliminar a necessidade de repetir instruções para IA**. Mas hoje, contexto que deveria ser "lido por qualquer agente, em qualquer provider, em qualquer máquina" se acumula em três camadas mal definidas:
  1. **`<AI_GUIDELINES>` em AGENTS.md** — bloco compilado, conteúdo portável e versionado. Funciona para regras universais distribuídas para consumidores. **Não suporta** contexto repo-interno do próprio `ai-guidelines`.
  2. **Fora do bloco `<AI_GUIDELINES>` em AGENTS.md** — "Contexto Local", "Quickstart Local", notas avulsas. Cresce ad-hoc, sem taxonomia, sprawla. Sintoma observado pelo owner: "tenho inserido informações em AGENTS.md, fora das tags `<AI_GUIDELINES>`, mas isso não é escalável nem me parece a melhor opção".
  3. **Memória de provider (Claude memory, Codex context, Cursor rules, etc.)** — não-portável, não-versionada, invisível para outros agentes. Sintoma observado: feedbacks que salvei nesta sessão não estarão disponíveis quando owner abrir Codex amanhã.
- **Princípio violado:** ADR 0018 declara `AGENTS.md` como **output runtime** AI-agnóstico, não como SSOT sprawling. Hoje a SSOT do contexto repo-interno é o próprio AGENTS.md fora do bloco — exatamente o oposto da intenção arquitetural.
- **Direções a explorar (não decidir agora):**
  - **(a) Novo bloco compilado em AGENTS.md** (ex.: `<REPO_INTERNAL>`) preenchido por uma SSOT versionada (ex.: `.governance/repo-internal.md`). Mantém AGENTS.md como output mas separa escopos.
  - **(b) Arquivo paralelo canônico** (ex.: `.governance/agent-context.md`), lido por qualquer agente que entre no repo, equivalente a `<AI_GUIDELINES>` mas para contexto repo-específico (não-distribuído).
  - **(c) Tag de escopo nas regras existentes**: além de `universal`/`adapter`/`opt-in`, adicionar `repo-internal`. O bloco compilado teria subseção dedicada.
  - **(d) Convenção para memory feedbacks:** toda memory salva localmente deve ter espelho num artifact versionado do projeto, OU declarar explicitamente "este é local-only por razão X".
- **Pré-requisitos / cross-ref:**
  - Spec 0023 (`workflow-runtime`) atingir estado estável (lifecycle + enforcement cravados).
  - Spec 0021 (governance information architecture) PR1 mergeada — fornece o lar canônico para artifacts não-spec.
  - ADR 0018 (AGENTS.md como output AI-agnóstico) — premissa a respeitar.
  - ADR 0019 (`.governance/specs/` como root) — premissa a respeitar.
- **Sinal de "está na hora":**
  - Owner observar 2º+ caso de "contexto que eu repeti em outra ferramenta porque não está em lugar canônico".
  - Primeiro consumidor real ≠ `ai-guidelines` perguntar "onde coloco contexto repo-específico que não cabe no AGENTS.md distribuído?".
  - Sessão de trabalho com agente em provider ≠ Claude Code expor o gap de forma concreta.
- **Riscos antecipados:**
  - Criar uma 4ª camada sem retirar a 2ª (fora do bloco em AGENTS.md) só piora o sprawl.
  - Excesso de prescrição pode prejudicar a flexibilidade de cada provider (Claude memory, Cursor rules, Codex AGENTS.md têm semantics próprias).
  - Tornar contexto repo-interno "obrigatório" para qualquer agente lê-lo (ao invés de opt-in) pode vazar ruído para consumidores.
- **Não-objetivos:**
  - Reinventar memory engine. A solução é estrutural (onde mora o texto), não computacional.
  - Forçar todos providers a comportamento uniforme. Cada provider pode ler/honrar a SSOT à sua maneira; o que ai-guidelines garante é a existência da SSOT no repo.
- **Por que isto importa agora:** sem isso, o próprio `ai-guidelines` falha no seu objetivo fundador — owner segue repetindo contexto entre sessões/providers, e cada nova máquina/agente reinicia o ciclo. Adiar é aceitar que o framework não cumpre sua promessa de raiz.

---

## Now (próxima fila, ordem importa)

_(populado conforme novas candidatas amadurecem)_

---

## Bloqueadores cross-spec

_(populado conforme blocos cruzam fronteiras de spec)_
