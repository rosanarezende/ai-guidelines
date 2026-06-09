# Checkpoint de Handoff — CO-2 (`co-knowledge`) · design FECHADO + go dado (SSOT de retomada)

> **Documento de RETOMADA canônico** (ADR 0022). Assume **zero acesso ao transcript**.
> Data original: 2026-06-07. Atualização CO-2.1: 2026-06-08. O **design do CO-2 está
> FECHADO/aprovado** e a **fatia vertical original foi IMPLEMENTADA e revisada** (Technical
>
> - Architectural approved, 0 findings). Por decisão da owner, o mesmo **Draft PR #37**
>   recebeu o checkpoint complementar `checkpoint-co-knowledge-backfill`: inventário/backfill
>   mínimo load-bearing + Rules-as-Knowledge (`AGENTS.md` como projeção, `.core/rules` como
>   fonte) + pesquisa graph-store. **Leia este arquivo + reconcilie contra os arquivos/git;
>   os arquivos vencem.**
>   Atualização complementar: `research/2026-06-08-knowledge-health-promotion-and-backfill-plan.md`
>   registra `knowledge:health`, critérios de promoção e o nó final `knowledge-readiness`.
>   Atualização CO-2.2: por decisão da owner, `script-contracts` foi absorvido no
>   próprio PR #37 como `checkpoint-script-contracts`, não mais empurrado para nó futuro.

---

## 0. Ordem de retomada

1. `git status` (`.codex/` untracked = ignore) · `git log --oneline -6`.
2. Ler **este** handoff + memória `spec-0024-continuity-operational` + `state.yml § topology`.
3. `yarn validate` deve estar verde. Confirmar `cursor.pr = co-knowledge`, `#36`/`co-reconcile` em `concluded`.
4. A fatia vertical original do CO-2 já está **completa** (§6, todas as camadas commitadas e revisadas). O trabalho vivo é **CO-2.2** (§10): contrato operacional de scripts/hooks/docs/workflows/templates. **NÃO re-deliberar o design base** (§2 travado).

## 1. Estado (CONFIRME contra git)

- **CO-1 (`co-reconcile`) CONCLUÍDO-NA-STACK** — Human Gate approved (`gates/c-co-reconcile.yml`); **PR #36 permanece ABERTO** (modo `unit`, **sem merge isolado** — merge único no `integration-final`). Entregou `reconcile:check` advisory-first (contrato sintático `canonical-next: <id>`). F1 da auditoria (falso-verde do `includes`) `accepted` após o fix `c24a47b`.
- Topologia: `co-reconcile` em `concluded` (seq 4, github_pr 36); **cursor em `co-knowledge` / `checkpoint-script-contracts`** (seq 5).
- **CO-2 — fatia vertical original COMPLETA** (escopo travado). Branch `feat/spec-0024-co-knowledge`, **stacked sobre #36** (base = `feat/spec-0024-co-reconcile`); **Draft PR #37** aberto (ADR 0025 / contêiner-primeiro). Technical Audit + Architectural Review aprovados, 0 findings.
- **CO-2.1 — checkpoint complementar no mesmo PR #37**: inventário/backfill mínimo, `FAL-0002`, `co-knowledge:inventory`, Rules-as-Knowledge (`RulesCatalog` projetado como nós `rule`, inclusive `OPT-*`/`ADP-*`) e research graph-store.
- **CO-2.2 — `checkpoint-script-contracts` no mesmo PR #37**: contrato operacional SSOT para `package.json`, hooks, workflows, templates e docs; `script-contracts:sync/check`; validação no `validate`. Após validar, precisa de **review complementar curto** antes de Ready/Human Gate.

## 2. Design FECHADO do CO-2 (modelo travado pela owner — NÃO re-deliberar)

**Princípio:** o kernel #34 modela a maturação POSITIVA (`KnowledgeStage`: insight→decision→rule|guardrail→doctrine; `KnowledgeArtifact {id, stage, graduatedTo?}`; `KnowledgeRef {stage,id}`; `KnowledgeGraph` read-model puro; `knowledgeSources.ts` = wiring que cresce; adapters puros à la `insightArtifact`). O CO-2 adiciona o eixo NEGATIVO + os tipos que faltam, por **extensão mínima** e **adapters/projeções** (sem migração de acervo).

### 2.1 `Falsification` (entidade de 1ª classe; NÃO é `KnowledgeStage`)

Campos (modelo travado):

