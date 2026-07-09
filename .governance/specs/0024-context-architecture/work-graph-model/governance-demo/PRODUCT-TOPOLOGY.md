# Topologia do produto visual

> **Status:** decisao de produto para a `governance-demo`.
> **Data:** 2026-07-07.
> **Autoridade:** complementa [`APP-PRODUCT-STATEMENT.md`](APP-PRODUCT-STATEMENT.md) e [`APP-DECISIONS.md`](APP-DECISIONS.md), especialmente QRD-36, QRD-37, QRD-38, QRD-41 e QRD-46.
> **Rodada aberta:** [`PRODUCT-DECISION-ROUND.md`](PRODUCT-DECISION-ROUND.md).

## 1. Decisao curta

O produto visual adota um modelo hibrido:

```text
Portal
  contas, sessoes, convites, memberships e registry de workspaces

Governance host Git-backed
  governanca real, work graph, roles governados, policies, event-log e decisoes

Repos de trabalho
  codigo, docs, design, infra, metricas, evidencias e sidecars
```

O portal existe para tornar a governanca operavel por pessoas. Ele nao e o SSOT
da governanca.

## 2. O que cada plano pode guardar

| Plano                      | Pode guardar                                                                | Nao pode guardar como autoridade                                      |
| -------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Portal                     | conta, sessao, email, provider id, convite, membership, workspace registry  | role governado, decisao, iniciativa, contrato, outcome, evidencia     |
| Governance host Git-backed | arquivos governados, roles, policies, event-log, sourceRevision, decisoes   | senha, sessao web, cookie, token de provider em payload publico       |
| Repo de trabalho           | codigo, docs, design, infra, metricas, context sidecars e evidencias locais | estado global de membership do portal ou authority fora da governanca |
| Integracoes                | evidencias derivadas, health, status, imports, exports e projections        | SSOT silencioso, gate automatico ou autoridade sem contrato governado |

## 3. Fluxo humano esperado

### Pessoa criadora

1. Entra no portal por magic link ou provider.
2. Cria workspace no portal.
3. Escolhe onde a governanca vai morar.
4. Conecta um governance host Git-backed, com GitHub como primeiro provider.
5. Configura perfis, papeis, fontes e integracoes.
6. Convida pessoas.
7. Opera o trabalho pela UI, enquanto as decisoes reais continuam no governance host.

### Pessoa convidada

1. Recebe convite.
2. Entra por magic link ou provider.
3. Aceita membership no portal.
4. Ve o workspace permitido.
5. Aceita ou recusa papeis propostos.
6. Executa acoes conforme authority derivada da governanca, nao conforme login.

### Demo anonima

1. Pessoa acessa sem conta.
2. O portal cria apenas uma sessao anonima local/sandbox.
3. Dados demo nunca se misturam com workspace real.
4. Nenhuma authority governada e concedida.

## 4. Topologias suportadas desde a modelagem

| Topologia            | Para quem serve                                        | Portal                             | Governance host                 | Observacao                                                            |
| -------------------- | ------------------------------------------------------ | ---------------------------------- | ------------------------------- | --------------------------------------------------------------------- |
| `local-solo`         | pessoa sozinha, experimento local                      | local ou dispensavel               | pasta local                     | menor friccao, mas nao resolve convite real                           |
| `git-backed`         | pessoa solo rigorosa ou time pequeno com GitHub        | local ou hospedado                 | repo Git dedicado ou embutido   | GitHub e o primeiro provider real                                     |
| `self-hosted-portal` | time que quer UI compartilhada sem SaaS da mantenedora | app + PostgreSQL operado pelo time | Git ou filesystem compartilhado | Docker Compose ajuda no dogfood, mas nao decide provedor final        |
| `hosted-portal`      | entrada publica/portfolio operada pela mantenedora     | portal publico opcional            | Git do usuario                  | futuro; exige decisao de custo, email, termos, privacidade e retencao |

## 5. Relacao entre repos

Direcao de produto:

```text
ai-guidelines
  framework/CLI/core headless

produto visual (nome a decidir)
  portal humano, app Next/MUI, backend do portal, Cup, dashboards e integracoes

governance host da plataforma
  governanca da propria plataforma: governa ai-guidelines + produto visual
```

O app visual deve sair de `work-graph-model` para um repo irmao quando o plano
de corte estiver definido. A Spec 0024 mantem a historia, as pesquisas e as
decisoes que explicam como o produto nasceu.

## 6. Regra de seguranca

Login, provider OAuth, membership de portal e acesso GitHub respondem perguntas
diferentes:

| Pergunta                         | Quem responde                                  |
| -------------------------------- | ---------------------------------------------- |
| Quem e esta pessoa?              | portal / identity provider                     |
| Em qual workspace ela participa? | membership do portal                           |
| Onde a governanca mora?          | workspace registry + governance host config    |
| O que ela pode fazer?            | authority derivada do governance host          |
| Qual evidencia sustenta isso?    | governance host + repos de trabalho + adapters |

Misturar essas respostas cria brecha de seguranca e auditoria falsa. O app deve
mostrar essa separacao na UX, nos testes e nos contratos.

## 7. O que fica bloqueado antes da proxima grande leva de telas

- nome publico candidato;
- plano de extracao para repo irmao;
- contrato do GitHub governance host;
- provider de magic link/e-mail para ambiente publico ou producao-like;
- politica minima de dados do portal;
- criterio de dogfood da plataforma governando `ai-guidelines` e o repo do app.
