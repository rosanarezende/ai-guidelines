# Auditoria adversarial da ARQUITETURA de testes — governance-demo

> **Tipo:** auditoria adversarial de arquitetura de teste (artefato de apoio, sem autoridade própria).
> **Data:** 2026-07-05.
> **Base:** HEAD `765a5a40`, PR #45 Draft. Continua os reviews de 2026-07-05 (adversarial / phase0 / full-app-gap).
> **Foco:** não "mais testes", e sim atacar o **nível** e a **forma** da suíte.

## 1. Base verificada (FATOS)

- `contracts:check` PASS: `56 contratos (14 deny), 26 seeds, 11 rotas, {active:5, expected-fail:22, fixme:29}` (7 seeds sem contrato — warn).
- `typecheck` e2e + mock-api + backend → PASS. `test:e2e` verde. `git status` limpo antes desta rodada.
- Inventário: **16 specs Playwright** em `test/journeys/`; **1 spec de domínio** em `backend/tests/adoption-authorization.test.ts` (node:test, 5 testes) — fora do conjunto de checks focados; corre só dentro do pesado `check-governance-app.ts`.
- Superfície de API real: **40+ rotas** `/api/local/*` + `/api/graph*` + `/api/results` + `/api/work` + `/api/map`. Testadas por HTTP direto: **2** (`security-journey.spec.ts`).

## 2. Diagnóstico adversarial

**A pirâmide de teste está invertida.** Quase toda asserção — inclusive regras de domínio puras — paga o custo de subir Next + mock-api + browser:

- `seed-coverage.spec.ts` (25 testes) e `authority-model.spec.ts` (SEC-11/12) **não usam o browser**: só chamam funções de domínio + um `GET /api/shell/state`. Rodam sob Playwright por inércia, não por necessidade. São testes de domínio disfarçados de e2e.
- O único layer rápido real (`backend/tests`, node:test) tinha **5 testes** e **não estava nos checks focados** — invisível no loop de desenvolvimento.
- **Não existe layer de API/route.** 40+ rotas com enforcement de authority/fail-closed, e só 2 casos HTTP. O kernel `authorizeShellCommand` (mapa papel→comando) não tinha teste de matriz.
- **Categorias ausentes**: property/invariante, matriz de autorização, mock-fidelity explícito, regressão do read-model de grafo, acessibilidade/teclado, isolamento multi-workspace como invariante, idempotência/replay/stale no nível de teste da demo.

**Consequência:** a suíte é lenta para o que deveria ser instantâneo, e frágil onde deveria ser estrutural. Um invariante central ("papel proposto nunca autoriza") era provado por 1 caso e2e, não por propriedade sobre todo o corpus.

## 3. Mapa da arquitetura (alvo)

| Camada             | Ferramenta                              | O que prova                                                                                    | Estado                                           |
| ------------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Domínio/invariante | `node --test` (backend/tests)           | authority, role state-machine, sourceTrust, onboarding, isolamento demo, matriz de autorização | **elevado nesta rodada** (5 → 22 testes, ~207ms) |
| API/route          | HTTP direto ou use-case                 | `/api/local/*` authority, fail-closed, idempotência                                            | **lacuna** (2 casos)                             |
| Contract/e2e       | Playwright + mock-api                   | jornada humana, cross-screen, sentinela                                                        | maduro (56 contratos)                            |
| Seed regression    | node:test (recomendado) hoje Playwright | seeds carregam e mantêm invariantes                                                            | migrar de Playwright                             |
| Governança/backend | tools/checks + backend                  | resolver, event-log, adapters                                                                  | existente                                        |

## 4. Gaps por tipo de teste

| Tipo                        | Estado                                            | Ação                                                                                                                     |
| --------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Property/invariante         | **adicionado**: INV-1..5 sobre todas as seeds     | manter; ampliar com stack-compat e trust por kind                                                                        |
| Matriz de autorização       | **adicionado**: papel × comando no kernel         | ampliar para role.assign self/sensitive e invite/token                                                                   |
| API/route                   | lacuna                                            | novo layer HTTP contra `/api/local/*` (authority, 422 fail-closed, idempotency-key/replay)                               |
| State-machine               | parcial (role no backend test)                    | onboarding not-started→partial→finished; invite pending→accepted/declined/revoked/expired; source draft→scanned→degraded |
| Cross-screen por identidade | fraco (regex de copy)                             | ligar por valor (id/sourceRevision) quando a UI existir                                                                  |
| Graph read-model regressão  | ausente na suíte da demo                          | node:test sobre `queryGraphOverview/contractImpact/intentDeps` com o snapshot demo                                       |
| Acessibilidade/teclado      | ausente                                           | smoke de navegação por teclado + nome acessível na jornada ativa                                                         |
| Mock-fidelity               | **explicitado**: mesmas funções + INV sobre seeds | manter; adicionar teste de paridade mock-api↔reducer real por comando                                                    |

