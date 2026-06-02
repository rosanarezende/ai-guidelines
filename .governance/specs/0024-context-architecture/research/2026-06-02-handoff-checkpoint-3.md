# Handoff operacional — Spec 0024, abertura do Checkpoint 3 (sessão nova)

> Documento de **retomada**, não resumo histórico. Assume zero acesso à conversa anterior. Objetivo: abrir o **Checkpoint 3 (GG-0003)** sem reabrir o que já fechou. **Supersede** `2026-06-02-handoff-next-session.md` para o estado pós-2.4d.

## 1. Estado Atual

- **Spec:** `0024-context-architecture`
- **Branch ativa:** `feat/spec-0024-ruleset-producibility` (= PR **#33**, _sequence_ 1 — primeiro PR de execução; a **base da stack** é #32 / `feat/spec-0024-context-architecture`)
- **PR #33:** **Ready** (`isDraft: false` — convertido para Ready for review per CORE-10 / ADR 0024), **gate APPROVED**. Commits: `90de5ba` (2.4d feat) → `4de3600` (fix A/C) → `af2d88c` (review artifact) → `db244c7` (fechamento do gate).
- **CI #33:** clean (`mergeState: CLEAN`). `yarn validate` verde. Git limpo.
- **#33 embarca:** 2.2 · 2.2b · 2.3 · 2.3a · 2.3b · 2.4 · 2.4a · 2.4b · 2.4c · **2.4d**.
- **Gate do #33:** **FECHADO** — `gates/c2.4d.yml` `approved` (PR INTEIRO, keyado no cursor 2.4d, **não** retroativo por checkpoint). `reviews/c2.4d-architectural_review.yml` (F1/F2 `accepted`, F3 `dismissed`-deferido) + `c2.4d-resolutions.yml`. `review:check` verde. Human Gate ratificado (owner **APPROVED**, 2026-06-02).

## 2. O que o 2.4d entregou (NÃO reabrir)

- **Disclosure de IA = projeção de PROCESSO derivada.** Renderer puro `src/cli/disclosureRender.ts` (`yarn disclosure`): deriva de `consolidate()` (review-as-artifact) ∩ os checkpoints que o PR embarca (`state.yml § topology`). Projeta: nº de revisões, categorias (roles), findings emitidos/resolvidos, existência+estado do gate. **ZERO artefato/schema novo.** Fora do `validate` (é gerador, não check).
- **Explicitamente REJEITADO (não rediscutir):** `Co-Authored-By`/git trailers como fonte canônica (autoria de commit ≠ participação no processo); `participants.yml`/`contributors.yml`/ledger/grafo (over-modeling — `actor → role` nasce falso, cardinalidade m:n que varia no tempo). Rastreabilidade de participação = objeto separado **deferido**.
- **"Implementação assistida por IA"** = frase **editorial** do template de PR (manual, editável; um PR pode ser puro-humano). Não é dado governado, schema nem check. Só revisões/findings/gate são derivados.
- **Falsificação (gate) fechou:** **A** (gateState "approved" exige cobertura total do escopo, senão `partial` — regra conservadora) + **C** (`violations` do `consolidate()` agora fatais no `main`). **B** (disclosure stale) **deferido**.

## 3. Decisões cravadas (Resolved — NÃO reabrir)

- `[DEC-0024-G00]`/`G02`/`G06`/`G07` (decision-brief, todas Resolved).
- Disclosure: processo-derivado, sem participants, sem trailers (ver §2; memória `disclosure-participation-not-authorship`).
- `governance-pr-check` é **required**. `review-as-artifact` + **anti-autoaprovação** = dogfood (sem DEC). Limite honesto: tamper-**evidence**, não prevenção (ADR 0021).

## 4. Próximo: Checkpoint 3 — GG-0003 Consistency Projection Check

- **Objetivo (plan.md):** check **ESTRITAMENTE MECÂNICO** — `state.yml` = fonte de verdade + **lista FIXA de marcadores literais contraditórios** (`"Stage 1 ativo"`, `"gate aberto"`, brief `Pendente`…). **Sem parsing semântico.** Ataca o **drift silencioso SSOT→projeção** (o padrão recorrente nº 1; NEXT.md §10.1 e §10.9 "absorção exige projeção ao ponto de consumo").
- **⚠️ PRIMEIRO PASSO (design beat — alinhar com o owner ANTES de implementar):** a **lista FIXA de marcadores** + o mecanismo (quais docs varrer; que condição-vs-`state.yml` cada marcador checa). **Não cravar sozinho** ("não criar decisões sem gate").
- **Mecânica de abertura:** branch `feat/spec-0024-checkpoint-3` **stacked** sobre `feat/spec-0024-ruleset-producibility` (a linha da spec — NÃO off-`main`). Draft (CORE-09). Título pela topologia: `[🛠️2️⃣➜] [Spec 0024] Checkpoint 3 — …`. PR body usa o **disclosure derivado** (`yarn disclosure`), **sem texto manual**. Nasce dogfoodando review-as-artifact.
- **Topologia ao abrir (`state.yml § topology`, G07):** mover **#33 → `concluded`** (gate aprovado) e **checkpoint-3 → `active`** com `github_pr` = novo PR. `state-yml:check` valida invariantes (sequence única/contígua; `github_pr` ⟺ active/concluded).
- **Padrão de fechamento do 3:** implementa (check + fixture + testes no mesmo commit) → Technical Audit → Architectural Review → Human Gate (artefatos `reviews/c3-*` + `gates/c3.yml`) → avança. Não mergeia em `main`.

## 5. Débitos remanescentes (follow-up, NÃO-bloqueantes — NEXT.md)

- **B — disclosure stale:** `governance-pr-check` valida só presença do header, não equivalência com a projeção. Fix = `disclosure:check` (detector de drift; marcadores `<!-- fatos-derivados:início/fim -->` já ancorados no template).
- **Alinhamento da cobertura do disclosure ao gate-por-PR:** granularidade decidida = **por-PR** (1 gate cobre o PR); a cobertura conservadora do A mede contra todos os `node.checkpoints`, então o disclosure lê "parcial 1 de N". Cosmético/advisory (o gate real é `review:check` + artefato). Acoplado a B.
- Pré-existentes: G06 CAMADA 1 (`decision-trace:check`); casa única de templates (`F-AG04`, Checkpoint 11B); protótipo 4A em `git stash`; paridade-API (ruleset + topologia↔git); reconciliação de fechamento de spec (reframe G08/G09; campo `decision`; `next` ainda parcialmente stale).

## 6. Disciplinas (invioláveis)

- **pt-BR** em toda saída. **HARNESS LOCK:** `yarn format ; yarn validate` antes de commit. **push/apply de ruleset só com autorização explícita do owner (CORE-07).**
- **1 checkpoint atômico por vez; parar no Gate.** Falsificação ativa. Correção local pequena não espera; mudança estrutural sim (Claude→Codex→ChatGPT→Rosana).
- **NÃO mergeia em `main`** (modo `unit`; merge único ao fim via `review.md` R8). NÃO tocar G08/G09 (reframe de absorção = decisão de fechamento).

## 7. Prompt de Retomada (colar em sessão nova)

```
Retome a execução da Spec 0024 (context-architecture). Abra o Checkpoint 3.

NÃO reabra arquitetura. NÃO refaça pesquisa. NÃO crie decisões sem gate.

Leia, nesta ordem:
- .governance/specs/0024-context-architecture/research/2026-06-02-handoff-checkpoint-3.md  (ESTE handoff — SSOT da retomada)
- .governance/specs/0024-context-architecture/state.yml  (§ topology = SSOT; § next)
- .governance/specs/0024-context-architecture/plan.md  (§ "Sequência de Checkpoints", linha do Checkpoint 3)
- .governance/specs/0024-context-architecture/reviews/README.md  (modelo review-as-artifact)

Estado: branch feat/spec-0024-ruleset-producibility, PR #33 (Ready) com gate APPROVED
(gates/c2.4d.yml; review:check verde; CI clean). #33 embarca 2.2→2.4d.

Objetivo: abrir o Checkpoint 3 (GG-0003 Consistency Projection Check) como PR stacked
feat/spec-0024-checkpoint-3, nascendo com review-as-artifact + disclosure derivado
(yarn disclosure, sem texto manual). PRIMEIRO alinhe com o owner a LISTA FIXA de
marcadores do GG-0003 (decisão de design — não cravar sozinho). Ao abrir, atualize a
topologia: #33 → concluded, checkpoint-3 → active com github_pr.

Disciplinas: pt-BR; yarn format ; yarn validate antes de commit; CORE-07; 1 checkpoint
por gate; falsificação ativa; NÃO mergeia em main (modo unit). Verifique git limpo +
yarn validate verde antes de qualquer ação.
```
