# Matriz de cobertura do app de governanca

> **Status:** active.
> **Criado em:** 2026-07-05.
> **Autoridade funcional:** [`APP-FUNCTIONAL-SPEC.md`](APP-FUNCTIONAL-SPEC.md).
> **Autoridade de iteracao visual:** [`APP-ITERATION-MAP.md`](APP-ITERATION-MAP.md).
> **Fonte de contratos automatizados:** [`test/contracts/app-contracts.yml`](test/contracts/app-contracts.yml).
> **Estrategia de testes:** [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md).

Este arquivo e o painel de cobertura da `governance-demo`. Ele responde:

- o que o produto promete;
- qual contrato automatizado cobre a promessa;
- em que camada a promessa ja e provada;
- o que ainda e demo, esperado-falhar, fixme ou lacuna real;
- qual e a proxima ativacao que transforma contrato em comportamento usado.

Ele nao substitui o mapa de iteracao visual. O mapa diz o que foi visto no
navegador por uma pessoa. Esta matriz diz se existe contrato automatizado e em
que camada ele protege o fluxo.

## 1. Como ler

### Estados de contrato

| Estado          | Significado                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| `active`        | O contrato executa e deve passar.                                            |
| `expected-fail` | O contrato executa, chega ao ponto minimo e falha ate o produto ser fechado. |
| `fixme`         | O contrato existe, mas rota/infra/feature ainda nao tem condicao minima.     |
| `mixed`         | O fluxo combina contratos em mais de um estado.                              |
| `absent`        | Ainda nao ha contrato de produto suficiente.                                 |

### Camadas de prova

| Camada              | Prova                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `domain`            | Invariante puro em `backend/tests`, sem browser/servidor.                                   |
| `api-in-memory`     | Handler da mock-api via Hono `app.request()`, sem servidor/browser.                         |
| `real-route`        | Casca real Next via Playwright `request`, sem browser.                                      |
| `ui-e2e`            | Jornada humana em Playwright com browser.                                                   |
| `read-model`        | Snapshot/graph/rollup derivado provado em teste de dominio ou rota de leitura.              |
| `visual-validation` | Validacao humana no navegador registrada em [`APP-ITERATION-MAP.md`](APP-ITERATION-MAP.md). |

Regra: uma linha so vira "coberta de ponta a ponta" quando existe `ui-e2e`
ativo quando o comportamento e visual, ou `domain/api/read-model` ativo quando
o comportamento e puramente mecanico.

## 2. Resumo atual

Fonte: `test/contracts/app-contracts.yml`.

| Indicador                               | Valor atual |
| --------------------------------------- | ----------- |
| Contratos declarados                    | 57          |
| Contratos `active`                      | 16          |
| Contratos `expected-fail`               | 12          |
| Contratos `fixme`                       | 29          |
| Contratos `deny`                        | 14          |
| Seeds declaradas                        | 26          |
| Seeds sem contrato funcional de produto | 6           |

Observacao: o fechamento de `@demo/domain` como fronteira browser/server ja foi
aplicado. O pacote `@demo/domain` deve expor apenas `.`, `./browser` e
`./server`; qualquer subpath interno volta a ser risco arquitetural.

Observacao sobre seeds sem contrato funcional: este warning e deliberado. Ele
mantem visiveis cenarios ricos de regressao/dominio que ainda nao foram
promovidos a contrato de produto. Nao criar `expected-fail` apenas para silenciar
warning; `expected-fail` e reservado para produto-alvo explicito com rota
alcancavel e sentinela.

## 3. Matriz produto x teste

