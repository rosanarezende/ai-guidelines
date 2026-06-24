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

### Fechamento: dois eixos (resultado polimórfico × autoridade `gate`) — resolve §9.5

O fecho tem **dois eixos distintos**, não um:

| Eixo                             | Pergunta            | Quem                                                                                                                                                                                             |
| -------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Resultado** (o que aconteceu)  | "o que saiu disso?" | **polimórfico por tipo**: `delivery`→capacidade entregue (PR/merge, sem verdict) · `experiment`/`spike`→`learning-record` · `incident`→postmortem · `patch`/`fix`→commit+verificação             |
| **Autoridade** (podemos fechar?) | "está aprovado?"    | **`gate`** (Human Gate): decisão de quem tem **autoridade** sobre o checkpoint (papel — **nem sempre quem desenvolve**, relevante em time); `gates/c-<checkpoint>.yml`, gated por reviews limpos |

**`gate` ≠ `learning-record`:** um é _"o que decidimos"_ (autoridade), o outro é _"o que aconteceu"_
(evidência). A relação é `gate --references--> learning-record` — o resultado **alimenta** o gate. Num
`experiment`: os dois (o `learning-record` won/lost é a evidência sobre a qual se bate o gate). Num
`delivery`: só o `gate` (a evidência é o próprio trabalho mergeado).

**Simetria:** o fechamento é polimórfico (resultado por tipo), igual a abertura (`intent-brief` por
tipo); o `gate` é o eixo de **autoridade** por cima, onde a topologia avança.

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

## 6. O percurso da pergunta: `finding` → `research` → `decision` (resolve §9.4 e §9.6)

**Um `finding` é a unidade de "o que aprendemos", não "o que decidimos"** (FATO `findings.md`):
estrutura `Observação · Evidências(→research) · Impacto(→DEC) · Status(Aberto|Convergido)`. Dois
contratos cravados: (1) o finding **referencia** a research, não a duplica (já é aresta, não prosa);
(2) `Convergido` é **imutável** — _revisões abrem um novo finding_.

**Nó vs estado (resolve §9.4):** o **`finding` é o NÓ** (a pergunta), com `status`
(`Aberto→Convergido` = o "estado" do `F-006`); **`research` e `decision` são NÓS-artefato** que o
finding referencia (`Evidências`/`Impacto`). `F-006` ("são estados") fala do **percurso da pergunta**;
o grafo fala dos **artefatos** pendurados nele — não competem.

**Quando a research nasce (resolve §9.6):** investiga um **`finding` aberto**; ao **convergir e exigir
julgamento**, vira `[DEC] Pendente`. O `intent-brief` **lista as perguntas abertas** ao abrir o
trabalho — viram os findings iniciais (`intent-brief --raises--> finding`).

### Não-linearidade — o grafo cresce, não se reescreve

O dev **não é linear**: durante a execução, uma tarefa pode revelar nova pergunta, reabrir uma decisão
e gerar novas tarefas. O `findings.md` já tem o mecanismo (**`Convergido` imutável; revisão abre novo
finding**), então o grafo **cresce append-only** (`KnowledgeGraph`: _"cresce monotonicamente"_):

```
intent-brief ─opens─▶ finding(Aberto) ─investigated-by─▶ research
                          │ converges
                          ▼
                      finding(Convergido) ─feeds─▶ decision ─authorizes─▶ tasks ─▶ checkpoint/etapa/tarefa
                                                     ▲                                   │
                                                     │ supersedes                        │ raises
                                                     └────────── new finding(Aberto) ◀───┘
```

Uma tarefa `raises` um novo finding → research → `decision` que `supersedes` o anterior → quebra novas
tarefas. O velho fica `Convergido`/`Resolved` (histórico honesto); o grafo ganha nós+arestas. **A
não-linearidade vira topologia rastreável**, não reescrita — a cura do drift que doía.

### Modo de investigação + pausa derivada (resolve §9.7 e §9.3)

**Um `finding` é investigado por `research`** (análise de mesa) **ou — quando só dá pra responder
construindo — por um `spike`** (PoC/protótipo time-boxed, _"dá pra fazer?"_), escolhidos por **risco**
(custo-de-estar-errado). O `spike` é o **pilar de investigação**: pode ser standalone **ou** aberto
para resolver um `finding` (`finding --investigated-by--> spike`); seu `learning-record` **`resolves`
o finding**, limitado pelo **time-box**. _(Resolve §9.3: o `spike` é work item de 1ª classe, não doc colado.)_

⚠️ **`experiment` NÃO é um investigador-filho.** É um **tipo primário** — em times de growth, o trabalho
**principal**, com **entrega de valor real** e **destinos diversos** no fecho (`learning-record`):
`won` → **promove a `delivery`** (herda `hypothesis`/`successMetrics`, ADR 0010); `lost` → clean-up
(`resolution: cleaned-up`) ou `kept`; `inconclusive` → itera/novo experimento. A relação com `delivery`
é **promoção** (lateral, com o experiment **a montante**), **não** subordinação. Tipos se ligam por
arestas (`investigated-by`, **`promotes-to`**), **não** por contenção pai-filho.

