# Checkpoint de Handoff — CO-2 (`co-knowledge`) · design FECHADO + go dado (SSOT de retomada)

> **Documento de RETOMADA canônico** (ADR 0022). Assume **zero acesso ao transcript**.
> Data: 2026-06-07. O **design do CO-2 está FECHADO/aprovado** e a **fatia vertical foi
> IMPLEMENTADA** (5 camadas, `yarn validate` verde); **Draft PR #37** aberto, aguardando o
> **Technical Audit Gate**. **Leia este arquivo + reconcilie contra os arquivos/git; os arquivos vencem.**

---

## 0. Ordem de retomada

1. `git status` (`.codex/` untracked = ignore) · `git log --oneline -6`.
2. Ler **este** handoff + memória `spec-0024-continuity-operational` + `state.yml § topology`.
3. `yarn validate` deve estar verde. Confirmar `cursor.pr = co-knowledge`, `#36`/`co-reconcile` em `concluded`.
4. A fatia vertical do CO-2 já está **completa** (§6, todas as camadas commitadas). Próximo = **Technical Audit Gate**, NÃO implementação. **NÃO re-deliberar o design** (§2 travado).

## 1. Estado (CONFIRME contra git)

- **CO-1 (`co-reconcile`) CONCLUÍDO-NA-STACK** — Human Gate approved (`gates/c-co-reconcile.yml`); **PR #36 permanece ABERTO** (modo `unit`, **sem merge isolado** — merge único no `integration-final`). Entregou `reconcile:check` advisory-first (contrato sintático `canonical-next: <id>`). F1 da auditoria (falso-verde do `includes`) `accepted` após o fix `c24a47b`.
- Topologia: `co-reconcile` em `concluded` (seq 4, github_pr 36); **cursor em `co-knowledge`** (seq 5); `active: []`.
- **CO-2 — fatia vertical COMPLETA** (escopo travado). Branch `feat/spec-0024-co-knowledge`, **stacked sobre #36** (base = `feat/spec-0024-co-reconcile`); **Draft PR #37** aberto (ADR 0025 / contêiner-primeiro). `yarn validate` verde (103 suites / 1005 testes); `governance-pr-check` ✅.
- **Todas as camadas do §6 estão CONCLUÍDAS e commitadas** (domínio + grafo + persistência + check + dogfood). **Nada pendente** no escopo do CO-2. Próximo passo = **Technical Audit Gate** (§8) — não implementação.

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

`KnowledgeRef` permanece PURO (`insight|decision|rule|guardrail|doctrine`; não estender `ID_PATTERN`). Alvo constrangível =
`GovernedRef = { space:"knowledge"; ref: KnowledgeRef } | { space:"work"; id: WorkItemId }`.
`formatGovernedRef` → `"knowledge:decision:DEC-0024-G07"` | `"work:spec-0024"`. WorkItem entra SÓ por aqui (ADR 0010 preservado).

### 2.3 Fingerprint — payload exato

`fingerprint = sha256(JSON.stringify([ normalizeClaim(claim), falsifiesRef?formatRef:null, constrains.map(formatGovernedRef).sort() ]))[:12]` (padrão canônico do `reviewArtifactsReader`). `normalizeClaim` = colapsa whitespace + trim — **resiste só a variação SUPERFICIAL de formatação, NÃO a paráfrase semântica** (exigiria NLP/LLM, proibido — ADR 0018). É **tamper-evidence + identidade**, não detector de equivalência semântica.

### 2.4 Grafo (extensão mínima) + adapters

- `KnowledgeGraph` (`src/app/projections/KnowledgeGraph.ts`): nó vira união `{kind:"artifact", id, stage} | {kind:"falsification", id}`; `KnowledgeEdge.relation` ganha `"falsifies" | "constrains" | "crystallizedAs"` (além de `"graduatedTo"`). Aresta `constrains` aponta `GovernedRef`; as demais, `KnowledgeRef`. Nós-alvo podem não estar materializados (igual ao `graduatedTo` hoje — `incoming` já suporta).
- Adapters puros `decisionArtifact`/`doctrineArtifact` (Lens = flag de doctrine, mesmo stage) — projetam ref governado como `KnowledgeArtifact` para o grafo ser heterogêneo. **Mínimos**: NÃO ler o acervo de ADRs/DECs (isso é migração — fora).

## 3. Escopo IN / OUT

**IN (CO-2):** `Falsification` (domínio + fingerprint + invariantes); `GovernedRef` (✅); arestas `falsifies`/`constrains`/`crystallizedAs` no grafo; adapters `decision`/`doctrine`; persistência `falsifications.yml` + serializer; `co-knowledge:check` advisory; dogfood `FAL-0001`. Modelo de tipos **completo**; fatia vertical **mínima** que prova os invariantes.

**OUT (→ nós posteriores; NÃO abrir):** `EnforcementBinding` + `knowledge:compile` (CO-3); projetor situado / reconcile-on-load (CO-4); captura/frontier (CO-5); dispatcher de eventos (CO-6); **backfill/migração AMPLA** do acervo histórico (converter todo o conjunto de ADRs/DECs/WorkItems existentes em registros/fixtures); promover o check a `required`.

