# Auditoria adversarial da suíte de contratos pós-Fase 0 — governance-demo

> **Tipo:** auditoria adversarial de qualidade/estratégia de teste (artefato de apoio, sem autoridade própria).
> **Data:** 2026-07-05.
> **Autoridade:** decisões de teste moram em `TESTING-STRATEGY.md` + QRD (APP-DECISIONS.md). Este documento é evidência.
> **Escopo:** auditar a suíte pós-Fase 0 (`bb6b9280`) como mecanismo de governança. NÃO implementa produto.
> **Continuação de:** `_reviews/2026-07-05-test-suite-adversarial-review.md` (Fase 0 fechou vários P0 daquela rodada).

## 1. Base verificada (FATOS)

- Branch `feat/spec-0024-artifact-taxonomy-and-model-review-contract`; HEAD `bb6b9280`; working tree limpa.
- `git log -3`: `bb6b9280 test: harden governance demo app contracts` / `422d3d2e` / `dace30ea`.
- `contracts:check` → **PASS**: `52 contratos, 25 seeds, 11 rotas, status {active:3, expected-fail:37, fixme:12}`.
- `typecheck` (e2e) → **PASS**. `typecheck` (mock-api) → **PASS**.
- `test:e2e` → **PASS**: 83 testes, **69 passed, 14 skipped** (1.8 min). Os 37 `expected-fail` aparecem como `x` (expected failure = verde); os 12 `fixme` + 2 `test.fixme` legados = 14 skipped; 3 active + jornadas reais + 25 seed-coverage = passes genuínos.
- Rotas reais (11): `/ /signup /organizations /onboarding /settings /console /map /results /work /sources` (+ raiz). **Não existem:** `/integrations /audit /planning /intake /triage /gates /contracts /operations` e overlay `Cup`.
- Fase 0 confirmada: `pendingContract(id, mode)` diferencia `fixme`(`test.fixme`) e `expected-fail`(`test.fail`); seed `acme-demo` corrigida; seed `workspace-with-integration-statuses` existe e é rica; lint `check-app-contracts.ts` ativo.

**Método:** auditoria estática + execução dos checks. Não subi produto para inspeção visual; conclusões sobre "onde o teste falha" vêm da leitura dos specs cruzada com as rotas/ testids existentes.

## 2. Veredito curto

**PARCIAL — a fundação está bem melhor, mas ainda NÃO é segura para guiar implementação sem duas correções de mecanismo.** A Fase 0 resolveu seeds, lint e a distinção fixme/expected-fail; o `seed-coverage` é forte. Porém, como mecanismo de _governança de segurança_, a suíte tem um **false-green estrutural**:

- **Todo `expected-fail` arma `test.fail(true)` na primeira linha e falha no primeiro `getByTestId` inexistente** — antes de qualquer asserção contratual. Não há sentinela provando que o teste chegou à tela/seed certa. O verde de hoje significa apenas "algo falhou", não "o comportamento-alvo foi exercido".
- **Pior: 6 contratos de BLOQUEIO de segurança estão como `expected-fail`** (SEC-02, SEC-03, SEC-05, SEC-07, SEC-08, SEC-10) + CUP-03/CUP-04. Sob `test.fail`, "o app deixa de bloquear" e "o teste nem rodou" produzem **o mesmo verde**. Um bug de segurança real (ex.: remover o último admin _funciona_) apareceria **verde**. Um contrato de deny/deny-visible não pode viver em `expected-fail`.

Antes de ativar contratos por tela: (a) reclassificar contratos de bloqueio; (b) introduzir sentinela de chegada; (c) endurecer o lint para exigir a rota-alvo primária. Detalhe abaixo.

## 3. Findings