| Fluxo / feature                     | Planejado em                           | Contratos                                                 | Seeds / personas principais                                                                    | Cobertura atual                                                                                   | Gap real                                                                                                                                             | Proxima ativacao                                                                                 |
| ----------------------------------- | -------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Signup e sessao local               | `APP-FUNCTIONAL-SPEC` §2.2; mapa 01/03 | APP-01, APP-03                                            | `blank`                                                                                        | `active` em `ui-e2e`; rotas locais exercitadas; entrada usa Zod                                   | Auth real ainda e futuro; conta local nao e identity provider                                                                                        | Manter; nao bloquear proximas fatias                                                             |
| Criar/selecionar workspace          | mapa 02/13/15                          | APP-02, APP-13, APP-14                                    | `blank`, `onboarding-partial`, `acme-demo`                                                     | `active`; entrada/select usam Zod; Home parcial mostra proximo passo real; demo fica marcada      | Workspace virgem redireciona para onboarding por decisao de gate; Home cobre workspace parcial, nao not-started                                      | Proxima fatia: fontes de trabalho e coerencia de perfil/Settings                                 |
| Navegacao global                    | mapa 03A; QRD-35                       | APP-35                                                    | `empty-workspace`                                                                              | `active`; shell prova topbar/sidebar, estados sem-host/em-breve, Cup e console                    | Ainda falta validacao visual humana e comportamento fino por authority na UI de pessoas/papeis                                                       | Usar APP-35 como base de APP-02; aprofundar authority quando APP-07/APP-16 forem ativados        |
| Onboarding parcial e retomada       | mapa 04                                | APP-04                                                    | `blank`                                                                                        | `active` em `ui-e2e`                                                                              | Cobertura limitada ao fluxo parcial; nao cobre todas as escolhas                                                                                     | Manter como sentinela; ampliar com perfil/host/fontes                                            |
| Onboarding perfil/responsabilidades | mapa 05/06                             | APP-05, APP-06, CONS-01                                   | `empty-workspace`, `workspace-compact-policy`                                                  | `expected-fail`                                                                                   | Perfil, regra de acumulo e Settings ainda podem divergir; recomendacao precisa refletir politica efetiva                                             | Ativar perfil + regra de acumulo com persistencia e reflexo em Home/Settings                     |
| Onboarding pessoas/papeis           | mapa 07                                | APP-07; SEC-11, SEC-12                                    | `workspace-groups-teams`, `workspace-authority-personas`                                       | UI `expected-fail`; authority `active` em `domain`; rotas mutaveis usam Zod                       | Motor de authority e fronteira HTTP provam proposed/accepted, mas UI de convite/aceite ainda nao prova fluxo humano                                  | Ligar tela de pessoas a assignments, groups e accept/reject                                      |
| Governance host                     | mapa 08/17                             | APP-08, APP-17, APP-34                                    | `workspace-sem-host`, `workspace-host-local`, `workspace-host-embutido`                        | `active`; fit-check/link/create/sandbox usam Zod; console degradado mostra sourceRevision         | Leitura completa do read-model do host real ainda nao esta ligada ao console                                                                         | Depois de Home/demo: aprofundar Sources e read-model real do host                                |
| Fontes de trabalho                  | mapa 09/18/21                          | APP-09, APP-18, APP-21, CONS-02, SEC-05                   | `workspace-host-local`, `workspace-provider-versioned-source`, `workspace-cloud-synced-folder` | APP-09/18/21 e CONS-02 `active`; add/scan/browser-scan usam Zod; SEC-05 segue `fixme`             | Fluxo local/nuvem, fallback manual, GitHub como provider e consistencia Home/Settings/Sources estao cobertos; falta provar bloqueios de trust/SEC-05 | Proxima fatia pode focar perfil/Settings ou trust downgrade em resultados                        |
| Assistente/modelo                   | mapa 10/19                             | APP-10, APP-19, SEC-01                                    | `workspace-multi-assistant`, `workspace-controlled`                                            | APP-10 `expected-fail`; APP-19/SEC-01 `fixme`; save/default/test usam Zod                         | Ollama/local/cloud e egress ainda nao viraram UX confiavel fim-a-fim                                                                                 | Implementar configuracao honesta em onboarding/settings antes de Cup provider-assisted           |
| Integracoes hub/status              | mapa 20/40/41/42/43/44                 | APP-11, APP-20, INT-01, INT-02, INT-03, CONS-03, SEC-09   | `workspace-with-integration-statuses`, `workspace-github-work-source`                          | `fixme`; status por workspace usa Zod                                                             | Hub dedicado `/integrations` ainda ausente; status contextual e autoridade nao sao operaveis                                                         | Comecar read-only: catalogo, valor, risco, quem solicita/aprova, status efetivo                  |
| Settings como espelho do onboarding | mapa 15/18/19/20                       | APP-15, APP-18, APP-19, APP-20, CONS-01, CONS-02, CONS-03 | `workspace-compact-policy`, `workspace-provider-versioned-source`                              | Fontes `active`; perfil/assistant/integracoes seguem `expected-fail`/`fixme`                      | Settings ja espelha fontes; ainda pode divergir em perfil, regra de acumulo, assistant e integracoes                                                 | Garantir sincronia perfil/host/fontes/assistant/integracoes                                      |
| Planejamento de ciclo               | mapa 22                                | APP-22, APP-33                                            | `workspace-planning-progressivo`                                                               | `fixme`                                                                                           | Rota/UX de planning ainda nao existe como superficie de produto                                                                                      | So ativar depois de workspace+host+fontes; criar fluxo progressivo minimo                        |
| Intake e registro de iniciativa     | mapa 23                                | APP-23                                                    | `workspace-planning-progressivo`                                                               | `fixme`                                                                                           | Registro ainda nao nasceu como UI orientada por pessoa                                                                                               | Criar primeiro comando/tela de register/proposal com Cup deterministic opcional                  |
| Triagem/matcher                     | mapa 24                                | APP-24                                                    | `workspace-provider-versioned-source`                                                          | `fixme`                                                                                           | Matcher nao tem UX nem contrato assistivo de confianca                                                                                               | Depende de sources + register; manter bloqueado ate haver dados reais                            |
| Gate/ativacao                       | mapa 25/31                             | APP-25                                                    | `workspace-shared`                                                                             | `fixme`                                                                                           | Gate existe conceitualmente, mas nao como experiencia humana                                                                                         | Ativar so apos intake/triage; provar authority e audit trail                                     |
| Work/execucao                       | mapa 26                                | APP-26                                                    | `acme-demo`                                                                                    | `expected-fail` + read-model                                                                      | Demo/read-only existe, mas workflow operacional ainda nao e humano                                                                                   | Primeira lista operacional com TanStack Table + MUI e actions dry-run                            |
| Contratos                           | mapa 27/29/31                          | APP-27                                                    | `acme-demo`                                                                                    | `fixme`                                                                                           | Contract graph existe em read-model, mas tela de contrato ainda nao                                                                                  | Tela read-only de contrato, consumers, revision, contention e linked intents                     |
| Resultados/dashboards               | mapa 28                                | APP-28, SEC-02, SEC-08                                    | `acme-demo`                                                                                    | APP-28 `expected-fail`; read-model/rollup `active`; security UI `fixme`                           | Rollup e valido no dominio, mas dashboard humano ainda nao esta fechado                                                                              | Implementar `/results` com ECharts + TanStack Query e badges de confianca                        |
| Mapa de governanca                  | mapa 29                                | APP-29, SEC-02                                            | `acme-demo`                                                                                    | APP-29 `expected-fail`; graph read-model `active`                                                 | Mapa ainda precisa de interacoes estabilizadas e explicacao para stakeholders                                                                        | React Flow+ELK como mapa principal; ECharts graph opcional depois                                |
| Operacoes/incidentes                | mapa 30                                | APP-30                                                    | `acme-demo`                                                                                    | `fixme`                                                                                           | Incidentes existem na demo, mas nao como fluxo humano                                                                                                | Criar painel read-only basico antes de mutacoes                                                  |
| Auditoria                           | mapa 31                                | APP-31, APP-33, SEC-08                                    | `acme-demo`, `workspace-planning-progressivo`                                                  | `fixme`                                                                                           | Event-log/audit ainda ficam no console ou dominio, nao numa UX dedicada                                                                              | Criar tabela basica de eventos/decisoes com links para origem                                    |
| Console tecnico                     | mapa 32                                | APP-32                                                    | `acme-demo`                                                                                    | `expected-fail`                                                                                   | Console existe, mas contrato de uso tecnico ainda falha                                                                                              | Manter como avancado; nao deixar substituir UX principal                                         |
| Cup/CWP overlay                     | mapa 34-39                             | CUP-01, CUP-02, CUP-03, CUP-04                            | `empty-workspace`, `workspace-controlled`, `workspace-host-local`                              | `fixme`                                                                                           | Sem launcher/context resolver/specialist router; provider assistivo bloqueado por policy                                                             | Comecar C0/C1 deterministic sem provider e sem mutacao                                           |
| Seguranca e authority               | `POLICY-HANDBOOK`; mapa transversal    | SEC-01..SEC-12                                            | `workspace-controlled`, `workspace-authority-personas`, outras                                 | SEC-11/12 `active`; varios deny `fixme`; API in-memory cobre replay/authority basico              | Bloqueios de UI e explicacao de policy ainda nao estao provados                                                                                      | Transformar deny de UI em active quando as telas existirem; nunca usar `expected-fail` para deny |
| Schema e contratos runtime          | `ARCHITECTURE`; `TESTING-STRATEGY`     | Sem contrato APP dedicado                                 | n/a                                                                                            | Rotas mutaveis de `/api/local/*` usam schemas Zod compartilhados; guard barra parsing JSON manual | Responses publicas e APIs nao-locais ainda nao sao todas derivadas de Zod/JSON Schema                                                                | Avancar para response schemas quando as telas sairem do modo esperado-fail                       |

