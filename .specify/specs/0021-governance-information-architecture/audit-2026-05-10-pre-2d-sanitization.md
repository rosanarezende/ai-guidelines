# Auditoria pré-2.D — Sanitização da Implementação 2.A/2.B/2.C

> **Spec:** [`./spec.md`](./spec.md)  
> **Plan:** [`./plan.md`](./plan.md)  
> **Tasks:** [`./tasks.md`](./tasks.md) (sub-bloco `[2.C-sanitize]`)  
> **Data:** 2026-05-10  
> **Owner da auditoria:** @rosanarezende (revisão humana) + Claude Opus 4.7 (execução)  
> **Status:** Concluída — sanitização materializada como sub-bloco atômico antes de iniciar 2.D.

---

## 🎯 Motivação

Após 2.C ser entregue (RulesEngine TS + reorg físico de `.core/rules/`), a owner solicitou auditoria DDD da implementação acumulada (PR1 + 2.A + 2.B + 2.C) com a lente **"rigor sem overengineering"**, **antes** de abrir 2.D.

O objetivo desta auditoria não é refazer trabalho aprovado, e sim caçar:

1. **Drift entre tipos e validação** — código compila mas a invariante prometida pelo type system não é checada em runtime.
2. **Drift entre código e documentação canônica** — `spec.md`/`plan.md`/`decision-brief.md`/`ARCHITECTURE.md`/`tasks.md`/`NEXT.md` divergindo do estado real.
3. **Smells DDD** — God Service nascendo, ports vazando, policies acumulando estado, IO escapando da infra.
4. **Overengineering oportunista** — abstrações criadas "por garantia" sem dor real.
5. **Coverage gaps** que ameacem 2.D ou PR3.

---

## 🧭 Escopo auditado

| Camada            | Arquivos                                                                                                                                                                                                                                                                 | Tamanho       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `domain/`         | `work-item/{WorkItem,WorkItemDraft,WorkItemPolicy}.ts`, `policy/{GovernancePolicies,PromotionPolicy}.ts`, `registry/Registry.ts`, `workspace/{WorkspaceState,WorkspacePrecedence,MigrationPlan}.ts`, `rules/{Rule,ruleZone,RulesCatalog}.ts`, `shared/{errors,types}.ts` | ~14 arquivos  |
| `app/`            | `ports/*`, `use-cases/{RegisterWorkItem,PromoteWorkItem,DiscoverWorkspace,AdoptWorkspace}.ts`, `services/{RegistryService,RulesEngine}.ts`                                                                                                                               | ~12 arquivos  |
| `infrastructure/` | `yaml/{registrySchema,GovernanceRegistryStore}.ts`, `filesystem/Node{FileSystemProbe,WorkspaceProvisioner}.ts`, `json/JsonRulesCatalogSource.ts`                                                                                                                         | 5 arquivos    |
| `test-utils/`     | `Boundaries.test.ts`, `doubles.ts`, `RulesTopologyConsistency.test.ts`                                                                                                                                                                                                   | 3 arquivos    |
| Testes ativos     | suítes BDD `[BR-CLI-*]` em `domain/` e `app/use-cases/` + integração yaml + integração workspace                                                                                                                                                                         | 120 testes ts |
| Docs              | `spec.md`, `plan.md`, `tasks.md`, `decision-brief.md`, `NEXT.md`, `.core/governance/ARCHITECTURE.md`                                                                                                                                                                     | 6 arquivos    |

---

## ✅ Pontos fortes (preservar)

1. **Discriminated union Dense/Virtual** é DDD exemplar — campos cruzados são impossíveis em compile-time, não dependem da policy para serem rejeitados.
2. **`GovernancePolicies` é fachada fina real** — apenas delega para `WorkItemPolicy.assertValidDraft` e `PromotionPolicy.promote`. Sem estado, sem orquestração. O nome no plural reforça a intenção de composição.
3. **Boundary Lock auto-aplicado** com roadmap explícito de migração para AST no PR3. Regex é declarada provisória, não eterna.
4. **Pure functions ubíquas:** `deriveWorkspaceState`, `resolvePrecedence`, `planAdoption`, `scopeToZone`, `pathToZone`. Determinismo total: mesma entrada → mesma saída.
5. **Atomicidade real** em vários níveis: `tmp + rename` na escrita do `registry.yml`; `removeDirectoryIfEmpty` como cláusula de não-destruição; rollback bilateral nos use cases.
6. **Stable error codes** (`REGISTRY_YAML_*`, `POLICY_*`, `WORKSPACE_*`, `RULES_*`) — SSOT de mensagens consumida por testes e UI.
7. **`PersistentRegistryStore` como extension interface** — testes ficam em `InMemoryRegistry` sem IO; quem implementa IO real declara `load`/`save`.
8. **`OPT_IN_FEATURE_LAYOUT` lança em feature desconhecida** — força reflexão de zona para cada feature opt-in nova, sem fallback silencioso.

