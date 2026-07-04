# Decisoes do app de governanca

> **Status:** registro versionado de decisoes de produto/arquitetura da `governance-demo`.
> **Formato:** QRD = Question · Reasoning/Research · Decision.
> **Autoridade:** este arquivo registra decisoes da aplicacao. O modelo conceitual continua em [`../model.yml`](../model.yml), e o contrato funcional das telas fica em [`APP-FUNCTIONAL-SPEC.md`](APP-FUNCTIONAL-SPEC.md).
> **Uso apos compactacao:** ao retomar a frente do app, ler este arquivo antes de implementar nova tela, fake/mock API, ambiente ou teste e2e.

## Estado resumido

- Backend runtime real: `backend/src/` em TypeScript strict, com dominio, application, ports, adapters e API handlers.
- Frontend real: `frontend/` em Next/MUI, com signup, organizacoes, onboarding, Home, Settings e console tecnico.
- Lacuna principal: o app ainda tem muita UI parcial/read-only; escolhas de onboarding e configuracoes precisam virar estado persistido e comandos/use cases reais.
- Regra de produto: fake/mock API valida experiencia; backend real valida governanca.

## QRD-01 — Ambientes de execucao

**Q — Question**

Como separar desenvolvimento, testes e producao sem confundir demo, mock e backend real?

**R — Reasoning/Research**

O app precisa de ambientes separados porque a owner quer iterar UX localmente, inclusive com persistencia mutavel simulada. Ao mesmo tempo, a governanca nao pode considerar uma simulacao como mecanismo real. Se o ambiente nao for explicito, o app volta ao problema atual: tela parece funcional, mas o fluxo real continua no console tecnico ou no backend nao conectado.

Separar apenas `NODE_ENV` nao basta. Precisamos tambem separar a fonte de dados e o modo de escrita:

- ambiente: `development`, `test`, `production`;
- fonte de dados: `real-runtime`, `mock-api`, `demo-acme`;
- modo de escrita: `read-only`, `draft`, `command-runtime`.

**D — Decision**

Criar configuracao explicita por ambiente:

```text
GOVERNANCE_APP_ENV=development | test | production
GOVERNANCE_DATA_SOURCE=real-runtime | mock-api | demo-acme
GOVERNANCE_API_BASE_URL=http://127.0.0.1:<port>
```

Regras:

| Ambiente           | Data source permitido | Escrita                       | Uso               |
| ------------------ | --------------------- | ----------------------------- | ----------------- |
| `development:real` | `real-runtime`        | command runtime               | dogfood real      |
| `development:mock` | `mock-api`            | lowdb/local mutable state     | iterar UX rapido  |
| `development:demo` | `demo-acme`           | read-only ou comandos da demo | explorar acme     |
| `test:e2e`         | `mock-api` seeded     | resetavel por teste           | Playwright        |
| `test:unit`        | MSW/in-memory         | sem persistencia              | componentes/hooks |
| `production`       | `real-runtime`        | command runtime               | app real          |

Em producao:

- `mock-api` proibida;
- demo nao pode ser workspace implicito;
- backend/config real precisa ser explicito.

## QRD-02 — Biblioteca da mock API

**Q — Question**

Qual biblioteca usar para simular persistencia local mutavel de contas, workspaces, membros, configuracoes, intents e estados de fluxo?

**R — Reasoning/Research**

`json-server` e simples e conhecido, mas e mais adequado para CRUD direto em colecoes. O app precisa simular regras de fluxo, erros, permissoes, onboarding parcial, estados de workflow, respostas por perfil, stale state e futuros comandos. Isso exige controle de handlers e dominio fake, nao apenas CRUD generico.

`lowdb` resolve bem a persistencia JSON local tipada. A API em si deve ser propria, em TypeScript, para simular fluxos realistas e manter os contratos proximos do backend real.

**D — Decision**

Usar:

- `lowdb` como persistencia JSON local da mock API;
- TypeScript nos handlers;
- schemas/contratos reaproveitados do backend quando possivel;
- `json-server` nao entra como base principal.

`json-server` pode ser usado apenas para prototipos descartaveis, se algum dia for util. Ele nao deve virar dependencia central da aplicacao.

## QRD-03 — Local e nome da mock API

**Q — Question**

A fake API deve ficar dentro de `frontend/` ou como pasta/pacote separado? O nome deve ser `fake-api`, `mock-api`, `dev-api` ou outro?

**R — Reasoning/Research**

Colocar a API dentro do `frontend/` e rapido, mas acopla comportamento de backend a tela. Isso dificulta reaproveitar a simulacao em testes, futuro app desktop/mobile, CLI ou outras superficies. Tambem aumenta o risco de a tela funcionar apenas porque o mock esta colado no Next.

O termo `fake-api` e compreensivel e era usado em contexto anterior da owner, mas `mock-api` comunica melhor que e um test double. `dev-api` e menos claro porque pode soar como API real de desenvolvimento.

**D — Decision**

Criar uma pasta separada:

```text
governance-demo/
  frontend/
  backend/
  mock-api/
  test/
```

Nome oficial: `mock-api`.

Copy de produto/docs pode explicar: "mock API local para desenvolvimento". Evitar tratar como backend real.

Estrutura inicial recomendada:

```text
governance-demo/mock-api/
  package.json
  src/
    server.ts
    db.ts
    routes/
      accounts.ts
      workspaces.ts
      members.ts
      onboarding.ts
      sources.ts
      assistant.ts
      integrations.ts
      planning.ts
      intents.ts
    seeds/
      empty-workspace.json
      acme-demo.json
      onboarding-partial.json
```

## QRD-04 — Servidor HTTP da mock API

**Q — Question**

Usar Next route handlers, Hono, Express/Fastify ou outro servidor para expor a mock API?

**R — Reasoning/Research**

Next route handlers seriam suficientes para algo simples, mas isso manteria a mock API presa ao frontend. Express/Fastify funcionam, mas adicionam mais peso do que a necessidade atual. Hono e leve, TypeScript-friendly, roda em Node e cria uma fronteira HTTP clara.

Como a mock API deve ser reutilizavel por Playwright, testes, futuro desktop/mobile e possivelmente outros clientes, uma API separada e mais limpa.

**D — Decision**

Usar:

```text
mock-api = Hono + lowdb + TypeScript
```

O frontend consome a mock API via `GOVERNANCE_API_BASE_URL`, do mesmo jeito que consumiria uma API real.

## QRD-05 — MSW e testes de frontend

**Q — Question**

Se a mock API existe, ainda precisamos de MSW?

**R — Reasoning/Research**

Sim, mas para outro papel. A mock API simula persistencia local e jornadas mutaveis. MSW e melhor para testes de componente, hooks e estados especificos de UI: loading, erro, timeout, permissoes, payload malformado e edge cases isolados.

Sem MSW, testes de UI ficam dependentes de subir servidor. Sem mock API, Playwright e desenvolvimento local ficam pobres para fluxos mutaveis.

**D — Decision**

Usar os dois:

| Ferramenta   | Papel                                                 |
| ------------ | ----------------------------------------------------- |
| `mock-api`   | desenvolvimento local com persistencia mutavel        |
| `MSW`        | testes unitarios/integracao de UI e cenarios isolados |
| `Playwright` | jornadas e2e reais do produto                         |
| backend real | prova de governanca, command runtime e resolvers      |

Regra:

```text
mock-api valida experiencia.
MSW valida estados de UI.
Playwright valida jornada.
backend real valida governanca.
```

## QRD-06 — Testes end-to-end

**Q — Question**

Como testar o app ponta a ponta enquanto o backend real ainda esta incompleto para todas as telas?

**R — Reasoning/Research**

O app precisa de e2e agora, porque a maior falha atual e de fluxo: a pessoa entra, navega, escolhe, mas as escolhas nao viram configuracao real. Playwright com mock API seeded permite testar a experiencia completa antes de todos os comandos reais existirem.

Mas isso nao deve substituir os checks de governanca. Cada jornada pode ter dois niveis:

- e2e de experiencia contra `mock-api`;
- prova de governanca contra backend real quando o mecanismo existir.

**D — Decision**

Adotar Playwright para e2e.

Primeiras jornadas:

1. signup -> criar workspace -> iniciar onboarding;
2. escolher perfil -> cadastrar pessoas/papeis -> revisar recomendacao;
3. configurar assistente local -> testar conexao mockada;
4. adicionar fonte de trabalho -> ver status de evidencia;
5. registrar iniciativa simples -> ver intake criado;
6. continuar onboarding parcial pela Home;
7. trocar workspace sem vazar dados da demo acme.

Cada jornada deve resetar a seed da mock API antes de rodar.

## QRD-07 — Definicao de pronto para telas

**Q — Question**

Quando uma tela deixa de ser prototipo e passa a ser considerada funcional?

**R — Reasoning/Research**

Uma tela pode nascer contra mock API, mas nao deve ser considerada funcional apenas por persistir em lowdb. O framework exige resolver, comando, evidencia e fail-closed para governanca real. Sem essa distincao, o app vira apenas um CRUD bonito.

