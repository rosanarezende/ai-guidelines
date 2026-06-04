# Dossiê de Auditoria — PR #34 (Gate: Technical Audit → Architectural Review → Human)

> **Pacote de Gate** (ADR 0022, situado). Reúne tudo que **Codex** (Technical Audit) e **ChatGPT** (Architectural Review) precisam para auditar o **PR #34** sem reconstruir contexto. Companion de `2026-06-03-handoff-convergence-reopened.md` (a retomada; **este** é o pacote do Gate). Decisão de fase: **`[DEC-0024-G08]`** (B1, owner 2026-06-03) — passar o #34 pelo **ciclo completo de Gate antes** de empilhar `pr-cli-cutover`. **Não pré-julga findings:** enumera escopo, invariantes a verificar e fronteiras já deferidas.

## 0. Antes de auditar — estado verificado (2026-06-03)

- Branch **`feat/spec-0024-insights-in-flight`** = **PR #34** (base `feat/spec-0024-ruleset-producibility` = #33). Git limpo.
- **`yarn validate` VERDE:** 812 testes / 83 suites · `tsc` limpo · coverage gate ok.
- **CI:** `governance-pr-check` ✅ · `repo-validation` ✅ · `smoke` (6 matrizes) ✅.
- `review:check` ✅ (artefatos do #33 íntegros) · `insights:check` ✅ (6 percepções) · `state-yml:check` ✅ (2 conformam).

## 1. Unidade sob auditoria

**PR #34**, `sequence 2`, stacked sobre #33 (`concluded`). **Modo `unit`** — não mergeia isolado; o Human Gate decide o PRÓXIMO MOVIMENTO, não o merge.

**Escopo = materialização de `[DEC-0024-G08]`:** o **núcleo do domínio Knowledge orientado a grafo**, em três superfícies:

- **(a) Capability Insights** — o estágio 0 do pipeline, vertical completo (domínio + persistência + CLI + check + projeção).
- **(b) Kernel Knowledge** — o pipeline de maturação + o contrato de extensão (`KnowledgeArtifact`).
- **(c) Núcleo KnowledgeGraph** — o read-model derivado (CQRS), semeado por Insights.

**Net tree:** 53 arquivos, +3062/−55 — código sob `src/` + ledger `.governance/runtime/insights.yml` + docs de governança (a reconciliação G08, **já ratificada pelo owner** → contexto, não alvo primário da auditoria).

## 2. Mapa commit → artefato → entrypoints

| Commit    | Introduziu                        | Entrypoints                                                                                                                                                                                                                      |
| --------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `9c7ad54` | Capability Insights (slice)       | `domain/insight/{Insight,InsightId,InsightLedger,InsightPolicy,InsightTransitions}.ts` · `cli/insight.ts` · `infrastructure/yaml/{FileInsightStore,insightsLedgerSerializer}.ts` · projeção `app/workflow/InsightsProjection.ts` |
| `4fbd17a` | Ciclo de vida + check no validate | `cli/insight.ts` (`promote`/`discard`) · `cli/insightsCheck.ts` · `app/use-cases/{Promote,Discard}Insight.ts`                                                                                                                    |
| `72bd435` | Auditoria de engenharia (Grupo A) | terminais com actor/timestamp · remoção do campo morto `links` · `specId` autoritativo · forma canônica no check                                                                                                                 |
| `42b201f` | **Kernel Knowledge**              | `domain/knowledge/{KnowledgeStage,KnowledgeRef,KnowledgeArtifact}.ts` · `domain/insight/insightKnowledge.ts` (estágio 0 + `graduationRefOf`)                                                                                     |
| `d06035d` | (histórico) programa em 0025      | **RETIRADO** em `b3f1761` — ver nota abaixo                                                                                                                                                                                      |
| `ab883a8` | **Núcleo KnowledgeGraph**         | `app/projections/KnowledgeGraph.ts` + `app/projections/knowledgeSources.ts`                                                                                                                                                      |

> **Nota (anti-confusão):** `d06035d` persistiu o programa em `0025/state.yml` e foi **RETIRADO** em `b3f1761` (`[DEC-0024-G08]`). O **net tree NÃO carrega `0025`** — não há spec 0025 independente. As mensagens de commit `feat(spec-0025)` são **ruído histórico do log**, não artefato vivo.

## 3. Technical Audit (Codex) — propriedades a verificar

Verificação de **corretude e invariantes** (não estética). Por camada:

- **`domain/insight`** — transições válidas/inválidas cobertas por teste (não só happy path: `promote` de descartado, recorrência pós-terminal, id malformado)? `InsightLedger` append-coerente e dedup por `InsightId`? `insightsLedgerSerializer` round-trip (`parse∘serialize` idempotente)? Relógio **injetado** (sem `Date.now()` direto nas terminais)? Campo morto `links` removido sem referência órfã?
- **`domain/knowledge`** — `stageOrder` total sobre os 5 estágios (`rule`/`guardrail` empatam em 2 — intencional)? `KnowledgeRef.isWellFormedRef` valida **forma, não existência** (fronteira deliberada — §5); `parseRef`/`formatRef` round-trip; `ID_PATTERN` por estágio captura typo (`--ref garbage`) sem falso-negativo. `KnowledgeArtifact` mínimo (id+stage+`graduatedTo?`).
- **`domain/insight/insightKnowledge`** — adapter **PURO** (não muta `Insight`/persistência/CLI); `graduationRefOf` cobre `promoted`/`discarded`/`backlog→null`; **direção de dependência `insight → knowledge`** (o kernel **não** importa `Insight`).
- **`app/projections`** — `KnowledgeGraph` **sem estado próprio** (recomputa de fontes); travessia bidirecional (`outgoing`/`incoming`); **`incoming` para nó-alvo ainda não-materializado** (aresta pendente) resolve sem quebrar; crescimento monotônico. `knowledgeSources.collectKnowledgeArtifacts` = único ponto de wiring que cresce.
- **`cli/insight` + `insightsCheck`** — ciclo `add|saw|list|promote|discard` ponta-a-ponta sem YAML manual; `insightsCheck` no `validate` (invariantes + forma canônica + arestas de graduação); exit codes coerentes.

## 4. Architectural Review (ChatGPT) — fidelidade à direção

- **Knowledge = PIPELINE de maturação** (`insight→decision→rule|guardrail→doctrine`), **não** taxonomia MECE como `WorkItem` (ADR 0010). A distinção está codificada (`stageOrder`) e documentada — é a modelagem certa para `[DEC-0024-G08]`?
- **CQRS — grafo = read-model DERIVADO** (não tardio/acessório; `PIT-0004`). O núcleo cresce **monotônico sem refatorar** via `KnowledgeArtifact` (costura de extensão). A promessa "cada entidade futura soma +N arestas em `knowledgeSources`, e o `KnowledgeGraph` não muda" **se sustenta no código**?
- **`KnowledgeRef` como aresta uniforme** — toda relação cross-estágio é um ref tipado. Suficiente para a **navegabilidade/recuperabilidade** que motiva a reabertura ("a resposta estava num ADR esquecido")?
- **Fronteira forma-vs-existência** (`isWellFormedRef`) **deferida deliberadamente** — aceitável como MVP do grafo? (Integridade referencial cross-artefato = decisão futura; `pr-workitem-registry`/`pr-dualroot-collapse`.)
- **Não reabrir em finding** (hipóteses já rejeitadas — §7 do handoff): `participants.yml`/`Co-Authored-By` como participação; mover `.core/` por navegabilidade; `next[]` como fonte; **0025 independente**.

## 5. Fora de escopo / débitos deferidos — NÃO emitir finding bloqueante

- **Ledger `insights.yml` framework-wide committado** → risco de conflito de merge em specs paralelas; `promotion.ref` valida **só forma**. Endereçado em `pr-workitem-registry`/`pr-dualroot-collapse`.
- **Surface CLI do grafo** (`ag graph`/`ag why`) **ausente** — depende de `pr-cli-cutover` (próximo nó, **bloqueado neste Gate** por decisão do owner — B1).
- **#34 não-atômico** (6 commits cross-eixo) — desvio **consciente do owner**, registrado.
- **`next[]` do `state.yml` stale** (era Checkpoint-3) — `PIT-0001`; dissolvido em `pr-decision`. Débito conhecido, **não** drift novo.
- **Disclosure derivado** (`yarn disclosure`) **N/A** para este branch (linha de convergência) — as revisões viram **estes** artefatos.

## 6. Convenção dos artefatos — como registrar a auditoria

**1 review por role + 1 gate**, keyados no **cursor de #34 = `graph-core`** (cobrem o **PR inteiro**, não retroativo por checkpoint — espelha o `c2.4d` do #33). _(Convenção; o owner pode trocar a chave, ex.: `pr34`.)_

| Lane                        | Arquivo                                         | Dono                     |
| --------------------------- | ----------------------------------------------- | ------------------------ |
| **Finding** (technical)     | `reviews/c-graph-core-technical_audit.yml`      | reviewer (executor real) |
| **Finding** (architectural) | `reviews/c-graph-core-architectural_review.yml` | reviewer (executor real) |
| **Resolução**               | `reviews/c-graph-core-resolutions.yml`          | Claude                   |
| **Gate**                    | `gates/c-graph-core.yml`                        | owner                    |

- `checkpoint: "graph-core"` em todos. **Proveniência (2.4f):** `role` = a lane; **`executor: { platform, model }`** = o agente que rodou (ex.: `platform: antigravity`, `model: gemini-3.1-pro-high`), **estruturado e selado**. Gate mantém `actor` (humano); `actor` em review é legado.
- **Evidência de cobertura (2.4e):** numa **aprovação limpa** (`findings_emitted: 0`) a `audit_evidence: { scope, basis }` é **obrigatória e selada** (proibida quando há findings). `scope` = o que foi inspecionado (pode referenciar §3/§5 deste dossiê); `basis` = por que aprovou. Sem isto, o review é cego para recuperabilidade.
- **Fingerprints:** deixe `fingerprint: x` / `review_fingerprint: x` e rode **`yarn review:check`** — ele imprime o hash esperado (JSON-canônico; inclui `audit_evidence` quando presente). Ids contíguos `F1..FN`; `findings_emitted` = nº de blocos.
- **Resolução** referencia `<role>#Fn` totalmente qualificado; **NÃO destrava** o gate (só a `disposition` do reviewer destrava — anti-autoaprovação).
- **Enforcement** (`review:check`, no `validate` → required): gate `approved` ⟹ **ZERO** finding `critical/high` com `disposition: open`.
- Disciplina completa: `reviews/README.md`.

## 7. Topologia (contexto)

`#32`, `#33` **concluded** · **`#34` active** (cursor `graph-core`) · **`pr-cli-cutover` = próximo `planned`, NÃO aberto** (owner B1: Gate do #34 primeiro). Trilha completa: §5 do handoff de retomada.
