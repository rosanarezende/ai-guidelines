# Review - Spike S1 control-plane portal Git-backed

> Status: active-supporting-review.
> Data: 2026-07-06.
> Escopo: `governance-demo` control plane / portal sobre governance host Git-backed.
> Artefato de planejamento: `governance-demo/SPIKE-CONTROL-PLANE-PORTAL.md`.

## 1. Base verificada

- Branch: `feat/spec-0024-artifact-taxonomy-and-model-review-contract`.
- HEAD de implementacao da fatia: posterior ao commit de reconciliacao `be52043a`.
- Better Auth foi instalado no app Next e, na fatia S1c, os drivers/perfis de
  store foram declarados tambem no backend para o avaliador server-side.
- A bancada interna foi criada em `/spikes/control-plane-portal`, fora da navegacao principal de produto.
- O spike adicionou um kernel puro em `@demo/domain` para contas, workspaces, convites, memberships de portal, provider link, proposta e sanitizacao.
- O spike adicionou teste de dominio em `backend/tests/control-plane-portal-spike.test.ts`.
- A fatia S1b adicionou um store file-first de spike em `backend/src/adapters/control-plane/FilePortalControlPlaneStore.ts`.

## 2. Fatos

### F1 - Control plane nao vira governance plane

O kernel do spike separa:

- `PortalAccount`, `PortalWorkspace`, `PortalInvite` e `PortalMembership` como dados de portal/control plane;
- `GovernanceHostRef` como ponte para o governance host Git-backed;
- `governanceAuthorityGrants` como lista separada e vazia na fixture inicial.

Aceitar convite cria membership de portal, mas `portalAccountHasGovernanceAuthority(...)` continua falso se nao houver grant governado explicito.

### F2 - Payload publico e sanitizado

`projectPublicControlPlaneState(...)` projeta estado publico sem `ProviderSecret`, sem conteudo governado e sem token de instalacao bruto. `collectSecretLeaks(...)` existe para falhar caso a substring sensivel apareca na projecao.

### F3 - Escrita no governance host e proposal-only

`createGovernanceProposal(...)` nao aplica mutacao no host. A funcao retorna uma proposta com `sourceRevision` quando a revisao esperada confere e retorna `source-revision-stale` quando diverge.

### F4 - Better Auth foi testado como candidato de superficie

O app instancia Better Auth server-side com o plugin `organization` e verifica a existencia das APIs necessarias para o fluxo alvo:

- signup/signin/session;
- create organization;
- create invitation;
- accept invitation;
- list members;
- update member role.

Isto prova aderencia inicial de superficie, nao prova ainda persistencia, operacao, emails, RBAC final ou integracao GitHub real.

### F5 - Persistencia file-first do portal foi provada sem virar SSOT governado

`FilePortalControlPlaneStore` persiste:

- snapshot JSON sanitizado do portal;
- event-log JSONL deterministico;
- `writesToRemote: false` em todos os eventos do spike.

O snapshot persistido contem contas, workspaces, convites, memberships,
provider links redigidos e propostas. Ele nao contem provider secret nem
conteudo governado.

### F6 - GitHub bridge continua dry-run

`dryRunGitHubBridgeProposal(...)` produz repo, branch candidate e PR candidate,
mas nao escreve no remoto. A ponte exige proposta e sourceRevision previamente
validada.

### F7 - SQLite/PostgreSQL sao stores de portal; Neo4j e read-model de grafo

`portal-store-comparison.ts` separa tres candidatos:

- SQLite: `portal-transaction-store`, default local/single-server.
- PostgreSQL: `portal-transaction-store`, default compartilhado/self-hosted.
- Neo4j: `governance-graph-read-model`, rejeitado como store de
  conta/sessao/convite.

`evaluateBetterAuthPortalStoreProfiles(...)` verifica que os drivers do spike
estao presentes para SQLite e PostgreSQL (`better-auth`,
`@better-auth/kysely-adapter`, `kysely`, `better-sqlite3`, `pg`). A conexao live
com PostgreSQL nao e exigida nesta fatia; sem URL de banco, o status fica
`skipped-without-database-url`.

### F8 - SQLite executa fluxo HTTP real com Better Auth

`BetterAuthSQLitePortalHttpSpike` instancia Better Auth com:

- `emailAndPassword`;
- plugin `organization`;
- migrations publicas de `better-auth/db/migration`;
- SQLite temporario via Kysely/`better-sqlite3`;
- handler HTTP real de Better Auth.

