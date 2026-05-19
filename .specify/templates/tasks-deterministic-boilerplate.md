<!-- ai-guidelines-template: tasks-deterministic-boilerplate v=3 -->

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

## Fase de Review (Gate de Homologação)

> **Fase exclusiva para empacotamento e homologação.** Nenhuma implementação nova após este ponto, exceto correções demandadas pelo review humano.

- [ ] **3.1** Atualizar header da `spec.md`: status → `In Review`.
- [ ] **3.2** Pipeline canônico verde: rodar a suíte completa (install bloqueado/immutable + format check + test com coverage). Ex. no `ai-guidelines`: `yarn check:repo`. Em outros stacks: `npm ci && npm run lint && npm test`, `pnpm install --frozen-lockfile && pnpm verify`, ou equivalente.
- [ ] **3.3** Critérios de aceite de `spec.md` (alto nível) e DoD de `plan.md` (detalhado) confirmados ponto-a-ponto.
- [ ] **3.4** Validar a entrega em **ambiente real** quando aplicável: rodar a feature em consumidor / staging / espelho de prod, revisando regressões. Para specs do `ai-guidelines` que tocam compilador/rules, o canal canônico é `yarn guidelines adopt --target ../<consumidor> --dry-run`. Specs puramente internas (refactor sem mudança de comportamento, ajustes de teste, etc.) podem registrar "não-aplicável" no PR com justificativa.
- [ ] **3.5** PR atualizado: descrição em 3 etapas (contexto → decisões cravadas → impacto cross-spec) conforme regra de PR collab.
- [ ] **3.6** **[MANDATÓRIO]** Aguardar **Gate de Review Humano** — homologação técnica formal. **Não prosseguir** para Fase 4 sem aprovação explícita.
- [ ] **3.7** Aplicar correções demandadas em loops de review até aprovação; cada correção é commit incremental rastreável.

---

## Fase de Encerramento Pré-Merge

> **[MANDATÓRIO]** Esta fase ocorre **na branch do PR, antes do merge**. Nenhuma tarefa pós-merge — o pacote deve estar **100% auto-suficiente** no momento do merge. O merge só ocorre após este checklist completo.
>
> **Princípio de PR auto-suficiente:** ao mergear, o agente que vier depois não precisa abrir hotfix nem commit complementar para fechar a spec. Tudo o que a release precisa — status `Done`, histórico, changelog publicado, version bump, índices atualizados — já está nesse mesmo PR.

- [ ] **4.1** `NEXT.md` (se existir): migrar débitos relevantes para `roadmap/backlog.md` (atualizando candidatas existentes ou abrindo novas) e **deletar** o arquivo.
- [ ] **4.2** Migração de research (se houve research pontual ad-hoc durante a implementação): cada arquivo significativo renomeado para `YYYY-MM-DD-nome.md` (se ainda não estiver) e movido para a pasta de domínio correta em `.specify/specs/researchs/<domínio>/`. Adicionar link + resumo em `.specify/specs/research-index.md`. Política completa em `.core/process/governance-foundation.md`. Specs `deterministic` puras costumam dispensar este passo.
- [ ] **4.3** `spec.md` header: status → `Done (PR #X — YYYY-MM-DD)`.
- [ ] **4.4** `roadmap/historico.md`: spec movida para "Specs concluídas" com data; entrada removida de "Em execução" em `roadmap/backlog.md`.
- [ ] **4.5** `CHANGELOG.md`: se a spec mudou comportamento publicado, criar **release publicada** (`## [X.Y.Z] — YYYY-MM-DD`) — não deixar em `[Unreleased]`. Bumpar `version` em `package.json` na mesma operação. Refatorações internas e specs puramente documentais dispensam release.
- [ ] **4.6** **[MANDATÓRIO]** Confirmar que **a sessão atual** não abriu outra spec antes deste encerramento (cf. `.core/process/governance-foundation.md` § "Checklist de fechamento" — _uma sessão, uma spec ativa_, e research da Spec 0017 [`2026-04-29-concurrency-best-practices.md`](../specs/researchs/governance/2026-04-29-concurrency-best-practices.md)). Specs em paralelo conduzidas por outros contribuidores ou outras sessões **são permitidas** em repos OSS — a regra é por sessão de trabalho, não por repositório.
- [ ] **4.7** **[COMMIT]** `chore(spec-NNNN): encerramento pré-merge — status final e limpeza de débitos`.
- [ ] **4.8** **[MANDATÓRIO]** Aprovação humana explícita para merge. **Não fazer merge autonomamente.**