**D — Decision**

Usar tres niveis de pronto:

| Nivel               | Criterio                                                          |
| ------------------- | ----------------------------------------------------------------- |
| `UX-provada`        | jornada passa em Playwright contra mock API                       |
| `Produto-integrado` | tela persiste via API/gateway estavel e recarrega estado          |
| `Governanca-real`   | fluxo equivalente passa por backend real/command runtime/resolver |

So `Governanca-real` conta como pronto para o framework. `UX-provada` e `Produto-integrado` contam como progresso de produto, nao como prova de governanca.

## QRD-08 — Governance host obrigatorio

**Q — Question**

Uma organizacao/workspace pode finalizar onboarding sem ter um governance host configurado?

**R — Reasoning/Research**

O workspace e a entidade de produto onde a pessoa organiza empresa, cliente, projeto pessoal ou sandbox. O governance host e diferente: ele e o lugar fisico onde mora o SSOT file-first daquele workspace.

Sem governance host, o app pode criar conta, workspace e rascunhos, mas nao tem onde gravar governanca autoritativa: membros, papeis, fontes, intents, decisoes, outcomes e event-log. Se o onboarding puder terminar sem host, a UI passa a parecer funcional sem governar nada.

Ao mesmo tempo, exigir um repo Git real no primeiro minuto pode travar adocao. Uma pessoa pode querer testar numa pasta local ou sandbox antes de apontar para repos reais.

**D — Decision**

Workspace pode existir sem governance host, mas onboarding real nao pode ser considerado concluido sem governance host.

Estados:

| Estado                        | Permitido          | Como aparece                                                    |
| ----------------------------- | ------------------ | --------------------------------------------------------------- |
| Workspace criado sem host     | sim                | `rascunho local`                                                |
| Onboarding parcial sem host   | sim                | Home mostra proximo passo: escolher onde a governanca vai morar |
| Onboarding concluido sem host | nao, salvo sandbox | bloqueia conclusao ou marca como `sandbox`                      |
| Demo acme sem host do usuario | sim                | badge claro `demo`                                              |
| Producao sem host             | nao                | erro de configuracao                                            |

Opcoes do onboarding:

1. usar pasta local dedicada de governanca;
2. usar repo dedicado de governanca;
3. embutir host em repo existente;
4. continuar em modo sandbox, sem chamar isso de organizacao governada.

Regra de produto:

```text
Para governar de verdade, o app precisa de uma pasta onde decisoes,
configuracoes e historico serao gravados.
```

## QRD-09 — Layout fisico do governance host

**Q — Question**

Qual layout fisico devemos usar para o host de governanca sem confundir host com sidecar de repo governado?

**R — Reasoning/Research**

Existem dois papeis fisicos diferentes:

- `governance host`: guarda o estado autoritativo do workspace;
- `repo sidecar`: publica contexto/evidencia de uma fonte/repo governado.

Quando a pasta ou repo e dedicado a governanca, a raiz ja representa o host. Criar uma subpasta `.governance/` dentro dela adiciona uma camada redundante e dificulta leitura humana. Quando o host fica embutido dentro de um repo existente, ai sim ele precisa de uma pasta propria para nao conflitar com o sidecar `.governance/` do repo.

**D — Decision**

Adotar estes layouts:

| Caso                     | Nome fisico                    | Diferenca                              |
| ------------------------ | ------------------------------ | -------------------------------------- |
| Pasta local              | `<workspace-slug>-governance/` | nao necessariamente versionada por Git |
| Repo dedicado            | `<workspace-slug>-governance/` | e um repo Git proprio                  |
| Dentro de repo existente | `.governance-host/`            | host embutido                          |
| Repo governado normal    | `.governance/`                 | sidecar do repo                        |

Pasta local ou repo dedicado:

```text
mundo-da-mel-governance/
  host.yml
  members/
  sources/
  business/
  intents/
  decisions/
  outcomes/
  events/
```

Host embutido em repo existente:

```text
mundo-da-mel-site/
  .governance-host/
    host.yml
    members/
    sources/
    business/
    intents/
    decisions/
    outcomes/
    events/

  .governance/
    sidecar.yml
    manifest.yml
    context.json
    works/
    registry/
```

Repo governado normal:

```text
mundo-da-mel-editorial/
  .governance/
    sidecar.yml
    manifest.yml
    context.json
    works/
    registry/
```

Regras:

- `host.yml` so existe em host.
- `sidecar.yml` so existe em sidecar.
- Host dedicado nao usa `.governance/` por baixo.
- `.governance/` fica reservado para sidecar.
- `.governance-host/` so existe quando o host esta embutido em repo existente.
- Modo combinado so e permitido quando `.governance-host/` e `.governance/` existem como pastas irmas, nunca uma dentro da outra.

## QRD-10 — Conta, membro, papel e autoridade

**Q — Question**

Conta, membro de workspace, papel atribuido e autoridade efetiva sao a mesma coisa? Quem pode atribuir papeis e quando eles passam a valer?

**R — Reasoning/Research**

Se a conta local que criou o workspace virar automaticamente sponsor, payer, attester ou authority, o app cria consentimento implicito e abre brecha de governanca. Tambem nao e correto atribuir papel a outra pessoa e tratar como ativo sem aceite: qualquer papel carrega responsabilidade, mesmo quando nao e altamente sensivel.

Precisamos separar quatro conceitos:

- `Account`: identidade local ou externa da pessoa no app;
- `Membership`: vinculo dessa account/pessoa com um workspace;
- `RoleAssignment`: atribuicao de papel dentro do workspace, com autor, destinatario, status e escopo;
- `Authority`: autoridade efetiva resolvida a partir de membership ativa, role assignments validos, grupos/times e policy.

Essa separacao tambem prepara o caminho para identity-provider futuro sem bloquear o dogfood local.

**D — Decision**

Separar formalmente:

```text
Account != Membership != RoleAssignment != Authority
```

Estados de membership:

```text
invited | active | disabled | left
```

Estados de role assignment:

```text
self-assigned | proposed | accepted | rejected | revoked
```

Regra de aceite:

```text
Se actor == subject:
  pode entrar como self-assigned, se a policy do workspace permitir.

Se actor != subject:
  entra sempre como proposed.
  so vira accepted quando o subject aceita.
```

Authority efetiva:

```text
Authority efetiva =
  membership active
  + role assignment accepted/self-assigned
  + policy permite
```

Quem pode propor papeis:

| Acao                                | Quem pode                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| propor papel comum                  | workspace-admin, sponsor ou sujeito com `role-management`                      |
| propor papel sensivel               | workspace-admin + sponsor/security conforme policy                             |
| autoatribuir papel em solo          | criador do workspace, com badge self-governed                                  |
| autoatribuir papel em compact/trio  | permitido com badge/revisao conforme profile                                   |
| autoatribuir papel sensivel em full | bloqueado ou exige aprovacao separada                                          |
| revogar papel                       | workspace-admin, sponsor, policy owner ou o proprio subject para sair do papel |
| aceitar/rejeitar papel              | somente subject                                                                |

Papeis atribuidos a outra pessoa nunca geram authority efetiva antes do aceite.

## QRD-11 — Subjects, grupos e acesso ao grafo

**Q — Question**

Papeis podem ser atribuidos a times/grupos alem de pessoas? Todo time deve ter acesso a informacoes de outros times no grafo?

**R — Reasoning/Research**

Benchmark publico aponta que RBAC simples nao basta para uma organizacao grande:

- NIST RBAC modela relacoes muitos-para-muitos entre usuarios, papeis e permissoes, alem de hierarquia/restricoes. Fonte: <https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=916402>.
- NIST ABAC decide por atributos de sujeito, objeto, operacao e ambiente. Fonte: <https://csrc.nist.gov/pubs/sp/800/162/upd2/final>.
- Zanzibar/ReBAC modela autorizacao como relacoes entre sujeitos e objetos, adequado para objetos compartilhados em escala. Fonte: <https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/>.
- OPA separa decisao de policy da aplicacao. Fonte: <https://openpolicyagent.org/docs>.
- Kubernetes separa Role de RoleBinding e permite subjects como users, groups e service accounts. Fonte: <https://kubernetes.io/docs/reference/access-authn-authz/rbac/>.
- SCIM padroniza users/groups para provisionamento entre identity providers e apps. Fonte: <https://datatracker.ietf.org/doc/html/rfc7644>.

Para o work graph, isso implica um desenho hibrido:

```text
RBAC para papeis
+ ReBAC para relacoes no grafo
+ ABAC para classificacao/atributos/contexto
+ policy-as-code/resolver para decisao auditavel
```

Times e grupos sao necessarios, mas nao devem virar atalho para acesso amplo. O app precisa resolver autoridade efetiva e acesso por sujeito, acao, recurso e contexto.

**D — Decision**

Modelar `Subject` como:

```text
person | team | group | service-account | external-group
```

Exemplos:

