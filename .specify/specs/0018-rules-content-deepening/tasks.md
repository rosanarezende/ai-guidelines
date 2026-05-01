# Tasks — Spec 0018 Rules Content Deepening

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: Draft (revised 2026-04-30) — **Stage 1 (Research)**

> **Progress file vivo, em duas etapas.** Stage 1 (abaixo) cobre Setup +
> Research + Síntese de opções + Gate humano. Fases de Stage 2 (catálogo,
> eval, reconciliação, validação cruzada, encerramento) ficam como
> placeholder e são preenchidas após o gate, refletindo as decisões
> validadas em `decision-brief.md`.

> **Reabertura 2026-04-30:** estrutura abaixo substitui integralmente as
> Fases 1+ das versões anteriores. Tasks A.1, A.2, B.1 marcadas `[x]` na
> versão pré-revisão referem-se ao conteúdo de `b9efb83`, agora preservado
> no Anexo do `plan.md` e tratado como rascunho candidato para reconciliação
> em Stage 2.

---

## Fase 0 — Setup

- [x] **0.1** Branch `feat/spec-0018-rules-content-deepening` criada a partir de `main`.
- [x] **0.2** `spec.md` instanciado a partir de `.specify/templates/spec-boilerplate.md`.
- [x] **0.3** **[MANDATÓRIO]** Validação Humana inicial: aprovação do problema e escopo (chat).
- [x] **0.4** `plan.md` e `tasks.md` criados.
- [x] **0.5** `roadmap/backlog.md` atualizado: spec 0018 em "Em execução".
- [x] **0.6** Reabertura formal: `spec.md`, `plan.md` e `tasks.md` reescritos como `Draft (revised 2026-04-30)`.
- [x] **0.7** Refatoração pass 2: estrutura Stage 1 + Gate adotada após feedback do owner.
- [x] **0.8** Criar `decision-brief.md` inicial com pontos `[DEC-0018-A01]`–`[DEC-0018-A06]` (Bloco A) e `[DEC-0018-B01]`–`[DEC-0018-B08]` (Bloco B), todos em status `Pendente`, sem opções preenchidas (opções entram durante Fases 1 e 2).
- [x] **0.9** **[MANDATÓRIO]** Validação Humana da revisão pass 2: aprovar a estrutura A+B em Stage 1 + Gate antes de iniciar Fase 1. Owner sinalizou "iniciar a Fase 1 (A.0 audit dos boilerplates)" em 2026-05-01.

---

## Fase 1 — Bloco A (Stage 1): Auditoria research-backed dos boilerplates

### Sub-bloco [A.0] — Auditoria

- [x] **A.0.1** Inventariar os 7 boilerplates em `.specify/templates/`: campos, propósito declarado, vocabulário usado. — Output: `research/2026-04-30-boilerplates-audit.md` § 2.
- [x] **A.0.2** Mapear como specs executadas (0008, 0015, 0016, 0017, 0018-rev0) preencheram cada artefato — capturar campos ignorados, campos ad-hoc adicionados, seções que cresceram informalmente. — Output: § 3 (drift estrutural).
- [x] **A.0.3** Cross-check entre boilerplates × `docs/process/spec-foundation.md`: detectar drift bidirecional (políticas ausentes em boilerplate; campos ausentes em política). — Output: § 4.
- [x] **A.0.4** Catalogar lacunas trazidas pela prática: "Decisão de Fusão", "Decisões revisitadas", "Tipo de spec" (conteúdo × infra), "Cross-refs com specs irmãs", "Conteúdo candidato pré-research", outras emergentes. — Output: § 5 (16 lacunas L1–L16).
- [x] **A.0.5** Catalogar ruído removível: campos que nunca foram preenchidos. — Output: § 6 (7 itens R1–R7).
- [x] **A.0.6** Avaliar dogfood: o `decision-brief.md` desta spec funcionou? Que campos, IDs, transições de status foram úteis ou problemáticos? Que melhorias informam o futuro `decision-brief-boilerplate.md`? — Output: § 7 (D1–D18).
- [x] **A.0.7** Produzir matriz **boilerplate × manter | revisar | adicionar | remover** com justificativa por linha em `research/2026-04-30-boilerplates-audit.md`. **Sem decisões finais** — apenas opções estruturadas. — Output: § 8 (8.1 a 8.8, incluindo o 8º artefato `decision-brief-boilerplate.md`).

### Sub-bloco [A.1] — Popular `decision-brief.md` com opções (Bloco A)

- [x] **A.1.1** A partir da matriz de A.0, popular `[DEC-0018-A01]` (updates por boilerplate, umbrella com sub-rows) com opções e tradeoffs. — Sub-rows A01.1 a A01.8 com itens `[manter|revisar|adicionar|remover]` referenciando audit § 8.1–8.8.
- [x] **A.1.2** Popular `[DEC-0018-A02]` (estrutura do campo "Tipo de spec") com opções. — 4 sub-eixos (cardinalidade / semântica / default / diferenciação operacional) com opções A–C.
- [x] **A.1.3** Popular `[DEC-0018-A03]` (localização e formato da política content × infra em `spec-foundation.md`) com opções. — 3 sub-eixos (localização interna / formato / sincronização do drift bidirecional § 4.2).
- [x] **A.1.4** Popular `[DEC-0018-A04]` (texto da linha em `global-rules.md`) com candidatos. — 2 sub-eixos (subseção / redação) com 4 candidatos textuais (A–D).
- [x] **A.1.5** Popular `[DEC-0018-A05]` (formato do `decision-brief-boilerplate.md`) com opções derivadas do dogfood (A.0.6). — 5 sub-eixos cobrindo D8–D17 da auditoria.
- [x] **A.1.6** Popular `[DEC-0018-A06]` (localização física da seção "Tipos de spec" + workflow em dois passes) com opções. — Já populado na criação do brief; cross-ref para audit § 4.3 e § 9 adicionada.

