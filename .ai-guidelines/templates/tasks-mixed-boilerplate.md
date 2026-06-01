<!-- ai-guidelines-template: tasks-mixed-boilerplate v=4 -->

# Tasks — Spec [Número] [Título Curto] — `mixed`

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: Draft <!-- Draft | In Progress (Stage 1) | In Progress (Stage 2) | In Review | Done (PR #X — YYYY-MM-DD) -->

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md` na seção 📐 "Decisões revisitadas" e ajustar tasks impactadas. Não retroceder status sem registro.

> **Variante `mixed`.** Use este boilerplate quando a spec tem **sub-blocos de design determinístico e outros que dependem de pesquisa/evidência** (cf. `.core/process/governance-foundation.md` § "Tipos de spec"). O workflow é híbrido:
>
> - **Stage 1 (Research → Gate)** é executado **apenas para os sub-blocos evidence-driven**.
> - Sub-blocos determinísticos podem ser implementados em paralelo ou aguardar o gate humano.
>
> Se a spec for inteiramente de um tipo, use:
>
> - [`tasks-evidence-driven-boilerplate.md`](./tasks-evidence-driven-boilerplate.md) — 100% evidence-driven, sem sub-blocos puramente determinísticos.
> - [`tasks-deterministic-boilerplate.md`](./tasks-deterministic-boilerplate.md) — 100% determinístico, sem Stage 1 nem `decision-brief.md`.

---

## Fase 0 — Setup + Stage 1 (Research → Decision-Brief → Gate humano)

> Em `mixed`, a Fase 0 identifica quais sub-blocos do `plan.md` são `(evidence-driven)` e precisam de Stage 1. Os demais são classificados como `(deterministic)` e podem iniciar a implementação após o Setup, **desde que** suas premissas sejam independentes das decisões pendentes nos sub-blocos `(evidence-driven)`. Quando há acoplamento (mesmo que parcial), o pragmatismo recomenda aguardar o Gate fechar para evitar retrabalho.

### Sub-bloco [0.Setup] — Bootstrap e instanciação

- [ ] **0.1** **Bootstrap**: ler `roadmap/backlog.md` (spec ativa, prioridades, candidatas absorvidas) e `.core/process/governance-foundation.md` § "Tipos de spec".
- [ ] **0.2** **Tipo de spec** confirmado como `mixed` no header da `spec.md`.
- [ ] **0.3** **Slug semântico** definido (ex.: `<domínio>-<verbo-curto>`); o **número (NNNN)** só é alocado na criação da branch.
- [ ] **0.4** Branch `feat/spec-NNNN-<slug>` criada a partir de `main`.
- [ ] **0.5** `spec.md` instanciado a partir de `.specify/templates/spec-boilerplate.md`; header completo com `Tipo de spec: mixed` e campo `Decision Brief` apontando para `./decision-brief.md`.
- [ ] **0.6** **[MANDATÓRIO]** Validação Humana inicial: owner aprova problema e escopo definidos no `spec.md` **antes** de avançar para Stage 1 ou Implementação A.
- [ ] **0.7** `plan.md` instanciado a partir de `.specify/templates/plan-boilerplate.md`. Os sub-blocos de implementação devem ser classificados explicitamente como `(evidence-driven)` (com bloco Stage 1/Stage 2 placeholder) ou `(deterministic)` (já detalhados).
- [ ] **0.8** `tasks.md` (este arquivo) instanciado a partir desta variante.
- [ ] **0.9** `decision-brief.md` instanciado a partir de `.specify/templates/decision-brief-boilerplate.md` com pontos `[DEC-NNNN-*]` listados em status `Pendente`, sem opções preenchidas.
- [ ] **0.10** `roadmap/backlog.md` atualizado: spec movida para "Em execução"; candidatas absorvidas migradas para `roadmap/historico.md` com ponteiro à spec absorvedora.
- [ ] **0.11** `NEXT.md` instanciado (mandatório).
- [ ] **0.12** Criar Pull Request em Draft. O agente usa o template do repositório se existir (ex: `.github/pull_request_template.md`), preenchendo as informações da spec. Caso não exista template, adicionar uma descrição concisa do contexto e escopo inicial.
- [ ] **0.[COMMIT]** texto de commit atômico sugerido: "chore(spec-NNNN): setup inicial da spec". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar ao usuário.

### Sub-bloco [0.Research] — Stage 1: produzir researches

> Foco exclusivo nos sub-blocos marcados como `(evidence-driven)`. Toda research deve alimentar pelo menos um ponto `[DEC-*]` do referencial `evidence-driven`.
>
> **Critério de parada (ver `governance-foundation.md` § "Contrato da cadeia"):** a research **para quando há material suficiente para decidir**, não quando resta uma única resposta. Decidir é proibido à research — ela entrega **opções vivas e comparáveis** (simetria informacional) ou um **finding convergido**, declarando o `Modo de gate`; **torna comparável, não convence**.

- [ ] **0.R.1** Listar perguntas de research a responder (uma linha por arquivo) em `plan.md` § Research lifecycle, cada pergunta cruzada com o ponto `[DEC-*]` correspondente.
- [ ] **0.R.2** Produzir `research/YYYY-MM-DD-<tema>.md` por pergunta. Cada arquivo cita fontes (URL + ID externo quando aplicável: CWE-NNN, paper, benchmark publicado, transcrição).
- [ ] **0.R.3** Validar critério: cada research cobre pelo menos uma pergunta do `plan.md` E alimenta pelo menos um ponto `[DEC-*]`. Sem ambos, research sai do escopo (mover para `_drafts/` ou descartar).
- [ ] **0.R.4** Análise de débitos: atualizar `NEXT.md` com eventuais insights secundários.
- [ ] **0.R.[COMMIT]** texto de commit incremental sugerido: "research(spec-NNNN): sínteses Stage 1 publicadas". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar.

### Sub-bloco [0.Brief] — Stage 1: popular `decision-brief.md` com opções

> Cristalizar o que research mostra como **opções com tradeoffs** para os pontos `[DEC-NNNN-*]` dos sub-blocos `(evidence-driven)`.

- [ ] **0.B.1** Para cada `[DEC-NNNN-*]`: registrar Pergunta + **Modo de gate** + Contexto (research) + **ou** Opções no **conjunto mínimo** (Problema · Benefícios · Tradeoffs · Riscos · Quando escolher · Quando NÃO escolher — **nunca Pró/Contra**; Formas B/C, modo `escolha`) **ou** o finding convergido (Forma D, modo `aceitação`). Recomendação inicial **só em `escolha`** e _bounded_. Pontos complexos podem ser decompostos em sub-eixos.
- [ ] **0.B.2** Cross-refs entre pontos: pontos com dependência mútua explicitam o vínculo (ex.: "redação final depende de `[DEC-NNNN-AYY]`").
- [ ] **0.B.3** Tabela "Resumo de status" no fim do brief com todos os pontos em `Pendente`.
- [ ] **0.B.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **0.B.[COMMIT]** texto de commit incremental sugerido: "docs(spec-NNNN): decision-brief.md populado com opções Stage 1". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar.

### Sub-bloco [0.Gate] — Gate humano (decision-brief → Resolved)

> **[MANDATÓRIO]** A implementação dos sub-blocos `(evidence-driven)` (Stage 2) só inicia após este gate fechar.

- [ ] **0.G.1** Owner revisa `decision-brief.md` com todos os pontos `[DEC-NNNN-*]` em status `Pendente` e opções preenchidas.
- [ ] **0.G.2** Para cada ponto, conforme o **`Modo de gate`** (`escolha` = owner arbitra entre opções vivas; `aceitação` = owner aceita / rejeita / reenquadra um finding convergido — ver `governance-foundation.md` § "Contrato da cadeia"): owner crava o ato + justificativa + data no bloco "Decisão do Gate Humano"; status muda para `Resolved`.
- [ ] **0.G.3** Pontos que demandem mais research voltam para [0.Research] com tarefa derivada. Iterar até zero pontos `Pendente`/`Partial`.
- [ ] **0.G.4** Status agregado do `decision-brief.md` mudado para `Resolved` (data + owner). Bloco final "✅ Gate fechado" assinado.
- [ ] **0.G.5** `plan.md` v2 publicado: seções de design técnico `(evidence-driven)` derivadas das decisões cravadas. Cada subseção referencia o `[DEC-NNNN-*]` correspondente. Stage 2 deixa de ser placeholder.
- [ ] **0.G.6** `tasks.md` v2: este arquivo é atualizado — Fases 1–4 abaixo passam de placeholder para tasks operacionais para as seções `(evidence-driven)`. Status atualizado para `In Progress (Stage 2)`.
- [ ] **0.G.7** Análise de débitos: atualizar `NEXT.md`.
- [ ] **0.G.[COMMIT]** texto de commit atômico sugerido: "docs(spec-NNNN): gate humano fechado — plan v2 + tasks v2 publicados". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar.

---

## Fase 1 — Implementação A (Stage 2)

> Bloco principal de implementação derivado do `plan.md`. Os sub-blocos `(deterministic)` podem ter sido executados antes ou em paralelo. Os `(evidence-driven)` dependem do fechamento do [0.Gate]. Cada sub-bloco encerra com **commit incremental atômico**. A IA deve fornecer a sugestão de commit como saída padrão de fechamento, sem perguntar.

> **Nota — promoção de regra.** Se a spec promover regra editorial / de processo / de IA, classificar explicitamente como **universal** × **opt-in** (cf. `.core/process/governance-foundation.md` § "Categorias de regras").

### Sub-bloco [A] — [nome do sub-bloco no plan] `(deterministic)`

> Origem: [`<seção do plan>`](./plan.md#...)

- [ ] **1.A.1** Descrição da task (1–3 linhas, com path concreto).
- [ ] **1.A.2** Próxima task.
- [ ] **1.A.N** Pipeline de check + test verde após o sub-bloco A (ex.: `yarn check && yarn test` no `ai-guidelines`; substitua pelo equivalente do stack do consumidor — `npm test`, `pnpm verify`, `cargo test`, `pytest`, etc.).
- [ ] **1.A.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.A.[COMMIT]** texto de commit incremental sugerido: "<tipo>(spec-NNNN): <resumo do sub-bloco A>". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar.

### Sub-bloco [B] — [nome do sub-bloco no plan] `(evidence-driven)`

> Origem: [`<seção do plan>`](./plan.md#...) e [`[DEC-NNNN-XYZ]`](./decision-brief.md#dec-nnnn-xyz).

- [ ] **1.B.1** Descrição da task (1–3 linhas, com path concreto).
- [ ] **1.B.2** Próxima task.
- [ ] **1.B.N** Pipeline de check + test verde após o sub-bloco B.
- [ ] **1.B.4** Análise de débitos: atualizar `NEXT.md`.
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
