<!-- ai-guidelines-template: tasks-deterministic-boilerplate v=4 -->

# Tasks — Spec [Número] [Título Curto] — `deterministic`

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Status: Draft <!-- Draft | In Progress | In Review | Done (PR #X — YYYY-MM-DD) -->

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md` na seção 📐 "Decisões revisitadas" e ajustar tasks impactadas. Não retroceder status sem registro.

> **Variante `deterministic`.** Use este boilerplate quando o **Tipo de spec** declarado no header da `spec.md` é `deterministic` — i.e., o design é conhecido e não depende de pesquisa/evidência a ser coletada (cf. `.core/process/governance-foundation.md` § "Tipos de spec"). O workflow é **single-pass**: Setup → Implementação direta, sem Stage 1 (Gate humano) nem uso de `decision-brief.md`.
>
> Se o design não for 100% determinístico, considere:
>
> - [`tasks-evidence-driven-boilerplate.md`](./tasks-evidence-driven-boilerplate.md) — design depende de pesquisa; workflow em dois passes com gate humano.
> - [`tasks-mixed-boilerplate.md`](./tasks-mixed-boilerplate.md) — Stage 1 condicional para sub-blocos identificados como evidence-driven.

---

## Fase 0 — Setup

> Bootstrap da spec: ler estado do roadmap, classificar a spec, criar branch, instanciar artefatos e travar escopo com humano antes de qualquer implementação.

### Sub-bloco [0.Setup] — Bootstrap e instanciação

- [ ] **0.1** **Bootstrap**: ler `roadmap/backlog.md` (spec ativa, prioridades, candidatas absorvidas) e `.core/process/governance-foundation.md` § "Tipos de spec".
- [ ] **0.2** **Tipo de spec** confirmado como `deterministic` no header da `spec.md`. Critério-teste: _"o design depende de evidência técnica/pesquisa ainda não coletada?"_ → **não**.
- [ ] **0.3** **Slug semântico** definido (ex.: `<domínio>-<verbo-curto>`); o **número (NNNN)** só é alocado na criação da branch.
- [ ] **0.4** Branch `feat/spec-NNNN-<slug>` criada a partir de `main`.
- [ ] **0.5** `spec.md` instanciado a partir de `.specify/templates/spec-boilerplate.md`; header completo com `Tipo de spec: deterministic`. Em specs determinísticas o campo `Decision Brief` é ausente.
- [ ] **0.6** **[MANDATÓRIO]** Validação Humana inicial: owner aprova problema e escopo definidos no `spec.md` **antes** de avançar para implementação.
- [ ] **0.7** `plan.md` instanciado a partir de `.specify/templates/plan-boilerplate.md` — em specs `deterministic`, a seção "Stage 1 / Stage 2 placeholder" do template é omitida; o `plan.md` entra direto em design técnico.
- [ ] **0.8** `tasks.md` (este arquivo) instanciado a partir desta variante.
- [ ] **0.9** `roadmap/backlog.md` atualizado: spec movida para "Em execução"; candidatas absorvidas migradas para `roadmap/historico.md` com ponteiro à spec absorvedora.
- [ ] **0.10** `NEXT.md` instanciado (mandatório).
- [ ] **0.11** Criar Pull Request em Draft. O agente usa o template do repositório se existir (ex: `.github/pull_request_template.md`), preenchendo as informações da spec. Caso não exista template, adicionar uma descrição concisa do contexto e escopo inicial.
- [ ] **0.[COMMIT]** texto de commit atômico sugerido: "chore(spec-NNNN): setup inicial da spec". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar ao usuário.

---

## Fase 1 — Implementação A

> Bloco principal de implementação derivado do `plan.md`. Cada sub-bloco encerra com **commit incremental atômico** — atomicidade tipo "história de usuário concluída", não "fim do dia". A IA deve fornecer a sugestão de commit como saída padrão de fechamento, sem perguntar.

> **Nota — promoção de regra.** Se a spec promover regra editorial / de processo / de IA, classificar explicitamente como **universal** × **opt-in** (cf. `.core/process/governance-foundation.md` § "Categorias de regras").

### Sub-bloco [A] — [nome do sub-bloco no plan]

> Origem: [`<seção do plan>`](./plan.md#...)

- [ ] **1.A.1** Descrição da task (1–3 linhas, com path concreto).
- [ ] **1.A.2** Próxima task.
- [ ] **1.A.N** Pipeline de check + test verde após o sub-bloco A (ex.: `yarn check && yarn test` no `ai-guidelines`; substitua pelo equivalente do stack do consumidor — `npm test`, `pnpm verify`, `cargo test`, `pytest`, etc.).
- [ ] **1.A.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.A.[COMMIT]** texto de commit incremental sugerido: "<tipo>(spec-NNNN): <resumo do sub-bloco A>". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar.

### Sub-bloco [B] — [nome do sub-bloco no plan]

- [ ] **1.B.1** ...
- [ ] **1.B.2** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.B.[COMMIT]** texto de commit incremental sugerido: "<tipo>(spec-NNNN): <resumo do sub-bloco B>". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar.

---

## Fase Extra Condicional (Implementação B, Migração, etc.)

> Fase opcional. Criada apenas quando houver um segundo estágio real de implementação, migração, hardening ou rollout.

### Sub-bloco [C] — [nome do sub-bloco no plan]

- [ ] **C.1** ...
- [ ] **C.2** Análise de débitos: atualizar `NEXT.md`.
- [ ] **C.[COMMIT]** texto de commit incremental sugerido: "<tipo>(spec-NNNN): <resumo do sub-bloco C>". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar.

---

## Fase de Review → vive em `review.md`

> **Modelo de 3 boundaries (cf. `[DEC-0023-M01]`):** a homologação / prontidão de
> integração **não vive mais no `tasks.md`**. Ela vive em **`review.md`** (gates
> R1–R7, instanciado de `review-boilerplate.md`): R1–R6 `[x]` liberam abrir o
> Integration PR; R7 (merge authorization) libera o merge da stack.
>
> `tasks.md` é **execution-only**: cobre apenas execução/implementação e deve poder
> fechar 100% `[x]` quando a execução termina — sem depender de gates de homologação
> nem de ações pós-merge. O gate determinístico do runtime lê `review.md`, não este arquivo.

---

## Fase de Encerramento → vive em `release-log.md`

> **Operações pós-merge** (migração de research, status `Done`, CHANGELOG/release,
> `historico.md`, ajustes públicos, incidentes) vivem em **`release-log.md`** (instanciado
> de `release-log-boilerplate.md`) — registro operacional, **não gate**. Exceções que são
> gates de readiness e vivem em `review.md`: migração do `NEXT.md` (R5) e merge
> authorization (R7).
