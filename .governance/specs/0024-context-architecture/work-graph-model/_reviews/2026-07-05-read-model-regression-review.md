# Regressão de read-model/dashboard sem browser — governance-demo

> **Tipo:** implementação de testes de regressão de read-model (artefato de apoio, sem autoridade própria).
> **Data:** 2026-07-05.
> **Base:** HEAD `dcebd065`, PR #45 Draft. Segue o review de API/route do mesmo dia.
> **Foco:** provar a derivação de `/api/results`, `/api/work`, `/api/map`, `/api/graph*` sem subir servidor nem browser.

## 1. Base verificada (FATOS)

- HEAD `dcebd065`; PR #45 Draft; tree limpa.
- `test:shell` (backend) passa com a nova regressão: **30/30** (~1.5s), incluindo 8 testes novos de read-model.
- Rotas de read-model: `/api/results/dashboard`, `/api/work/items`, `/api/map/governance` são gate → `loadGovernanceSnapshot()` → builder de view-model do frontend; `/api/graph*` chama as queries do backend diretamente.

## 2. Diagnóstico

O read-model (grafo derivado + dashboard) tinha cobertura **só via browser** (contratos APP-28/29/26, todos `expected-fail` — nem rodam o corpo). A derivação em si — rollup do dashboard, integridade do grafo, contract-impact, intent-deps — não tinha teste rápido, apesar de:

- `loadGovernanceSnapshot()` e as queries (`queryGraphOverview/ContractImpact/IntentDependencies/GraphPath/GraphConflicts`) serem **funções puras de leitura** do host governado da acme (arquivos fixos → determinístico), importáveis por caminho relativo no backend;
- serem exatamente o que `/api/results|work|map|graph*` servem.

Seam correto: **backend node:test**. Os builders de view-model (`app/*/_model/from-snapshot`) são presentation do frontend (alias `@demo/backend`, node-unrunnable) e seguem cobertos por e2e — não os dupliquei.

## 3. O que foi implementado

`backend/tests/read-model-regression.test.ts` (node:test, sem servidor/browser), 8 testes:

- **snapshot coerente**: revision/company/counts presentes; `graphNodes/graphEdges` batem com o grafo.
- **rollup (invariante de segurança)**: para TODO target, `actualCount` = nº de outcomes **válidos**; `invalidCount` = resto; `actualCount===0 ⇒ actual === "sem actual valido"`. Prova que outcome sem evidência **não infla** o dashboard (a garantia por trás de SEC-08) no nível de derivação.
- **outcome valid flag**: `valid` reflete ausência de erro de validação no snapshot.
- **grafo derivado**: `derived:true`, `sourceRevision` presente, tipos centrais (objective/target/intent/contract/outcome) presentes, toda aresta referencia nós reais.
- **shortest path**: caminho existe entre extremos de uma aresta real.
- **contract-impact**: resolve para um contrato real, com consumers/affectedIntents/affectedTargets/outcomesCiting como listas.
- **intent-deps**: resolve superfície (works/repos/dependsOn/transitiveDependsOn) de uma intent real.
- **conflicts**: derivado, lista tipada (`contract-contention|attestation-collapse|validation-error`).

IDs derivados em runtime do próprio grafo (não hardcoded): robusto a ajustes de dados, mas quebra se a derivação regredir (query retorna null, grafo perde tipo, rollup passa a somar inválido).

## 4. O que segue frágil / próximos gaps

- **Presentation dos builders de view-model** (`buildResultsDashboard/buildWorkItems/buildGovernanceMaps`) segue só em e2e (`expected-fail`) — quando `/results|work|map` virarem `active`, o corpo passa a rodar e cobre a shaping.
- **Gate das rotas** (`resolveAdoptionGate` → 401/404/`governance-host-not-linked`) é frontend/next; não coberto por node:test. Candidato a Playwright `request` (sem browser) como a casca de `/api/local`.
- Migração de `seed-coverage.spec.ts` (25 boots) para node:test segue pendente.

## 5. Camadas de teste (estado após esta rodada)

| Camada                          | Comando                  | Custo          | Escopo                                                      |
| ------------------------------- | ------------------------ | -------------- | ----------------------------------------------------------- |
| Domínio/invariante + read-model | `backend run test:shell` | ~1.5s          | authority, invariantes de seed, **read-model/rollup/grafo** |
| API in-memory                   | `mock-api run test:api`  | ~250ms         | handler de comando (schema/replay/authority/isolamento)     |
| Rota real HTTP                  | dentro de `test:e2e`     | boot servidor  | sessão/JSON das rotas                                       |
| Contract/e2e                    | `test:e2e`               | boot + browser | jornadas, presentation                                      |

Caminho oficial: `check-governance-app.ts` roda backend `test:shell` (agora com read-model) + mock-api `test:api` — as camadas rápidas entram no check governado.
