---
artifact-kind: pre-coding-review
subject: "a abertura do trabalho é polimórfica por kind (não um intent-brief coeso único); simulação de repo multi-tipo para falsificar os templates de abertura/registro"
date: 2026-06-24
reviewer: internal
method: assessment
---

# Pre-coding review — a abertura é polimórfica por kind (simulação de repo multi-tipo)

> **Natureza:** `pre-coding-review` (dogfood). **Não-autoridade**, não decide, não implementa. Em divergência
> vencem `state.yml`, `tasks.md`, `decision-brief.md`, `reviews/`+`gates/`, Git/GitHub. **Lifecycle:** este
> review → DEC (refina a G25/§D1) → execução. **Linhagem:** `intent-brief` research §3/§7(b)/§8 ·
> `governed-work-flow-model` (fechamento polimórfico) · ADR 0010 (Virtual no registry) · ADR 0022/`pr-bodies`
> (GitHub não é memória) · `GG-0005`.

## 1. O erro detectado (FATO — regressão contra o próprio grounding)

O dogfood tratou a abertura como **"um `intent-brief` coeso, igual para todos"**. Dois pontos regrediram
contra o que a própria research já decidira:

**(a) Virtual modelado como _inline no PR_.** `_flow-model-dogfood/_TEMPLATE.intent-inline.md` e
`_examples-by-kind/virtual-inline.md` dizem _"na prática vão no corpo do PR/registro, **não num arquivo**"_.
Isso **contradiz** o `intent-brief` research **§7(b)**, que concluíra: Virtual mora num **registry versionado**
(ADR 0010: _"apenas no registry"_), e _"inline no PR/commit é o degrau **menos durável**"_ (branch/squash
deletável). É exatamente o **"GitHub como fonte da verdade"** que a doutrina (`pr-bodies/` + ADR 0022) rejeita.
**O repo é a fonte, não o GitHub.**

**(b) Incident modelado como `sealed: true`.** `_examples-by-kind/incident_hook-windows.md` tem `sealed: true`
no frontmatter **mas** o corpo diz _"doc **vivo**, não sela"_ — **contradição interna**. Incident é reativo:
acretua causa-raiz/prevenção, não sela.

## 2. A tese corrigida

> A abertura tem um **conceito comum** (registrar intenção/contexto para iniciar o trabalho) mas **forma física
> e ciclo POLIMÓRFICOS por kind**. Não é "um arquivo `intent-brief` para todos" — é uma **família** cuja
> materialização e selagem variam.

| kind                 | Abertura (forma física)       | Selagem                                | Fecho (eixo Resultado)           | Onde mora                          |
| -------------------- | ----------------------------- | -------------------------------------- | -------------------------------- | ---------------------------------- |
| `delivery`           | arquivo `intent-brief.md`     | **selado** (questions ligam back)      | `gate` (capacidade entregue)     | pasta-workspace                    |
| `experiment`         | arquivo `intent-brief.md`     | **sela a HIPÓTESE** (anti-mover-trave) | `learning-record` (won→promotes) | pasta-workspace                    |
| `spike`              | arquivo `intent-brief.md`     | leve; **time-boxed**                   | `learning-record` (resposta)     | pasta-workspace                    |
| `incident`           | arquivo `intent-brief.md`     | **NÃO sela — DOC VIVO**                | postmortem (o próprio doc)       | pasta-workspace                    |
| `proposal/patch/fix` | **entrada em `registry.yml`** | n/a                                    | promoção / commit+verificação    | **registry versionado, sem pasta** |

→ **`sealed` deixa de ser booleano universal:** é **propriedade por kind** (delivery/experiment selam;
incident **não**; spike leve). O template de abertura não pode cravar `sealed: true` para todos.

## 3. Onde mora o intent de um Virtual (resolve o §7b)