| ID  | Sev | Arquivo/linha                                                               | Fato observado                                                                                                                                                                                                                                                       | Interpretação                                                                                                                                                        | Risco                                                                                                                             | Correção recomendada                                                                                                                                                           |
| --- | --- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A01 | P0  | `security-authority.spec.ts` SEC-02/03/05/07/08/10; `cup.spec.ts` CUP-03/04 | Contratos de bloqueio/deny modelados como `expected-fail` (`test.fail`)                                                                                                                                                                                              | `test.fail` fica verde se o corpo falha por QUALQUER motivo; para um deny-contract, "app não bloqueia" também lança e fica verde                                     | Regressão de segurança (remover último admin, trust bump, break-glass sem TTL, vazamento ao Cup) passaria despercebida como verde | Deny-contract nunca é `expected-fail`: `fixme` enquanto a rota não existe; `active` quando existe, provando o bloqueio observado. Nunca `test.fail`                            |
| A02 | P0  | `contract-fixtures.ts:8-19` + todos os 37 expected-fail                     | `pendingContract(id,"expected-fail")` chama `test.fail(true)` na 1ª linha; cada teste falha no 1º `getByTestId` (ex. SEC-08:98 `outcome-without-evidence`), antes da asserção contratual                                                                             | Sem sentinela: o verde não prova chegada à tela/seed certa; mascara rota quebrada, seed errada, sessão inválida, testid renomeado                                    | Suíte "verde" que não exercita nada; ao implementar, um erro de infra continua verde e some do radar                              | Reestruturar: asserções-sentinela de chegada (rota responde, tela/heading certo, seed carregada) ANTES de armar `test.fail`; helper `arriveThenExpectFail(page, sentinel, id)` |
| A03 | P1  | `check-app-contracts.ts:164-168`                                            | `expected-fail` exige apenas ≥1 superfície existente; a rota-ALVO pode não existir                                                                                                                                                                                   | CONS-03 (alvo `/integrations`), INT-02 (`/triage`), APP-28/SEC-08/SEC-10/APP-16 (`/audit`), APP-29 (`/contracts`) passam no lint mas só podem falhar na rota ausente | Confirma o false-green de A02 num cluster: o teste nunca alcança o comportamento                                                  | Lint: exigir que a **primeira** superfície-rota (alvo) exista para `expected-fail`, ou adicionar campo `primary_surface` e validá-lo                                           |
| A04 | P1  | todos os specs; `contract-fixtures.ts:26-40`                                | Única persona de UI: `signInAs` sempre `local-ana` (admin). Contratos declaram invited-member/security-owner/member/sponsor/source-owner/requester/approver/attester/stakeholder mas ninguém autentica como eles                                                     | Authority/permissão na UI é teatro: ao virar `active`, não provam diferença admin×não-admin                                                                          | Contratos de authority "passam" sem nunca exercer papel restrito; SoD e "sem permissão" não são testados na UI                    | Fixtures `asMember/asSecurityOwner/asNoAuthority/asProposedRole/asSponsor/asStakeholder` (cookie+seed); reescrever SEC/CUP/APP-07/APP-25 sobre elas                            |
| A05 | P1  | `cup.spec.ts` CUP-01..04 (expected-fail); lint `knownNonRoutes`             | Cup é overlay inexistente (0 superfícies); lint remove `Cup` de `routeSurfaces` e deixa rotas secundárias sustentarem o `expected-fail`                                                                                                                              | Cup é INFRA ausente, não feature quebrada; pela regra da própria owner deveria ser `fixme` (como SEC-01)                                                             | Inconsistência de estado: CUP-\* "rodam" mas só falham em `cup-open-button`; sinal nulo vestido de expected-fail                  | Reclassificar CUP-01..04 para `fixme` até existir o shell do overlay (C0); ensinar o lint a tratar `Cup` como infra-gate                                                       |
| A06 | P1  | `check-app-contracts.ts:99-114`; `seeds/index.ts`                           | 8 seeds ricas sem nenhum contrato funcional: `onboarding-partial`, `workspace-host-embutido`, `workspace-local`, `workspace-controlled-neo4j`, `workspace-docker-compose`, `workspace-docker-ollama-profile`, `workspace-shared-google`, `workspace-controlled-oidc` | Estados importantes (host embutido vs sidecar, neo4j read-model, google/oidc login≠authority) só existem no `seed-coverage`, sem contrato de comportamento           | Cobertura de estado ilusória: a seed existe, mas nenhum contrato prova que a UI trata o estado                                    | Lint: warn de seed no matrix sem contrato; adicionar contratos para host-embutido, neo4j-stale e SEC-03 variantes google/oidc                                                  |
| A07 | P1  | `cross-screen-consistency.spec.ts:9-17`; `contract-fixtures.ts:60-69`       | CONS-01 usa `expectConsistentText(routes, /compact\|time enxuto/)` — regex de copy que casa em qualquer lugar da página, não o **id** de perfil ligado                                                                                                               | "Consistência" prova presença de texto, não binding do mesmo registro/revisão entre telas                                                                            | Duas telas podem mostrar a mesma palavra por acaso e passar; divergência real de id/policy escapa                                 | Cross-screen deve ligar por valor estável (profile id, sourceRevision, source id capturado em uma tela e conferido na outra), não regex de copy                                |
| A08 | P2  | toda a suíte                                                                | 0 `test.step`, 0 tags `@persona/@surface` (Fase 0 não adicionou)                                                                                                                                                                                                     | Relatório não fatiável por persona/superfície; sem "dashboard de contratos" para a owner                                                                             | Gestão de pendências continua manual; `fixme`/`expected-fail` não são navegáveis por recorte                                      | `test.step("origem→destino")` nas jornadas cross-screen; tags `@surface:x @persona:y @kind:negative`; script-matriz sobre `reports/results.json`                               |
| A09 | P2  | `check-app-contracts.ts:62-71`                                              | `routeForPage` filtra `_priv` e `(grupo)` mas mantém `[id]` literal                                                                                                                                                                                                  | Rota dinâmica `app/integrations/[id]/page.tsx` mapearia para `/integrations/[id]`, sem casar `/integrations/123` de um contrato                                      | Latente (nenhum contrato usa rota dinâmica hoje); quebra quando `/integrations/[id]` chegar                                       | Tratar segmentos `[...]` como coringa no matcher de rota                                                                                                                       |
| A10 | P2  | `check-app-contracts.ts:126-129`                                            | `active` é satisfeito por `text.includes(contract.id)` — menção em comentário conta                                                                                                                                                                                  | Um contrato poderia ficar `active` sem `test(` real, só citado em comentário                                                                                         | Baixo hoje (APP-01/03/04 têm teste real), mas o lint permite active vazio                                                         | Exigir, para `active`, um `test(` cujo título contenha o ID e ausência de `pendingContract` (esta já é checada)                                                                |
| A11 | P2  | `results-audit.spec.ts` APP-28; `security-authority.spec.ts` SEC-08         | Dois contratos diferentes (`APP-28` resultado válido, `SEC-08` rollup sem evidência) sobre `/results` com testids distintos (`results-target-chart` vs `outcome-without-evidence`)                                                                                   | Ok, mas ambos falham no 1º testid; sem sentinela não se sabe se `/results` sequer renderizou o snapshot demo                                                         | Reforça A02 na tela que já existe (`/results` é real)                                                                             | `/results` é candidata #1 a sentinela: assert que a página carrega o snapshot acme antes do `test.fail`                                                                        |
| A12 | P2  | `APP-ITERATION-MAP.md §3.1` vs YAML                                         | Tabela do iteration-map lista status "fixme" para quase tudo; YAML já migrou 37 p/ expected-fail                                                                                                                                                                     | Doc-drift: o mapa de iteração não reflete os estados atuais                                                                                                          | Confunde quem usar o mapa como guia de ativação                                                                                   | Reconciliar a coluna de status do iteration-map com o YAML (ou gerar a tabela a partir do YAML)                                                                                |

