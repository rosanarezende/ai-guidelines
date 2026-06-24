---
artifact-kind: pre-coding-review
subject: "modelo do fluxo de trabalho governado (G25) — cadeia tipada intent→research→decision→tasks como grafo, através dos 7 tipos + validação da hierarquia G22"
date: 2026-06-24
reviewer: internal
method: assessment
---

# Modelo de fluxo do trabalho governado (G25)

> **Natureza:** `pre-coding-review` (dogfood). **Não-autoridade**, não decide, não implementa.
> **Documento VIVO** em iteração owner↔Claude para convergir a **DEC-0024-G25**. Em divergência
> vencem `state.yml`, `tasks.md`, `decision-brief.md`, `reviews/`+`gates/`, Git/GitHub.
> **Princípio-mãe:** o fluxo é um **grafo tipado** (nós + arestas como dado), **não prosa**.
> Linhagem: `intent-brief` research + `governance-self-index` research + `[DEC-0024-G22]`
> (hierarquia) + `[DEC-0024-G08]`/`G23` (grafo derived-only). Lifecycle: **este modelo → DEC → execução**.

## 1. Princípio — o fluxo é um grafo, não uma lista de arquivos

A dor da 0024 (research espalhada; `state.yml`/`tasks.md`/`plan.md` como espelhos que brigam)
vem de **seams modelados em prosa ou espelho-manual**. A cura é a mesma da research de indexação:
**nós com arestas tipadas como dado**, e a estrutura **derivada de uma SSOT**, não reescrita à mão.

## 2. A cadeia canônica (Stage 1 → Stage 2)

```
            opens                resolves-finding          authorizes            breaks-into
intent-brief ───▶ [research ⇄ finding] ───▶ decision-brief ───▶ tasks ───▶ checkpoint/etapa/tarefa
   (humano abre)   (Stage 1: investiga)      (decisões+gate)    (Stage 2)        │
                          │                       ▲                              │ projection-of
                          └──── grounded-by ───────┘                             ▼
                                                                          state.yml § topology (SSOT)
```

- **Stage 1** = `intent-brief → research → decision-brief → gate` (decidir).
- **Stage 2** = `tasks` (quebrar) + `topology` (estrutura) → executar.
- **A regra que você cravou:** _só quebramos tarefas **depois** das decisões._ As tarefas não nascem
  em paralelo à decisão — nascem **dela**.

**Arestas tipadas da cadeia:** `opens` · `investigated-by` · `resolves` (finding) · **`grounded-by`**
(decision→research, a de-para) · `authorizes` (decision→tasks) · `breaks-into` (hierarquia) ·
`projection-of` (tasks/plan→topology) · `approved-by` (→gate) · `verdicted-by` (→learning-record).

## 3. A cadeia através dos 7 tipos — um grafo, sete caminhos

Cada tipo **percorre um subconjunto** da mesma cadeia. Dense percorrem mais; Virtual colapsam.

| Tipo         | Abre                   | Research?                                     | Decision?                         | Tasks (quebra)?               | Topology? | Fecha                          |
| ------------ | ---------------------- | --------------------------------------------- | --------------------------------- | ----------------------------- | --------- | ------------------------------ |
| `delivery`   | intent-brief           | opcional (se há pergunta aberta)              | decision-brief (se há julgamento) | sim (Checkpoint/Etapa/Tarefa) | sim       | `gate`                         |
| `experiment` | intent-brief           | opcional (desenho do teste)                   | decision-brief                    | sim (constrói o teste)        | sim       | `learning-record` → `gate`     |
| `spike`      | intent-brief           | **é o próprio trabalho**                      | a resposta (talvez DEC)           | mínimo                        | talvez    | `learning-record` (resposta)   |
| `incident`   | intent-brief (reativo) | a investigação de causa-raiz **é a research** | prevenção (talvez DEC)            | tarefas de mitigação          | talvez    | doc vivo (postmortem)          |
| `proposal`   | inline (ledger)        | —                                             | promoção/descarte                 | —                             | —         | promove→`delivery` ou descarta |
| `patch`      | inline (ledger)        | —                                             | —                                 | —                             | —         | commit + verificação           |
| `fix`        | inline (ledger)        | —                                             | —                                 | —                             | —         | commit + verificação           |

**Insight:** o `spike` é o caso onde a **research É o trabalho**; o `incident` é onde a **investigação
É a research**. Isso mostra que `research` não é um arquivo a mais — é um **estado da cadeia** (`F-006`)
que alguns tipos habitam como sua atividade principal. _A burocracia escala com o peso_ (Dense/Virtual).

## 4. A hierarquia de decomposição (validação de `[DEC-0024-G22]`)

`Spec › Frente › Checkpoint › Etapa › Tarefa`. **Onde vive:** **dentro do Stage 2** (o ramo
`tasks`/`topology`), como uma **árvore de arestas `breaks-into`** — não cobre o Stage 1.

