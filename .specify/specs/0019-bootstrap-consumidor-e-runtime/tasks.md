# Tasks — Spec 0019 Bootstrap Consumidor e Runtime — `mixed`

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: Draft

---

## Fase 0 — Setup + Stage 1 (Research → Decision-Brief → Gate humano)

### Sub-bloco [0.Setup] — Bootstrap e instanciação

- [x] **0.1** **Bootstrap**: ler `roadmap/backlog.md` e `.core/process/spec-foundation.md`.
- [x] **0.2** **Tipo de spec** confirmado como `mixed` no header da `spec.md`.
- [x] **0.3** **Slug semântico** definido (`0019-bootstrap-consumidor-e-runtime`).
- [x] **0.4** Branch `feat/spec-0019-bootstrap-consumidor-e-runtime` criada a partir de `main`.
- [x] **0.5** `spec.md` instanciado.
- [x] **0.6** **[MANDATÓRIO]** Validação Humana inicial: owner aprova problema e escopo.
- [x] **0.7** `plan.md` instanciado com os blocos A `(deterministic)` e B `(evidence-driven)`.
- [x] **0.8** `tasks.md` instanciado.
- [x] **0.9** `decision-brief.md` instanciado.
- [x] **0.10** `roadmap/backlog.md` atualizado: spec movida para "Em execução".
- [x] **0.11** `NEXT.md` instanciado (mandatório).
- [x] **0.12** Criar Pull Request em Draft. O agente usa o template do repositório se existir (ex: `.github/pull_request_template.md`), preenchendo as informações da spec. Caso não exista template, adicionar uma descrição concisa do contexto e escopo inicial.

### Sub-bloco [0.Research] — Stage 1: produzir researches

- [x] **0.R.1** Listar perguntas de research a responder em `plan.md`.
- [x] **0.R.2** Produzir `research/YYYY-MM-DD-<tema>.md` por pergunta.
- [x] **0.R.3** Validar critério: cada research cobre perguntas do `plan.md`.
- [x] **0.R.4** Análise de débitos: registrar em `NEXT.md` insights que fujam do escopo.
- [x] **0.R.[COMMIT]** texto de commit incremental sugerido: "research(spec-0019): sínteses Stage 1 publicadas"

### Sub-bloco [0.Brief] — Stage 1: popular `decision-brief.md` com opções

- [x] **0.B.1** Para cada `[DEC-0019-*]`: registrar Pergunta + Contexto + Opções.
- [x] **0.B.2** Cross-refs entre pontos.
- [x] **0.B.3** Tabela "Resumo de status" no fim do brief.
- [x] **0.B.4** Análise de débitos: registrar em `NEXT.md` opções descartadas que viram débitos.
- [x] **0.B.[COMMIT]** texto de commit incremental sugerido: "docs(spec-0019): decision-brief.md populado com opções Stage 1"

### Sub-bloco [0.Gate] — Gate humano (decision-brief → Resolved)

- [x] **0.G.1** Owner revisa `decision-brief.md` com todos os pontos `[DEC-0019-*]`.
- [x] **0.G.2** Para cada ponto: owner escolhe opção e justifica; status muda para `Resolved`.
- [x] **0.G.3** Iterar se necessário.
- [x] **0.G.4** Status agregado mudado para `Resolved`.
- [x] **0.G.5** `plan.md` v2 publicado (seções de design técnico `(evidence-driven)` derivadas das decisões).
- [x] **0.G.6** `tasks.md` v2: atualizar Fases 1–4.
- [x] **0.G.7** Análise de débitos para o `NEXT.md`.
- [x] **0.G.[COMMIT]** texto de commit atômico sugerido: "docs(spec-0019): gate humano fechado — plan v2 + tasks v2 publicados"

---

## Fase 1 — Implementação A (Stage 2)

### Sub-bloco [A] — CLI Wizard & Template Distribution `(deterministic)`

- [x] **1.A.1** Atualizar scripts de init e adopt para copiar a pasta `.specify/templates` para `.ai-guidelines/templates` no consumidor.
- [x] **1.A.2** Refatorar wizard para apresentar prompts de features em categorias (Editoriais, Processo, etc).
- [x] **1.A.2.1** Persistir `.ai-guidelines/config.json` com `sdd_dir`, `providers` e `adapters`.
- [x] **1.A.3** Remover arquivo legado `.core/templates/AGENTS-pointer.md.tmpl` e referências na compilação.
- [x] **1.A.N** Pipeline de check + test verde.
- [x] **1.A.4** Análise de débitos para o `NEXT.md`.
- [x] **1.A.[COMMIT]** texto de commit incremental sugerido: "feat(spec-0019): CLI Wizard & Template Distribution"

### Sub-bloco [B] — Runtime Architecture & Trampolines `(evidence-driven)`

- [x] **1.B.1** Implementar scaffolding de trampolins e ignore files por provider selecionado.
- [x] **1.B.1.1** Criar comando `providers` para adicionar/atualizar trampolins sem rerodar `adopt`.
- [x] **1.B.2** Atualizar `compiler.mjs` para zones temáticas e interpolação via `sdd_dir`.
- [x] **1.B.N** Pipeline de check + test verde.
- [x] **1.B.3** Análise de débitos para o `NEXT.md`.
- [x] **1.B.[COMMIT]** texto de commit incremental sugerido: "feat(spec-0019): Runtime Architecture & Trampolines"

---

## Fase 2 — Implementação B (Stage 2)

(Fundido na Fase 1, já que os sub-blocos A e B cobrem o escopo técnico, salvo descoberta de novos sub-blocos).

---

## Fase 3 — Preparação para Review (Gate de Homologação)

- [ ] **3.1** Atualizar header da `spec.md`: status → `In Review`.
- [ ] **3.2** Pipeline canônico verde (`yarn check:repo` ou similar).
- [ ] **3.3** Critérios de aceite de `spec.md` e DoD de `plan.md` confirmados.
- [ ] **3.4** `decision-brief.md`: validar pontos `Resolved` contra o design.
- [ ] **3.5** Validar a entrega em ambiente real (`adopt --dry-run`).
- [ ] **3.6** PR atualizado com descrição em 3 etapas.
- [ ] **3.7** **[MANDATÓRIO]** Aguardar Gate de Review Humano.
- [ ] **3.8** Aplicar correções.

---

## Fase 4 — Encerramento Pré-Merge

- [ ] **4.1** `NEXT.md` deletado se existir e pendências migradas.
- [ ] **4.2** Migração de research.
- [ ] **4.3** `decision-brief.md` permanece no diretório da spec.
- [ ] **4.4** `spec.md` header atualizado.
- [ ] **4.5** `roadmap/historico.md` atualizado.
- [ ] **4.6** `CHANGELOG.md` atualizado (se aplicável).
- [ ] **4.7** Confirmar limites por sessão.
- [ ] **4.8** Commit `chore(spec-0019): encerramento pré-merge`.
- [ ] **4.9** **[MANDATÓRIO]** Aprovação humana explícita para merge.