## 4. Mapa de contratos (família × status)

| Família                              | Contratos                         | Status atual                      | Deveria ser                                                                                | Motivo                                                | Ação                                                                                   |
| ------------------------------------ | --------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Signup/logout/onboarding parcial     | APP-01/03/04                      | active                            | **active** ✔                                                                               | rota existe, comportamento entregue e provado         | manter; considerar dividir em 3 testes p/ atribuição fina                              |
| Auth/workspace/Home nova/demo        | APP-02/13/14                      | expected-fail                     | **expected-fail + sentinela**                                                              | rotas existem (`/ /organizations /settings /console`) | add sentinela de chegada (A02)                                                         |
| Onboarding perfil/responsab./revisão | APP-05/06/12                      | expected-fail                     | **expected-fail + sentinela**                                                              | `/onboarding` existe                                  | sentinela `/onboarding` carregou                                                       |
| Settings/pessoas/host/sources        | APP-07/08/09/15/16/17/18/21       | expected-fail                     | **expected-fail + sentinela**; APP-16 depende de `/audit` (ausente) → parte fixme          | rotas base existem; `/audit` não                      | sentinela; separar a asserção `/audit` de APP-16                                       |
| Assistente                           | APP-10/19                         | expected-fail                     | **expected-fail + sentinela**; parte Cup/`/integrations` → fixme                           | `/settings` existe; `/integrations` e Cup não         | dividir superfícies existentes das ausentes                                            |
| Integrações hub/contexto/github      | APP-11/20, INT-01/02/03           | INT-01 fixme; resto expected-fail | **fixme** (alvo `/integrations` ausente)                                                   | rota-alvo não existe                                  | rebaixar APP-11/20/INT-02/INT-03 p/ fixme até `/integrations`                          |
| Planning→Intake→Triage→Gate          | APP-22/23/24/25                   | fixme                             | **fixme** ✔                                                                                | rotas ausentes                                        | manter; falta contrato de CADEIA (F09 da rodada 1)                                     |
| Work/Contracts                       | APP-26 (exp-fail), APP-27 (fixme) | —                                 | APP-26 **expected-fail + sentinela** (`/work` existe); APP-27 **fixme** ✔                  | `/contracts` ausente                                  | sentinela em APP-26                                                                    |
| Results/Map                          | APP-28/29 (exp-fail)              | —                                 | **expected-fail + sentinela** (`/results`,`/map` existem)                                  | candidatas mais maduras p/ implementar                | sentinela; primeiras a virar active                                                    |
| Operations/Audit                     | APP-30/31 (fixme)                 | —                                 | **fixme** ✔                                                                                | rotas ausentes                                        | manter                                                                                 |
| Console                              | APP-32 (exp-fail)                 | —                                 | **expected-fail + sentinela** (`/console` existe)                                          | ok                                                    | sentinela                                                                              |
| Cup/CWP                              | CUP-01..04 (exp-fail)             | —                                 | **fixme**                                                                                  | overlay inexistente (infra)                           | rebaixar (A05)                                                                         |
| Segurança BLOQUEIO                   | SEC-02/03/05/07/08/10             | expected-fail                     | **fixme** (rota ausente) ou **active** (deny observável) — **nunca expected-fail**         | deny-contract vira false-green (A01)                  | reclassificar por rota; SEC-07/SEC-10 alvo `/settings` existe → caminho p/ active cedo |
| Segurança BLOQUEIO                   | SEC-01/04/06/09                   | fixme                             | **fixme** ✔                                                                                | rota/infra ausente                                    | manter                                                                                 |
| Consistência                         | CONS-01/02/03                     | expected-fail                     | CONS-01/02 **expected-fail + binding por valor**; CONS-03 **fixme** (alvo `/integrations`) | binding fraco / rota ausente                          | A07 + rebaixar CONS-03                                                                 |