Esses pontos definem a vara para futuras adições: novo eixo de policy = módulo próprio + composição; novo IO = novo adapter atrás de port; nova invariante = código de erro estável.

---

## 🔍 Achados — por severidade

### 🔴 Bloqueadores (corrigir antes de 2.D)

#### [A1] `WorkItemPolicy.assertValidDraft` não rejeita `workspacePath` em `patch`/`fix`

**Sintoma:** a validação atual (`WorkItemPolicy.ts` linhas 86–93) só verifica `proposal`:

```ts
if (draft.kind === "proposal" && draft.workspacePath !== undefined) {
  throw new GovernanceError("POLICY_PROPOSAL_MUST_BE_VIRTUAL", ...);
}
```

**Por que é bug:** `VIRTUAL_KINDS = ["proposal", "patch", "fix"]`. Se chega um draft `{kind: "fix", workspacePath: "x"}`, ele:

1. passa pela policy (não há check para `fix`);
2. cai em `buildWorkItem` do `RegisterWorkItem.ts`;
3. `isDenseKind("fix") === false`, então retorna o `base` sem `workspacePath` (linha 84–87);
4. o caller perde o campo **silenciosamente**, com aparência de sucesso.

Isto é **drift entre o type system e a validação**: o type system diz "VirtualWorkItem não tem workspacePath", mas só uma das três variantes virtuais é defendida em runtime.

**Correção:** generalizar para todos os virtuais (uso de `isVirtualKind`) com código de erro novo `POLICY_VIRTUAL_REJECTS_WORKSPACE`. O código antigo `POLICY_PROPOSAL_MUST_BE_VIRTUAL` deixa de existir (não há ainda releases públicas dependendo dele — está em ai-guidelines pré-1.0).

**Teste:** `Pillars.test.ts` ganha suite parametrizada cobrindo `proposal`, `patch` e `fix`.

#### [A2] Drift "6 pilares" vs "7 pilares" em `plan.md` e `decision-brief.md`

**Sintoma:** `plan.md` linhas 26, 43 e 64 dizem "6 pilares de valor". O 7º pilar (`experiment`) foi adicionado em 2026-05-10 com base em princípios de Growth Engineering (registrado no §"Origem Editorial" da `spec.md`). O `decision-brief.md` em A02 abre dizendo "consolidaremos o registry em 6 pilares MECE" e em seguida lista 7 itens.

**Por que importa:** quando o próximo agente humano/IA ler `plan.md` para entender escopo, vai contar 6. O domínio (`WORK_ITEM_KINDS`) e o `ARCHITECTURE.md` já dizem 7. **A doc canônica deve falar a mesma coisa que o código.**

**Correção:** patch documental + nota de revisitação:

- `plan.md`: substituir "6 pilares" por "7 pilares" nas 3 ocorrências; adicionar entrada em `📐 Decisões revisitadas` registrando a inclusão de `experiment` em 2026-05-10.
- `decision-brief.md` A02: ajustar a frase introdutória e adicionar pós-it "Ressalva 2026-05-10" sob a decisão (sem reabrir o gate — o gate cobre a expansão; só estamos sincronizando a contagem).

---

### 🟡 Importantes (resolver em 2.C-sanitize ou registrar débito)

#### [B1] `tasks.md` 1.C.5 marcado `[ ]` apesar do 2.B.5 ter resolvido

`tasks.md` linha 256:

```
- [ ] **1.C.5** Estratégia definitiva para preservação de comentários YAML (adiado para IO real)
```

Status real: 2.B.5 entregou o Caminho A (`parseDocument` + mutação granular via `yaml@2`). Marcar `[x]` com cross-ref para 2.B.5.

#### [B2] PR1 PR-MGMT headers ficaram `[ ]` mesmo com PR1 já merged

`tasks.md` linhas 171–174 (`1.[PR-MGMT.NEW-BRANCH]`, `1.[PR-MGMT.DESCRIPTION]`, `1.[PR-MGMT.REVIEW-GATE]`, `1.[PR-MGMT.MERGE-CHAIN]`) continuam `[ ]`. PR1 está merged conforme commit `9c1cd19` (2026-05-10).

Cosmético, mas se o boilerplate exige Harness Lock visível, deve refletir o estado real. Marcar `[x]` retroativos com nota.

#### [B3] Ordem `Register` vs `Promote` invertida — não documentada explicitamente

- `RegisterWorkItem.execute`: policy → **registry.add** → workspace.create (rollback registry se workspace falhar).
- `PromoteWorkItem.execute`: policy → **workspace.create** (se novo) → registry.update (rollback workspace se update falhar).

