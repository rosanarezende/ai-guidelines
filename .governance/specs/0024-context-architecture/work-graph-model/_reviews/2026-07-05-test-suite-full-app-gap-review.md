# Gap review implementável da suíte — governance-demo (pós-Fase A)

> **Tipo:** gap review implementável (artefato de apoio, sem autoridade própria).
> **Data:** 2026-07-05.
> **Base:** HEAD `0ca600fe` (Fase A aplicada). Continua `_reviews/2026-07-05-test-suite-phase0-audit.md`.
> **Objetivo:** mapear o que ainda falta para a suíte governar o produto desejado inteiro, com ação implementável por item.

## Base verificada (FATOS)

- `contracts:check` → **PASS**: `52 contratos, 26 seeds, 11 rotas, {active:3, expected-fail:21, fixme:28}`.
- `typecheck` e2e + mock-api → **PASS**. `test:e2e` → **PASS**: 54 passed, 30 skipped.
- Fase A confirmada no disco: sentinela `armExpectedFailAfterArrival` (arma `test.fail` só após rota <400 + DOM), deny-contracts em `fixme`, seed `acme-demo` corrigida, lint com rota-primária + infra-gate + `active` exige `test()` real. Bons fechamentos dos P0 do audit anterior.

## Gaps encontrados nesta rodada

| ID  | Sev | Fato observado                                                                                                                                                                                                                                                                                 | Interpretação                                                                                                                     | Ação implementável                                                                                                  |
| --- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| G01 | P1  | Helpers de persona (`asMember/asNoAuthority/asProposedRole/asSecurityOwner/asSponsor/asStakeholder`) existem mas **nenhum spec os usa** (órfãos)                                                                                                                                               | Cobertura de persona ainda é potencial, não real; toda autenticação de teste é admin                                              | Wirar personas em contratos que declaram atores não-admin; criar contratos de mecanismo que exercem persona de fato |
| G02 | P1  | Seed `workspace-authority-personas` existe (Bia security-owner _accepted_, Caio sponsor _accepted_, Eva source-owner _proposed_) mas **nenhum contrato a usa**                                                                                                                                 | O estado mais rico para provar authority está inerte                                                                              | Contratos `active` de authority-model sobre essa seed (proposed≠authority, accepted⇒authority)                      |
| G03 | P1  | Regra deny é uma **lista hardcoded** no lint (`denyContractIds`)                                                                                                                                                                                                                               | Novo contrato deny não é protegido automaticamente; depende de lembrar de editar o lint                                           | Derivar deny de campo YAML (`deny: true`); lint = união(campo, legado)                                              |
| G04 | P2  | 9 seeds no matrix sem nenhum contrato: `onboarding-partial`, `workspace-authority-personas`, `workspace-controlled-neo4j`, `workspace-controlled-oidc`, `workspace-docker-compose`, `workspace-docker-ollama-profile`, `workspace-host-embutido`, `workspace-local`, `workspace-shared-google` | Estados ricos (host embutido, neo4j, google/oidc, solo) só existem no `seed-coverage`; nenhum contrato de comportamento os exerce | Lint: **warn** de seed sem contrato; adicionar contratos usando host-embutido, personas e solo                      |
| G05 | P2  | 0 `test.step` na suíte                                                                                                                                                                                                                                                                         | Relatório de jornada longo não é navegável por passo; owner não fatia por etapa                                                   | Introduzir `test.step` nas novas jornadas e nas cross-screen                                                        |
| G06 | P2  | `routeForPage` mantém `[id]` literal (dynamic route)                                                                                                                                                                                                                                           | Latente: quando `/integrations/[id]` existir, superfície `/integrations/123` não casa                                             | Tratar `[x]` como coringa no matcher de rota                                                                        |
| G07 | P2  | Cross-screen `CONS-01` liga por regex de copy (`/compact\|time enxuto/`), não por valor                                                                                                                                                                                                        | Duas telas podem exibir a mesma palavra por acaso; divergência real de id/policy escapa                                           | Ligar por valor estável (profile id / sourceRevision) capturado em uma tela e conferido na outra                    |
| G08 | P1  | Nenhum contrato de **cadeia** cross-feature (Planning→Intake→Triage→Gate→Work→Contracts→Results→Audit; Incident→Follow-up→Outcome)                                                                                                                                                             | Contratos por tela isolada não provam o valor central: rastrear decisão→evidência→resultado                                       | Registrar contrato de cadeia (`fixme`, corpo escrito) para orientar implementação                                   |

## Personas × cobertura (estado real)

| Persona             | Helper existe? | Usada por contrato?                    | Menor fixture/seed para cobrir                      |
| ------------------- | -------------- | -------------------------------------- | --------------------------------------------------- |
| admin               | sim            | sim (default)                          | —                                                   |
| security-owner      | sim            | **não**                                | `workspace-authority-personas` (Bia accepted)       |
| sponsor             | sim            | **não**                                | `workspace-authority-personas` (Caio accepted)      |
| proposed-role       | sim            | **não**                                | `workspace-authority-personas` (Eva proposed)       |
| member/no-authority | sim            | **não** (só API em `security-journey`) | `workspace-authority-personas` / `workspace-shared` |
| stakeholder         | sim            | **não**                                | `acme-demo` (leitura)                               |
| solo/self-governed  | não            | não                                    | `workspace-local` (existe, ocioso)                  |

## Segurança × contrato (o que ainda é lacuna de mecanismo)

Deny-contracts hoje corretamente em `fixme` (rota/infra ausente): SEC-01/02/03/04/05/06/07/08/09/10, CUP-03/04. Eles não podem virar `active` sem UI. Mas há um mecanismo de segurança **já implementado no domínio** e **sem contrato**: a resolução de authority (`resolveWorkspaceAuthority`) que garante "proposed/rejected/revoked nunca geram autoridade". Isso pode e deve virar contrato `active` de mecanismo agora — é a prova mais honesta disponível antes da UI.

## Recomendação desta leva (implementável já, sem produto)

1. **Lint** (G03/G04/G06): deny via campo, warn de seed sem contrato, coringa `[id]`.
2. **Authority-model `active`** (G01/G02): novos contratos de mecanismo sobre `workspace-authority-personas` provando proposed≠authority e accepted⇒authority — fecham segurança real e tornam persona não-teatro.
3. **Wiring de persona** (G01): SEC-03/CUP-04/APP-07 passam a autenticar como a persona declarada (mantendo-se `fixme` até a UI existir), para nascerem corretos.
4. **Cadeia** (G08): registrar `APP-33` (iniciativa→audit) como `fixme` com corpo escrito.
5. **Seeds ociosas** (G04): `APP-34` host embutido (`fixme`), aproveitando `workspace-host-embutido`.
6. **test.step** (G05) nas jornadas novas.

Fora de escopo desta leva (produto): implementar `/integrations`, `/audit`, `/planning`, `/triage`, `/gates`, `/contracts`, `/operations` e o overlay Cup — os contratos ficam `fixme` até lá.
