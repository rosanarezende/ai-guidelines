# Checkpoint de Continuidade — Spec 0024, Human Gate do PR #34 (SSOT de retomada)

> **Documento de RETOMADA canônico** (ADR 0022, situado). Assume zero acesso à conversa anterior. É a **única fonte** para iniciar sessão limpa até o Human Gate do #34. **Supersede** todos os handoffs anteriores (ver §10). Data: 2026-06-04. **Não** contém decisões novas — consolida o já decidido.

---

## 1. Estado atual

| Item              | Valor                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch            | **`feat/spec-0024-insights-in-flight`** (= PR #34)                                                                                                 |
| HEAD              | **`20b9a28`**                                                                                                                                      |
| Working tree      | **limpo** (git status vazio)                                                                                                                       |
| PR #34            | **OPEN**, **Ready for review** (não-draft), base `feat/spec-0024-ruleset-producibility` (#33), `sequence 2`, **modo `unit`** (não mergeia isolado) |
| CI (no `20b9a28`) | **verde** — `governance-pr-check` · `repo-validation` · `smoke` (6 matrizes)                                                                       |
| `review:check`    | **verde** — `graph-core: [technical_audit=approved · architectural_review=approved] · findings 0 open / 0 closed · gate pending`                   |

**Lanes do gate (cursor `graph-core`):**

| Lane                   | Estado               | Executor                        | Findings | Selo           | Commit       |
| ---------------------- | -------------------- | ------------------------------- | -------- | -------------- | ------------ |
| `technical_audit`      | **approved**         | antigravity/gemini-3.1-pro-high | 0        | `4b995794f65d` | `1c7c3e1`    |
| `architectural_review` | **approved**         | chatgpt/gpt-5.5                 | 0        | `185d897a1708` | `20b9a28`    |
| `resolutions`          | **N/A** (0 findings) | —                               | —        | —              | —            |
| **gate (Human)**       | **⏳ PENDING**       | —                               | —        | —              | (não criado) |

**Commitado:** todo o código + ambos os artefatos de review. **Pendente:** **só o Human Gate** (`gates/c-graph-core.yml`, owner-owned). Nada mais em aberto no #34.

---

## 2. Linha do tempo (rastreabilidade — SHAs vs base #33)

| SHA                               | Introduziu                                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `9c7ad54` · `4fbd17a` · `72bd435` | **Capability Insights** ("Percepções em Trânsito"): domínio DDD + `insights.yml` + CLI `add/saw/list/promote/discard` + `insights:check` + projeção no `continue` + auditoria de engenharia |
| `42b201f`                         | **Fundação Knowledge**: kernel `KnowledgeStage`/`KnowledgeRef`/`KnowledgeArtifact` + `insightKnowledge` (Insight = estágio 0)                                                               |
| `d06035d`                         | **Persistência do programa** em `0025/state.yml` — **RETIRADO** em `b3f1761` (ver §4)                                                                                                       |
| `ab883a8`                         | **KnowledgeGraph núcleo**: read-model (`KnowledgeGraph.from`, `knowledgeSources`)                                                                                                           |
| `b3f1761`                         | **`[DEC-0024-G08]`**: reabre G03/G04/G05; topology reconciliada (#34 active); **retira** o dir 0025                                                                                         |
| `f1f6d4c`                         | **Dossiê de auditoria** do #34 (pacote de Gate) — `research/2026-06-03-audit-dossier-pr34.md`                                                                                               |
| `46143be`                         | **Contrato 2.4e**: `audit_evidence` (scope+basis) sela recuperabilidade de aprovações limpas                                                                                                |
| `c584b98`                         | **Contrato 2.4f**: `executor { platform, model }` (VO estruturado e selado); `actor` legado/Gate                                                                                            |
| `f5ea233`                         | **Contrato 2.4g**: `audit_evidence.coverage` (lista de caminhos — o "onde" queryável)                                                                                                       |
| `1c7c3e1`                         | **Technical Audit** (graph-core) commitado — executor Gemini, 2.4g, approved/0                                                                                                              |
| `20b9a28`                         | **Architectural Review** (graph-core) registrado — executor ChatGPT, 2.4g, approved/0                                                                                                       |

> Mensagens `feat(spec-0025)` em `d06035d`/`ab883a8` são **ruído histórico do log** — o net tree **não** carrega 0025 (§4).

---

## 3. Decisões tomadas — **DECIDIDO / NÃO REABRIR**

| Decisão                                                                                                                                                       | Estado   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **`[DEC-0024-G08]`** (Resolved 2026-06-03, owner)                                                                                                             | cravada  |
| Reabertura de **G03/G04/G05** para modelagem deliberada DENTRO da 0024                                                                                        | cravada  |
| **Descarte da hipótese 0025** (não há spec independente; é modelagem deferida da 0024)                                                                        | cravada  |
| **Arquitetura orientada a grafo** (entidades + `KnowledgeRef` navegável + projeções derivadas)                                                                | cravada  |
| **KnowledgeGraph = read-model DERIVADO** (CQRS; não fonte de verdade)                                                                                         | cravada  |
| **`executor` estruturado** `{platform, model}`, selado (2.4f)                                                                                                 | cravada  |
| **`audit_evidence` estruturado** scope+basis (2.4e)                                                                                                           | cravada  |
| **`coverage` estruturado** (lista de caminhos, 2.4g); narrativa fica texto                                                                                    | cravada  |
| Cravadas anteriores: G00/G02/G06/G07; Open abolido; brief por estado; WorkflowType removido; proveniência runtime-scoped; topology-as-data (`[DEC-0024-G07]`) | cravadas |

**Disciplina:** "NÃO re-modelar" vale para o decidido. Em G03/G04/G05, modelar **é** a direção (não drift).

---

## 4. Hipóteses descartadas — **NÃO RESSUSCITAR**

| Hipótese                                                                         | Por que caiu                                                                      |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Spec 0025 independente / spawn cross-spec**                                    | falsificada: G03/G04/G05 são eixos da 0024; dir criado e **retirado** (`b3f1761`) |
| **Grafo como SSOT / fonte de verdade**                                           | rejeitada: grafo é projeção derivada (artefatos→grafo, nunca grafo→artefatos)     |
| **Registry de agentes (`Agent`)**                                                | over-modeling: executor é VO embutido; "uso de modelos" = projeção derivada       |
| **Registry de áreas (`Area`)**                                                   | over-modeling: coverage é lista embutida; "Area/heatmap" = projeção derivada      |
| **Modelagem m:n de participação** (`participants.yml`/`contributors.yml`/ledger) | over-modeling (cf. `disclosureRender`); autoria ≠ participação                    |
| **`Coverage Entity` / `Review Graph`**                                           | over-modeling (architectural review confirmou ausência)                           |
| **String composta `platform/model`**                                             | re-conflata dimensões ortogonais; força parsing (lição 2.4c)                      |
| **Estruturar `scope`/`basis` (notas) ou `coverage` como `{area, note}`**         | narrativa é irredutível; só o enumerável se estrutura                             |
| **Relocar `.core/` por navegabilidade**                                          | estética de baixo valor; entidades+grafo tornam a localização irrelevante         |
| **`next[]` como fonte da próxima ação**                                          | mis-binding (PIT-0001); a topology é a fonte derivável                            |
| **Co-Authored-By/git trailers como participação**                                | autoria ≠ participação                                                            |

---

## 5. Estado arquitetural vigente

**Pipeline de maturação do conhecimento:**

```
Insight → KnowledgeArtifact → KnowledgeRef → KnowledgeGraph
(estágio 0)   (contrato)        (aresta)       (read-model)
```

- **Write-model (FONTE DE VERDADE):** as entidades/artefatos com invariantes. Hoje materializado: **`Insight`** (agregado, persistido em `insights.yml`). Cada entidade futura implementa `KnowledgeArtifact` (declara `stage` + `graduatedTo: KnowledgeRef`) e soma-se em `knowledgeSources.collectKnowledgeArtifacts`.
- **Projeções (DERIVADAS):** **`KnowledgeGraph`** — puro, stateless, reconstruível, cresce monotônico. Semeado **só por Insights** hoje. Os artefatos alimentam o grafo; o grafo **não** alimenta os artefatos (sem estado duplicado / SSOT concorrente).
- **Navegação:** via `KnowledgeRef` (aresta tipada) + travessia bidirecional do grafo (`outgoing`/`incoming`).

**O que AINDA NÃO existe:**

- Entidades `Decision`/`Rule`/`Guardrail`/`Doctrine` (estágios > 0 do pipeline) — entram nos PRs da trilha.
- Surface CLI do grafo (`ag graph`/`ag why`) — depende de `pr-cli-cutover`.
- Projeções de uso (dashboards modelo×área) — o dado (`executor`/`coverage`) já é estruturado, mas nenhuma projeção foi construída.
- Integridade referencial de `KnowledgeRef` (validação é leniente por forma; existência = decisão futura).

---

## 6. Contrato de auditoria vigente (revisão-como-artefato)

Estado final após dogfood (`reviews/*.yml` + `gates/*.yml`, derivado por `review:check` no `validate`):

| Campo                                          | Tipo                    | Significado                                                    |
| ---------------------------------------------- | ----------------------- | -------------------------------------------------------------- |
| `executor: { platform, model }` (**2.4f**)     | **estruturado, selado** | quem executou (agente computacional); `platform` ⊥ `model`     |
| `audit_evidence.coverage: [<path>]` (**2.4g**) | **estruturado, selado** | o "onde" auditado (queryável; dual de `finding.location`)      |
| `audit_evidence.scope` (**2.4e**)              | **texto**               | o que/como foi inspecionado (narrativa)                        |
| `audit_evidence.basis` (**2.4e**)              | **texto**               | por que aprovou (narrativa)                                    |
| `actor: <handle>`                              | texto                   | **Gate** (decisor humano); em review = **legado** (c2.3/c2.4d) |

- `audit_evidence` existe **sse** `findings_emitted == 0` (proibido quando há findings — lá a evidência são os findings). Selo: `review_fingerprint` inclui extensões **tagueadas** `[["audit_evidence",[scope,basis,coverage]],["executor",[platform,model]]]` só quando presentes (histórico sem extensões fica byte-idêntico).
- **Por que parou em 2.4g:** todas as dimensões **enumeráveis** (executor, coverage) estão estruturadas e seladas; as **narrativas** (scope, basis) permanecem texto. Estruturar mais seria modelar o irredutível / criar agregados — rejeitado ("dados pequenos → projeções ricas"). **Ponto de parada natural** (confirmado pela architectural review §4/§5).

---

## 7. Próxima sequência executável (`state.yml § topology` = SSOT; **não alterada**)

```
#34 (active, gate PENDING) → pr-cli-cutover(3) → pr-doctrine(4) → pr-decision(5)
→ pr-rule-guardrail(6) → pr-projection-split(7) → pr-workitem-registry(8)
→ pr-dualroot-collapse(9) → integration-final(terminal)
```

- **Próximo nó:** **`pr-cli-cutover`** (registry de comandos em `src/`, dissolve a costura `engine.mjs`/`args.mjs`; destrava verbos baratos como `ag graph`/`ag why`). **github_pr: null** (não aberto).
- **Dependência:** stacked sobre `feat/spec-0024-insights-in-flight` (#34).
- **FECHADO até o Human Gate:** `pr-cli-cutover` **não abre** antes de `gates/c-graph-core.yml` (approved).
- **Primeiro passo APÓS o gate:** o Human Gate **decide o próximo movimento** (NÃO mergeia em main; modo unit). O movimento decidido = **abrir `pr-cli-cutover`** stacked, nascendo já com review-as-artifact 2.4g (`executor` + `coverage`). Ao abrir: `#34` → concluded, `pr-cli-cutover` → active com `github_pr`.

**Para fechar o Human Gate** (owner-owned), criar `gates/c-graph-core.yml`:

```yaml
checkpoint: "graph-core"
actor: "@rosanarezende"
ref: "#34"
date: "<data>"
decision: approved
note: "PR #34 (Knowledge kernel + KnowledgeGraph + contrato 2.4e→2.4g) aprovado para AVANÇAR; 2 lanes approved, 0 findings. Decide o próximo movimento (pr-cli-cutover), não merge."
```

`review:check` já garante a pré-condição (gate approved ⟹ zero bloqueante open — satisfeito).

---

## 8. Riscos conhecidos (reais, ainda abertos)

- **`next[]` do `state.yml` é log stale** (era era Checkpoint-3): a "Próxima ação" do `continue` lê `next[0]` antigo. Débito conhecido (PIT-0001); **dissolvido em `pr-decision`**. NÃO é drift; NÃO corrigir aqui (não alterar topology nesta sessão).
- **Ledger `insights.yml` framework-wide committado** → risco de conflito de merge em specs paralelas; `promotion.ref` valida só forma. Endereçado em `pr-workitem-registry`/`pr-dualroot-collapse`.
- **`#34` não-atômico** (commits cross-eixo) — desvio consciente do owner, registrado.
- **Artefatos de review são tamper-EVIDENCE, não tamper-proofing** (ADR 0021): check local é cego a autoria; eleva a barra, não impede forja atribuída. Limite honesto assumido.

---

## 9. Prompt de retomada (colar em sessão nova)

```
Retome a Spec 0024 APÓS o Human Gate do PR #34. Leia PRIMEIRO, como SSOT:
.governance/specs/0024-context-architecture/research/2026-06-04-checkpoint-human-gate-pr34.md

NÃO reabra: enquadramento (não há 0025; é 0024 com G03/G04/G05 reabertos),
G00/G02/G06/G07, nem as hipóteses descartadas (§4 do checkpoint).

Estado: branch feat/spec-0024-insights-in-flight = PR #34 (OPEN, 20b9a28).
Lanes graph-core: technical_audit=approved (gemini) · architectural_review=approved
(chatgpt) · gate PENDING. review:check + CI verdes.

Verifique: git limpo · yarn validate verde · gates/c-graph-core.yml.
- Se o gate AINDA não existe → o owner ainda não aprovou; pare e aguarde.
- Se o gate = approved → o próximo movimento é ABRIR pr-cli-cutover (§7), stacked
  sobre #34, nascendo com review-as-artifact 2.4g (executor + coverage). Ao abrir:
  #34→concluded, pr-cli-cutover→active com github_pr.

Disciplinas: pt-BR; yarn format ; yarn validate antes de commit; CORE-07 (push/apply
só com autorização); NÃO mergeia em main (modo unit); 1 PR pelo Gate por vez; não
alterar topology fora de um checkpoint executável.
```

---

## 10. Higiene de contexto — supersessões

**Este checkpoint SUPERSEDE (como SSOT de retomada):**

- `research/2026-06-03-handoff-convergence-reopened.md` — era o SSOT pós-reabertura; agora histórico (banner adicionado).
- `research/2026-06-02-handoff-checkpoint-3.md` — era a retomada da era #33/Checkpoint-3 (já superada pela convergence-reopened).
- `research/2026-06-02-handoff-next-session.md`, `2026-05-31-*` (×2), `2026-05-30-*`, `2026-05-29-handoff-next-session.md` — handoffs de sessões anteriores, todos absorvidos aqui.

**NÃO supersedido (permanece vigente):**

- `research/2026-06-03-audit-dossier-pr34.md` — **pacote de auditoria** do #34 (companheiro deste checkpoint; referenciado pelos reviews). Mantido.
- `state.yml § topology`, `plan.md`, `decision-brief.md § [DEC-0024-G08]` — fontes canônicas; **não alteradas**.

**Referências a 0025:** as menções a "0025" em `state.yml`/`plan.md`/`brief`/`spec.md` são **explicativas e corretas** (registram o descarte). Não há dir `0025`. Não scrubear.