```yaml
subject: { kind: person, id: user-ana }
subject: { kind: team, id: time-sre }
subject: { kind: group, id: security-reviewers }
subject: { kind: service-account, id: bot-context-publisher }
subject: { kind: external-group, id: github:org/team }
```

RoleAssignment pode apontar para qualquer `Subject`, mas continua tendo status, escopo e policy.

Authority efetiva passa a ser derivada de:

```text
pessoa ativa no workspace
+ papeis aceitos diretamente
+ papeis herdados de teams/groups
+ policy de escopo
+ classificacao/visibilidade do recurso
= pode ou nao pode
```

Criar `access-policy` por workspace:

```yaml
access-policy:
  default-read: limited # open | limited | restricted
  rules:
    - subject: { kind: team, id: time-growth }
      can-read:
        - objective:public
        - target:public
        - intent:own-area
        - repo-work:own-repo
      can-write:
        - proposal:create
        - triage:comment
```

Todo no governado precisa de classificacao minima:

```text
public | internal | confidential | restricted
```

Leitura nao e apenas binaria:

```text
full | redacted | metadata-only | denied
```

Grupos externos precisam de proveniencia:

```yaml
managed-by: external-idp
source: github-team
last-synced-at: "2026-07-04T00:00:00Z"
local-editable: false
```

UI obrigatoria:

- mostrar authority direta vs herdada;
- explicar "por que tenho acesso?";
- mostrar quando existe item restrito redigido;
- permitir auditoria de policy decision;
- nao assumir que todo workspace e open-by-default.

## QRD-12 — Natureza do app

**Q — Question**

O app deve ser tratado como um produto SaaS pago, como uma demo da sim acme, ou como uma superficie open-source/local-first do framework?

**R — Reasoning/Research**

O framework nasceu open-source e a decisao de virar produto pago ainda nao foi tomada. Se o app nascer assumindo billing, tenant cloud ou plano pago como centro do dominio, vamos modelar responsabilidade financeira antes de haver um fluxo real que justifique isso.

Ao mesmo tempo, a sim tecnica atual nao basta: a owner precisa de uma superficie humana para validar onboarding, configuracao, decisoes, dashboards, integracoes e operacao diaria sem depender do console tecnico.

O app, portanto, precisa ser uma camada de produto real, mas nao deve assumir um modelo comercial prematuro.

**D — Decision**

O app e a superficie humana, local-first e self-hostable do framework de governanca.

Ele deve:

- operar workspaces reais;
- guiar adocao;
- persistir configuracoes e decisoes;
- chamar backend/runtime governado;
- integrar ferramentas externas como evidence providers/importers/projections;
- continuar utilizavel sem conta cloud ou ferramenta externa obrigatoria.

Ele nao deve assumir, por default:

- cobranca;
- plano pago;
- tenant cloud;
- billing workflow;
- dependencia de servidor externo;
- assistente cloud obrigatorio.

Papeis como `payer`/`billing-owner` so entram quando houver fluxo real de pagamento, custo, contrato ou compra. Para custo operacional, preferir `cost-owner` ou papel equivalente escopado a FinOps/custos, nao a cobranca do produto.

## QRD-13 — Integracao entre app e CLI `ai-guidelines`

**Q — Question**

Como o app deve se integrar com a CLI que ja vinha sendo construida no framework (`ai-guidelines`) sem criar duas formas concorrentes de governar?

**R — Reasoning/Research**

O pacote atual do repositorio e `ai-guidelines`, com CLI em `dist/cli/main.js` e comandos expostos por `npm run flow -- ...` no desenvolvimento local. A CLI ja carrega a disciplina do framework: init/adopt/update, work/review/decide, checks, CI e automacao repo-first.

O app resolve outro problema: tornar o mesmo modelo operavel por pessoas que nao querem ou nao devem operar YAML, payloads e comandos tecnicos. Se o app gravar estado proprio que a CLI nao le, teremos split-brain. Se o app for apenas uma casca que shella a CLI, ficaremos presos a uma UX fragil e dificil de portar para desktop/mobile.

O desenho mais robusto e manter CLI e app como superficies diferentes sobre o mesmo modelo/runtime.

**D — Decision**

CLI e app devem compartilhar:

- layout file-first;
- governance host;
- sidecars de fontes/repos;
- dominio/runtime/ports/adapters;
- command contracts;
- base-revision/idempotency/event-log;
- resolvers e politica fail-closed.

A CLI `ai-guidelines` continua sendo a superficie primaria para:

- terminal;
- CI;
- automacao;
- init/adopt/update;
- checks;
- fluxos governados de work/review/decide;
- uso por times que preferem linha de comando.

O app passa a ser a superficie primaria para:

- signup/local account;
- workspaces;
- onboarding;
- configuracoes;
- convite/papeis;
- planejamento;
- intake/triagem/gate;
- dashboards;
- pendencias;
- auditoria humana;
- integracoes e assistente.

Regra:

```text
Toda acao governada do app deve mapear para comando/use case que a CLI/runtime tambem entende.
Toda acao governada da CLI deve produzir estado que o app consiga ler e explicar.
```

Shell-out para a CLI pode existir como ponte temporaria para reaproveitar comandos ja prontos, mas nao e a arquitetura alvo. A arquitetura alvo e compartilhar dominio/runtime/contratos, preservando a CLI como superficie headless e o app como superficie humana.

## QRD-14 — Workspace mode e adapters

**Q — Question**

O modo de operacao do workspace deve determinar ferramentas especificas, como GitHub, GitLab, Bitbucket, SQLite, OIDC ou Ollama?

**R — Reasoning/Research**

Nao. O modo deve expressar garantias minimas de operacao, compartilhamento, identidade, persistencia, evidencia e seguranca. Ele nao deve prender a pessoa a vendor ou ferramenta especifica.

Tambem nao deve ser derivado rigidamente do tamanho do time. Um dev solo pode querer postura mais controlada, usando GitHub, auth forte e auditoria. Um time de duas pessoas pode lidar com informacao sensivel e precisar de controles fortes. Uma empresa grande pode querer avaliar localmente antes de conectar provedores corporativos.

O desenho correto tem tres eixos diferentes:

```text
governance-profile = como decisoes/responsabilidades funcionam
workspace-mode = quao compartilhado e verificavel esse workspace precisa ser
adapters = ferramentas concretas escolhidas para cumprir as garantias
```

Se amarrarmos `workspace-mode` a ferramenta, perdemos portabilidade e self-hosting. Se separarmos tudo sem orientacao, deixamos a pessoa perdida. Portanto, o app deve recomendar combinacoes, mas permitir override explicito.

**D — Decision**

Criar um eixo independente:

```yaml
workspace-mode: local | shared | controlled
```

Significado:

| Workspace mode | Garantia                                                | Exige                                                                     |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `local`        | uma pessoa ou avaliacao local                           | storage local + conta local                                               |
| `shared`       | mais de uma pessoa opera o mesmo workspace              | app acessivel ao time + persistencia compartilhada + convites/memberships |
| `controlled`   | acesso, egress e auditoria exigem controles mais fortes | policy de acesso + auditoria + identidade/aprovacao mais forte            |

Esses modos nao escolhem ferramenta. Eles so dizem o que precisa ser verdadeiro.

Ferramentas entram como adapters:

```yaml
identity-provider: none | local-auth | github-oauth | gitlab-oauth | bitbucket-oauth | oidc

work-source: local-folder | git-local | github | gitlab | bitbucket | gitea | manual

storage: files | sqlite | postgres

assistant: none | ollama | openai-compatible | cloud-approved
```

Regras:

- o app recomenda um `workspace-mode`, mas permite trocar;
- o app recomenda adapters compativeis, mas nao prende a vendor;
- `controlled` pode ser escolhido por dev solo;
- `local` pode ser escolhido por empresa grande em avaliacao, com badge claro de limitacao;
- `shared` exige backend/app acessivel por mais de uma pessoa e persistencia compartilhada minima;
- ferramentas externas potencializam evidencia e experiencia, mas nao substituem o SSOT file-first;
- o onboarding deve mostrar "o que este modo garante", "o que ele nao garante" e "quais adapters voce pode usar".

Exemplos validos:

| Cenario                        | Governance profile | Workspace mode | Adapters possiveis                            |
| ------------------------------ | ------------------ | -------------- | --------------------------------------------- |
| dev solo local                 | `solo`             | `local`        | files + local account + local-folder + ollama |
| dev solo rigoroso              | `solo`             | `controlled`   | sqlite + github-oauth + github + ollama       |
| dupla em projeto sensivel      | `compact`          | `controlled`   | sqlite/postgres + oidc/local-auth + gitlab    |
| empresa grande em piloto       | `full`             | `local`        | files + demo/manual, com limitacao explicita  |
| time pequeno com repos remotos | `compact`          | `shared`       | sqlite + local-auth + github/gitlab           |

## QRD-15 — Onboarding padrao e avancado

**Q — Question**

