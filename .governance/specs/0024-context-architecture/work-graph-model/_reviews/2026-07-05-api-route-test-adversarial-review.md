# Auditoria adversarial da camada API/route — governance-demo

> **Tipo:** auditoria adversarial + implementação de testes de API/route (artefato de apoio, sem autoridade própria).
> **Data:** 2026-07-05.
> **Base:** HEAD `26313442`, PR #45 Draft. Continua o review de arquitetura de teste do mesmo dia.
> **Foco:** provar que as rotas HTTP respeitam sessão, authority, validação e fail-closed — sem gastar browser.

## 1. Base verificada (FATOS)

- `contracts:check` PASS: `56 contratos (14 deny), 26 seeds, 11 rotas, {active:5, expected-fail:22, fixme:29}`.
- `test:shell` (domínio) 22/22 verde. `typecheck` backend+e2e+mock-api PASS.
- Superfície: 23 rotas `/api/local/*` (thin handlers) + `/api/graph*`, `/api/results`, `/api/work`, `/api/map`. Antes desta rodada, testadas por HTTP: **2** (`security-journey.spec.ts`, member vs admin).

## 2. Diagnóstico adversarial da camada API/route

O seam das rotas é limpo e testável, mas estava **quase sem cobertura**:

- **Handler thin**: `requireWorkspaceSession()` (401/400) → `request.json()` (400) → use-case da aplicação (`server/adoption/application/*`) → status 422/200. A lógica real está no use-case + no executor autorizado `applyAuthorizedShellCommand` (o MESMO do backend real e da mock-api).
- **Idempotência/replay**: provada por `command.id` em **dois** stores idênticos — `file-state-store.ts` (`appliedCommandIds()`) e mock-api (`db.data.events.some(...)` → 422 `duplicate-command`). Não havia teste.
- **Bloqueio de execução direto no seam node**: o app Hono da mock-api roda em processo via `app.request()` — **sem servidor, sem browser** — exercitando o handler `/api/shell/commands` real. Ninguém usava isso para teste.
- **Alias trava node:test do frontend**: a app-layer do frontend importa `@demo/backend/domain` (path do tsconfig, que `node --test` não resolve) e as rotas usam `next/headers`. Por isso o teste in-process do frontend não é viável sem bundler — **a mock-api (imports relativos) é o seam node correto**, e a casca de rota (sessão/JSON) fica para Playwright `request`.

## 3. Arquitetura de teste adicionada

Duas camadas complementares, priorizando o que roda sem servidor:

| Camada                         | Onde                                     | Como                                                        | Prova                                                                                                                                   |
| ------------------------------ | ---------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **API in-memory** (nova)       | `mock-api/tests/api-commands.test.ts`    | `node --test` + Hono `app.request()` (sem servidor/browser) | contrato de comando: schema 400, replay/idempotência 422, authority 422, isolamento de workspace, seed desconhecida 400, estado reflete |
| **Rota real HTTP** (estendida) | `test/journeys/security-journey.spec.ts` | Playwright `request` contra o Next booted (sem browser)     | casca da rota: 401 no-session, 400 invalid-json (sessão + parse só existem aqui)                                                        |

Justificativa de servidor (mandato pede): a casca de rota do frontend depende de `next/headers` (cookie de sessão) e do alias `@demo/backend`; não roda em `node --test` puro. Por isso a sessão/JSON são provadas por Playwright `request` (HTTP sem browser) contra o servidor já booted pela config e2e; TODO o resto (comando/authority/replay/isolamento) foi para o layer in-memory, rápido e sem servidor.

## 4. Rotas e riscos cobertos

- **Sessão**: sem cookie → 401 `no-session` (fail-closed); sessão sem workspace → 400 (via `requireWorkspaceSession`, exercitado).
- **Authority**: admin aplica; papel `proposed` (Eva) negado com erro específico por família (`missing-authority`, `missing-source-manager`); membro sem authority negado (já em security-journey).
- **Payload**: JSON inválido → 400 `invalid-json`; comando sem id/type → 400 `command-schema`.
- **Idempotência/replay**: mesmo `command.id` duas vezes → 422 `duplicate-command` (não aplica duas vezes).
- **Isolamento**: comando em `workspace-fantasma` por principal não-membro → 422 `not-a-member`; estado aplicado não vaza para outro workspace.
- **Seed/reset**: seed desconhecida → 400 com lista de seeds.

## 5. Segurança: que bypass agora FALHA em teste

- Replay de comando (reenviar o mesmo id para aplicar duas vezes) → 422.
- Agir num workspace sem membership (forjar workspaceId) → 422 not-a-member.
- Papel apenas proposto tentando comando sensível → 422 missing-\*.
- Chamar rota mutadora sem sessão → 401.
- Enviar corpo malformado esperando aplicação silenciosa → 400.

Nota honesta: **stale/base-revision** é garantia do _command runtime governado_ (`/api/commands/*`, com base-revision), não do shell local `/api/local/*` — este usa idempotência por id, não base-revision. O teste de stale continua no domínio governado (fora deste seam); não inventei um stale que a rota local não tem.

## 6. Contratos/seeds/status alterados

- **Nenhuma mudança de status de contrato.** As novas camadas são testes de mecanismo/HTTP, não contratos de UI. O inventário segue `56 contratos, 14 deny, active:5/expected-fail:22/fixme:29`.
- Nenhuma seed nova (a `workspace-authority-personas` já existia; agora também alimenta o layer de API).

## 7. O que segue frágil / próximos gaps

- **Camada de rota real ainda fina**: só session/JSON via Playwright. Enum-validation e status-mapping por rota ainda dependem do use-case; poderiam virar um layer de use-case in-process se o alias `@demo/backend` virar subpath real de node (`imports` map) — mudança de config a avaliar.
- `seed-coverage.spec.ts` (25 boots Playwright) segue candidato a migrar para node:test.
- Graph read-model (`/api/graph*`, `/api/results`, `/api/work`, `/api/map`) sem teste de regressão dedicado no seam de teste da demo.

## 8. Camadas de teste (estado após esta rodada)

| Camada             | Comando                      | Custo          | Estado                 |
| ------------------ | ---------------------------- | -------------- | ---------------------- |
| Domínio/invariante | `backend run test:shell`     | ~200ms         | 22 testes              |
| API in-memory      | `mock-api run test:api`      | ~300ms         | 6 testes               |
| Rota real HTTP     | dentro de `e2e run test:e2e` | boot servidor  | 4 testes (sem browser) |
| Contract/e2e       | `e2e run test:e2e`           | boot + browser | 56 contratos           |

O barato agora prova o caro: authority/replay/isolamento saíram do território de browser.
