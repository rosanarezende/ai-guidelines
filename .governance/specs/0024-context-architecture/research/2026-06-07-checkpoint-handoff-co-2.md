# Checkpoint de Handoff — CO-2 (`co-knowledge`) · design FECHADO + go dado (SSOT de retomada)

> **Documento de RETOMADA canônico** (ADR 0022). Assume **zero acesso ao transcript**.
> Data: 2026-06-07. O **design do CO-2 está FECHADO e aprovado pela owner** ("Go condicionado
> a este modelo"); a implementação **começou** e foi pausada (limite semanal). **Leia este
> arquivo + reconcilie contra os arquivos/git; os arquivos vencem.**

---

## 0. Ordem de retomada

1. `git status` (`.codex/` untracked = ignore) · `git log --oneline -6`.
2. Ler **este** handoff + memória `spec-0024-continuity-operational` + `state.yml § topology`.
3. `yarn validate` deve estar verde. Confirmar `cursor.pr = co-knowledge`, `#36`/`co-reconcile` em `concluded`.
4. Retomar a implementação do CO-2 a partir do §6 (camada onde parou). **NÃO re-deliberar o design** (§2 está travado).

## 1. Estado (CONFIRME contra git)

- **CO-1 (`co-reconcile`) CONCLUÍDO-NA-STACK** — Human Gate approved (`gates/c-co-reconcile.yml`); **PR #36 permanece ABERTO** (modo `unit`, **sem merge isolado** — merge único no `integration-final`). Entregou `reconcile:check` advisory-first (contrato sintático `canonical-next: <id>`). F1 da auditoria (falso-verde do `includes`) `accepted` após o fix `c24a47b`.
- Topologia: `co-reconcile` em `concluded` (seq 4, github_pr 36); **cursor em `co-knowledge`** (seq 5); `active: []`.
- **CO-2 em implementação** (este handoff). Branch do CO-2: `feat/spec-0024-co-knowledge`, **stacked sobre #36** (base = `feat/spec-0024-co-reconcile`); **Draft PR** aberto no início do desenvolvimento (ADR 0025 / contêiner-primeiro; nº conhecido após o push).
- **Camada de domínio INICIADA, NÃO concluída:** `src/domain/knowledge/GovernedRef.ts` escrito (VO: union `knowledge|work`, `formatGovernedRef`/`parseGovernedRef`/`isWellFormedGovernedRef`) — **sem testes ainda**; commitado neste checkpoint de início do CO-2 (junto com este handoff). `Falsification.ts` e **todo o resto do §6 estão PENDENTES.**

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

**OUT (→ nós posteriores; NÃO abrir):** `EnforcementBinding` + `knowledge:compile` (CO-3); projetor situado / reconcile-on-load (CO-4); captura/frontier (CO-5); dispatcher de eventos (CO-6); **migração ampla** do acervo (ADRs/DECs/WorkItems existentes); promover o check a `required`.

## 4. Invariantes

- **F1** — `falsifiesRef`, se presente, é `KnowledgeRef` bem-formado. `claim`/`evidence` não-vazios; `constrains` não-vazio.
- **F2** — `fingerprint == falsificationFingerprint(f)` (tamper-evidence; editar claim/refs sem re-selar → ⚠️; padrão 2.4c).
- **F3** — cada `constrains[i]` é `GovernedRef` bem-formado de conhecimento governado existente/**derivável** (FORMA, não existência — existência é advisory).
- **F4a (anti-reabertura por REF — determinístico, advisory)** — se `falsifiesRef` reaparece como nó **ativo** no grafo (insight `open`, decision/doctrine existente) → ⚠️ "reabrindo conhecimento falsificado". Comparação por igualdade de ref. Único candidate determinístico = o REF do nó (não fingerprint de claim).
- **F4b (anti-reabertura por paráfrase) — REBAIXADO a risco documentado.** Sem payload determinístico cross-tipo; exigiria NLP/LLM (ADR 0018). **Não fingir enforcement.** Mitigação futura: `supersede` explícito (CO-3+).

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

1. **Domínio (INICIADO)** — `GovernedRef.ts` escrito (working tree → commitado neste checkpoint), **ainda SEM testes**. **PENDENTE:** `Falsification.ts` (interface + `normalizeClaim` + `falsificationFingerprint` + `sealFalsification` + `validateFalsification` puro F1–F3) + testes de ambos (`GovernedRef.test.ts`, `Falsification.test.ts`).
2. **Grafo + adapters** — estender `KnowledgeGraph.ts` (nó união + relations) + `decision/doctrine` adapters + testes de travessia.
3. **Persistência** — `src/infrastructure/yaml/falsificationsSerializer.ts` (allowlist estrita, round-trip determinístico, opcionais omitidos — molde: `insightsLedgerSerializer.ts`) + testes.
4. **Check** — `src/cli/coKnowledgeCheck.ts` (`main` sempre exit 0; F1/F2/F3/F4a) + `cli/co-knowledge-check.mjs` (wrapper, espelha `reconcile-check.mjs`) + `package.json` script `co-knowledge:check` + inserir no `validate` após `reconcile:check` + testes (incl. fixture sintética que prova F4a + advisory não-bloqueante).
5. **Dogfood + finalização** — `.governance/runtime/falsifications.yml` (FAL-0001, §5) + `yarn format` + `yarn validate` verde + **commit local**. Abrir PR do CO-2 stacked sobre #36 = ação CORE-07 (autorização explícita; depois Technical Audit → Architectural Review → Human Gate).

## 7. NÃO REABRIR (travado nesta deliberação)

- `falsifies: ∅` (rejeitado: claim sempre obrigatória; só `falsifiesRef` é opcional).
- `KnowledgeRef` estendido para WorkItem (rejeitado: `KnowledgeRef` puro; WorkItem via `GovernedRef`).
- `DecisionSurface` persistida (rejeitado: `constrains` aponta ref existente/derivável — INV-4).
- F4 por equivalência semântica como enforcement (rejeitado: rebaixado a risco; sem NLP/LLM — ADR 0018).
- Falsification como `KnowledgeStage`/atributo (rejeitado: entidade ortogonal de 1ª classe).
- Migração ampla do acervo (fora de escopo); CO-3+ (fora de escopo).

## 8. Próximo passo imediato

Retomar o §6 a partir da **camada 1 PENDENTE** (`Falsification.ts` + testes). NÃO re-deliberar (§2 travado). NÃO abrir PR sem autorização. Manter advisory-first e disciplina modelo≠migração.

## 9. Cross-refs

- SSOT estrutural: `state.yml § topology` (cursor `co-knowledge`). Gate CO-1: `gates/c-co-reconcile.yml`.
- Kernel a reusar: `src/domain/knowledge/{KnowledgeRef,KnowledgeStage,KnowledgeArtifact}.ts` · `src/app/projections/{KnowledgeGraph,knowledgeSources}.ts` · `src/domain/insight/insightKnowledge.ts` (padrão adapter).
- Fingerprint canônico: `src/infrastructure/yaml/reviewArtifactsReader.ts` (`fingerprintOf`). Serializer molde: `insightsLedgerSerializer.ts`.
- Lentes: ADR 0018 (sem LLM runtime) · ADR 0026 / INV-4 (projeção≠entidade) · ADR 0021 (enforcement/gate humano) · ADR 0010 (WorkItem MECE). PIT-0008 (declaração≠enforcement). Memória `spec-0024-continuity-operational`.