| Nível          | Papel (G22)                                          | Validação no novo modelo                                                       |
| -------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Spec**       | o todo (workspace)                                   | ⚠️ revisar nome pós-rename `spec→delivery` (é o container ou o kind?)          |
| **Frente**     | agrupamento humano, **leitura derivada** de topology | ✅ coerente — já é **projeção derivada**, não SSOT (alinha com o princípio §1) |
| **Checkpoint** | unidade de implementação                             | ✅ holds — nó-âncora do breakdown                                              |
| **Etapa**      | subdivisão **opcional**                              | ✅ holds (opcional)                                                            |
| **Tarefa**     | folha/evidência                                      | ✅ holds                                                                       |

**Refino:** a hierarquia é a **decomposição da EXECUÇÃO** (Stage 2), **distinta** da cadeia Stage 1
(intent→research→decision). Eram confundidas porque tudo vivia em prosa espalhada. No grafo, é uma
**sub-árvore `breaks-into`** pendurada no nó `decision` (`decision --authorizes--> Checkpoints`).

## 5. Os nós e as arestas (o grafo tipado)

**Tipos de nó:** `intent-brief` · `finding` · `research` · `decision`(DEC) · `checkpoint` · `etapa` ·
`tarefa` · `topology` · `review` · `gate` · `learning-record`. _(Frente = view derivada, não nó-fonte.)_

**Tipos de aresta (conjunto fechado, candidato):** `opens` · `investigated-by` · `resolves` ·
`grounded-by` · `supersedes`/`superseded-by` · `authorizes` · `breaks-into` · `projection-of` ·
`approved-by` · `verdicted-by` · `promotes-to` · `enforced-by`.

## 6. Os dois seams que doíam na 0024 — e a cura

- **Seam 2 (`research → decision`)** — confuso porque a research vivia em 3 lugares (`research/` +
  `findings.md` + `decision-brief §2`) e a promoção era prosa. **Cura:** arestas tipadas
  (`finding --investigated-by--> research`; `decision --grounded-by--> research`;
  `decision --resolves--> finding`). O estado da cadeia vira **dado consultável**, não leitura de prosa.
- **Seam 4 (`tasks ↕ state.yml`)** — dói porque há **3 representações** da mesma estrutura
  (`state.yml § topology` + `tasks.md` + `plan.md § Sequência`), sincronizadas à mão, e **duas
  reivindicam SSOT**. **Cura:** **uma SSOT** (`state.yml § topology`, dado) + **derivados**
  (`tasks` checklist, `Frente` agrupamento); **`plan.md` se aposenta** (narra o que já é dado).

## 7. O que o G25 decide vs. o que é fundacional

- **G25 (agora):** a **cadeia** `intent-brief → research → decision → tasks` como **grafo tipado**
  (nós + arestas); **como os 7 tipos a percorrem** (§3); a **hierarquia G22 validada/refinada** (§4);
  o conjunto fechado de **arestas** (§5); e o `grounded-by` como 1ª aresta concreta (seam 2).
- **Fundacional (depois, trilho grafo/internal-refactor):** colapsar `state`/`tasks`/`plan` numa SSOT
  - derivados (seam 4); **aposentar `plan.md`**; o motor de grafo que torna as arestas consultáveis.

## 8. Em aberto (iterar aqui)

1. **Nome do topo:** pós `spec→delivery`, o container ainda se chama "Spec"? Ou o workspace é
   "delivery" e "spec" some? (toca G22 + a hierarquia).
2. **`Frente` fica ou sai?** É view derivada útil, ou ruído? (o `tasks.md` já alertou da confusão Fase/Frente.)
3. **`spike`/`incident`:** se a research **é** o trabalho deles, eles precisam de `intent-brief` +
   `learning-record` separados, ou colapsam num doc só? (paralelo ao "incident = doc vivo").
4. **`research` é nó ou estado?** `F-006` diz **estado**; aqui tratei como nó com arestas. Reconciliar.
5. **Gate × learning-record** como nós de fechamento: um referencia o outro? (veredito de valor ≠ aprovação).
6. **Quando a research nasce:** de um `finding` aberto (pergunta com alternativas competindo) — quem
   abre o finding? O `intent-brief` lista perguntas abertas que viram findings?

## Âncoras

- **Linhagem:** `research/2026-06-24-intent-brief-work-initiation-artifact.md` (o nó artefato +
  ciclo de vida §8) · `research/2026-06-24-governance-self-index-by-intention.md` (tese do grafo) ·
  `research/2026-06-23-governance-model-question-audit.md`.
- **Decisões/contratos:** `[DEC-0024-G22]` (Spec›Frente›Checkpoint›Etapa›Tarefa) · `[DEC-0024-G06]`
  (contrato da cadeia research→…→implementação) · `F-006` (research/finding/decision/execution = estados) ·
  `[DEC-0024-G07]` (topology-as-data, SSOT) · `[DEC-0024-G08]`/`G23` (grafo derived-only).
