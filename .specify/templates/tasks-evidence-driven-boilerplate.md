<!-- ai-guidelines-template: tasks-evidence-driven-boilerplate v=5 -->

# Tasks — Spec [Número] [Título Curto] — `evidence-driven`

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: Draft <!-- Draft | In Progress (Stage 1) | In Progress (Stage 2) | In Review | Done (PR #X — YYYY-MM-DD) -->

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md` na seção 📐 "Decisões revisitadas" e ajustar tasks impactadas. Não retroceder status sem registro.

> **Variante `evidence-driven`.** Use este boilerplate quando o **Tipo de spec** declarado no header da `spec.md` é `evidence-driven` — i.e., o design depende de evidência técnica/pesquisa **ainda não coletada** (cf. `.core/process/governance-foundation.md` § "Tipos de spec"). A diferença canônica em relação ao boilerplate genérico é a expansão da **Fase 0** com Stage 1 (Research → Decision-Brief → Gate humano), executada **antes** da Implementação A. Stage 2 (Fases 1–4) só inicia após o gate humano resolver todos os pontos `[DEC-NNNN-*]` do `decision-brief.md`.
>
> Se a spec não cabe em `evidence-driven` puro, considere:
>
> - [`tasks-deterministic-boilerplate.md`](./tasks-deterministic-boilerplate.md) — design determinístico, sem Stage 1.
> - [`tasks-mixed-boilerplate.md`](./tasks-mixed-boilerplate.md) — Stage 1 condicional para sub-blocos identificados como evidence-driven.

---

## Fase 0 — Setup + Stage 1 (Research → Decision-Brief → Gate humano)

> Em `evidence-driven`, a Fase 0 estende o Setup canônico com **Stage 1**: coletar evidência, registrar opções no `decision-brief.md`, fechar o gate humano. **Nenhum design técnico cravado pré-research.** Stage 2 (Fase 1+) só inicia após o gate fechar.

### Sub-bloco [0.Setup] — Bootstrap e instanciação

- [ ] **0.1** **Bootstrap**: ler `roadmap/backlog.md` (spec ativa, prioridades, candidatas absorvidas) e `.core/process/governance-foundation.md` § "Tipos de spec".
- [ ] **0.2** **Tipo de spec** confirmado como `evidence-driven` no header da `spec.md`. Critério-teste: _"o design depende de evidência técnica/pesquisa ainda não coletada?"_ → **sim**.
- [ ] **0.3** **Slug semântico** definido (ex.: `<domínio>-<verbo-curto>`); o **número (NNNN)** só é alocado na criação da branch.
- [ ] **0.4** Branch `feat/spec-NNNN-<slug>` criada a partir de `main`.
- [ ] **0.5** `spec.md` instanciado a partir de `.specify/templates/spec-boilerplate.md`; header completo com `Tipo de spec: evidence-driven` e campo `Decision Brief` apontando para `./decision-brief.md`.
- [ ] **0.6** **[MANDATÓRIO]** Validação Humana inicial: owner aprova problema e escopo definidos no `spec.md` **antes** de avançar para Stage 1.
- [ ] **0.7** `plan.md` instanciado a partir de `.specify/templates/plan-boilerplate.md` com bloco **Stage 1 / Stage 2 placeholder** (Stage 2 fica em placeholder até o gate fechar).
- [ ] **0.8** `tasks.md` (este arquivo) instanciado a partir desta variante.
- [ ] **0.9** `decision-brief.md` instanciado a partir de `.specify/templates/decision-brief-boilerplate.md` com pontos `[DEC-NNNN-*]` listados em status `Pendente`, sem opções preenchidas (opções entram no sub-bloco [0.Brief]).
- [ ] **0.10** `roadmap/backlog.md` atualizado: spec movida para "Em execução"; candidatas absorvidas migradas para `roadmap/historico.md` com ponteiro à spec absorvedora.
- [ ] **0.11** `NEXT.md` instanciado (mandatório).
- [ ] **0.12** Criar Pull Request em Draft. O agente usa o template do repositório se existir (ex: `.github/pull_request_template.md`), preenchendo as informações da spec. Caso não exista template, adicionar uma descrição concisa do contexto e escopo inicial.
- [ ] **0.[COMMIT]** texto de commit atômico sugerido: "chore(spec-NNNN): setup inicial da spec". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar ao usuário.

### Sub-bloco [0.Research] — Stage 1: produzir researches

> Pesquisa instrumental, externa ou empírica que alimenta os pontos `[DEC-NNNN-*]` do `decision-brief.md`. **Toda research deve alimentar pelo menos um ponto `[DEC-*]`** — research que não alimenta está fora de escopo.
>
> **Critério de parada (ver `governance-foundation.md` § "Contrato da cadeia"):** a research **para quando há material suficiente para decidir**, não quando resta uma única resposta. Decidir é proibido à research — ela entrega **opções vivas e comparáveis** (simetria informacional: mesmo conjunto mínimo de perguntas por opção, inclusive "quando NÃO escolher") ao decision-brief, declarando o `Modo de gate` (`escolha`/`aceitação`); não entrega uma conclusão. **Torna comparável, não convence.**

- [ ] **0.R.1** Listar perguntas de research a responder (uma linha por arquivo) em `plan.md` § Research lifecycle, cada pergunta cruzada com o ponto `[DEC-*]` correspondente.
- [ ] **0.R.2** Produzir `research/YYYY-MM-DD-<tema>.md` por pergunta. Cada arquivo cita fontes (URL + ID externo quando aplicável: CWE-NNN, paper, benchmark publicado, transcrição).
- [ ] **0.R.3** Validar critério: cada research cobre pelo menos uma pergunta do `plan.md` E alimenta pelo menos um ponto `[DEC-*]`. Sem ambos, research sai do escopo (mover para `_drafts/` ou descartar).
- [ ] **0.R.4** Análise de débitos: atualizar `NEXT.md` com eventuais insights secundários.
- [ ] **0.R.[COMMIT]** texto de commit incremental sugerido: "research(spec-NNNN): sínteses Stage 1 publicadas". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar.

### Sub-bloco [0.Brief] — Stage 1: popular `decision-brief.md` com opções

> Cristalizar o que research mostra como **opções com tradeoffs**, sem cravar decisão. Recomendação inicial é opcional (incluir quando há evidência convergente em ≥ 1 research). Opções divergentes ficam abertas para o gate.

- [ ] **0.B.1** Para cada `[DEC-NNNN-*]`: registrar Pergunta + **Modo de gate** + Contexto (research) + **ou** Opções no **conjunto mínimo** (Problema · Benefícios · Tradeoffs · Riscos · Quando escolher · Quando NÃO escolher — **nunca Pró/Contra**; Formas B/C, modo `escolha`) **ou** o finding convergido (Forma D, modo `aceitação`). Recomendação inicial **só em `escolha`** e _bounded_. Pontos complexos podem ser decompostos em sub-eixos.
- [ ] **0.B.2** Cross-refs entre pontos: pontos com dependência mútua explicitam o vínculo (ex.: "redação final depende de `[DEC-NNNN-AYY]`").
- [ ] **0.B.3** Tabela "Resumo de status" no fim do brief com todos os pontos em `Pendente`.
- [ ] **0.B.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **0.B.[COMMIT]** texto de commit incremental sugerido: "docs(spec-NNNN): decision-brief.md populado com opções Stage 1". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar.

### Sub-bloco [0.Gate] — Gate humano (decision-brief → Resolved)

> **[MANDATÓRIO]** Stage 2 (Fase 1+) só inicia após este gate fechar. Pontos podem resolver em rodada única ou em múltiplas rodadas; status `Partial` é estado válido enquanto algumas decisões esperam mais research.

- [ ] **0.G.1** Owner revisa `decision-brief.md` com todos os pontos `[DEC-NNNN-*]` em status `Pendente` e opções preenchidas.
- [ ] **0.G.2** Para cada ponto, conforme o **`Modo de gate`** (`escolha` = owner arbitra entre opções vivas; `aceitação` = owner aceita / rejeita / reenquadra um finding convergido — ver `governance-foundation.md` § "Contrato da cadeia"): owner crava o ato + justificativa + data no bloco "Decisão do Gate Humano"; status muda para `Resolved`.
- [ ] **0.G.3** Pontos que demandem mais research voltam para [0.Research] com tarefa derivada. Iterar até zero pontos `Pendente`/`Partial`.
- [ ] **0.G.4** Status agregado do `decision-brief.md` mudado para `Resolved` (data + owner). Bloco final "✅ Gate fechado" assinado.
- [ ] **0.G.5** `plan.md` v2 publicado: seções de design técnico derivadas das decisões cravadas. Cada subseção referencia o `[DEC-NNNN-*]` correspondente. Stage 2 deixa de ser placeholder.
- [ ] **0.G.6** `tasks.md` v2: este arquivo é atualizado — Fases 1–4 abaixo passam de placeholder para tasks operacionais derivadas do plan v2. Status atualizado para `In Progress (Stage 2)`.
- [ ] **0.G.7** Análise de débitos: atualizar `NEXT.md`.
- [ ] **0.G.[COMMIT]** texto de commit atômico sugerido: "docs(spec-NNNN): gate humano fechado — plan v2 + tasks v2 publicados". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar.

---

## Fase 1 — Implementação A (Stage 2)

> Primeiro sub-bloco de implementação derivado do `plan.md` v2. Cada sub-bloco encerra com **commit incremental atômico** — atomicidade tipo "história de usuário concluída", não "fim do dia". A IA deve fornecer a sugestão de commit como saída padrão de fechamento, sem perguntar. Cada sub-bloco referencia explicitamente o `[DEC-NNNN-*]` que o alimenta.

> **Nota — promoção de regra.** Se a spec promover regra editorial / de processo / de IA, classificar explicitamente como **universal** × **opt-in** (cf. `.core/process/governance-foundation.md` § "Categorias de regras").

### Sub-bloco [A] — [nome do sub-bloco no plan]

> Origem: [`<seção do plan>`](./plan.md#...) e [`[DEC-NNNN-XYZ]`](./decision-brief.md#dec-nnnn-xyz).

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