| campo            | obrigatório?       | tipo            | nota                                                      |
| ---------------- | ------------------ | --------------- | --------------------------------------------------------- |
| `id`             | sim                | `FAL-NNNN`      | identidade                                                |
| `claim`          | **sim**            | string          | a proposição falsificada (o conteúdo negado)              |
| `fingerprint`    | **sim**            | string          | sela `claim_norm + falsifiesRef\|null + constrainsSorted` |
| `falsifiesRef`   | **opcional**       | `KnowledgeRef`  | a claim falsa **apenas quando já era governada** como nó  |
| `constrains`     | **sim, não-vazio** | `GovernedRef[]` | superfícies de decisão governadas restringidas            |
| `evidence`       | **sim, não-vazio** | string          | ex.: `git-tag:evidence/merge-prematuro-falsified`         |
| `crystallizedAs` | opcional           | `KnowledgeRef`  | a lição positiva, ex. `insight:PIT-0008`                  |
| `capturedAt`     | opcional           | ISO string      | consistência com `insights.yml`                           |

**Justificativa da owner:** "uma Falsification sempre falsifica uma `claim`. O que é opcional é a existência prévia dessa claim como nó governado (`falsifiesRef`)." → **NÃO modelar `falsifies: ∅`**: a claim é sempre conteúdo; `falsifiesRef` é que pode faltar.

### 2.2 `GovernedRef` (✅ já implementado em `GovernedRef.ts`)

`KnowledgeRef` permanece PURO no eixo de estágios (`insight|decision|rule|guardrail|doctrine`; não colocar WorkItem/provider como estágio). No estágio `rule`, os ids válidos incluem `GR-*`, `CORE-*`, `OPT-*` e `ADP-*`: escopo opt-in/provider é metadado de `RulesCatalog`, não `KnowledgeStage`. Alvo constrangível =
`GovernedRef = { space:"knowledge"; ref: KnowledgeRef } | { space:"work"; id: WorkItemId }`.
`formatGovernedRef` → `"knowledge:decision:DEC-0024-G07"` | `"work:spec-0024"`. WorkItem entra SÓ por aqui (ADR 0010 preservado).

### 2.3 Fingerprint — payload exato

`fingerprint = sha256(JSON.stringify([ normalizeClaim(claim), falsifiesRef?formatRef:null, constrains.map(formatGovernedRef).sort() ]))[:12]` (padrão canônico do `reviewArtifactsReader`). `normalizeClaim` = colapsa whitespace + trim — **resiste só a variação SUPERFICIAL de formatação, NÃO a paráfrase semântica** (exigiria NLP/LLM, proibido — ADR 0018). É **tamper-evidence + identidade**, não detector de equivalência semântica.

### 2.4 Grafo (extensão mínima) + adapters

- `KnowledgeGraph` (`src/app/projections/KnowledgeGraph.ts`): nó vira união `{kind:"artifact", id, stage} | {kind:"falsification", id}`; `KnowledgeEdge.relation` ganha `"falsifies" | "constrains" | "crystallizedAs"` (além de `"graduatedTo"`). Aresta `constrains` aponta `GovernedRef`; as demais, `KnowledgeRef`. Nós-alvo podem não estar materializados (igual ao `graduatedTo` hoje — `incoming` já suporta).
- Adapters puros `decisionArtifact`/`ruleArtifact`/`doctrineArtifact` (Lens = flag de doctrine, mesmo stage) — projetam fonte governada como `KnowledgeArtifact` para o grafo ser heterogêneo. **Mínimos**: NÃO ler/backfillar cegamente o acervo inteiro de ADRs/DECs/regras; `RulesCatalog` entra como fonte tipada, e `AGENTS.md` permanece projeção runtime compilada.

## 3. Escopo IN / OUT

**IN (CO-2):** `Falsification` (domínio + fingerprint + invariantes); `GovernedRef` (✅); arestas `falsifies`/`constrains`/`crystallizedAs` no grafo; adapters `decision`/`doctrine`; persistência `falsifications/ledger.yml` + serializer; `co-knowledge:check` advisory; dogfood `FAL-0001`. Modelo de tipos **completo**; fatia vertical **mínima** que prova os invariantes.

**IN (CO-2.1):** inventário/backfill mínimo versionado (`knowledge-backfill.yml`) com 2 exemplos por tipo (`insight`, `decision`, `rule`, `guardrail`, `doctrine`, `falsification`); exemplos adicionais `OPT-*`/`ADP-*` para provar `AGENTS.md` como projeção de `.core/rules`; `FAL-0002` para CO-1/PIT-0001; parser/check `co-knowledge:inventory` required no `validate`; montagem mínima do `KnowledgeGraph` a partir do inventário e do `RulesCatalog`; research graph-store (`2026-06-08-graph-store-options.md`) comparando Neo4j/RDF/SQLite/Postgres/Cassandra/Git.

**OUT (→ nós posteriores; NÃO abrir):** `EnforcementBinding` + `knowledge:compile` (CO-3); projetor situado / reconcile-on-load (CO-4); captura/frontier (CO-5); dispatcher de eventos (CO-6); **backfill/migração AMPLA** do acervo histórico (agora condicionado ao nó final `knowledge-readiness`, antes de `integration-final`); instalar/adotar banco externo como runtime/SSOT.

