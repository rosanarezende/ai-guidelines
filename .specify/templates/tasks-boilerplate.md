# Tasks — Spec [Número] [Título Curto]

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md) <!-- só existe se Tipo de spec ∈ {evidence-driven, mixed} -->
> Status: Draft <!-- Draft | In Progress | In Review | Done (PR #X — YYYY-MM-DD) -->

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md` na seção 📐 "Decisões revisitadas" e ajustar tasks impactadas. Não retroceder status sem registro.

> **Boilerplate genérico — variante de referência.** Ao instanciar uma spec real, escolha a variante alinhada ao `Tipo de spec` declarado no header da `spec.md` (cf. `.core/process/spec-foundation.md` § "Tipos de spec"):
>
> - `evidence-driven` → [`tasks-evidence-driven-boilerplate.md`](./tasks-evidence-driven-boilerplate.md) — adiciona sub-bloco **Stage 1 (Research)** + **Gate humano via `decision-brief.md`** entre Setup e Implementação A.
> - `deterministic` → [`tasks-deterministic-boilerplate.md`](./tasks-deterministic-boilerplate.md) — single-pass: Setup → Implementação direta, sem Stage 1.
> - `mixed` → [`tasks-mixed-boilerplate.md`](./tasks-mixed-boilerplate.md) — híbrido: Stage 1 condicional para os sub-blocos identificados como evidence-driven; restante single-pass.
>
> Esta variante genérica documenta o **backbone canônico de 5 fases (0–4)** sem injeções específicas por tipo. Mantém-se aqui como referência única do modelo — specs reais devem usar uma das variantes acima.

---

## Fase 0 — Setup

> Bootstrap da spec: ler estado do roadmap, classificar a spec, criar branch, instanciar artefatos e travar escopo com humano antes de qualquer implementação.

- [ ] **0.1** **Bootstrap**: ler `roadmap/backlog.md` (spec ativa, prioridades, candidatas absorvidas) e `.core/process/spec-foundation.md` § "Tipos de spec".
- [ ] **0.2** **Tipo de spec** decidido (`evidence-driven` | `deterministic` | `mixed`) — campo obrigatório no header da `spec.md`. Critério-teste: _"o design depende de evidência técnica/pesquisa ainda não coletada?"_
- [ ] **0.3** **Slug semântico** definido (ex.: `<domínio>-<verbo-curto>`); o **número (NNNN)** só é alocado na criação da branch — candidatas vivem no backlog por slug.
- [ ] **0.4** Branch `feat/spec-NNNN-<slug>` criada a partir de `main`.
- [ ] **0.5** `spec.md` instanciado a partir de `.specify/templates/spec-boilerplate.md`; header completo com **Tipo de spec** preenchido.
- [ ] **0.6** **[MANDATÓRIO]** Validação Humana inicial: owner aprova problema e escopo definidos no `spec.md` **antes** de avançar para qualquer implementação.
- [ ] **0.7** `plan.md` e `tasks.md` (variante apropriada ao tipo) instanciados a partir dos templates.
- [ ] **0.8** `roadmap/backlog.md` atualizado: spec movida para "Em execução"; candidatas absorvidas migradas para `roadmap/historico.md` com ponteiro à spec absorvedora.
- [ ] **0.9** `NEXT.md` instanciado (mandatório).
- [ ] **0.10** Criar Pull Request em Draft. O agente usa o template do repositório se existir (ex: `.github/pull_request_template.md`), preenchendo as informações da spec. Caso não exista template, adicionar uma descrição concisa do contexto e escopo inicial.

---

## Fase 1 — Implementação A

> Primeiro sub-bloco de implementação. Cada sub-bloco encerra com **commit incremental atômico** — atomicidade tipo "história de usuário concluída", não "fim do dia".

Decompor por componente/sub-bloco do `plan.md`. Cada task deve ser observável ("o que muda no repo após esta task"), com path concreto quando aplicável.

> **Nota — promoção de regra.** Se a spec promover regra editorial / de processo / de IA, classificar explicitamente como **universal** × **opt-in** (cf. `.core/process/spec-foundation.md` § "Categorias de regras").

### Sub-bloco [A] — [nome do sub-bloco no plan]

> Origem: [`<seção do plan>`](./plan.md#...) <!-- e [`[DEC-NNNN-XYZ]`](./decision-brief.md#...) se evidence-driven/mixed -->

- [ ] **1.A.1** Descrição da task (1–3 linhas, com path concreto).
- [ ] **1.A.2** Próxima task.
- [ ] **1.A.N** Pipeline de check + test verde após o sub-bloco A (ex.: `yarn check && yarn test` no `ai-guidelines`; substitua pelo equivalente do stack do consumidor — `npm test`, `pnpm verify`, `cargo test`, `pytest`, etc.).
- [ ] **1.A.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.A.[COMMIT]** texto de commit incremental sugerido: "<tipo>(spec-NNNN): <resumo do sub-bloco A>"

### Sub-bloco [B] — [nome do sub-bloco no plan]

- [ ] **1.B.1** ...
- [ ] **1.B.2** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.B.[COMMIT]** texto de commit incremental sugerido: "<tipo>(spec-NNNN): <resumo do sub-bloco B>"

> **Specs single-bloco:** se o `plan.md` define apenas um bloco de implementação, **fundir Fase 1 + Fase 2** num único conjunto de sub-blocos com nota explícita no header desta fase. Não pular Fase 2 silenciosamente.

---

## Fase 2 — Implementação B

> Segundo sub-bloco de implementação. Mesma exigência de **commits incrementais atômicos** ao final de cada sub-bloco. Specs single-bloco fundem 1+2 (cf. nota acima).

### Sub-bloco [C] — [nome do sub-bloco no plan]

- [ ] **2.C.1** ...
- [ ] **2.C.2** Análise de débitos: atualizar `NEXT.md`.
- [ ] **2.C.[COMMIT]** texto de commit incremental sugerido: "<tipo>(spec-NNNN): <resumo do sub-bloco C>"

### Sub-bloco [D] — [nome do sub-bloco no plan]

- [ ] **2.D.1** ...
- [ ] **2.D.2** Análise de débitos: atualizar `NEXT.md`.
- [ ] **2.D.[COMMIT]** texto de commit incremental sugerido: "<tipo>(spec-NNNN): <resumo do sub-bloco D>"

---

## Fase 3 — Preparação para Review (Gate de Homologação)

> **Fase exclusiva para empacotamento e homologação.** Nenhuma implementação nova após este ponto, exceto correções demandadas pelo review humano. O objetivo é entregar ao revisor um pacote autossuficiente.

- [ ] **3.1** Atualizar header da `spec.md`: status → `In Review`.
- [ ] **3.2** Pipeline canônico verde: rodar a suíte completa (install bloqueado/immutable + format check + test com coverage). Ex. no `ai-guidelines`: `yarn check:repo`. Em outros stacks: `npm ci && npm run lint && npm test`, `pnpm install --frozen-lockfile && pnpm verify`, ou equivalente.
- [ ] **3.3** Critérios de aceite de `spec.md` (alto nível) e DoD de `plan.md` (detalhado) confirmados ponto-a-ponto.
- [ ] **3.4** Validar a entrega em **ambiente real** quando aplicável: rodar a feature em consumidor / staging / espelho de prod, revisando regressões. Para specs do `ai-guidelines` que tocam compilador/rules, o canal canônico é `node cli/ai-guidelines-cli.mjs adopt --target ../<consumidor> --dry-run`. Specs puramente internas (refactor sem mudança de comportamento, ajustes de teste, etc.) podem registrar "não-aplicável" no PR com justificativa.
- [ ] **3.5** PR atualizado: descrição em 3 etapas (contexto → decisões cravadas → impacto cross-spec) conforme regra de PR collab; aponta para `spec.md`, `plan.md` e `decision-brief.md` (se houver).
- [ ] **3.6** **[MANDATÓRIO]** Aguardar **Gate de Review Humano** — homologação técnica formal. **Não prosseguir** para Fase 4 sem aprovação explícita.
- [ ] **3.7** Aplicar correções demandadas em loops de review até aprovação; cada correção é commit incremental rastreável.

---

## Fase 4 — Encerramento Pré-Merge

> **[MANDATÓRIO]** Esta fase ocorre **na branch do PR, antes do merge**. Nenhuma tarefa pós-merge — o pacote deve estar 100% atômico no momento do merge. O merge só ocorre após este checklist completo.

- [ ] **4.1** `NEXT.md` (se existir): migrar débitos relevantes para `roadmap/backlog.md` (atualizando candidatas existentes ou abrindo novas) e **deletar** o arquivo.
- [ ] **4.2** Migração de research: cada arquivo significativo renomeado para incluir a data (`YYYY-MM-DD-nome.md`) e movido para a pasta de domínio correta em `.specify/specs/researchs/<domínio>/`. Adicionar link + resumo em `.specify/specs/research-index.md`. Política completa em `.core/process/spec-foundation.md`.
- [ ] **4.3** `decision-brief.md` (se houver) **permanece** no diretório da spec como artefato histórico — não migra.
- [ ] **4.4** `spec.md` header: status → `Done (PR #X — YYYY-MM-DD)`.
- [ ] **4.5** `roadmap/historico.md`: spec movida para "Specs concluídas" com data; entrada removida da seção "Em execução" em `roadmap/backlog.md`.
- [ ] **4.6** `CHANGELOG.md`: entrada da spec **somente se** houve mudança de comportamento publicada (gatilho explícito; refatorações internas e specs puramente documentais dispensam).
- [ ] **4.7** **[MANDATÓRIO]** Confirmar que **a sessão atual** não abriu outra spec antes deste encerramento (cf. `.core/process/spec-foundation.md` § "Checklist de fechamento" — _uma sessão, uma spec ativa_, e research da Spec 0017 [`2026-04-29-concurrency-best-practices.md`](../specs/researchs/governance/2026-04-29-concurrency-best-practices.md)). Specs em paralelo conduzidas por outros contribuidores ou outras sessões **são permitidas** em repos OSS — a regra é por sessão de trabalho, não por repositório.
- [ ] **4.8** **[COMMIT]** `chore(spec-NNNN): encerramento pré-merge — research migrado, NEXT removido, status final`.
- [ ] **4.9** **[MANDATÓRIO]** Aprovação humana explícita para merge. **Não fazer merge autonomamente.**