O usuario deve escolher diretamente banco, Docker, Neo4j, auth provider e adapters no onboarding?

**R — Reasoning/Research**

Nao como caminho padrao. Essas escolhas tem impacto real, mas sao tecnicas demais para serem a primeira experiencia. Se o app abrir com "SQLite vs Postgres vs Neo4j" ou "Docker vs servidor" para uma pessoa nao tecnica, ele empurra a carga cognitiva errada para o usuario.

Ao mesmo tempo, o framework precisa servir pessoas tecnicas e organizacoes que sabem exatamente o que querem. Um dev solo pode querer `controlled`; um time pequeno pode querer Docker + GitHub; uma empresa pode querer avaliar localmente antes de conectar SSO. Portanto, esconder as opcoes tambem seria ruim.

O desenho precisa ter dois caminhos:

```text
onboarding padrao = perguntas simples -> recomendacao explicada
onboarding avancado = escolhas tecnicas -> validacao de compatibilidade
```

**D — Decision**

O onboarding tera dois caminhos:

1. **Padrao guiado**
   - pergunta intencao/contexto;
   - recomenda `governance-profile`;
   - recomenda `workspace-mode`;
   - recomenda `execution-mode`;
   - recomenda adapters minimos;
   - explica consequencias em linguagem simples.

2. **Avancado**
   - permite escolher `execution-mode`;
   - permite escolher `operational-store`;
   - permite escolher `graph-read-model`;
   - permite escolher `identity-provider`;
   - permite escolher `work-source`;
   - permite escolher `assistant`;
   - valida compatibilidade;
   - mostra requisitos, riscos e degradacoes.

Arvore conceitual:

```text
1. governance-profile
   Como decisoes e responsabilidades funcionam.

2. workspace-mode
   Quao compartilhado/controlado o workspace precisa ser.

3. execution-mode
   Como o app vai rodar.

4. storage/read-model adapters
   Onde ficam estado operacional, grafo e projecoes.

5. tool adapters
   Git, auth, assistente, CI, observabilidade etc.
```

Valores iniciais:

```yaml
execution-mode: local-process | docker-compose | self-hosted-server

operational-store: files | sqlite | postgres

graph-read-model: none | file-export | neo4j

identity-provider: none | local-auth | github-oauth | gitlab-oauth | bitbucket-oauth | oidc

work-source: local-folder | git-local | github | gitlab | bitbucket | gitea | manual

assistant: none | ollama | openai-compatible | cloud-approved
```

Regras de UX:

- o caminho padrao nunca pergunta "qual banco voce quer?" como primeira camada;
- o caminho padrao mostra uma stack recomendada e o motivo;
- o caminho avancado mostra impacto, requisitos e riscos por escolha;
- toda combinacao incoerente deve virar bloqueio ou warning claro;
- `neo4j` aparece como `graph-read-model`, nao como banco unico do app;
- Docker aparece como `execution-mode`, nao como requisito universal;
- banco operacional e read-model de grafo sao escolhas separadas.

Exemplos de incompatibilidade/degradacao:

| Escolha                               | Resultado                                            |
| ------------------------------------- | ---------------------------------------------------- |
| `shared + local-process + files only` | permitido so como avaliacao, com badge de limitacao  |
| `controlled + identity-provider none` | bloqueia ou exige excecao explicita                  |
| `controlled + manual work-source`     | permitido apenas com evidencia rebaixada             |
| `neo4j + source revision ausente`     | bloqueia read-model porque grafo nao pode virar SSOT |
| `docker-compose`                      | exige Docker instalado e health checks dos servicos  |

## QRD-16 — Neo4j no primeiro release

**Q — Question**

Neo4j deve ficar para depois ou precisa estar disponivel como opcao ja no primeiro release funcional?

**R — Reasoning/Research**

O grafo e o coracao conceitual do framework. Se o primeiro release tiver apenas telas/tabulares e read-model file export, o app valida onboarding e comandos, mas nao valida uma promessa central: entender impacto, dependencia, lineage e coordenacao como grafo.

Ao mesmo tempo, Neo4j nao deve virar requisito universal. Exigir Neo4j para todo workspace aumentaria friccao, especialmente para solo/local. Tambem seria errado transforma-lo em SSOT por atalho: o modelo ja decidiu que o estado autoritativo continua file-first/event-log, e bancos/read-models sao derivados salvo contrato explicito futuro.

Portanto, Neo4j deve entrar no primeiro release como opcao real e suportada de `graph-read-model`, principalmente no caminho avancado e em stacks Docker/self-hosted. Isso permite dogfoodar o grafo sem bloquear quem quer comecar simples.

**D — Decision**

Neo4j deve existir no primeiro release funcional como opcao de `graph-read-model`.

Regras:

- `graph-read-model: neo4j` e opcao suportada no caminho avancado;
- nao e default do caminho padrao;
- nao e requisito para `local`;
- pode ser recomendado para `shared` ou `controlled` quando houver muitos repos, contratos, dependencias ou necessidade de visualizacao/impacto;
- nao substitui `authoritative-governance`;
- comandos governados continuam relendo governance host/event-log e falham fechado se a revisao fonte divergir;
- o app deve explicar que Neo4j acelera/explora consultas de grafo, mas nao decide nem escreve governanca por padrao.

Stack minima para Neo4j no primeiro release:

```yaml
graph-read-model: neo4j
execution-mode: docker-compose | self-hosted-server
operational-store: files | sqlite | postgres
authoritative-governance: files/event-log
```

Mecanismos minimos:

- configuracao de conexao ou Docker Compose gerado;
- health check do Neo4j;
- export/rebuild do grafo a partir do governance host;
- `sourceRevision` gravada junto da carga;
- status de freshness no app;
- falha fechada se o app tentar agir a partir de grafo stale;
- aviso quando Neo4j estiver indisponivel: app continua funcionando, mas perde graph read-model avancado;
- opcao de remover/recriar read-model sem tocar no SSOT.

Critério para considerar "Neo4j suportado" no primeiro release:

1. usuario escolhe `graph-read-model: neo4j` no onboarding avancado;
2. app mostra requisitos;
3. app testa conexao;
4. app gera/exporta a carga;
5. app mostra grafo/impacto a partir do Neo4j;
6. app mostra `sourceRevision`;
7. app bloqueia acao quando o Neo4j estiver stale ou sem source revision.

## QRD-17 — Docker Compose oficial

**Q — Question**

O framework deve gerar um `docker-compose.yml` oficial para stacks shared/controlled, ou deixar cada pessoa/time montar Postgres, Neo4j, app e outros servicos do seu jeito?

**R — Reasoning/Research**

Se cada pessoa monta os servicos de um jeito, a experiencia de adocao fica fragil: portas diferentes, versoes diferentes, variaveis diferentes, Neo4j/Postgres configurados de formas incompatíveis e bugs que nao pertencem ao framework. Isso prejudica especialmente `shared` e `controlled`, onde varias pessoas precisam acessar o mesmo app e a mesma persistencia.

Ao mesmo tempo, Docker nao deve ser requisito universal. Para solo/local, rodar sem Docker e parte da proposta de baixa friccao. Para empresa grande em ambiente controlado, Docker Compose pode ser apenas o artefato de desenvolvimento/piloto; producao pode usar outro orquestrador.

Portanto, Docker Compose deve ser uma opcao oficial e suportada de `execution-mode`, nao o unico caminho.

**D — Decision**

O primeiro release deve incluir geracao/uso de Docker Compose oficial para stacks `shared` e `controlled`.

Regras:

- `execution-mode: docker-compose` e opcao suportada no onboarding avancado;
- para `shared`, Docker Compose e recomendado quando mais de uma pessoa vai acessar o app;
- para `controlled`, Docker Compose e caminho padrao de piloto/self-hosted simples, salvo quando a pessoa escolher `self-hosted-server`;
- para `local`, Docker Compose e opcional, nao recomendado como default;
- o compose deve ser gerado por workspace/stack, nao editado manualmente como contrato implicito;
- servicos entram por escolha de adapters, nao todos sempre;
- o app deve mostrar requisitos: Docker instalado, portas, volumes, backup, credenciais, health checks;
- o compose nao substitui o governance host file-first.

Servicos iniciais:

```yaml
services:
  governance-app: always
  operational-store:
    sqlite: embedded/file
    postgres: optional service
  graph-read-model:
    neo4j: optional service
  assistant:
    ollama: optional/external-by-default
```

Padrao recomendado:

| Workspace mode | Execution mode recomendado               | Observacao                                             |
| -------------- | ---------------------------------------- | ------------------------------------------------------ |
| `local`        | `local-process`                          | menor friccao; Docker opcional                         |
| `shared`       | `docker-compose`                         | app e persistencia padronizados para o time            |
| `controlled`   | `docker-compose` ou `self-hosted-server` | compose para piloto; servidor formal para uso continuo |

O compose oficial deve ter:

- nomes de servico estaveis;
- volumes nomeados;
- `.env` gerado por workspace;
- health checks;
- portas configuraveis;
- backup/export documentado;
- protecao para nao versionar segredo;
- modo de regenerar sem apagar dados.

