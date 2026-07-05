# Backend R0/R1 — achados para tirar o app do papel

> Status: **IMPLEMENTADO no essencial (2026-07-04).** R0 = `mock-api/` (Hono+lowdb, 24
> seeds, mesmo reducer do domínio) + `test/` (Playwright, jornada 1) + data-source switch
> por env. R1 = domínio/APIs de produto persistindo perfil/regra/modo/stack, pessoas/
> grupos/convites/papéis com authority derivada, governance host (3 formatos + sandbox,
> fit-check/scaffold com sourceRevision), fontes com sourceTrust e assistente multi-provider.
> Fechados no essencial: F-R0-01/02/03 · F-R1-01/02/03/04/05. Parciais: F-R1-06 (GitHub
> work-source: contrato/kind/backlog modelados; conexão cloud é fatia seguinte) · F-R1-07
> (graph-read-model neo4j persiste config/status/sourceRevision; health-check vivo é fatia
> seguinte). QRD-05 (MSW) aguarda primeiros testes de componente/hook.
> Autoridade: `../model.yml`, `APP-PRODUCT-STATEMENT.md`, `APP-FUNCTIONAL-SPEC.md`,
> `APP-DECISIONS.md` e `../integration-catalog.yml`.
> Data original do diagnostico: 2026-07-04.

## Base verificada

- Branch esperada: `feat/spec-0024-artifact-taxonomy-and-model-review-contract`.
- HEAD observado durante a analise: `93569d16`.
- Working tree: documentos da governance-demo e catalogo de integracoes ainda nao commitados.
- `APP-DECISIONS.md` registra QRD-01 a QRD-26.
- `APP-FUNCTIONAL-SPEC.md` declara que nao ha decisao de escopo de release aberta nesta trilha.
- `backend/src/api/contracts.ts` expoe contrato real para snapshot, comandos genericos, grafo e integracoes.
- `frontend/server/adoption/application/use-cases.ts` expoe apenas signup local, criar/anexar/selecionar workspace e status de onboarding.

## Veredito

Nao ha mais pergunta grande de produto/modelagem para responder antes da proxima implementacao.
O bloqueio atual e mecanico: o frontend precisa de um backend de produto que persista e
releia as escolhas reais de onboarding, pessoas, papeis, host, fontes, assistente e integracoes.

Hoje a arquitetura ja tem partes certas, mas a jornada humana ainda cai em lacunas:

- existe command runtime governado para comandos centrais da acme demo;
- existe adoption shell local com lock, event-log e idempotencia;
- existe API para grafo/integracoes;
- nao existe API de produto para a maior parte do onboarding real;
- nao existe mock-api resetavel para iterar UX/e2e sem depender do runtime governado;
- nao existe persistencia real das escolhas que a UI pergunta ao usuario.

## Achados principais

| id      | Fato                                                                                                         | Interpretacao                                                                                                                | Impacto                                                                     |
| ------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| F-R0-01 | QRD-01 a QRD-07 definem ambientes, mock-api, Hono/lowdb, MSW e Playwright.                                   | O spec funcional usa essas decisoes como infraestrutura, mas ainda nao ha `mock-api/`, scripts ou e2e real.                  | A equipe itera UI sem fixture mutavel confiavel e sem regressao de jornada. |
| F-R0-02 | `APP-FUNCTIONAL-SPEC.md` descreve muitas telas futuras, mas a API real ainda e generica.                     | Faltam endpoints de produto que falem a linguagem da pessoa usuaria.                                                         | O frontend tende a virar console bonito ou mock solto.                      |
| F-R0-03 | `frontend/server/adoption` ja tem file-first local state com lock/event-log/idempotencia.                    | A base deve ser expandida, nao substituida.                                                                                  | Reescrever tudo aumenta risco; estender o shell e mais pragmatico.          |
| F-R1-01 | Signup/workspace/status existem; perfil, regras, modo, host, fontes, assistente e integracoes nao persistem. | O onboarding hoje nao consegue terminar como configuracao real.                                                              | A Home nao pode refletir estado real apos reload.                           |
| F-R1-02 | `APP-DECISIONS.md` separa account/principal, membership, role-assignment e authority.                        | A UI de papeis precisa ser pessoa-first/grupo-first, nao lista de papeis soltos.                                             | Sem convite/aceite, o app cria autoridade falsa.                            |
| F-R1-03 | QRD-08/09/21 decidiram tres formatos de governance host.                                                     | O backend precisa fazer fit-check e scaffold/link real para todos.                                                           | Sem host ou sandbox explicito, nao ha organizacao governada.                |
| F-R1-04 | QRD-22 permite fontes sem Git como fontes reais rebaixadas.                                                  | Fonte deve ter `sourceTrust`, provider/version, freshness e limitacoes explicitas.                                           | Sem isso, pasta local/cloud drive vira evidencia falsa.                     |
| F-R1-05 | QRD-24 decidiu assistente/matcher multi-provider.                                                            | R1 precisa guardar configuracao/default por funcao, mesmo que matcher completo venha depois.                                 | UI de assistente fica sem contrato estavel.                                 |
| F-R1-06 | QRD-26 decidiu GitHub work-source como primeira cloud integration.                                           | R1 deve ao menos modelar contrato/estado de conexao e backlog visivel; implementacao cloud completa pode ser fatia seguinte. | Sem isso, configuracoes e backlog ficam desconectados do catalogo.          |
| F-R1-07 | Neo4j e read-model opcional de release 1.                                                                    | Onboarding avancado precisa salvar `graph-read-model: neo4j` e health/freshness quando configurado.                          | A promessa de grafo como coracao fica so no console.                        |