## 5. Gaps de persona

Personas SEM jornada real (só existe `admin local-ana`); menor conjunto de fixtures/seeds para cobrir:

| Persona                        | Estado                                 | Fixture/seed mínima                                                                     |
| ------------------------------ | -------------------------------------- | --------------------------------------------------------------------------------------- |
| Pessoa sem authority           | ausente                                | `asNoAuthority` (principal sem role) + seed `empty-workspace`/`workspace-shared`        |
| Invited-member / proposed-role | só no `security-journey` (API)         | `asMember`, `asProposedRole` sobre `workspace-groups-teams`/`workspace-shared-convites` |
| Security-owner                 | ausente (SEC/CUP fingem)               | `asSecurityOwner` sobre `workspace-controlled`                                          |
| Sponsor / actual-attester      | ausente                                | `asSponsor`, `asAttester` sobre `workspace-shared`/`acme-demo`                          |
| Solo/self-governed             | ausente                                | seed `workspace-local` (existe!) + jornada onboarding solo                              |
| Stakeholder read-only          | ausente                                | `asStakeholder` (sem write) sobre `acme-demo`, jornada Results→Map                      |
| Empresa com SoD                | parcial (APP-07/25 fixme, sem persona) | seed `workspace-controlled` com 2 pessoas + requester≠approver                          |