## QRD-18 — Ollama no Compose

**Q — Question**

Quando o usuario escolhe assistente local, o framework deve subir Ollama automaticamente no Docker Compose, ou apenas conectar a um Ollama ja instalado?

**R — Reasoning/Research**

Ollama e uma boa primeira opcao porque permite assistencia local e reduz vazamento de dados por default. Mas colocar Ollama sempre dentro do Compose cria outros problemas:

- imagens e modelos podem ser grandes;
- uso de CPU/GPU varia muito por maquina;
- download de modelo sem consentimento explicito seria uma surpresa operacional ruim;
- times podem ja ter Ollama, LM Studio, LocalAI, vLLM ou outro runtime local aprovado;
- em ambiente controlled, o assistente pode precisar de aprovacao de Security antes de qualquer uso;
- em solo/local, o usuario pode querer a friccao minima de apontar para `http://127.0.0.1:11434`.

Portanto, assistente local deve ser facil de configurar, mas nao deve ser iniciado automaticamente sem escolha explicita.

Benchmark aplicado:

- Ollama, LM Studio, Jan, GPT4All, LocalAI, llama.cpp e vLLM oferecem ou expõem caminhos OpenAI-compatible em graus diferentes. Isso favorece um adapter generico `openai-compatible`, nao um acoplamento duro a Ollama.
- Open WebUI e LibreChat tratam provedores como conexoes/endpoints configuraveis, geralmente com URL, chave e descoberta de modelos quando possivel.
- Continue separa modelos por funcao/capacidade (`chat`, `edit`, `autocomplete`, `embed`, `rerank`). Esse padrao e mais util para o framework do que uma escolha unica de "modelo do assistente".
- Dify e ferramentas de workspace tratam provedores/modelos como configuracao compartilhada pelo workspace, nao como preferencia solta de cada tela.
- LiteLLM e mais bem modelado como gateway organizacional de modelos, com roteamento, chaves virtuais, orcamento e logs. Ele nao substitui Ollama/LM Studio/vLLM; ele pode ficar acima deles em `shared`/`controlled`.

**D — Decision**

Ollama deve ser **externo por padrao**.

Regras:

- o caminho padrao do onboarding deve tentar conectar a um Ollama local existente antes de sugerir subir servico novo;
- a tela deve ser de **assistente/model provider**, nao de "Ollama";
- Ollama e o preset recomendado para local, mas nao o unico caminho;
- o primeiro release deve suportar dois adapters reais:
  - `assistant-ollama`;
  - `assistant-openai-compatible`;
- LM Studio, Jan, GPT4All, LocalAI, llama.cpp/vLLM e LiteLLM entram como presets sobre `assistant-openai-compatible`, quando tecnicamente aplicavel;
- todo provider precisa passar por `assistant.health`, `model-discovery` quando suportado, `capability-probe`, `egress-policy` e audit log;
- capabilities devem ser gravadas por funcao: `chat`, `structured-json`, `tool-calling`, `embeddings`, `rerank`, `vision`, `context-window`, `max-output`, `streaming`;
- um provider pode estar conectado e ainda assim aparecer como `limited` se nao provar a capacidade necessaria para matcher/extracao/embedding;
- o Compose oficial pode gerar um servico Ollama opcional, mas somente atras de profile explicito, por exemplo `profiles: [\"assistant\"]`;
- o profile de assistente fica desligado por default;
- nenhum modelo deve ser baixado automaticamente sem confirmacao explicita;
- a escolha de modelo deve mostrar tamanho aproximado, requisitos locais e impacto de privacidade/custo;
- `assistant.health` deve funcionar tanto para endpoint externo quanto para servico Compose;
- endpoint nao-loopback deve acionar policy/egress e, em `controlled`, aprovacao antes de uso;
- cloud providers continuam atras de allowlist/policy, nunca como default.

Stack minima quando a pessoa escolhe rodar Ollama via Compose:

```yaml
assistant:
  provider: ollama
  runtime: docker-compose-profile
  profile: assistant
  defaultEnabled: false
  modelPull: explicit
```

Copy obrigatoria:

- `Ollama local pode ser usado sem mandar dados para a internet, mas o app nao baixa modelos nem liga servicos pesados sem sua confirmacao.`
- `Se voce ja roda Ollama na sua maquina ou no seu servidor, basta conectar o endpoint.`
- `Se preferir, o workspace pode gerar um servico Ollama opcional no Docker Compose. Ele fica desligado ate voce ativar.`

## QRD-19 — Auth, convites e membership

**Q — Question**

Quando o workspace deixa de ser solo/local, qual e o minimo aceitavel de autenticacao, convite e aceite de papeis? O app pode continuar com principal local simples, ou precisa de auth real antes de permitir multiplos membros?

**R — Reasoning/Research**

Benchmark aplicado:

- GitHub Organizations separa convite para organizacao, membership e teams. Owners convidam pessoas; teams agrupam membros e carregam permissoes em cascata.
- GitLab separa membros diretos, grupos, papeis e acesso herdado. Um membro pode entrar diretamente em projeto/grupo ou herdar acesso por grupo.
- Grafana separa autenticacao, organizacoes, teams e roles. Algumas integracoes sincronizam membership/roles, mas o produto continua resolvendo permissoes internas.
- Keycloak representa o padrao self-hosted robusto para identidade: OIDC/OAuth2/SAML, identity brokering e mapeamento de atributos/grupos.

Conclusao: login responde "quem e esta pessoa"; membership responde "em qual workspace ela participa"; role assignment/authority responde "o que ela pode fazer"; teams/groups respondem "o que ela herda". Misturar essas camadas gera brecha de seguranca e torna a auditoria falsa.

Tambem nao e correto exigir GitHub/OIDC para todo mundo. O framework precisa funcionar localmente e self-hosted com baixo custo, mas deve deixar visivel quando a identidade e fraca.

**D — Decision**

O app deve modelar tres camadas separadas:

1. `account/principal`: identidade que consegue entrar no app.
2. `membership`: vinculo entre principal e workspace/organizacao.
3. `role-assignment/authority`: responsabilidade ou poder dentro do workspace.

Regras por workspace mode:

- `local`: pode usar `local-principal` sem auth forte; serve para solo e sandbox. A UI deve marcar como `local-only`.
- `shared`: exige pelo menos `local-auth` com usuarios reais, convite, aceite explicito de membership e aceite explicito de papeis atribuidos a outra pessoa.
- `controlled`: exige `local-auth` endurecido ou identity provider externo; OIDC/SAML recomendado.
- GitHub, GitLab, Bitbucket e OIDC sao identity providers, nao fontes automaticas de autoridade governada.
- todo papel atribuido a outra pessoa inicia como `proposed`;
- papel so vira efetivo quando o sujeito aceita, ou quando vem de team/group com fonte e policy explicitas;
- service accounts nao aceitam papel; precisam de owner humano, escopo e TTL;
- quem pode convidar ou atribuir papel e governado por authority propria: `membership-manager`, `workspace-admin`, `security-admin` ou equivalente;
- convites locais entram antes de email/cloud: token/codigo local, status `pending`, expiracao e revogacao;
- email, SCIM e sincronizacao de grupos externos entram como adapters, nao como requisito do primeiro release funcional.

Impacto no fluxo:

1. Criar identidade local ou entrar por provider.
2. Criar/selecionar workspace.
3. Escolher modo de identidade:
   - `solo/local nesta maquina`;
   - `time com login local`;
   - `conectar GitHub/Google/OIDC`.
4. Convidar pessoas ou pular com rebaixamento visivel.
5. Atribuir papeis como propostas.
6. Mostrar pendencias de aceite.
7. Liberar acoes sensiveis somente quando authority estiver efetiva, ou quando o profile permitir auto-declaracao/break-glass visivel.

## QRD-20 — Primeiros identity providers externos

**Q — Question**

Quais identity providers externos entram primeiro no app: GitHub, Google/Gmail, OIDC generico, GitLab, Bitbucket ou nenhum cloud?

**R — Reasoning/Research**

GitHub e o primeiro provider natural para uma ferramenta de governanca de software: identifica devs, reduz atrito para times que ja usam GitHub e prepara caminho para integracao futura com repos. Mas login GitHub nao pode ser confundido com integracao GitHub App, nem com authority governada.

Google tambem precisa entrar cedo, mas como **Google / Google Workspace**, nao como "Gmail". Conta pessoal Gmail e conta corporativa Google Workspace tem implicacoes diferentes de controle, dominio e auditoria. A UI deve usar linguagem de Google Sign-In / Google Workspace e deixar dominio restrito como opcao de workspace.

OIDC generico e o caminho tecnico para empresas e self-hosted serio: Keycloak, Authentik, Zitadel, Okta, Microsoft Entra ID, Google Workspace via OIDC e outros IdPs compativeis. Ele deve existir no modo avancado/controlled, mas nao deve aparecer como primeira pergunta para usuarios comuns.