## Lacuna de transposicao no spec

`APP-FUNCTIONAL-SPEC.md` reflete bem QRD-08 a QRD-26 nas telas.
QRD-01 a QRD-07 aparecem de forma indireta, pois sao decisoes de ambiente/teste.
Antes de implementar R0, vale adicionar uma pequena matriz de cobertura no spec ou no PR
explicando:

- QRD-01/02/03/04: viram `mock-api/`, scripts e env vars;
- QRD-05: vira MSW quando houver testes de componente/hook;
- QRD-06: vira Playwright e primeira jornada e2e;
- QRD-07: vira regra de aceite "tela so conta como funcional quando tem backend real ou mock-api declarada".

## Escopo recomendado

### R0 — harness de desenvolvimento e teste de produto

Objetivo: permitir iteracao UX realista sem fingir governanca real.

Entregas:

- `governance-demo/mock-api/` com Hono + lowdb + TypeScript;
- seeds resetaveis para os cenarios decididos em `APP-DECISIONS.md`;
- scripts `dev:real`, `dev:mock`, `mock-api:dev`, `mock-api:reset`, `test:e2e`;
- contrato tipado compartilhado entre frontend, mock-api e backend real;
- Playwright cobrindo pelo menos signup -> workspace -> onboarding parcial -> Home;
- documentacao clara: mock-api valida experiencia, nao governanca.

### R1 — backend real do onboarding e adocao inicial

Objetivo: fazer o onboarding salvar configuracao real, recarregavel e auditavel.

Entregas:

- expandir `backend/src/domain/adoption-shell.ts` e `frontend/server/adoption` para:
  - governance-profile;
  - accumulation rule;
  - workspace-mode;
  - execution-mode;
  - operational-store;
  - graph-read-model;
  - assistant providers/defaults;
  - integration backlog/status projection;
- modelar pessoas, grupos, memberships, invites, role assignments e authority derivada;
- implementar convite local com status `proposed | accepted | declined | revoked`;
- implementar governance host:
  - local folder `workspace-slug-governance/`;
  - dedicated repo folder with same physical name;
  - embedded host `.governance-host/`;
  - explicit sandbox mode;
- implementar fontes de trabalho:
  - Git local;
  - pasta local;
  - pasta sincronizada/cloud com trust rebaixado;
  - contrato inicial para GitHub work-source sem confundir com login GitHub;
- persistir tudo por comando local com lock/event-log/idempotencia;
- expor APIs de produto para o frontend, sem obrigar o frontend a montar comando generico manualmente;
- manter o command runtime governado como fronteira de governanca real.

## Nao incluir em R0/R1

- planejamento completo (`/planning`);
- intake/triage/gate completos;
- matcher completo;
- publish outcome;
- incident lifecycle completo;
- adapters write-capable SQLite/Neo4j/Mongo;
- auth cloud real com troca de token persistida;
- transformar Neo4j em SSOT.

## Ordem recomendada

1. R0 mock-api + seeds + env/source switch + Playwright minimo.
2. R1.1 adoption-shell schema + APIs de configuracao persistida.
3. R1.2 pessoas/grupos/convites/papeis/authority derivada.
4. R1.3 governance host fit-check + scaffold/link.
5. R1.4 fontes de trabalho + sourceTrust.
6. R1.5 assistente/integracoes configuraveis + backlog visivel.
7. R1.6 conectar frontend ao backend R1 e remover mocks locais da UI.

## Critério de aceite

Ao final de R0/R1, uma pessoa deve conseguir:

1. criar conta local;
2. criar workspace;
3. escolher caminho padrao ou avancado;
4. salvar perfil de governanca;
5. convidar/adicionar pelo menos uma pessoa ou seguir solo com degradacao visivel;
6. atribuir papeis como propostas;
7. escolher modo do workspace;
8. escolher/criar/linkar governance host ou declarar sandbox;
9. adicionar ao menos uma fonte de trabalho;
10. configurar ou dispensar assistente;
11. ver integracoes disponiveis/release-1/em-breve/adiadas;
12. recarregar a aplicacao e ver o estado preservado;
13. rodar a primeira jornada e2e contra mock-api;
14. rodar a mesma leitura basica contra backend real local.