> **Precisão CO-2.1:** "migração fora de escopo" agora significa **sem backfill amplo cego**, não ausência de plano. O PR #37 passa a carregar um backfill mínimo load-bearing + inventário com deadlines + plano de readiness final. O que não migrar agora precisa estar classificado, não escondido como dívida implícita.

## 4. Invariantes

- **F1** — `falsifiesRef`, se presente, é `KnowledgeRef` bem-formado. `claim`/`evidence` não-vazios; `constrains` não-vazio.
- **F2** — `fingerprint == falsificationFingerprint(f)` (tamper-evidence; editar claim/refs sem re-selar → ⚠️; padrão 2.4c).
- **F3** — cada `constrains[i]` é `GovernedRef` bem-formado de conhecimento governado existente/**derivável** (FORMA, não existência — existência é advisory).
- **F4a (anti-reabertura por REF — determinístico, advisory)** — se `falsifiesRef` reaparece como nó **ativo** no grafo (insight `open`, decision/doctrine existente) → ⚠️ "reabrindo conhecimento falsificado". Comparação por igualdade de ref. Único candidate determinístico = o REF do nó (não fingerprint de claim).
- **F4b (reabertura por paráfrase semântica) — fora do enforcement MECÂNICO do runtime.** O `co-knowledge:check` (determinístico) **não decide** equivalência semântica — isso exigiria julgamento semântico. **NÃO é "o humano resolve sozinho, sem apoio":** a mitigação correta é **revisão assistida por IA** (canal de síntese / adversarial review) que **sugere candidatos** a duplicata, com **decisão final humana no Gate** (ADR 0021). Preserva ADR 0018 — a IA não é runtime nem fonte de verdade; **sugere, não decide nem sela estado**. (Mitigação estrutural opcional futura: `supersede` explícito, CO-3+.)

Tudo **advisory-first**: `co-knowledge:check` `main` retorna sempre 0.

## 5. Dogfood `FAL-0001` (merge-prematuro)

```yaml
# .governance/runtime/falsifications/ledger.yml
FAL-0001:
  claim: "restrição de evento de merge/aterrissagem é enforçável em superfície de estado contínuo (status check/landing_policy/vehicle-from-topology)"
  # falsifiesRef AUSENTE DE PROPÓSITO: a claim falsa NUNCA foi governada como nó
  # antes — só existem a evidência (git tag) e a LIÇÃO (PIT-0008). Esta lacuna é
  # exatamente o que o CO-2 fecha (critério explícito da owner).
  constrains: ["knowledge:decision:DEC-0024-G07"] # topology = declaração, não enforcement
  crystallizedAs: "insight:PIT-0008" # a lição positiva
  evidence: "git-tag:evidence/merge-prematuro-falsified"
  fingerprint: <selar com falsificationFingerprint>
```

Prova **F1–F3 + `constrains`**; **NÃO** F4a (sem `falsifiesRef`). F4a é provado por **fixture sintética** (`Falsification` com `falsifiesRef: decision:DEC-XXXX` + nó ativo homônimo).

## 6. Plano de implementação (camadas + ESTADO) — retomar daqui

Todas as camadas abaixo estão **CONCLUÍDAS e commitadas** na branch (PR #37):

1. ✅ **Domínio** — `GovernedRef.ts` + `Falsification.ts` (`normalizeClaim`, `falsificationFingerprint`, `sealFalsification`, `validateFalsification` F1–F3) + testes (`f90069d`).
2. ✅ **Grafo + adapters** — `KnowledgeGraph` nó-união + relations `falsifies`/`constrains`/`crystallizedAs` + `typedArtifacts` (`decision`/`doctrine`) + testes (`564a3fc`).
3. ✅ **Persistência** — `falsificationsSerializer` (allowlist, round-trip determinístico, opcionais omitidos) + testes (`90a89b9`).
4. ✅ **Check** — `coKnowledgeCheck.ts` + `co-knowledge-check.mjs` + script `co-knowledge:check` no `validate` (após `reconcile:check`) + testes (F4a + advisory não-bloqueante) (`90a89b9`).
5. ✅ **Dogfood** — `.governance/runtime/falsifications/ledger.yml` (FAL-0001, §5; `falsifies_ref` ausente explícito) (`90a89b9`). `yarn validate` verde (103 suites / 1005 testes).

Início/topologia: `2bca476` (handoff + GovernedRef + cursor) + `caf64da` (planned→active, PR #37).

## 7. NÃO REABRIR (travado nesta deliberação)

- `falsifies: ∅` (rejeitado: claim sempre obrigatória; só `falsifiesRef` é opcional).
- `KnowledgeRef` estendido para WorkItem (rejeitado: `KnowledgeRef` puro; WorkItem via `GovernedRef`).
- `DecisionSurface` persistida (rejeitado: `constrains` aponta ref existente/derivável — INV-4).
- F4 por equivalência semântica como enforcement (rejeitado: rebaixado a risco; sem NLP/LLM — ADR 0018).
- Falsification como `KnowledgeStage`/atributo (rejeitado: entidade ortogonal de 1ª classe).
- Migração ampla do acervo (fora de escopo); CO-3+ (fora de escopo).

## 8. Próximo passo imediato

A fatia vertical original está completa e revisada; o trabalho vivo é CO-2.2. Fluxo de fechamento da 0024 (Draft até o fim):
concluir os deltas ativos do PR #37 → `yarn validate` → **revisões complementares conforme `.governance/review-policy.yml`** (na 0024 seguimos usando Technical/Architectural como dogfood intensivo, não como regra universal) → **atualizar body final** (Valor entregue/disclosure/evidências) → **converter para Ready** (a entrega está pronta para decisão humana) → **Human Gate** (owner decide avançar/ajustar/rejeitar; NÃO é merge em main). NÃO re-deliberar (§2); NÃO abrir CO-3+; NÃO instalar banco externo neste PR.

## 9. CO-2.1 (`checkpoint-co-knowledge-backfill`) — delta aprovado pela owner

Motivação: a implementação original provava o modelo, mas ainda deixava ambígua a adoção real do grafo. A owner rejeitou deixar a migração como dívida invisível. O delta mínimo aprovado:

- `knowledge-backfill.yml` com 2 exemplos por tipo: `insight`, `decision`, `rule`, `guardrail`, `doctrine`, `falsification`; e exemplos source-side de regra `OPT-*`/`ADP-*` para cobrir o conteúdo que aparece compilado em `AGENTS.md`.
- `FAL-0002` reifica a falsificação CO-1/PIT-0001: "retomada pode confiar no próximo narrado sem reconciliar contra state.yml topology".
- `co-knowledge:inventory` valida cobertura mínima e deadlines; entra no `validate`.
- `knowledgeGraphFromBackfill` monta o read-model mínimo a partir do inventário + ledger de Falsifications.
- `knowledgeGraphFromRulesCatalog` projeta `RulesCatalog` diretamente como nós `rule`; `AGENTS.md` deixa de ser tratado como fonte conceitual e passa a ser apenas uma projeção compilada do mesmo conhecimento.
- Research graph-store compara Neo4j/RDF/SQLite/Postgres/Cassandra/Git. Decisão provisória: Neo4j tem maior fit para spike futuro, mas banco externo deve ser projeção derivada reconstruível, não SSOT.
- Plano complementar de readiness (`2026-06-08-knowledge-health-promotion-and-backfill-plan.md`): define `knowledge:health` como dossiê determinístico + prompt de revisão assistida por IA (humano decide F4b), critérios de promoção de `co-knowledge:integrity`/`co-knowledge:check`, e condiciona o backfill amplo P0/P1 ao nó final `knowledge-readiness` antes de `integration-final`.

## 10. CO-2.2 (`checkpoint-script-contracts`) — delta aprovado pela owner

Motivação: scripts, hooks, docs, workflows e templates estavam ficando confusos e
podiam prometer gates diferentes dos realmente executados. Como este repositório é
framework, o tamanho atual do dogfooding não pode enviesar o desenho para "só dois
state.yml" ou "só alguns scripts".

Entregável esperado:

- `.core/governance/script-contracts.yml` como SSOT operacional.
- `script-contracts:sync` para projetar `package.json`, `.husky/*`, templates de
  consumidor e `docs/scripts.md`.
- `script-contracts:check` no `validate`, falhando em drift.
- `CORE-08`/`CORE-14` e `AGENTS.md` migrados do comando manual duplicado para o
  contrato por hooks instalados.
- `script-contracts` removido de planned e absorvido em `co-knowledge` no PR #37.

## 11. Cross-refs

- SSOT estrutural: `state.yml § topology` (cursor `co-knowledge`). Gate CO-1: `gates/c-co-reconcile.yml`.
- Kernel a reusar: `src/domain/knowledge/{KnowledgeRef,KnowledgeStage,KnowledgeArtifact}.ts` · `src/app/projections/{KnowledgeGraph,knowledgeSources}.ts` · `src/domain/insight/insightKnowledge.ts` (padrão adapter).
- Fingerprint canônico: `src/infrastructure/yaml/reviewArtifactsReader.ts` (`fingerprintOf`). Serializer molde: `insightsLedgerSerializer.ts`.
- Lentes: ADR 0018 (sem LLM runtime) · ADR 0026 / INV-4 (projeção≠entidade) · ADR 0021 (enforcement/gate humano) · ADR 0010 (WorkItem MECE). PIT-0008 (declaração≠enforcement). Memória `spec-0024-continuity-operational`.