GitLab e Bitbucket sao importantes, mas podem entrar primeiro como **work-source/integracao de repos** antes de identity provider, se o escopo precisar ser reduzido. Autenticacao e conexao de repos permanecem fluxos separados.

**D — Decision**

O primeiro release funcional deve suportar:

- `local-auth`: minimo para workspace `shared`;
- `github-oauth`: primeiro provider externo dev-friendly;
- `google-oidc`: provider externo para usuarios nao-dev, founders, produto, design, clientes e Google Workspace;
- `oidc`: provider avancado generico para `controlled` e self-hosted serio.

Regras:

- a UI mostra "Entrar com Google", nao "Entrar com Gmail";
- em contexto corporativo, a UI deve permitir restringir por dominio Google Workspace;
- GitHub login identifica a pessoa, mas nao conecta repos automaticamente;
- GitHub App / GitHub repo access e outro adapter/fluxo;
- Google login identifica a pessoa, mas nao autoriza acesso a Drive/Gmail/Calendar por default;
- OIDC generico exige issuer URL, client id, client secret, scopes, redirect URL e mapeamento de claims;
- IdP externo nao cria authority governada automaticamente: membership, convite, aceite e role assignment continuam sendo resolvidos pelo app;
- GitLab/Bitbucket identity providers ficam como candidatos posteriores, salvo se uma jornada de usuario exigir antes.

Labels de UI:

- `Continuar localmente`;
- `Entrar com GitHub`;
- `Entrar com Google`;
- `Conectar provedor corporativo (OIDC)`;
- `Configurar depois`.

## QRD-21 — Distribuicao fisica do governance host

**Q — Question**

Quais distribuicoes fisicas do governance host o primeiro release deve suportar, e em que situacoes cada uma e adequada?

**R — Reasoning/Research**

O governance host nao deve ser escolhido pelo tamanho da organizacao. A decisao correta depende de ownership, permissoes, lifecycle, blast radius, colaboracao e auditoria.

Uma empresa grande com repo monolitico pode usar host embutido se o monolito for o centro real do trabalho e se `.governance-host/` tiver protecao adequada. Um dev solo tambem pode usar host embutido para experimentar no proprio repo. O mesmo formato fisico pode ser valido em escalas diferentes.

O que muda e o fit:

- quantos repos serao governados;
- quem pode escrever no host;
- se quem escreve codigo tambem pode escrever governanca;
- se governanca precisa de PR/CI/review proprio;
- se o host acompanha o lifecycle de um repo ou tem lifecycle proprio;
- se o repo atual e monolito central ou apenas um repo entre muitos;
- se o workspace precisa backup/auditoria compartilhados.

**D — Decision**

O primeiro release deve suportar **tres distribuicoes fisicas**, todas de primeira classe:

| Distribuicao          | Caminho                                            | Adequada quando                                                                                                           | Riscos/alertas                                                                                         |
| --------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Host embutido         | `repo/.governance-host/`                           | repo unico, monolito central, dev solo em repo existente, ou organizacao cujo repo central ja concentra permissoes/review | precisa CODEOWNERS/review/CI para `.governance-host/`; pode misturar lifecycle de produto e governanca |
| Host em pasta local   | `workspace-slug-governance/` sem Git obrigatorio   | sandbox, avaliacao, projeto pessoal, ambiente sem Git remoto, primeira experiencia local                                  | colaboracao, backup e auditoria sao fracos; deve aparecer como local/sandbox ou rebaixado              |
| Host em repo dedicado | `workspace-slug-governance/` como repo Git proprio | varios repos, varios times, SoD, lifecycle proprio de governanca, PR/CI/review dedicados                                  | mais friccao inicial; exige Git/provedor ou repo local versionado                                      |

O app deve perguntar pelo cenario antes de mostrar a topologia tecnica:

1. `Voce quer governar este repo, varios repos ou apenas experimentar?`
2. `As pessoas que alteram codigo tambem podem alterar governanca?`
3. `A governanca precisa de PR, CI ou revisao propria?`
4. `Este repo e o centro real do trabalho, como um monolito?`
5. `Voce quer que decisoes de governanca vivam junto do codigo ou em espaco proprio?`

Recomendacoes derivadas:

- repo unico/monolito + mesmas permissoes + lifecycle junto -> host embutido;
- experimento local/sandbox -> pasta local;
- varios repos/times/SoD/lifecycle proprio -> repo dedicado;
- caso ambiguo -> mostrar comparacao e deixar a pessoa escolher, registrando a razao.

Fit-check obrigatorio antes de concluir onboarding real:

- caminho existe ou pode ser criado;
- app tem permissao de escrita;
- host tem manifesto inicial;
- event-log inicial foi criado;
- `sourceRevision` inicial foi calculada;
- host e relido com sucesso;
- modo de distribuicao e razao escolhida ficam persistidos;
- para host embutido em repo Git: detectar se ha CODEOWNERS/review para `.governance-host/` ou marcar risco visivel;
- para pasta local sem Git: marcar colaboracao/auditoria como rebaixadas;
- para repo dedicado: validar que o repo/diretorio e distinto das fontes governadas, salvo decisao explicita.

## QRD-22 — Fontes sem Git e pastas sincronizadas

**Q — Question**

Uma fonte de trabalho sem Git deve poder entrar como fonte real rebaixada, ou deve ficar apenas como rascunho/sandbox? Como tratar pastas locais sincronizadas com Google Drive, OneDrive, Dropbox ou similares?

**R — Reasoning/Research**

O framework e file-first, mas nao deve ser git-only. Trabalho real tambem vive em Figma, Google Drive, SharePoint/OneDrive, Dropbox, Box, Notion, Confluence, planilhas, BI exports, backlogs e pastas locais.

Benchmark aplicado:

- Google Drive tem version history, revisions API e Drive audit logs em Google Workspace, mas revisions podem ter limites e, em Docs/Sheets/Slides, mudancas podem ser mescladas pela API. Historico existe, mas nao e equivalente a Git.
- Figma tem version history e API para listar versoes de arquivo; e uma fonte versionada adequada para design, desde que o app capture file key/version id/export hash.
- SharePoint/OneDrive tem version history e controles de retencao por organizacao/site/biblioteca; com Microsoft Graph pode fornecer evidencias mais fortes que uma pasta local simples.
- Dropbox e Box oferecem version history, mas retencao e acesso a API dependem de plano/configuracao.
- Notion e Confluence tem historico de pagina/conteudo, mas a granularidade e o acesso por API variam; sao bons para contexto/decisao, menos para provar execucao tecnica.

Conclusao: "tem historico" nao significa "tem evidencia governavel equivalente a Git". O modelo deve separar fonte, historico, identidade, retencao, revision id, audit log e capacidade de provar.

**D — Decision**

Fonte sem Git deve ser permitida no primeiro release como **fonte real rebaixada**, com nivel de confianca explicito.

Tipos iniciais:

- `local-folder`;
- `cloud-synced-folder`;
- `manual-upload`;
- `external-link`;
- `provider-versioned-source`;
- `provider-audited-source`.

Exemplos de providers:

- Google Drive / Google Workspace;
- Figma;
- SharePoint / OneDrive;
- Dropbox;
- Box;
- Notion;
- Confluence;
- spreadsheet/csv;
- BI export;
- backlog export.

Niveis de confianca:

| Trust level             | Quando usar                                                                          | Pode provar                                                           |
| ----------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `snapshot-only`         | pasta local comum ou pasta sincronizada sem API                                      | estado local por hash no momento da leitura                           |
| `cloud-sync-unverified` | pasta local dentro de Google Drive/OneDrive/Dropbox detectada, mas sem API conectada | que o app leu arquivos locais; nao prova revision remota/autoria/sync |
| `provider-versioned`    | API do provider conectada com revision/version id e metadados                        | versao do provider, timestamp, owner/last modifier quando disponivel  |
| `provider-audited`      | provider com audit logs/identity suficientes                                         | eventos auditaveis do provider, sujeito a plano/permissao/retencao    |
| `declared`              | upload/link/manual sem prova independente                                            | declaracao humana                                                     |
| `untrusted`             | validacao falhou                                                                     | nada; apenas alerta                                                   |

Regras:

- fonte sem Git pode alimentar planejamento, contexto, intake, discovery e evidencia manual;
- fonte sem Git nao pode sozinha provar execucao de codigo, contrato de API, release ou mudanca em repo;
- pasta local sincronizada com Drive/OneDrive/Dropbox sem API e `cloud-synced-folder`, nao provider-versioned;
- Google Drive API ou Microsoft Graph podem elevar a fonte para `provider-versioned`;
- Workspace/Admin audit logs podem elevar para `provider-audited`, quando disponiveis e autorizados;
- se a fonte alimentar matcher, o payload precisa carregar `sourceTrust`;
- se a fonte alimentar outcome/target, precisa de attester, janela e revision/export hash quando possivel;
- dashboard deve mostrar o nivel de confianca e o que ele nao prova;
- o app deve sugerir upgrade: conectar API, anexar export hash, definir periodicidade, versionar em Git, ou promover para provider-audited.