O teste S1d executa:

```text
POST /sign-up/email
  -> cookie de sessao
POST /organization/create
GET  /organization/list
```

O resultado persistido no SQLite contem 1 usuario, 1 sessao, 1 organizacao e
1 membership `owner`. O teste tambem fixa que o fluxo nao concede authority
governada, nao usa Neo4j como store de conta e nao le content plane.

## 3. Interpretacao

O spike sustenta a direcao arquitetural da QRD-41: um portal humano pode existir sem substituir o governance host file-first/Git-backed. A separacao de planos fica mecanizavel:

```text
identity/control plane -> conta, sessao, registry, convite, membership de portal
governance plane       -> roles governados, authority, decisions, event-log
content/work plane     -> repos, codigo, docs, metricas, evidencias
```

Better Auth continua um candidato forte porque fornece os blocos de conta,
sessao, organizacao e convite dentro do app. A fatia S1d reduziu a incerteza
mais importante do modo local: SQLite ja rodou migrations e fluxo HTTP real.
Ainda falta prova live equivalente para PostgreSQL antes de cravar o modo
compartilhado/self-hosted.

A fatia S1c reduz a incerteza da stack do portal: Better Auth pode operar nos
dois perfis necessarios (SQLite local e PostgreSQL compartilhado), enquanto
Neo4j permanece no plano de grafo derivado. Isto evita uma escolha falsa entre
"usar grafo" e "ter conta/convite seguros": os dois planos existem, mas com
responsabilidades diferentes.

## 4. Cobertura

O teste de dominio cobre:

- APP-40: projection publica responde workspace/invites/provider sem conteudo governado;
- APP-41: login/membership de portal nao concede authority governada;
- SEC-13: segredo de provider nao vaza para projection publica;
- ARCH-CP: proposta exige `sourceRevision` e falha fechado se stale;
- QRD-41: quatro topologias modeladas (`local-solo`, `git-backed`, `self-hosted-portal`, `hosted-portal`).
- S1b: store file-first persiste snapshot/event-log sem segredo e sem escrita remota.
- S1c: SQLite/PostgreSQL viaveis como stores Better Auth; Neo4j rejeitado como
  store de portal.
- S1d: Better Auth HTTP real persiste signup, sessao, organizacao e membership
  `owner` em SQLite.

## 5. Limites do spike

- Nao ha GitHub App real.
- Nao ha persistencia Better Auth ligada ao fluxo de produto.
- Nao ha email delivery de convite.
- Nao ha integracao com sessao real do app.
- Nao ha rota de produto navegavel para negocio/design/investidor.
- Nao ha conexao live com PostgreSQL nem migracao Better Auth aplicada em banco
  real.
- Nao ha prova de branch/PR real no governance host.

## 6. Riscos

### R1 - Portal virar autoridade por conveniencia

Se a proxima fatia salvar roles efetivos no DB do portal, o modelo perde a propriedade central. Mitigacao: todo role/authority efetivo deve ser lido ou proposto via governance host e marcado com `sourceRevision`.

### R2 - GitHub virar requisito implicito

Git-backed deve ser uma topologia suportada, nao a unica. A QRD-41 ainda exige `local-solo`, `git-backed`, `self-hosted-portal` e `hosted-portal`.

### R3 - Better Auth ser adotado antes da prova operacional compartilhada

O spike ja prova endpoint surface, migrations e fluxo HTTP em SQLite. Ele ainda
nao prova custo operacional, email, deploy, backup, compliance nem PostgreSQL
live. Mitigacao: proxima fatia deve testar PostgreSQL por ambiente e manter
SQLite como default local.

## 7. Recomendacao

Avancar para **S1e - PostgreSQL live por ambiente + convite/aceite** antes de
decidir Better Auth como stack final compartilhada.

Escopo recomendado:

1. Provar que a mesma configuracao troca para PostgreSQL por ambiente, sem
   mudar contratos de dominio.
2. Estender o fluxo HTTP para convite -> signup/signin convidado -> accept.
3. Usuario convidado nao precisa operar GitHub.
4. GitHub App bridge segue dry-run ate haver credencial/instalacao real isolada.
5. Teste de que o store do portal nao contem conteudo governado nem secrets.
6. Teste de que membership de portal nao concede authority.
7. Manter Neo4j fora do store do portal e cobri-lo em spike separado de
   graph-read-model.

Nao avancar ainda para hosted SaaS, nome publico ou decisao de licenca final do app.