## 4. Matriz de lacunas por camada

| Camada            | Ja prova                                                                         | Ainda nao prova                                                  | Acao recomendada                                                   |
| ----------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| Domain/invariante | Authority, proposed vs accepted, seed invariants, rollup/read-model, sourceTrust | UX humana, explicacao de policy, persistencia visual entre telas | Manter barato e ampliar so para regras puras                       |
| API in-memory     | Schema basico, replay/idempotencia, authority, isolamento                        | Todas as rotas locais e casos por persona                        | Adicionar casos quando a rota for ativada, sem duplicar Playwright |
| Real route HTTP   | Sessao/JSON/gate de read-model                                                   | Autorizacao detalhada por rota de produto                        | Cobrir novas rotas antes de ligar UI mutavel                       |
| UI/e2e            | Signup/logout/onboarding parcial e sentinelas de expected-fail                   | A maior parte da experiencia de produto                          | Ativar contrato por contrato, seguindo a ordem abaixo              |
| Visual validation | Ainda nao e fonte automatizada                                                   | Usabilidade, copy, entendimento, fluxo real no browser           | Registrar no `APP-ITERATION-MAP.md` a cada rodada humana           |

## 5. Ordem de ativacao recomendada

Antes de qualquer fluxo de configuracao, o fluxo humano comeca em `/signup`.
Conta local/principal e pre-condicao para criar workspace, selecionar workspace,
aceitar convite, receber membership e aceitar papel. Um convite nao integra a
pessoa automaticamente: ele gera uma pendencia/token, e a pessoa convidada
precisa criar/usar uma conta no app para aceitar e entrar na organizacao.