## 5. Gaps por persona

- Personas agora reais no domínio (matriz usa admin/security-owner/proposed via `workspace-authority-personas`).
- Ainda sem jornada de UI por persona não-admin (bloqueado por produto: telas de pessoas/papéis inexistentes). `asMember/asSecurityOwner` só wired em specs `fixme`.
- Falta persona **solo/self-governed** exercida (seed `workspace-local` ociosa) e **stakeholder read-only**.

## 6. Gaps por fluxo

- Cadeia iniciativa→audit registrada (`APP-33`, fixme) mas sem versão de domínio (planning/intake/gate reducers ainda não existem no shell — é produto).
- Incident→follow-up→outcome sem teste (produto ausente).
- Results→Audit binding por evento: sem teste (rotas `/audit` ausentes).

## 7. Gaps de segurança

- **Fechados por mecanismo nesta rodada** (node:test, rápido e difícil de burlar): matriz de autorização (member/proposed negados com erro específico; admin/aceito autorizado); proposed≠authority sobre todas as seeds; isolamento demo (nenhum workspace não-demo é sandbox-demo); sourceTrust não infla (cloud-sync nunca vira provider-\*); onboarding finished exige host/sandbox.
- **Ainda sem teste** (dependem de rota/produto, seguem `fixme` deny): stale read-model (SEC-02), egress cloud (SEC-01), event-log rewrite (SEC-04), classificação (SEC-06), last-admin na UI (SEC-07), break-glass TTL (SEC-10), integração como 2º SSOT (SEC-09). O deny agora é estrutural (`deny: true`), então nenhum vira `expected-fail`.
- **Lacuna de API**: idempotência/replay do command runtime (idempotency-key) não é testada na suíte da demo — candidata forte ao layer de API/route.

## 8. Testes redundantes/frágeis

- `seed-coverage.spec.ts` (25 testes Playwright) — redundante com o layer de domínio; deveria migrar para node:test (mesmo `SEEDS`/`buildSeed`), eliminando 25 boots de browser.
- `authority-model.spec.ts` (SEC-11/12) — puro domínio sob Playwright; fica por estar contract-bound (o lint exige spec + título). Recomendação: permitir que contrato de mecanismo aponte para spec node:test (ajuste de lint futuro).
- `cross-screen-consistency` — ainda liga por regex de copy; frágil quando a UI existir.

## 9. Recomendações priorizadas

1. **P0 (feito)** — layer de domínio/invariante de primeira classe (matriz de autorização + INV sobre seeds), rápido e nos checks.
2. **P1** — layer de API/route contra `/api/local/*`: authority (403/422), fail-closed de payload, idempotency-key/replay, stale base-revision. Reduz e2e e cobre o kernel HTTP.
3. **P1** — migrar `seed-coverage.spec.ts` para node:test (−25 boots).
4. **P2** — regressão do read-model de grafo (queries sobre snapshot demo) em node:test.
5. **P2** — smoke de acessibilidade/teclado na jornada ativa; cross-screen por identidade quando as telas existirem.
6. **P2** — ajustar o lint para aceitar contrato de mecanismo apontando para spec node:test, permitindo tirar SEC-11/12 do Playwright.

## 10. O que esta rodada implementou

- `backend/tests/authority-matrix.test.ts` — matriz papel×comando no kernel `authorizeShellCommand` (12 testes).
- `backend/tests/seed-invariants.test.ts` — INV-1..5 sobre todas as 26 seeds (5 testes).
- Camada roda em `npm --workspace acme-governance-backend run test:shell` (~207ms, 22/22 verdes) — agora parte dos checks focados.
- `TESTING-STRATEGY.md` — registra a pirâmide e o layer de domínio como primeira classe.