A invariante 4 do `ARCHITECTURE.md` ("Falha em criar workspace ⇒ rollback do registry. Falha em persistir registry ⇒ rollback do workspace já criado") já cobre os **dois** sentidos, mas a tabela §E.3 (Promotion semantics) não menciona que a ordem em `Promote` é o inverso de `Register`. Quem ler `RegisterItem.test.ts` espera o mesmo padrão em `PromoteItem.test.ts` e estranha.

**Correção:** acrescentar uma linha curta em `ARCHITECTURE.md` §E.3 explicando a inversão e o motivo (criar workspace primeiro evita estado intermediário com `kind=spec` apontando para pasta inexistente).

#### [B4] `RegistryService` — cobertura ergonômica e batch mode

- `RegistryService.add` é o único caminho coberto via `RegistryRoundTrip`. `update`/`remove`/`load`/`save` são exercitados apenas indiretamente via `GovernanceRegistryStore.test`.
- `options.autosave: false` (batch) nunca é testado.

Já está em NEXT.md débito 2.B.4. Manter como débito explícito — não adicionar testes neste sub-bloco (não vale o churn agora). Anotar em débito atualizado.

#### [B5] `JsonRulesCatalogSource` sem suite end-to-end

Coverage 0% (`Tests:` linha 7–29 nunca executada). O `RulesTopologyConsistency.test.ts` lê `rules.json` direto via `readFileSync` ao invés de usar o adapter próprio do bounded context (esquiva da DI).

Já está em NEXT.md débito 2.C.5. Manter; resolver em 2.D ou PR3 quando a CLI for plugada de fato.

#### [B6] Hardcoded `.specify` / `.ai-guidelines` em `DiscoverWorkspace.execute`

Linhas 37–38:

```ts
hasSpecify: probe.directoryExists(".specify"),
hasAiGuidelines: probe.directoryExists(".ai-guidelines"),
```

Mas `LEGACY_SOURCES` em `WorkspaceState.ts` já é a constante canônica:

```ts
export const LEGACY_SOURCES = [
  ".specify",
  ".ai-guidelines",
] as const satisfies ReadonlyArray<LegacySource>;
```

**Refatoração leve:** iterar `LEGACY_SOURCES` em vez de strings literais. Reduz drift e dá um único ponto de extensão se um terceiro legado aparecer.

#### [B7] Comentário fantasma em `RegistryService.ts`

Linha 4 cita `RegistryLoader.loadFromPath` — classe **inexistente** no codebase. O fluxo real é chamar `store.load()` diretamente (o store é o `GovernanceRegistryStore`). Comentário relíquia.

---

### 🟢 Pequenos (cleanup oportunista)

#### [C1] `RulesCatalog.RULE_ZONES` re-export inútil

`RulesCatalog.ts` re-exporta `RULE_ZONES`, mas o consumidor real (`Rule.ts`) já exporta. Re-export adiciona nó no grafo de imports sem ganho. Remover.

#### [C2] Duplicação `REGISTRY_IMMUTABLE_*` entre `InMemoryRegistry.update` e `GovernanceRegistryStore.update`

Mesmo bloco de checks (id imutável + createdAt imutável) em dois lugares. Extrair `assertRegistryImmutables(current, patch)` como helper puro reutilizável:

- Não é DRY-religioso: existe risco real de drift quando 2.D ligar a CLI e novo store aparecer.
- Helper puro é trivial (~10 linhas), testável isoladamente, sem custo de abstração.
- Marginal; aceitar se quisermos.

#### [C3] `RulesEngine` faz `build()` por dentro de cada lookup

`findById`, `listByZone`, `listByTag` chamam `build()` internamente. Para 40 regras isso é trivial. Não é overengineering nem performance crítica — só design lazy-explicit. **Não tocar agora.**

#### [C4] `bash.exe.stackdump` em git status

Artefato do shell Windows. Adicionar padrão `*.stackdump` ao `.gitignore`.

#### [C5] Skip-files `Isolation.test.ts` e `FileSystemAdapter.test.ts`

Mantidos em `it.skip` desde PR1. NEXT.md débito 2.B reconhece a equivalência via `RegistryRoundTrip` e a dependência de `WorkspaceStore` real (chega em 2.D/PR4). **Não tocar agora.**

#### [C6] Tests duplicados em `domain/policy/` e `app/use-cases/`

Existem `Promotion.test.ts` (policy pura) e `PromoteItem.test.ts` (use case orquestrado). Naming é distinto e os escopos são mesmo separados. **Não é duplicação — é DDD correto.**

---

## 🧹 Plano de Sanitização

Materializado como **sub-bloco `[2.C-sanitize]`** em `tasks.md`, executado em **commit atômico** antes de iniciar 2.D.

### Fase 1 — Bug fixes (obrigatórios) 🔴