**Proposta: uma pasta `registry/` versionada, um arquivo por kind** (`registry/<kind>.yml`, os 7 — MECE). É o
**índice de trabalhos do repo, particionado por natureza**: para **Virtual** (proposal/patch/fix) a entrada
**é** o trabalho (1 linha, durável no repo, **não** no GitHub); para **Dense** a entrada **indexa** o
`workspace` (o detalhe mora no `intent-brief`). A burocracia escala com o peso. Schema:
`_templates/registry-entry.yml`. Pré-requisito real (fundacional, fora do #45): materializar o `registry/`
(ADR 0010 prevê o registry). _(Um `registry.yml` único com todos os tipos juntos **não escala** — owner
2026-06-24; por isso a pasta por-kind.)_

## 4. O instrumento: simulação de repo multi-tipo (`_repo-simulation/`)

Em vez de **um único delivery auto-referente** (`_flow-model-dogfood/`), uma **simulação de 2 repos irmãos**
(`_repo-simulation/backend/` + `frontend/`) de um mesmo produto, cada um governado pelo modelo, com **um
trabalho por tipo** espalhado entre eles. Falsifica os templates **e** torna o **cross-repo concreto** (a base
para validar multi-repo + banco). Se a forma não encaixa num kind, **o template quebra ali — visível, não no
abstrato**.

**Cenário rodada 1 — "Login social (OAuth)", cross-repo (subconjunto representativo, decisão da owner):**
`backend` tem `proposal`(origem) → `delivery`(api), `spike`(lib), `incident`(token) → `fix`; `frontend` tem
`delivery`(ui, coordena com a api), `experiment`(botão, won), `patch`. Os **7 kinds** aparecem entre os 2 repos;
as arestas `coordinates-with: <repo>/<id>` ligam trabalhos **entre** repos. Cobre os 4 contrastes de abertura
(selado × sela-hipótese × doc-vivo × ledger).

## 5. O que a simulação deve falsificar (critérios de aceite)

1. O `_TEMPLATE.intent-brief.md` serve `delivery`/`experiment` sem mudança (kernel + corpo-por-kind)?
2. `incident` cabe no MESMO template com `sealed: false` + seção viva, **ou** precisa de molde próprio?
3. O `registry.yml` (Virtual) registra **durável sem burocracia** (1 linha, no repo)?
4. O fecho polimórfico (`gate` × `learning-record` × postmortem × commit) tem casa em cada um?

## 6. Achados da simulação (preencher conforme roda)

- **[F1]** `sealed` é por-kind, não universal → o schema do `intent-brief` precisa de `sealed` derivado do
  kind (delivery/experiment=true; incident=false; spike=leve). _(confirmado: incident exigiu `sealed: false` + postmortem.)_
- **[F2]** Virtual durável sem burocracia = **`registry/<kind>.yml`** (1 linha, no repo) — supersede o
  `intent-inline`/`virtual-inline` (inline-PR). _(confirmado: `prop-001`/`fix-001`/`patch-001` vivem no registry.)_
- **[F3] Identidade global cross-repo (D2) aparece concreta:** os ids colidem entre repos (`backend/deliv-001` ×
  `frontend/deliv-001`); a aresta `coordinates-with` precisa de **namespace `<repo>/<id>`**. É exatamente o que
  um banco de agregação cross-repo terá de resolver — a simulação tornou D2 **testável, não teórica**.
- _(demais achados entram aqui à medida que cada trabalho é aprofundado)_

## 7. Em aberto / fundacional

- Materializar `registry.yml` real (ADR 0010) — **fora do #45**.
- `sealed` por-kind vira propriedade do schema do `intent-brief` (refino de §D1).
- `spike`/`patch`/`fix` na rodada 2 da simulação.
- Supersede explícito de `_TEMPLATE.intent-inline.md`/`virtual-inline.md` (inline-PR) pelo `registry.yml`.

## Âncoras

- `research/2026-06-24-intent-brief-work-initiation-artifact.md` (§3 Dense/Virtual · §7b onde-mora-Virtual · §8 ciclo).
- `research/2026-06-24-governed-work-flow-model.md` (§3/§6 fechamento polimórfico).
- `research/2026-06-24-decided-g25-work-flow-model.md` (§D1 abertura · §D6 dois eixos).
- ADR 0010 (Virtual no registry; item 6) · ADR 0022 + `pr-bodies/` (GitHub não é memória) · `GG-0005`.