**A pausa do pai é DERIVADA, não um 6º status.** Hoje `LifecycleStatus = draft|in-progress|review|
done|archived` — sem "pausado". Mas o limbo ("nem ativo, nem fechado") **não precisa de status
armazenado**: deriva de o `checkpoint` ter um `finding` aberto sob investigação
(`checkpoint --blocked-by--> finding(Aberto)`); quando o spike `resolves` o finding, **o bloqueio cai
sozinho**. Mais preciso que um flag (bloqueia o checkpoint dependente, não o delivery inteiro) e sem
drift de despausar à mão. O repo **já** deriva bloqueios assim (briefing `work`: CI pendente, tree suja).

**Duas origens do limbo — ambas derivadas de uma FONTE, nenhuma é status armazenado:**

| Limbo       | Fonte                                                                          | Some quando                              |
| ----------- | ------------------------------------------------------------------------------ | ---------------------------------------- |
| **blocked** | um `finding` aberto sob investigação                                           | o `learning-record` `resolves` o finding |
| **paused**  | uma **pausa deliberada** (registro próprio: quem/quando/porquê/retomar-quando) | a condição de retomada se cumpre         |

**Pausa deliberada** (despriorizei, **sem** finding aberto) **acontece de verdade e precisa de registro
próprio** — é uma **intenção humana** com proveniência (motivo + condição de retomada), **não** um flag
silencioso (senão perde-se o "por quê" = drift). O label `paused` deriva **desse registro**, igual o
`blocked` deriva do finding.

## 7. Os dois seams que doíam na 0024 — e a cura

- **Seam 2 (`research → decision`)** — confuso porque a research vivia em 3 lugares (`research/` +
  `findings.md` + `decision-brief §2`) e a promoção era prosa. **Cura:** arestas tipadas
  (`finding --investigated-by--> research`; `decision --grounded-by--> research`;
  `decision --resolves--> finding`). O estado da cadeia vira **dado consultável**, não leitura de prosa.
- **Seam 4 (`tasks ↕ state.yml`)** — dói porque há **3 representações** da mesma estrutura
  (`state.yml § topology` + `tasks.md` + `plan.md § Sequência`), sincronizadas à mão, e **duas
  reivindicam SSOT**. **Cura:** **uma SSOT** (`state.yml § topology`, dado) + **derivados**
  (`tasks` checklist, `Frente` agrupamento); **`plan.md` se aposenta** (narra o que já é dado).

## 8. O que o G25 decide vs. o que é fundacional

- **G25 (agora):** a **cadeia** `intent-brief → research → decision → tasks` como **grafo tipado**
  (nós + arestas); **como os 7 tipos a percorrem** (§3); a **hierarquia G22 validada/refinada** (§4);
  o conjunto fechado de **arestas** (§5); e o `grounded-by` como 1ª aresta concreta (seam 2).
- **Fundacional (depois, trilho grafo/internal-refactor):** colapsar `state`/`tasks`/`plan` numa SSOT
  - derivados (seam 4); **aposentar `plan.md`**; o motor de grafo que torna as arestas consultáveis.

## 9. Em aberto (iterar aqui)

1. ✅ **Topo = `delivery`** (não "spec"); o termo "spec" some (owner 2026-06-24).
2. ⏳ **`Frente` fica ou sai?** — decidir via **simulação** de cenário multi-checkpoint (trabalho em time).
3. ✅ **`spike`/`incident` colapsam?** — resolvido (§6): `spike` é **work item de 1ª classe** (não doc colado); `incident` segue doc vivo (§3).
4. ✅ **`research` nó ou estado** — resolvido (§6): `finding`=nó c/ status; `research`/`decision`=nós-artefato.
5. ✅ **`gate` × `learning-record`** — resolvido (§3): dois eixos — **resultado** (polimórfico por tipo) × **autoridade** (`gate`); `gate --references--> learning-record`; experiment tem os dois, delivery só o gate.
6. ✅ **Quando a research nasce** — resolvido (§6): investiga um `finding` aberto; `intent-brief` o `raises`.
7. ✅ **Modo de investigação + pausa** — resolvido (§6): finding `investigated-by` `research` ou `spike` (por risco); **`experiment` é primário** (`promotes-to` `delivery`, não filho); **bloqueio = derivado** de finding aberto, não 6º status.
8. **🆕 Registro de pausa deliberada (owner 2026-06-24):** a pausa por despriorização (**sem** finding) **acontece e precisa de registro próprio** (quem/quando/porquê/retomar-quando) — artefato leve a desenhar; o label `paused` deriva dele.

## Âncoras

- **Linhagem:** `research/2026-06-24-intent-brief-work-initiation-artifact.md` (o nó artefato +
  ciclo de vida §8) · `research/2026-06-24-governance-self-index-by-intention.md` (tese do grafo) ·
  `research/2026-06-23-governance-model-question-audit.md`.
- **Decisões/contratos:** `[DEC-0024-G22]` (Spec›Frente›Checkpoint›Etapa›Tarefa) · `[DEC-0024-G06]`
  (contrato da cadeia research→…→implementação) · `F-006` (research/finding/decision/execution = estados) ·
  `[DEC-0024-G07]` (topology-as-data, SSOT) · `[DEC-0024-G08]`/`G23` (grafo derived-only).