---

## Fase 2 — Bloco B (Stage 1): Research lifecycle e opções

### Sub-bloco [B.0] — Research

- [ ] **B.0.1** `research/2026-04-30-benchmark-rules-content.md` — provedores (Anthropic, OpenAI, Google), OSS curado (Kong, ClickHouse, Bun, multica), `awesome-cursorrules`, Continue, Aider conventions.
- [ ] **B.0.2** `research/2026-04-30-empirical-bugs-ai-code.md` — METR, SWE-bench, Aider eval, estudos sobre falhas em código IA.
- [ ] **B.0.3** `research/2026-04-30-external-bug-taxonomies.md` — CWE, SEI CERT, Sonar, OWASP-LLM.
- [ ] **B.0.4** `research/2026-04-30-spec-driven-tools-rules.md` — Spec Kit, BMAD, OpenSpec, Continue, Aider; foco em rules editoriais e decisões pré-design.
- [ ] **B.0.5** `research/2026-04-30-tokens-baseline-budget.md` — medição instrumental do `<AI_GUIDELINES>` atual + projeção de teto.

### Sub-bloco [B.1] — Popular `decision-brief.md` com opções (Bloco B)

- [ ] **B.1.1** Popular `[DEC-0018-B01]` (taxonomia das categorias de regras) com opções.
- [ ] **B.1.2** Popular `[DEC-0018-B02]` (colocação por categoria) com opções.
- [ ] **B.1.3** Popular `[DEC-0018-B03]` (orçamento de tokens) com opções e medições baseline.
- [ ] **B.1.4** Popular `[DEC-0018-B04]` (formato do catálogo de regras) com opções.
- [ ] **B.1.5** Popular `[DEC-0018-B05]` (metodologia do eval) com opções.
- [ ] **B.1.6** Popular `[DEC-0018-B06]` (fronteira com Spec 0011) com opções.
- [ ] **B.1.7** Popular `[DEC-0018-B07]` (fronteira com Spec 0009) com opções.
- [ ] **B.1.8** Popular `[DEC-0018-B08]` (política de reconciliação do b9efb83) com opções.

---

## Fase 3 — Gate humano (decision-brief → Resolved)

> **[MANDATÓRIO]** Stage 2 só inicia após este gate.

- [ ] **3.1** Owner revisa `decision-brief.md` com todos os pontos `[DEC-0018-*]` em status `Pendente` e opções preenchidas.
- [ ] **3.2** Para cada ponto: owner escolhe opção (ou propõe nova), preenche bloco "Decisão" com escolha + justificativa + data; status muda para `Resolved`.
- [ ] **3.3** Pontos que demandem mais research voltam para Fase 1/2 com tarefa derivada — não bloqueiam outros pontos. Status agregado pode permanecer `Partial` enquanto isso.
- [ ] **3.4** Quando todos os pontos estiverem `Resolved`: status agregado do `decision-brief.md` muda para `Resolved`, com a data registrada na frontmatter.
- [ ] **3.5** `plan.md` v2: reescrever sub-blocos A.2–A.6 e B.2–B.5 com desenho técnico derivado das decisões; cada nova subseção referencia o `[DEC-*]` correspondente.
- [ ] **3.6** `tasks.md` v2: substituir o placeholder abaixo (Fases 4+) por tasks operacionais derivadas do plan v2.

---

## Fase 4+ — Stage 2 (placeholder; preencher pós-Gate)

> Tasks de implementação derivam das decisões registradas em `decision-brief.md`
> e do `plan.md` v2. Esqueleto antecipado (sujeito a reescrita pós-gate):
>
> - **Fase 4** — Bloco A: aplicar updates nos boilerplates + criar `decision-brief-boilerplate.md` + sincronizar `spec-foundation.md` + linha em `global-rules.md`.
> - **Fase 5** — Bloco B: construir catálogo de regras conforme formato validado.
> - **Fase 6** — Bloco B: executar eval conforme metodologia validada; registrar em `research/2026-04-30-eval-results.md`.
> - **Fase 7** — Bloco B: reconciliação do conteúdo b9efb83 conforme política validada (decisão por regra: manter | revisar | reverter); aplicar em `.core/rules/*`.
> - **Fase 8** — Validação cruzada e PR Draft.
> - **Fase 9** — Encerramento (mirror Fase 3 do `tasks-boilerplate.md`).

---

## Encerramento (após merge — Fase 9 do Stage 2)

> **[MANDATÓRIO]** Antes de abrir spec nova, completar este checklist (a ser
> reescrito como Fase 9 numerada após Gate, mantendo este conteúdo como base).

- [ ] **F9.1** `NEXT.md` (se criado em `[DEC-0018-B06]`/`[DEC-0018-B07]`): migrar débitos relevantes para `roadmap/backlog.md` e **deletar** o arquivo.
- [ ] **F9.2** `research/`: renomear cada arquivo significativo para `YYYY-MM-DD-nome.md` (já feito) e mover para `.specify/specs/researchs/governance/` ou `architecture/` conforme domínio. Adicionar link e resumo em `.specify/specs/research-index.md`.
- [ ] **F9.3** `decision-brief.md` permanece no diretório da spec como artefato histórico (não migra).
- [ ] **F9.4** `spec.md` header: status → `Done`.
- [ ] **F9.5** `roadmap/historico.md`: spec movida para "Specs concluídas" com data; entrada removida da seção "Em execução" em `roadmap/backlog.md`.
- [ ] **F9.6** Confirmar que nenhuma spec subsequente foi aberta antes deste encerramento.
