<!-- ai-guidelines-template: tasks-evidence-driven-boilerplate v=4 -->

# Tasks — Spec 0024 Handoff as First-Class — `evidence-driven`

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: In Progress (Stage 1)

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md § Decisões revisitadas` e ajustar tasks impactadas.

> **Variante `evidence-driven`.** A Fase 0 estende o Setup canônico com **Stage 1** (Research → Decision-Brief → Gate humano). **Nenhum design técnico cravado pré-research.** Stage 2 (Fase 1+) só inicia após o gate fechar.

---

## Fase 0 — Setup + Stage 1 (Research → Decision-Brief → Gate humano)

### Sub-bloco [0.Setup] — Bootstrap e instanciação

- [x] **0.1** Bootstrap: `roadmap/backlog.md` + `.core/process/governance-foundation.md` § "Tipos de spec" lidos na sessão de planejamento (2026-05-28).
- [x] **0.2** Tipo de spec confirmado: `evidence-driven` no header de `spec.md`. Critério: design depende de evidência ainda não coletada (análise comparativa de 5+ sistemas externos). **Sim.**
- [x] **0.3** Slug semântico: `handoff-as-first-class` (provisional — slug pode evoluir conforme research consolidar, conforme nota no spec.md header).
- [x] **0.4** Branch `feat/spec-0024-handoff-as-first-class` criada a partir de `main`.
- [x] **0.5** `spec.md` instanciado com `Tipo de spec: evidence-driven` e campo `Decision Brief` apontando para `./decision-brief.md`.
- [ ] **0.6** **[MANDATÓRIO]** Validação Humana inicial: owner aprova problema e escopo definidos no `spec.md` **antes** de avançar para Stage 1. _(Pendente — aguarda autorização textual da owner após revisão dos scaffolds neste PR.)_
- [x] **0.7** `plan.md` instanciado com bloco Stage 1 / Stage 2 placeholder.
- [x] **0.8** `tasks.md` (este arquivo) instanciado da variante `evidence-driven`.
- [x] **0.9** `decision-brief.md` instanciado com DECs `[DEC-0024-A01..F03]` em status `Open`, sem opções (opções entram no sub-bloco [0.Brief]). Preâmbulo "Síntese empírica" populado com 5 observações cravadas da sessão de planejamento.
- [x] **0.10** `roadmap/backlog.md` atualizado: `handoff-as-first-class` movida de `Now §1` para `Em execução` com cross-ref para a branch.
- [x] **0.11** `NEXT.md` instanciado.
- [ ] **0.12** Pull Request Draft criado usando `.github/pull_request_template.md`. _(Pendente — próxima ação operacional após [0.6].)_
- [x] **0.[COMMIT]** Commits da sessão de instanciação:
  - `chore(gitignore): adiciona temp/ (artefatos locais de pesquisa)` — separado por atomicidade.
  - `[🧾🔒] [Spec 0024] Bootstrap research-first — scaffold + decision-brief 5-eixos + Bloco A` — bootstrap principal.

### Sub-bloco [0.Research] — Stage 1: produzir researches

> Pesquisa instrumental, externa ou empírica que alimenta os pontos `[DEC-0024-*]`. **Toda research deve alimentar pelo menos um ponto `[DEC-*]`.** Os 5+ sistemas externos enumerados em `spec.md § Pesquisa de contexto` são alvos canônicos. Matriz pressão × sistema vive em `research/2026-05-28-pressure-axes-scope.md`.

- [/] **0.R.0** Inventário arquitetural (`research/2026-05-29-architectural-inventory.md`) — classificação Grupo A/B/C; **Fonte A** concluída e validada (owner, 2026-05-29). Corroboração **Fonte B** (externa) das classes do Grupo A pendente na research.
- [/] **0.R.1** Perguntas de research listadas em `plan.md § Research lifecycle`, cruzadas com `[DEC-0024-*]`. **Em andamento** — tabela inicial publicada; pode ganhar perguntas conforme research progride.
- [ ] **0.R.2** Produzir `research/YYYY-MM-DD-<sistema>.md` por sistema externo declarado em escopo (Hermes Agent, Cursor SDK, OpenCloud/OpenCode, Anthropic Dreaming in Cloud, Spec Kitty). Cada arquivo cita fontes (URL, transcrição, repo, paper).
- [ ] **0.R.G** **Research do Bloco G (fundacional, prioritário).** `G00` unidade primária (testar 4 hipóteses: `spec`/`pilar`/`lifecycle`/`artefato` — `lifecycle` é contender sério, obrigação de refutar); `G01` 7 pilares MECE; `G02` taxonomia de specs; `G03` promotion pipeline (reconcilia ADR 0010 + D04); `G04` contrato de boilerplate + core; `G05` modelo de projeção. **Fonte A + Fonte B** obrigatórias. `G00` resolve antes de A-F.
- [ ] **0.R.3** Validar critério de saída: **Bloco G fechado (`G00`-`G05` `Resolved`, Fonte A + B; G00 antes de A-F)**; ≥ 1 resposta evidence-backed por eixo A-F; ≥ 2 sistemas convergem em ≥ 2 respostas; Bloco A cresce para ≥ 8 observações.
- [ ] **0.R.4** Atualizar `NEXT.md` com insights secundários conforme emergirem.
- [ ] **0.R.[COMMIT]** Commits incrementais sugeridos por artifact:
  - `research(spec-0024): spec-kitty pressure analysis`
  - `research(spec-0024): hermes agent skill loop + memory tiers`
  - `research(spec-0024): cursor SDK harness anatomy`
  - `research(spec-0024): anthropic dreaming in cloud — curated memory`
  - `research(spec-0024): open code provider-agnostic patterns`
  - (opcional) `research(spec-0024): graph-based orchestration systems`

### Sub-bloco [0.Brief] — Stage 1: popular `decision-brief.md` com opções

> Cristalizar o que research mostra como **opções com tradeoffs**, sem cravar decisão. Recomendação inicial opcional (incluir quando evidência convergente em ≥ 1 research).

- [ ] **0.B.1** Para cada `[DEC-0024-XYZ]`: registrar Pergunta + Contexto (research) + Opções (com Pró/Contra) + Recomendação inicial (opcional). Pontos complexos decompostos em sub-eixos (Forma C).
- [ ] **0.B.2** Cross-refs entre pontos: pontos com dependência mútua explicitam vínculo.
- [ ] **0.B.3** Atualizar tabela "Resumo de status" — todos os pontos em `Pendente` (saíram de `Open`).
- [ ] **0.B.4** Atualizar `NEXT.md`.
- [ ] **0.B.[COMMIT]** `docs(spec-0024): decision-brief populado com opções Stage 1`.

### Sub-bloco [0.Gate] — Gate humano (decision-brief → Resolved)

> **[MANDATÓRIO]** Stage 2 (Fase 1+) só inicia após este gate fechar.

- [ ] **0.G.1** Owner revisa `decision-brief.md` com todos os pontos `[DEC-0024-XYZ]` em `Pendente` e opções preenchidas.
- [ ] **0.G.2** Para cada ponto: owner escolhe opção (ou propõe nova), preenche bloco "Decisão do Gate Humano" + data + justificativa; status → `Resolved`.
- [ ] **0.G.3** Pontos que demandem mais research voltam para [0.Research] com task derivada. Iterar até zero pontos `Pendente`/`Partial`.
- [ ] **0.G.4** Status agregado do `decision-brief.md` mudado para `Resolved`. Bloco "✅ Gate fechado" assinado.
- [ ] **0.G.5** `plan.md` v2 publicado: design técnico derivado das decisões cravadas. Cada subseção referencia `[DEC-0024-XYZ]` ancorante. Stage 2 deixa de ser placeholder.
- [ ] **0.G.6** `tasks.md` v2: Fases 1–4 abaixo passam de placeholder para tasks operacionais. Status atualizado para `In Progress (Stage 2)`.
- [ ] **0.G.7** Atualizar `NEXT.md`.
- [ ] **0.G.[COMMIT]** `docs(spec-0024): gate humano fechado — plan v2 + tasks v2 publicados`.

---

## Fase 1 — Implementação A (Stage 2, dentro da 0024)

> **[PLACEHOLDER]** Tasks operacionais de Stage 2 emergem do `plan.md` v2 pós-gate.
>
> **Framing cravado (owner, 2026-05-29):** a implementação é entregue **dentro desta spec** (Stage 2), derivada do plan v2 — handoff como projeção + ≥ 1 boilerplate/example de **referência** provando o contrato `G04`. O split `0024 → 0025` **não é pressuposto** (só se a research revelar mudança de direção relevante). Cada DEC `Resolved` do Bloco G gera ≥ 1 artefato implementável de referência (guardrail anti-"super ADR"). **Fronteira:** a implementação de referência **não** é autorização para migração em massa (Grupo B). Esta Fase 1 **será populada** com tasks de implementação após o gate, não esvaziada.
>
> **Reinterpretação de Stage 2 (2026-05-29):** a implementação de referência é, antes de tudo, **validação arquitetural** — prova que o modelo decidido no Bloco G consegue ser materializado. Não é só "construir"; é "provar que a arquitetura se materializa" antes de generalizar (migração ampla = Grupo B). Cf. NEXT § lifecycle `Research → Decision Session → Reference Implementation → Generalization`.

### Sub-bloco [A] — [a definir pós-gate]

- [ ] **1.A.1** [pendente — emerge do plan v2]

---

## Fase Extra Condicional (Implementação B, Migração, etc.)

> **[PLACEHOLDER]** Tipicamente não-aplicável a spec research-first. Definido pós-gate se necessário.

---

## Fase de Review → vive em `review.md`

> **Modelo de 3 boundaries (cf. `[DEC-0023-M01]`):** homologação / prontidão vive em `review.md` (instanciado pós-Stage 2). `tasks.md` é execution-only e fecha 100% `[x]` ao fim da execução. O "fim da execução" = gate fechado + plan v2 + tasks v2 + **implementação de referência (Stage 2) concluída** (100% `[x]`), dentro da própria 0024.

---

## Fase de Encerramento → vive em `release-log.md`

> **Operações pós-merge** vivem em `release-log.md` (instanciado pós-Stage 2 se aplicável). O encerramento cobre as decisões fundacionais cravadas + a implementação de referência entregue dentro da 0024; a **migração ampla (Grupo B)** permanece nas candidatas re-escopadas, não nesta spec.