| ID       | Ação                                                                                                                                                                                                                                                                    | Esforço |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **F1.1** | Generalizar `WorkItemPolicy.assertValidDraft` para `isVirtualKind && workspacePath !== undefined` → `POLICY_VIRTUAL_REJECTS_WORKSPACE`. Renomear `POLICY_PROPOSAL_MUST_BE_VIRTUAL` (era específico). Suite parametrizada em `Pillars.test.ts` cobre proposal/patch/fix. | ~15 min |
| **F1.2** | Substituir "6 pilares" → "7 pilares" em `plan.md` (3 ocorrências); adicionar entrada `2026-05-10` em `📐 Decisões revisitadas`. Adicionar ressalva pós-it em `decision-brief.md` A02 sem reabrir o gate.                                                                | ~5 min  |

### Fase 2 — Drift docs ↔ código 🟡

| ID       | Ação                                                                                                         | Esforço |
| -------- | ------------------------------------------------------------------------------------------------------------ | ------- |
| **F2.1** | `tasks.md` 1.C.5 → `[x]` com cross-ref para 2.B.5.                                                           | ~1 min  |
| **F2.2** | `tasks.md` PR1 PR-MGMT headers → `[x]` retroativos com nota "PR1 merged 9c1cd19".                            | ~2 min  |
| **F2.3** | `ARCHITECTURE.md` §E.3 (ou §C invariante 4): linha curta documentando inversão de ordem Register vs Promote. | ~5 min  |
| **F2.4** | Remover comentário fantasma de `RegistryLoader` em `RegistryService.ts` linha 4.                             | ~1 min  |

### Fase 3 — Cleanup leve 🟢

| ID       | Ação                                                                                                                                    | Esforço |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **F3.1** | `DiscoverWorkspace` itera `LEGACY_SOURCES` em vez de strings literais.                                                                  | ~5 min  |
| **F3.2** | Adicionar `*.stackdump` ao `.gitignore`.                                                                                                | ~1 min  |
| **F3.3** | Remover `RULE_ZONES` re-export de `RulesCatalog.ts`.                                                                                    | ~1 min  |
| **F3.4** | Extrair `assertRegistryImmutables` em `src/domain/registry/integrity.ts`; reutilizar em `InMemoryRegistry` e `GovernanceRegistryStore`. | ~15 min |

### Fase 4 — Atualização de NEXT.md (não toca código)

- Atualizar débitos 2.B.4 (RegistryService coverage) e 2.C.5 (JsonRulesCatalogSource E2E) com referência a esta auditoria.
- Adicionar item explícito "Auditoria pré-2.D realizada em 2026-05-10 — drift resolvido em `[2.C-sanitize]`".

### Validação final

```powershell
yarn format ; yarn check ; yarn test:nova-cli ; yarn test ; yarn build:rules
```

Esperado: 120 + 267 testes verdes, prettier OK, build:rules sem churn.

---

## 📌 Itens deixados intencionalmente fora

- **Re-write do builder mjs em TS** — gatilho é PR3 (`RuleExtractor` AST). Antes disso, mjs é SSOT.
- **AST migration do Boundary Lock** — gatilho é PR3 (LivingDocumentation já precisará da TS Compiler API instanciada).
- **`WorkspaceStore` real** — gatilho é 2.D quando a CLI plugar `.governance/specs/<id>/` no IO real.
- **Specs históricas referenciando `opt-in/methodologies/` e `opt-in/quality/`** — debito documental, fechamento em 4.C (cleanup holístico).
- **Race window em `NodeWorkspaceProvisioner.ensureDirectory`** — irrelevante em CLI single-process; revisitar se virar daemon.
- **`RegistryService.autosave: false` (batch)** — não bloqueia 2.D; manter como débito 2.B.4.

---

## 🪪 Critério de "pronto" desta auditoria

- [x] Bug funcional (F1.1) corrigido e coberto por teste parametrizado.
- [x] Drift de contagem de pilares (F1.2) reconciliado em `plan.md` e `decision-brief.md`.
- [x] `tasks.md` reflete estado real (1.C.5 + PR-MGMT PR1).
- [x] `ARCHITECTURE.md` documenta inversão de ordem Register vs Promote.
- [x] `RegistryService.ts` sem comentário fantasma.
- [x] `DiscoverWorkspace` sem hardcoded; helper de imutabilidade extraído.
- [x] `.gitignore` cobre `*.stackdump`.
- [x] Pipeline verde após sanitização.
- [x] NEXT.md atualizado registrando esta auditoria como executada.

> **Não-objetivo:** este documento não é "decision brief". Ele descreve uma **auditoria de qualidade** que não reabre decisões — apenas reconcilia código, docs e testes com as decisões já tomadas em `decision-brief.md`.