Copy obrigatoria:

- `Esta pasta parece sincronizada com Google Drive. Sem conectar o Drive, o app registra arquivos e hashes locais, mas nao prova historico, autor nem sincronizacao.`
- `Conecte o provider para usar revision id, metadados e, quando disponivel, audit logs.`
- `Fonte sem Git pode dar contexto e evidencia manual; ela nao prova mudanca de codigo ou release como um repo Git.`

## QRD-23 — Perfil compact e policy handbook

**Q — Question**

No perfil `compact`, quando ha uma mutacao sensivel sem independencia ideal, o app deve apenas avisar/revisar depois, ou deve bloquear alguma classe de acao? Como explicar essas decisoes para usuarios sem virar caixa-preta?

**R — Reasoning/Research**

`compact` existe para times pequenos que acumulam papeis e nao conseguem operar com toda a separacao de uma organizacao `full`. Se bloquear demais, o time contorna o framework. Se nao bloquear nada, governanca vira etiqueta.

A regra mais clara e separar fragilidade organizacional de falsificacao de confianca:

- fragilidade organizacional recuperavel deve seguir com aviso, rebaixamento e revisao;
- perda de auditoria, aumento de trust sem prova, reducao de seguranca e risco de vazamento devem bloquear ou exigir break-glass forte.

Tambem ficou decidido que o framework precisa de um documento de politicas explicavel por humanos e por assistentes. Um assistente local como Ollama deve conseguir responder "por que o app bloqueou/avisou?" citando uma regra versionada, nao improvisando.

**D — Decision**

`compact` e **warn/review por default**, com hard-block pequeno e bem definido.

O app nao bloqueia:

- self-attestation tecnica visivel;
- fonte manual ou rebaixada;
- acumulacao de papeis comum em time pequeno;
- excecao de processo com justificativa e revisao;
- pasta cloud sem API conectada, desde que fique `cloud-sync-unverified`.

O app bloqueia:

- apagar ou reescrever event-log;
- aumentar trust sem prova;
- reduzir classificacao/trust policy para permitir egress;
- desativar egress policy ou secret scan sem break-glass forte;
- remover ultimo admin/security-owner;
- publicar outcome no rollup sem fonte, janela e attester minimos;
- transformar declaracao em prova forte por edicao manual.

O primeiro release deve incluir um handbook versionado de politicas: [`POLICY-HANDBOOK.md`](POLICY-HANDBOOK.md).

Regras para assistente:

- pode explicar a politica aplicavel;
- pode sugerir proximo passo;
- nao pode aprovar excecao;
- nao pode reclassificar dado;
- nao pode promover trust;
- nao pode executar mutacao bloqueada.

Formato de explicacao:

1. o que aconteceu;
2. qual politica se aplica;
3. por que;
4. o que fazer agora.

## QRD-24 — Matcher e multiplos assistentes

**Q — Question**

O matcher deve nascer como um algoritmo/provedor unico, por exemplo lexical deterministico ou Ollama embeddings, ou deve permitir multiplas interacoes com provedores diferentes, com um default configuravel por workspace e override por situacao?

**R — Reasoning/Research**

A primeira formulacao, "lexical primeiro ou Ollama primeiro", estava estreita demais. O matcher e central para a adocao do framework: ele ajuda a ligar uma iniciativa a fontes, repos, contratos, owners e perguntas de triagem. Se ele for acoplado a um unico algoritmo ou assistente, a organizacao perde flexibilidade justamente no ponto em que mais precisa comparar sinais.

Benchmarks de ferramentas assistivas e plataformas de IA apontam para um padrao mais forte:

- provedores/modelos sao configurados como conexoes do workspace;
- um provider pode servir melhor para uma funcao e pior para outra;
- modelos locais, cloud e gateways OpenAI-compatible precisam de capacidades descobertas, nao assumidas;
- o usuario precisa poder trocar o provider default depois;
- sugestoes devem ser comparaveis e auditaveis, porque o assistente nao decide.

Tambem ha uma diferenca estrutural entre **matcher** e **assistente conversacional**:

- matcher produz sugestoes estruturadas para um passo de governanca;
- assistente explica, resume, ajuda a preencher e pode chamar o matcher;
- nenhum dos dois deve executar gate, reclassificar dado, promover trust ou escolher repo sem confirmacao humana.

Lexical deterministico continua importante, mas como **baseline auditavel** e fallback local, nao como a unica opcao. Ollama e importante para local-first. Claude, Codex, Gemini e outros provedores cloud podem ser uteis em contextos aprovados, mas devem ficar atras de policy/egress, classificacao, redaction e audit log.

**D — Decision**

O primeiro release deve priorizar uma arquitetura de **assistant/matcher providers multiplos**.

O workspace deve permitir:

- cadastrar varios providers;
- escolher um provider default por funcao;
- alterar o default depois;
- escolher provider diferente em uma interacao especifica;
- comparar sugestoes de mais de um provider quando fizer sentido;
- aceitar/rejeitar sugestoes explicitamente;
- auditar provider, modelo, prompt policy, input classification, redaction, sourceRevision, score, unknowns e escolha humana.

Funcoes configuraveis inicialmente:

```text
assistant-functions:
  explain-policy
  summarize-context
  suggest-triage-questions
  suggest-matches
  classify-source
  draft-register
  draft-decision
```

Providers iniciais:

```text
matcher-provider:
  lexical-deterministic

assistant-provider:
  ollama
  openai-compatible
  cloud-approved
```

Presets reconhecidos:

```text
local:
  ollama
  lm-studio
  jan
  gpt4all
  localai
  llama-cpp
  vllm

gateway:
  litellm
  openai-compatible

cloud-approved:
  claude
  codex
  gemini
  openai-compatible-cloud
```

Regras:

- `lexical-deterministic` e o baseline obrigatorio para matcher, porque e explicavel, rapido e local;
- `ollama` e o preset recomendado para assistencia local, mas nao e obrigatorio;
- `openai-compatible` cobre runtimes locais, gateways internos e provedores compativeis;
- `cloud-approved` exige policy de egress, allowlist, classificacao maxima permitida, redaction e aprovacao quando o perfil exigir;
- nenhum provider pode ser tratado como capaz sem `capability-probe`;
- um provider pode estar conectado e ainda ser `limited` para uma funcao especifica;
- a UI deve explicar "por que este provider pode ou nao pode ser usado nesta situacao";
- a decisao humana sempre vence a sugestao;
- sugestao aceita, rejeitada ou ignorada vira auditoria.

Formato minimo de uma sugestao de matcher:

```yaml
suggestion:
  provider: lexical-deterministic
  model: n/a
  function: suggest-matches
  input-classification: internal
  source-revision: sha256:...
  candidates:
    - ref: repo:acme-checkout
      score: 0.74
      evidence:
        - capability: checkout-flow
        - contract: acme-user-context
      unknowns:
        - stale capability: last verified > 30 days
  decision:
    status: accepted | rejected | ignored | overridden
    decided-by: principal:...
    reason: ...
```

Copy obrigatoria:

- `Voce pode comparar sugestoes de mais de um assistente. O app registra qual sugestao foi usada, rejeitada ou sobrescrita.`
- `O assistente sugere; a decisao continua humana e auditavel.`
- `Este provider nao pode receber este contexto pela politica atual. Escolha outro provider, reduza o contexto ou peca aprovacao.`
- `Lexical deterministico e o baseline local e explicavel; modelos de IA podem complementar, mas nao substituem a validacao humana.`

## QRD-25 — Planejamento com contexto opcional progressivo

**Q — Question**

No primeiro release, a tela de planejamento deve começar apenas com `objective + metric-definition + target`, ou deve disponibilizar tambem `thesis`, `opportunity-area` e `allocation`?

**R — Reasoning/Research**

Se o fluxo inicial exigir todos os conceitos do business-tier, o produto vira um sistema pesado de OKR/portfolio antes da pessoa enxergar valor. Um usuario novo precisa conseguir responder primeiro: "o que quero melhorar, como vou medir e qual alvo vale para este periodo?".

Mas esconder `thesis`, `opportunity-area` e `allocation` ate um release futuro tambem seria um erro. Esses conceitos foram introduzidos para representar o planejamento real que existe antes da iniciativa nascer. Se eles nao estiverem disponiveis desde a release 1, o app incentiva um planejamento raso e depois exige migracao conceitual.

A solucao e separar **minimo para concluir o ciclo guiado** de **capacidade disponivel no modelo e na UI**:

- o caminho guiado pede so o minimo necessario para criar um ciclo utilizavel;
- as opcoes de contexto aparecem como secoes progressivas, nao como campos obrigatorios;
- modo avancado mostra tudo desde o inicio;
- dashboards e registros devem preservar os campos opcionais quando preenchidos.

**D — Decision**

O primeiro release deve disponibilizar todas as pecas de planejamento, com UX progressiva.