Fixtures reaproveitam os dados já nas seeds (person-bia, person-caio, groups, roleAssignments); falta só o cookie+contexto que autentica como elas.

## 6. Gaps de segurança (POLICY-HANDBOOK × contratos)

| Política (handbook)                       | Contrato              | Estado        | Recomendação agora                                                                                             |
| ----------------------------------------- | --------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| Egress cloud sem approval                 | SEC-01                | fixme         | manter fixme (rota `/integrations` ausente)                                                                    |
| Assistant/cloud model gating              | APP-10/APP-19 parcial | expected-fail | falta contrato de "provider `limited` não usado p/ função que exige capability" (`POLICY §6.1`) → novo INT/SEC |
| Trust/sourceTrust bump                    | SEC-05                | expected-fail | **reclassificar** (deny-contract; A01); alvo `/sources` existe → caminho p/ active                             |
| Break-glass TTL/motivo/revisão            | SEC-10                | expected-fail | **reclassificar**; `/settings` existe → active cedo                                                            |
| Remover último admin/security-owner       | SEC-07                | expected-fail | **reclassificar** (o mais crítico: false-green permitiria remoção)                                             |
| Rewrite/delete event-log                  | SEC-04                | fixme         | manter fixme (alvo `/audit` ausente); é deny → nunca expected-fail                                             |
| Rollup/outcome sem evidência              | SEC-08                | expected-fail | **reclassificar**; `/results` existe                                                                           |
| Integração escrevendo estado autoritativo | SEC-09                | fixme         | manter fixme; garantir que ao virar active seja deny observável                                                |
| Classificação de dados (downgrade)        | SEC-06                | fixme         | manter fixme (deny)                                                                                            |
| Stale derived read-model                  | SEC-02                | expected-fail | **reclassificar**; `/map /results /work /console` existem → active possível                                    |
| Login externo → authority                 | SEC-03                | expected-fail | **reclassificar** (deny "não concede"); cobre só github; faltam google/oidc (seeds existem)                    |

**Padrão:** todo contrato cujo verbo é "não pode / bloqueia / não concede / não some / não vaza" é deny e não pode ser `expected-fail`. Hoje 6 deny estão em expected-fail — é o buraco central.

## 7. Recomendação de próxima leva (sem implementar produto)

**Fase A — hardening da suíte (fecha os P0/P1 de mecanismo):**

1. Reclassificar deny-contracts: SEC-02/03/05/07/08/10 e CUP-03/04 saem de `expected-fail` → `fixme` (rota/infra ausente) ou, onde a rota existe e o deny é observável hoje, preparar como `active` na implementação. CUP-01/02 → `fixme` (A05).
2. Introduzir sentinela: helper `arriveThenExpectFail` + reescrever os expected-fail de rota existente (APP-02/05/06/07/08/09/12/13/14/15/17/18/21/26/28/29/32, CONS-01/02) para provar chegada antes de `test.fail`.
3. Endurecer o lint: exigir rota-alvo primária p/ expected-fail (A03); warn de seed sem contrato (A06); coringa `[id]` (A09); `active` só com `test(` real (A10).
4. Fixtures de persona (A04) + binding por valor no cross-screen (A07).

**Fase B — primeira tela/fluxo a implementar (guiada pelos expected-fail mais maduros):** `/results` (APP-28) e `/map` (APP-29) — rotas já existem, contrato claro, dados no `acme-demo`. Ativar APP-28 primeiro (dashboard ECharts + confidence), depois SEC-08 como `active` (rollup sem evidência) na mesma tela.