1. **Higiene de testes e contratos** — garantir que os contratos das proximas telas estejam em `active`, `expected-fail` util ou `fixme` honesto; nenhum deny em `expected-fail`.
2. **Decisoes QRD pendentes** — fechar o que afeta implementacao: workspace virgem, host, sources, obrigatorio vs degradado, authority para criar/aceitar convites.
3. **APP-05 / APP-06 / APP-15 / CONS-01** — perfil, regra de acumulo e Settings coerentes.
4. **APP-07 / APP-16 / SEC-11 / SEC-12** — pessoas, grupos, convites, aceite de membership, aceite de papeis e authority efetiva na UI.
5. **APP-28 / APP-29** — `/results` e `/map` sobre demo/read-model com visualizacao real.
6. **INT-01..03** — hub de integracoes read-only, depois GitHub work-source.
7. **CUP-01 / CUP-02** — Cup deterministic C0/C1 sem provider externo.

## 6. Zod como governanca de schema

Decisao de direcao: **usar Zod e desejavel para a governance-demo**. Um app de
governanca nao deve depender apenas de tipos TypeScript apagados em runtime nem
de combinadores ad hoc quando o contrato cruza frontend, backend, mock-api,
testes e possiveis adapters externos.

### Estado atual

Hoje a demo ja tem:

- TypeScript strict;
- package `@demo/contracts`;
- validacao runtime Zod para todas as rotas mutaveis de `/api/local/*`;
- schemas por familia (`workspace`, `onboarding`, `members`, `host`,
  `work-sources`, `assistant`, `integrations`);
- JSON Schema projetado para algumas rotas;
- testes de schema/400 em API in-memory.

Isso fecha a etapa de request schemas para o shell local. A proxima fronteira de
governanca de schema e response schema/JSON Schema para as superficies que
virarem produto ativo.

### Direcao recomendada

Migrar `@demo/contracts` para ser a SSOT de schemas Zod:

```text
@demo/contracts
  src/
    commands/
      schemas.ts      # z.object(...) por comando/payload
      types.ts        # z.infer<typeof ...>
    api/
      schemas.ts      # request/response envelopes
      result.ts
    errors/
      schemas.ts
    index.ts
```

Regras:

- Todo request externo tem schema Zod.
- Todo response publico tem schema Zod ou tipo derivado de schema.
- `z.infer` gera o tipo TS compartilhado.
- JSON Schema, quando necessario, e derivado do Zod por ferramenta explicita.
- Backend, mock-api e testes importam o mesmo schema.
- Frontend pode importar schemas browser-safe para formularios, mas nunca
  validadores server-only.
- Erros de schema continuam fail-closed (`400`) e rastreaveis.

### Criterio de aceite das proximas fatias Zod

- `@demo/contracts` declara `zod` como dependencia propria. **Feito.**
- Rotas mutaveis de `/api/local/*` usam Zod na fronteira HTTP. **Feito para as
  rotas hoje existentes que aceitam body.**
- Os combinadores proprios deixam de ser a fonte principal para essa familia.
  **Feito para o shell local mutavel.**
- Teste de rota prova payload invalido e mensagem de erro governada. **Feito
  por familia/rota mutavel com `400 schema-invalid`.**
- `check-governance-app.ts` falha se rota nova em `frontend/app/api/local/**`
  voltar a usar parsing JSON manual ou deixar de apontar para schema
  compartilhado.

Nao fazer junto com UX: as proximas migracoes para Zod devem ser fatias tecnicas
pequenas, antes ou imediatamente junto da proxima rota mutavel que for ativada.

## 7. Como manter esta matriz

Atualizar este arquivo quando:

- um contrato mudar de `fixme` para `expected-fail`;
- um contrato virar `active`;
- uma seed nova entrar;
- uma rota de produto nascer;
- uma feature sair do escopo;
- Zod substituir uma familia de schemas;
- uma validacao visual em `APP-ITERATION-MAP.md` revelar gap de produto que
  ainda nao tem contrato.

Regra: se a pessoa mantenedora precisa perguntar "isso esta coberto?", a
resposta deve estar aqui ou em `test/contracts/app-contracts.yml`.