> **Precisão (Architectural Review):** "migração fora de escopo" = **sem backfill amplo** do acervo — **NÃO** modelo incompleto nem dívida estrutural. O CO-2 entrega a capacidade estrutural COMPLETA (`Falsification`, `Decision`, `ADR/Lens`, `WorkItem` como refs/alvos pelo modelo travado) + o dogfood mínimo **load-bearing** (`FAL-0001`). Seria débito se faltasse tipo/aresta/serializer/check/fixture essencial — não falta.

## 4. Invariantes

- **F1** — `falsifiesRef`, se presente, é `KnowledgeRef` bem-formado. `claim`/`evidence` não-vazios; `constrains` não-vazio.
- **F2** — `fingerprint == falsificationFingerprint(f)` (tamper-evidence; editar claim/refs sem re-selar → ⚠️; padrão 2.4c).
- **F3** — cada `constrains[i]` é `GovernedRef` bem-formado de conhecimento governado existente/**derivável** (FORMA, não existência — existência é advisory).
- **F4a (anti-reabertura por REF — determinístico, advisory)** — se `falsifiesRef` reaparece como nó **ativo** no grafo (insight `open`, decision/doctrine existente) → ⚠️ "reabrindo conhecimento falsificado". Comparação por igualdade de ref. Único candidate determinístico = o REF do nó (não fingerprint de claim).
- **F4b (reabertura por paráfrase semântica) — fora do enforcement MECÂNICO do runtime.** O `co-knowledge:check` (determinístico) **não decide** equivalência semântica — isso exigiria julgamento semântico. **NÃO é "o humano resolve sozinho, sem apoio":** a mitigação correta é **revisão assistida por IA** (canal de síntese / adversarial review) que **sugere candidatos** a duplicata, com **decisão final humana no Gate** (ADR 0021). Preserva ADR 0018 — a IA não é runtime nem fonte de verdade; **sugere, não decide nem sela estado**. (Mitigação estrutural opcional futura: `supersede` explícito, CO-3+.)

Tudo **advisory-first**: `co-knowledge:check` `main` retorna sempre 0.

## 5. Dogfood `FAL-0001` (merge-prematuro)

```yaml
# .governance/runtime/falsifications.yml
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
5. ✅ **Dogfood** — `.governance/runtime/falsifications.yml` (FAL-0001, §5; `falsifies_ref` ausente explícito) (`90a89b9`). `yarn validate` verde (103 suites / 1005 testes).

Início/topologia: `2bca476` (handoff + GovernedRef + cursor) + `caf64da` (planned→active, PR #37).

## 7. NÃO REABRIR (travado nesta deliberação)

- `falsifies: ∅` (rejeitado: claim sempre obrigatória; só `falsifiesRef` é opcional).
- `KnowledgeRef` estendido para WorkItem (rejeitado: `KnowledgeRef` puro; WorkItem via `GovernedRef`).
- `DecisionSurface` persistida (rejeitado: `constrains` aponta ref existente/derivável — INV-4).
- F4 por equivalência semântica como enforcement (rejeitado: rebaixado a risco; sem NLP/LLM — ADR 0018).
- Falsification como `KnowledgeStage`/atributo (rejeitado: entidade ortogonal de 1ª classe).
- Migração ampla do acervo (fora de escopo); CO-3+ (fora de escopo).

## 8. Próximo passo imediato

A fatia vertical está completa; **nada pendente** no escopo travado. Fluxo de fechamento da 0024 (Draft até o fim):
**Technical Audit Gate** (auditoria adversarial técnica; findings em artefato; correções podem ocorrer ainda em Draft) → **Architectural Review Gate** (aderência a ADRs/topologia/escopo) → **atualizar body final** (Valor entregue/disclosure/evidências) → **converter para Ready** (a entrega está pronta para decisão humana) → **Human Gate** (owner decide avançar/ajustar/rejeitar; NÃO é merge em main). NÃO re-deliberar (§2); NÃO abrir CO-3+; NÃO migrar acervo; **NÃO marcar Ready antes do Architectural Review fechar**.

## 9. Cross-refs

- SSOT estrutural: `state.yml § topology` (cursor `co-knowledge`). Gate CO-1: `gates/c-co-reconcile.yml`.
- Kernel a reusar: `src/domain/knowledge/{KnowledgeRef,KnowledgeStage,KnowledgeArtifact}.ts` · `src/app/projections/{KnowledgeGraph,knowledgeSources}.ts` · `src/domain/insight/insightKnowledge.ts` (padrão adapter).
- Fingerprint canônico: `src/infrastructure/yaml/reviewArtifactsReader.ts` (`fingerprintOf`). Serializer molde: `insightsLedgerSerializer.ts`.
- Lentes: ADR 0018 (sem LLM runtime) · ADR 0026 / INV-4 (projeção≠entidade) · ADR 0021 (enforcement/gate humano) · ADR 0010 (WorkItem MECE). PIT-0008 (declaração≠enforcement). Memória `spec-0024-continuity-operational`.
