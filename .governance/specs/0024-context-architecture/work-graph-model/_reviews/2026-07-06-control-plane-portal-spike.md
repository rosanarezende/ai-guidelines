# Review - Spike S1 control-plane portal Git-backed

> Status: active-supporting-review.
> Data: 2026-07-06.
> Escopo: `governance-demo` control plane / portal sobre governance host Git-backed.
> Artefato de planejamento: `governance-demo/SPIKE-CONTROL-PLANE-PORTAL.md`.

## 1. Base verificada

- Branch: `feat/spec-0024-artifact-taxonomy-and-model-review-contract`.
- HEAD de implementacao da fatia: posterior ao commit de reconciliacao `be52043a`.
- Better Auth foi instalado apenas no workspace `acme-governance-next-app`.
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

## 3. Interpretacao

O spike sustenta a direcao arquitetural da QRD-41: um portal humano pode existir sem substituir o governance host file-first/Git-backed. A separacao de planos fica mecanizavel:

```text
identity/control plane -> conta, sessao, registry, convite, membership de portal
governance plane       -> roles governados, authority, decisions, event-log
content/work plane     -> repos, codigo, docs, metricas, evidencias
```

Better Auth continua um candidato forte porque fornece os blocos de conta, sessao, organizacao e convite dentro do app. Mas a decisao final ainda precisa de uma fatia S1b com store real e fluxo end-to-end mais proximo do produto.

## 4. Cobertura

O teste de dominio cobre:

- APP-40: projection publica responde workspace/invites/provider sem conteudo governado;
- APP-41: login/membership de portal nao concede authority governada;
- SEC-13: segredo de provider nao vaza para projection publica;
- ARCH-CP: proposta exige `sourceRevision` e falha fechado se stale;
- QRD-41: quatro topologias modeladas (`local-solo`, `git-backed`, `self-hosted-portal`, `hosted-portal`).
- S1b: store file-first persiste snapshot/event-log sem segredo e sem escrita remota.

## 5. Limites do spike

- Nao ha GitHub App real.
- Nao ha persistencia Better Auth em banco real do produto.
- Nao ha email delivery de convite.
- Nao ha integracao com sessao real do app.
- Nao ha rota de produto navegavel para negocio/design/investidor.
- Nao ha teste de Postgres ou SQLite persistido para Better Auth.
- Nao ha prova de branch/PR real no governance host.

## 6. Riscos

### R1 - Portal virar autoridade por conveniencia

Se a proxima fatia salvar roles efetivos no DB do portal, o modelo perde a propriedade central. Mitigacao: todo role/authority efetivo deve ser lido ou proposto via governance host e marcado com `sourceRevision`.

### R2 - GitHub virar requisito implicito

Git-backed deve ser uma topologia suportada, nao a unica. A QRD-41 ainda exige `local-solo`, `git-backed`, `self-hosted-portal` e `hosted-portal`.

### R3 - Better Auth ser adotado antes da prova operacional

O spike prova endpoint surface, nao custo operacional, email, migracoes, deploy, backup ou compliance. Mitigacao: S1b deve usar DB real de spike e fluxo HTTP end-to-end.

## 7. Recomendacao

Avancar para **S1c - decisao de stack do portal** antes de decidir Better Auth como stack final.

Escopo recomendado:

1. Comparar duas opcoes para release inicial: Better Auth com SQLite/Postgres vs portal file-first control plane.
2. Provar signup -> workspace -> invite -> accept em rota interna com persistencia real escolhida.
3. Usuario convidado nao precisa operar GitHub.
4. GitHub App bridge segue dry-run ate haver credencial/instalacao real isolada.
5. Teste de que o store do portal nao contem conteudo governado nem secrets.
6. Teste de que membership de portal nao concede authority.

Nao avancar ainda para hosted SaaS, nome publico ou decisao de licenca final do app.