**Fase C — fluxo cross-screen:** Results→Audit e Map→Contracts, mas só depois de `/audit` e `/contracts` existirem; antes disso, o contrato de CADEIA `lifecycle-initiative` (Planning→…→Audit) fica fixme com corpo escrito.

**Fase D — segurança/authority:** com fixtures de persona prontas, virar `active`: SEC-07 (último admin, `/settings`), SEC-10 (break-glass, `/settings`), SEC-02 (stale, telas existentes), SEC-03 (login externo, `/settings`) — cada um provando o bloqueio observável, não `test.fail`.

**Regra de ouro:** nenhum deny-contract permanece `expected-fail`; nenhum expected-fail sem sentinela; nenhuma tela vira active antes da fixture de persona que o contrato declara.

## 8. Prompt para a próxima sessão (Fase A — hardening da suíte, sem produto)

```
# Fase A — hardening da suíte de contratos (governance-demo). NÃO implementar produto.

Branch feat/spec-0024-artifact-taxonomy-and-model-review-contract, HEAD bb6b9280.
Autoridade: _reviews/2026-07-05-test-suite-phase0-audit.md (findings A01–A12).
Só mexer em: test/**, tools/checks/**, mock-api/src/seeds/** (teste/harness). NADA de frontend/ ou backend/ de produto.

Faça, nesta ordem, com commits incrementais:

1. Deny-contracts fora de expected-fail (A01):
   - Em app-contracts.yml e nos specs, mudar SEC-02, SEC-03, SEC-05, SEC-07, SEC-08, SEC-10, CUP-03, CUP-04
     de expected-fail para fixme (rota/infra ainda não permite provar o BLOQUEIO observável).
   - Documentar no YAML (comentário/campo) que deny-contract nunca é expected-fail: é fixme até a rota existir,
     depois active provando o deny. CUP-01/CUP-02 também → fixme (overlay inexistente, A05).

2. Sentinela de chegada (A02):
   - Em test/journeys/support/contract-fixtures.ts, criar `arriveThenExpectFail(page, sentinelFn, id, reason?)`
     que executa asserções-sentinela (rota respondeu, tela/heading esperado, seed carregada) e SÓ DEPOIS chama
     test.fail(true). Se a sentinela falhar, o teste falha VERMELHO (infra quebrada), não verde.
   - Reescrever os expected-fail de rota existente (APP-02/05/06/07/08/09/12/13/14/15/17/18/21/26/28/29/32,
     CONS-01/02) para usar arriveThenExpectFail com uma sentinela mínima por tela.

3. Lint mais rígido (A03, A06, A09, A10) em tools/checks/check-app-contracts.ts:
   - expected-fail exige que a PRIMEIRA superfície-rota exista (ou adicionar primary_surface e validar);
   - warn (não fail) para seed no seed_matrix sem nenhum contrato;
   - tratar segmentos [id] como coringa no matcher de rota;
   - active exige um test( nomeando o ID, não só menção em comentário.
   - Manter check verde ao final.

4. Fixtures de persona (A04) em support/personas.ts:
   - asAdmin (atual), asMember, asSecurityOwner, asNoAuthority, asProposedRole, asSponsor, asStakeholder
     (cookie de sessão + seed apropriada). Reescrever SEC-03/SEC-07 e CUP-04 para autenticar como a persona
     declarada (não admin), mantendo-os fixme por ora.

5. Binding por valor no cross-screen (A07):
   - CONS-01/CONS-02 devem capturar um identificador estável em uma tela (profile id, source id, sourceRevision)
     e conferir o MESMO valor nas outras telas, não uma regex de copy.

Verificação: npm --workspace acme-governance-e2e run contracts:check && run typecheck && run test:e2e (deve
continuar 0 red; expected-fail viram fixme/red-honesto conforme reclassificação). Atualizar APP-ITERATION-MAP §3.1
e TESTING-STRATEGY se o significado dos estados mudar. Não commitar/pushar sem autorização; relatar contratos
reclassificados e a nova contagem de status.
```