Minimo obrigatorio para criar um ciclo utilizavel:

```text
period
business-objective
metric-definition
target
owner/definer
```

Disponivel desde a release 1, mas opcional no caminho guiado:

```text
thesis
opportunity-area
allocation
```

Regras:

- `thesis`, `opportunity-area` e `allocation` nao ficam para release futura;
- a pessoa iniciante pode concluir o planejamento sem preencher esses campos;
- a UI deve explicar o valor de cada campo opcional em linguagem simples;
- modo avancado permite criar/editar todos os campos de primeira;
- os campos opcionais devem aparecer nas telas de detalhe, dashboards e auditoria quando existirem;
- um intent pode nascer de objective/target sem thesis, mas o app deve mostrar que a causalidade esta incompleta;
- allocation ausente significa "nao declarado", nao "sem limite";
- `thesis` nao entra em rollup numerico; ela explica causalidade e deve ser revisavel;
- `opportunity-area` agrupa oportunidades, mas nao substitui target;
- `allocation` deve ser tratada como decisao governada quando afetar capacidade/budget.

Copy obrigatoria:

- `Voce pode criar o ciclo com objetivo, metrica e meta. Se quiser, adicione a tese, a area de oportunidade e a alocacao agora ou depois.`
- `A tese explica por que acreditamos que este objetivo pode mover a metrica. Ela ajuda a revisar aprendizado depois.`
- `A alocacao mostra quanto de capacidade ou budget foi reservado; deixar em branco significa nao declarado.`

## QRD-26 — Primeira integracao cloud e backlog visivel

**Q — Question**

Qual deve ser a primeira integracao cloud real alem de autenticacao, e como o app deve mostrar as outras integracoes de alto valor sem fingir que ja estao implementadas?

**R — Reasoning/Research**

`github-oauth` e `github` como fonte de trabalho sao coisas diferentes. Login responde "quem e a pessoa". Work-source responde "quais repos, PRs, commits, checks, CODEOWNERS e arquivos de governanca podem alimentar o grafo".

Para o framework, a primeira integracao cloud deve provar valor no coracao do modelo: conectar o grafo a fontes de trabalho reais, extrair contexto/capabilities/ownership/evidencia e publicar `sourceTrust` mais forte que uma pasta local ou entrada manual.

Por esse criterio, GitHub como work-source/repo provider e a melhor primeira integracao cloud. Google Drive, Jira/Linear, observabilidade, analytics, SonarCloud/SonarQube, Backstage e feature flags sao relevantes, mas entram melhor como backlog priorizado por ponto do fluxo.

O catalogo versionado de integracoes ja existe em [`../integration-catalog.yml`](../integration-catalog.yml). A decisao correta e projetar esse catalogo no app, com status honesto:

- disponivel agora;
- release 1;
- em breve;
- adiado por risco.

**D — Decision**

Primeira integracao cloud alem de auth: **GitHub como work-source/repo provider**.

Escopo da release 1:

- listar organizacoes/repos autorizados;
- selecionar repos para governanca;
- ler default branch;
- ler commits;
- ler pull requests;
- ler checks/status;
- ler CODEOWNERS;
- ler arquivos `.governance/`;
- publicar `sourceTrust: provider-versioned`;
- manter login GitHub separado de GitHub work-source;
- nunca criar authority automaticamente a partir do login;
- nunca escrever estado autoritativo sem comando governado.

O app tambem deve projetar o backlog de integracoes por ponto do fluxo:

| Ponto                 | Integracoes de maior valor                                                      |
| --------------------- | ------------------------------------------------------------------------------- |
| Fontes de trabalho    | GitHub, GitLab, Bitbucket, Gitea, CODEOWNERS, service catalog                   |
| Assistente/matcher    | Ollama, OpenAI-compatible, LiteLLM, Onyx/Open WebUI, Claude Code, Codex CLI     |
| Planejamento/outcomes | BigQuery, Snowflake, dbt, PostHog, Amplitude, cloud billing, Prometheus/Grafana |
| Execucao              | CI, JUnit/coverage/Playwright, SonarQube, Semgrep, CodeQL, deploy/release       |
| Contratos             | OpenAPI, GraphQL, protobuf, AsyncAPI, Pact                                      |
| Incidentes/operação   | OpenTelemetry, Prometheus, Grafana, PagerDuty, Opsgenie, incident.io            |
| Intake/backlog        | Jira, Linear, Azure DevOps, GitHub Issues                                       |
| Grafo                 | Neo4j, Graphistry, custom graph API                                             |

Copy obrigatoria:

- `Primeira integracao cloud da release 1: GitHub como fonte de trabalho. Login GitHub e conexao de repos sao configuracoes separadas.`
- `Integracoes disponiveis em breve: GitLab, Bitbucket, OpenAPI/GraphQL, Jira/Linear, BigQuery/dbt, PostHog/Amplitude, PagerDuty, SonarQube/Semgrep e Backstage.`
- `Em breve significa backlog priorizado, nao mecanismo ativo. O app deve dizer o que ja funciona sem cada integracao.`

## Proximas acoes derivadas

1. Atualizar o onboarding para refletir QRD-08/09/21: workspace pode existir sem host, mas onboarding real nao conclui sem host ou sandbox explicito; os tres formatos de host entram no primeiro release com fit-check.
2. Atualizar Pessoas/Papeis para QRD-10/11/19: account, principal, membership, role assignment, authority, subjects tipados, groups/teams, access-policy, invite token, aceite e revogacao.
3. Atualizar onboarding/configuracoes para separar `governance-profile` de `workspace-mode` e de adapters concretos.
4. Atualizar onboarding para ter caminho padrao guiado e caminho avancado, conforme QRD-15.
5. Incluir `graph-read-model: neo4j` como opcao real do primeiro release no onboarding avancado, com health check, rebuild, sourceRevision e stale fail-closed.
6. Incluir `execution-mode: docker-compose` como stack oficial gerada para shared/controlled, com servicos opcionais conforme adapters escolhidos.
7. Tratar assistentes como providers configuraveis por funcao; Ollama fica externo por default e Compose profile opcional, sem baixar modelo ou acionar endpoint nao-loopback sem consentimento/policy.
8. Implementar identity providers do primeiro release como fluxos separados de authority e repos: `local-auth`, `github-oauth`, `google-oidc` e `oidc` avancado.
9. Implementar fontes sem Git como fontes reais rebaixadas, com `sourceTrust`, deteccao de pasta sincronizada e adapters/version ids para providers suportados.
10. Implementar policy handbook como fonte explicativa para UI e assistente; toda decisao de block/warn/downgrade precisa apontar para uma politica versionada.
11. Implementar matcher como orquestrador de sugestoes multi-provider: baseline lexical deterministico obrigatorio, providers de IA configuraveis por funcao, default alteravel e auditoria de sugestao aceita/rejeitada/sobrescrita.
12. Implementar planning como contexto opcional progressivo: minimo obrigatorio objective+metric+target, com thesis/opportunity-area/allocation disponiveis desde a release 1.
13. Implementar GitHub como primeira cloud work-source/repo provider, separado de `github-oauth`, com sourceTrust e leitura de repos/PRs/checks/CODEOWNERS.
14. Projetar o backlog de integracoes do `integration-catalog.yml` na UI, com status `disponivel`, `release 1`, `em breve` e `adiado`.
15. Garantir que novas telas sigam QRD-12/13/14/15/16/17/18/19/20/21/22/23/24/25/26: app como superficie humana local-first, sem segundo SSOT, sem presumir SaaS pago, sem amarrar postura de workspace a vendor, sem expor banco/Docker como primeira pergunta do usuario comum, com Neo4j como read-model opcional suportado, Docker Compose como opcao oficial nao universal, Ollama externo por default, auth/membership/authority separados, providers externos GitHub/Google/OIDC sem authority automatica, governance host distribuido por fit-check, fontes sem Git com confianca explicita, politica explicavel, matcher/assistente multi-provider, planning progressivo com todos os campos disponiveis e backlog de integracoes visivel.
16. Criar `governance-demo/mock-api/` com Hono + lowdb.
17. Criar seeds iniciais: workspace vazio, onboarding parcial, acme demo, workspace sem host, workspace com host local, workspace com host embutido, workspace local, workspace shared, workspace controlled, workspace controlled+neo4j, workspace docker-compose, workspace docker-compose+ollama-profile, workspace com groups/teams, workspace shared com convites pendentes, workspace shared+github, workspace shared+google, workspace controlled+oidc, workspace com cloud-synced-folder, workspace com provider-versioned-source, workspace compact com policy examples, workspace com multiplos assistant providers, workspace com planning progressivo completo e workspace com GitHub work-source conectado.
18. Adicionar scripts:

- `dev:real`;
- `dev:mock`;
- `test:e2e`;
- `mock-api:dev`;
- `mock-api:reset`.

19. Adicionar Playwright e primeira jornada e2e.
20. Adicionar MSW apenas quando houver primeiros testes de componente/hook.
