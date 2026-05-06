# Tasks — Spec [Número] [Título Curto] — `evidence-driven`

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: Draft <!-- Draft | In Progress (Stage 1) | In Progress (Stage 2) | In Review | Done (PR #X — YYYY-MM-DD) -->

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md` na seção 📐 "Decisões revisitadas" e ajustar tasks impactadas. Não retroceder status sem registro.

> **Variante `evidence-driven`.** Use este boilerplate quando o **Tipo de spec** declarado no header da `spec.md` é `evidence-driven` — i.e., o design depende de evidência técnica/pesquisa **ainda não coletada** (cf. `.core/process/spec-foundation.md` § "Tipos de spec"). A diferença canônica em relação ao boilerplate genérico é a expansão da **Fase 0** com Stage 1 (Research → Decision-Brief → Gate humano), executada **antes** da Implementação A. Stage 2 (Fases 1–4) só inicia após o gate humano resolver todos os pontos `[DEC-NNNN-*]` do `decision-brief.md`.
>
> Se a spec não cabe em `evidence-driven` puro, considere:
>
> - [`tasks-deterministic-boilerplate.md`](./tasks-deterministic-boilerplate.md) — design determinístico, sem Stage 1.
> - [`tasks-mixed-boilerplate.md`](./tasks-mixed-boilerplate.md) — Stage 1 condicional para sub-blocos identificados como evidence-driven.

---

## Fase 0 — Setup + Stage 1 (Research → Decision-Brief → Gate humano)

> Em `evidence-driven`, a Fase 0 estende o Setup canônico com **Stage 1**: coletar evidência, registrar opções no `decision-brief.md`, fechar o gate humano. **Nenhum design técnico cravado pré-research.** Stage 2 (Fase 1+) só inicia após o gate fechar.

### Sub-bloco [0.Setup] — Bootstrap e instanciação

- [ ] **0.1** **Bootstrap**: ler `roadmap/backlog.md` (spec ativa, prioridades, candidatas absorvidas) e `.core/process/spec-foundation.md` § "Tipos de spec".
- [ ] **0.2** **Tipo de spec** confirmado como `evidence-driven` no header da `spec.md`. Critério-teste: _"o design depende de evidência técnica/pesquisa ainda não coletada?"_ → **sim**.
- [ ] **0.3** **Slug semântico** definido (ex.: `<domínio>-<verbo-curto>`); o **número (NNNN)** só é alocado na criação da branch.
- [ ] **0.4** Branch `feat/spec-NNNN-<slug>` criada a partir de `main`.
- [ ] **0.5** `spec.md` instanciado a partir de `.specify/templates/spec-boilerplate.md`; header completo com `Tipo de spec: evidence-driven` e campo `Decision Brief` apontando para `./decision-brief.md`.
- [ ] **0.6** **[MANDATÓRIO]** Validação Humana inicial: owner aprova problema e escopo definidos no `spec.md` **antes** de avançar para Stage 1.
- [ ] **0.7** `plan.md` instanciado a partir de `.specify/templates/plan-boilerplate.md` com bloco **Stage 1 / Stage 2 placeholder** (Stage 2 fica em placeholder até o gate fechar).
- [ ] **0.8** `tasks.md` (este arquivo) instanciado a partir desta variante.
- [ ] **0.9** `decision-brief.md` instanciado a partir de `.specify/templates/decision-brief-boilerplate.md` com pontos `[DEC-NNNN-*]` listados em status `Pendente`, sem opções preenchidas (opções entram no sub-bloco [0.Brief]).
- [ ] **0.10** `roadmap/backlog.md` atualizado: spec movida para "Em execução"; candidatas absorvidas migradas para `roadmap/historico.md` com ponteiro à spec absorvedora.
- [ ] **0.11** `NEXT.md` criado **somente se** a spec gerar débitos conscientes ao fim. Em `evidence-driven`, costuma ser criado tarde (após Stage 1) — não criar prematuramente.

### Sub-bloco [0.Research] — Stage 1: produzir researches

> Pesquisa instrumental, externa ou empírica que alimenta os pontos `[DEC-NNNN-*]` do `decision-brief.md`. **Toda research deve alimentar pelo menos um ponto `[DEC-*]`** — research que não alimenta está fora de escopo.

- [ ] **0.R.1** Listar perguntas de research a responder (uma linha por arquivo) em `plan.md` § Research lifecycle, cada pergunta cruzada com o ponto `[DEC-*]` correspondente.
- [ ] **0.R.2** Produzir `research/YYYY-MM-DD-<tema>.md` por pergunta. Cada arquivo cita fontes (URL + ID externo quando aplicável: CWE-NNN, paper, benchmark publicado, transcrição).
- [ ] **0.R.3** Validar critério: cada research cobre pelo menos uma pergunta do `plan.md` E alimenta pelo menos um ponto `[DEC-*]`. Sem ambos, research sai do escopo (mover para `_drafts/` ou descartar).
- [ ] **0.R.[COMMIT]** Commit incremental atômico: `research(spec-NNNN): sínteses Stage 1 publicadas`.

### Sub-bloco [0.Brief] — Stage 1: popular `decision-brief.md` com opções

> Cristalizar o que research mostra como **opções com tradeoffs**, sem cravar decisão. Recomendação inicial é opcional (incluir quando há evidência convergente em ≥ 1 research). Opções divergentes ficam abertas para o gate.

- [ ] **0.B.1** Para cada `[DEC-NNNN-*]`: registrar Pergunta + Contexto (research) + Opções (com Pró/Contra) + Recomendação inicial (opcional). Pontos complexos podem ser decompostos em sub-eixos.
- [ ] **0.B.2** Cross-refs entre pontos: pontos com dependência mútua explicitam o vínculo (ex.: "redação final depende de `[DEC-NNNN-AYY]`").
- [ ] **0.B.3** Tabela "Resumo de status" no fim do brief com todos os pontos em `Pendente`.
- [ ] **0.B.[COMMIT]** Commit incremental atômico: `docs(spec-NNNN): decision-brief.md populado com opções Stage 1`.

### Sub-bloco [0.Gate] — Gate humano (decision-brief → Resolved)

> **[MANDATÓRIO]** Stage 2 (Fase 1+) só inicia após este gate fechar. Pontos podem resolver em rodada única ou em múltiplas rodadas; status `Partial` é estado válido enquanto algumas decisões esperam mais research.

- [ ] **0.G.1** Owner revisa `decision-brief.md` com todos os pontos `[DEC-NNNN-*]` em status `Pendente` e opções preenchidas.
- [ ] **0.G.2** Para cada ponto: owner escolhe opção (ou propõe nova), preenche bloco "Decisão do Gate Humano" com escolha + justificativa + data; status muda para `Resolved`.
- [ ] **0.G.3** Pontos que demandem mais research voltam para [0.Research] com tarefa derivada. Iterar até zero pontos `Pendente`/`Partial`.
- [ ] **0.G.4** Status agregado do `decision-brief.md` mudado para `Resolved` (data + owner). Bloco final "✅ Gate fechado" assinado.
- [ ] **0.G.5** `plan.md` v2 publicado: seções de design técnico derivadas das decisões cravadas. Cada subseção referencia o `[DEC-NNNN-*]` correspondente. Stage 2 deixa de ser placeholder.
- [ ] **0.G.6** `tasks.md` v2: este arquivo é atualizado — Fases 1–4 abaixo passam de placeholder para tasks operacionais derivadas do plan v2. Status atualizado para `In Progress (Stage 2)`.
- [ ] **0.G.[COMMIT]** Commit atômico marcando o gate: `docs(spec-NNNN): gate humano fechado — plan v2 + tasks v2 publicados`.

---

## Fase 1 — Implementação A (Stage 2)

> Primeiro sub-bloco de implementação derivado do `plan.md` v2. Cada sub-bloco encerra com **commit incremental atômico** — atomicidade tipo "história de usuário concluída", não "fim do dia". Cada sub-bloco referencia explicitamente o `[DEC-NNNN-*]` que o alimenta.

> **Nota — promoção de regra.** Se a spec promover regra editorial / de processo / de IA, classificar explicitamente como **universal** × **opt-in** (cf. `.core/process/spec-foundation.md` § "Categorias de regras").

### Sub-bloco [A] — [nome do sub-bloco no plan]

> Origem: [`<seção do plan>`](./plan.md#...) e [`[DEC-NNNN-XYZ]`](./decision-brief.md#dec-nnnn-xyz).

- [ ] **1.A.1** Descrição da task (1–3 linhas, com path concreto).
- [ ] **1.A.2** Próxima task.
- [ ] **1.A.N** Pipeline de check + test verde após o sub-bloco A (ex.: `yarn check && yarn test` no `ai-guidelines`; substitua pelo equivalente do stack do consumidor — `npm test`, `pnpm verify`, `cargo test`, `pytest`, etc.).
- [ ] **1.A.[COMMIT]** Commit incremental atômico: `<tipo>(spec-NNNN): <resumo do sub-bloco A>`.

### Sub-bloco [B] — [nome do sub-bloco no plan]

- [ ] **1.B.1** ...
- [ ] **1.B.[COMMIT]** Commit incremental atômico do sub-bloco B.

> **Specs single-bloco:** se o `plan.md` define apenas um bloco de implementação, **fundir Fase 1 + Fase 2** num único conjunto de sub-blocos com nota explícita no header desta fase. Não pular Fase 2 silenciosamente.

---

## Fase 2 — Implementação B (Stage 2)

> Segundo sub-bloco de implementação. Mesma exigência de **commits incrementais atômicos** ao final de cada sub-bloco. Specs single-bloco fundem 1+2 (cf. nota acima).

### Sub-bloco [C] — [nome do sub-bloco no plan]

- [ ] **2.C.1** ...
- [ ] **2.C.[COMMIT]** Commit incremental atômico do sub-bloco C.

### Sub-bloco [D] — [nome do sub-bloco no plan]

- [ ] **2.D.1** ...
- [ ] **2.D.[COMMIT]** Commit incremental atômico do sub-bloco D.

---

## Fase 3 — Preparação para Review (Gate de Homologação)

> **Fase exclusiva para empacotamento e homologação.** Nenhuma implementação nova após este ponto, exceto correções demandadas pelo review humano.

- [ ] **3.1** Atualizar header da `spec.md`: status → `In Review`.
- [ ] **3.2** Pipeline canônico verde: rodar a suíte completa (install bloqueado/immutable + format check + test com coverage). Ex. no `ai-guidelines`: `yarn check:repo`. Em outros stacks: `npm ci && npm run lint && npm test`, `pnpm install --frozen-lockfile && pnpm verify`, ou equivalente.
- [ ] **3.3** Critérios de aceite de `spec.md` (alto nível) e DoD de `plan.md` (detalhado) confirmados ponto-a-ponto.
- [ ] **3.4** `decision-brief.md`: validar que todos os pontos `[DEC-NNNN-*]` estão `Resolved` e que cada decisão cravada está refletida no design do `plan.md` v2. Discrepância → bloqueia review.
- [ ] **3.5** Validar a entrega em **ambiente real** quando aplicável: rodar a feature em consumidor / staging / espelho de prod, revisando regressões. Para specs do `ai-guidelines` que tocam compilador/rules, o canal canônico é `node cli/ai-guidelines-cli.mjs adopt --target ../<consumidor> --dry-run`. Specs puramente internas (refactor sem mudança de comportamento, ajustes de teste, etc.) podem registrar "não-aplicável" no PR com justificativa.
- [ ] **3.6** PR criado/atualizado: descrição em 3 etapas (contexto → decisões cravadas com cross-ref ao `decision-brief.md` → impacto cross-spec) conforme regra de PR collab.
- [ ] **3.7** **[MANDATÓRIO]** Aguardar **Gate de Review Humano** — homologação técnica formal. **Não prosseguir** para Fase 4 sem aprovação explícita.
- [ ] **3.8** Aplicar correções demandadas em loops de review até aprovação; cada correção é commit incremental rastreável.

---

## Fase 4 — Encerramento Pré-Merge

> **[MANDATÓRIO]** Esta fase ocorre **na branch do PR, antes do merge**. Nenhuma tarefa pós-merge. O merge só ocorre após este checklist completo.

- [ ] **4.1** `NEXT.md` (se existir): migrar débitos relevantes para `roadmap/backlog.md` (atualizando candidatas existentes ou abrindo novas) e **deletar** o arquivo.
- [ ] **4.2** Migração de research: cada arquivo significativo renomeado para `YYYY-MM-DD-nome.md` (se ainda não estiver) e movido para a pasta de domínio correta em `.specify/specs/researchs/<domínio>/`. Adicionar link + resumo em `.specify/specs/research-index.md`. Política completa em `.core/process/spec-foundation.md`.
- [ ] **4.3** `decision-brief.md` **permanece** no diretório da spec (`.specify/specs/NNNN-<slug>/`) como artefato histórico — **não migra**.
- [ ] **4.4** `spec.md` header: status → `Done (PR #X — YYYY-MM-DD)`.
- [ ] **4.5** `roadmap/historico.md`: spec movida para "Specs concluídas" com data; entrada removida de "Em execução" em `roadmap/backlog.md`.
- [ ] **4.6** `CHANGELOG.md`: entrada da spec **somente se** houve mudança de comportamento publicada (gatilho explícito; refatorações internas e specs puramente documentais dispensam).
- [ ] **4.7** **[MANDATÓRIO]** Confirmar que **a sessão atual** não abriu outra spec antes deste encerramento (cf. `.core/process/spec-foundation.md` § "Checklist de fechamento" — _uma sessão, uma spec ativa_, e research da Spec 0017 [`2026-04-29-concurrency-best-practices.md`](../specs/researchs/governance/2026-04-29-concurrency-best-practices.md)). Specs em paralelo conduzidas por outros contribuidores ou outras sessões **são permitidas** em repos OSS — a regra é por sessão de trabalho, não por repositório.
- [ ] **4.8** **[COMMIT]** `chore(spec-NNNN): encerramento pré-merge — research migrado, NEXT removido, status final`.
- [ ] **4.9** **[MANDATÓRIO]** Aprovação humana explícita para merge. **Não fazer merge autonomamente.**
