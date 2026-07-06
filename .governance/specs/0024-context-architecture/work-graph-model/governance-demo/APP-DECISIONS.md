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

## QRD-27 - Stack de visualizacao do app

**Q - Question**

Quais bibliotecas de frontend devem sustentar mapas de governanca, grafo
tecnico, dashboards, tabelas e server state sem criar uma UI tecnica demais
para stakeholders nem escolher algo que sera trocado depois?

**R - Reasoning/Research**

O app tem duas superficies visuais diferentes.

Para stakeholders, lideres e owners, o principal nao e "ver todos os nos". E
entender o caminho de uma decisao ate evidencia, risco, contrato, resultado e
proximo passo. Essa superficie precisa de nos ricos, copy de produto, estados de
confianca, filtros por ciclo/objetivo/time e interacao guiada. React Flow e mais
adequado para isso porque e um renderer React para node-based UIs; seus exemplos
oficiais ja cobrem integracao com motores de layout como ELK e Dagre. ELK deve
ser o layout principal para mapas mais complexos; Dagre fica como alternativa
barata para fluxos hierarquicos simples.

Para auditoria/admin/dev, existe uma segunda superficie: o grafo tecnico. Ali
importa explorar vizinhanca, shortest path, impacto de contrato, dependencias e
densidade com muitos nos. Sigma.js, Reagraph e Apache ECharts devem ser
comparados em spike porque atacam esse espaco por caminhos diferentes:

- Sigma.js tem vocacao mais graph-oriented/large-graph e combina bem com
  Graphology.
- Reagraph e mais React-first e visualmente proximo de uma experiencia de
  produto para network graphs 2D/3D.
- Apache ECharts tem uma serie `graph` amigavel e pode ser interessante quando
  o console tecnico precisa ficar mais perto de dashboards e menos de uma tela
  de engenharia.

A decisao nao deve ser tomada por preferencia estetica isolada; deve ser tomada
com o read-model real e um fixture sintetico maior. ECharts entra no spike, mas
nao substitui automaticamente React Flow como superficie principal: mapas de
governanca continuam sendo fluxos ricos guiados, nao apenas grafos renderizados.

Dashboards e tabelas nao devem ser fechados por inercia do ecossistema MUI. MUI
continua sendo o design system do app, mas a biblioteca de visualizacao precisa
ser provada por superficie:

- dashboards precisam comparar MUI X Charts e Apache ECharts;
- tabelas precisam comparar MUI X Data Grid, TanStack Table e AG Grid Community;
- grafo tecnico precisa comparar Sigma.js, Reagraph e Apache ECharts;
- mapas de governanca continuam com React Flow + ELK como candidato principal,
  mas o spike deve provar que ele entrega a experiencia guiada melhor que uma
  visualizacao de grafo/chart generica.

TanStack Query entra como candidato padrao para server state, cache, mutations e
invalidacao quando as telas sairem do modo read-only. Ele nao e biblioteca de
visualizacao, entao fica fora dos spikes de renderer, mas precisa ser validado
na arquitetura de dados do app.

Referencias publicas usadas nesta decisao:

- React Flow / ELK layout: https://reactflow.dev/examples/layout/elkjs
- React Flow / Dagre layout: https://reactflow.dev/examples/layout/dagre
- Sigma.js: https://www.sigmajs.org/
- Reagraph: https://reagraph.dev/
- Apache ECharts graph example: https://echarts.apache.org/examples/en/editor.html?c=graph
- Apache ECharts graph/data note: https://apache.github.io/echarts-handbook/en/concepts/dataset/
- MUI X Charts: https://mui.com/x/react-charts/
- MUI X Data Grid: https://mui.com/x/react-data-grid/
- TanStack Query: https://tanstack.com/query/latest

**D - Decision**

Decisao estrutural:

- o app tera uma camada de view-model independente de renderer:
  `GovernanceMapViewModel`, `GovernanceDashboardViewModel` e
  `GovernanceTableViewModel`;
- nenhuma biblioteca visual pode ler YAML/event-log diretamente ou virar SSOT;
- toda acao governada continua relendo fonte autoritativa e `sourceRevision`;
- Cytoscape esta banido do produto e dos spikes. Ele nao deve entrar como
  dependencia, fallback, prototipo ou sugestao de implementacao. So pode
  reaparecer por nova decisao explicita da owner em QRD proprio.

Spikes obrigatorios antes de cravar a stack final:

### 1. Mapas de governanca

- `@xyflow/react` (React Flow) + `elkjs`;
- Apache ECharts `graph` como comparativo leve apenas se conseguir representar
  fluxos guiados sem parecer grafo tecnico.

Criterios especificos:

1. representar decisao -> evidencia -> contrato -> outcome -> dashboard;
2. suportar nos ricos com copy, status, risco, evidencia e CTA;
3. suportar layout automatico estavel e legivel em desktop;
4. permitir fallback textual/lista para acessibilidade;
5. funcionar em Next/React sem hydration warning;
6. manter linguagem visual de produto, nao de console tecnico.

### 2. Dashboards

- `@mui/x-charts`;
- Apache ECharts.

Criterios especificos:

1. linhas, barras, area, stacked, gauge/scorecard, funil e comparativos de ciclo;
2. drill-down de objective -> target -> outcome -> fonte;
3. estados de confianca visiveis: valido, pendente, sem evidencia,
   auto-declarado, break-glass, stale;
4. tema compativel com MUI;
5. boa responsividade;
6. performance com series maiores;
7. boa experiencia de tooltip/legenda/filtro;
8. TypeScript aceitavel e sem adapter fragil;
9. licenciamento compativel com open-source/self-hosted.

### 3. Tabelas e data grids

- `@mui/x-data-grid`;
- `@tanstack/react-table`;
- `ag-grid-community`.

Criterios especificos:

1. sorting, filtering, pagination, column visibility, density e row selection;
2. linhas com status de confianca, risco e proximo passo;
3. filtros persistiveis por usuario/workspace;
4. acessibilidade minima;
5. virtualizacao ou performance aceitavel em listas grandes;
6. integracao visual com MUI sem CSS frágil;
7. TypeScript forte para colunas e rows;
8. licenciamento compativel com open-source/self-hosted, sem depender de feature
   paga para o caminho principal.

### 4. Grafo tecnico/console

- `sigma` + `graphology`;
- `reagraph`;
- `echarts` ou wrapper React equivalente para Apache ECharts.

Criterios especificos:

1. renderizar o read-model real da acme e um fixture sintetico maior;
2. suportar filtros por tipo, owner/time, ciclo, confianca, status, contrato e
   fonte;
3. suportar selecao de no, vizinhanca, shortest path, contract-impact e
   intent-deps;
4. manter performance aceitavel com milhares de nos/arestas;
5. permitir tema compativel com MUI sem visual tecnico cru;
6. funcionar em Next/React sem hydration warning;
7. ter TypeScript aceitavel e sem adapter fragil;
8. preservar acessibilidade minima e fallback textual/lista;
9. nao virar SSOT: toda acao continua relendo YAML/event-log/sourceRevision;
10. responder se ECharts e suficiente para grafo tecnico amigavel ou se deve
    ficar restrito a dashboards/visualizacoes auxiliares;
11. gerar recomendacao documentada: Sigma.js, Reagraph, ECharts ou nenhum deles.

### 5. Server state

- `@tanstack/react-query` como candidato padrao.

Criterios especificos:

1. cache por workspace/sourceRevision;
2. invalidacao apos mutation;
3. tratamento claro de stale/read-model derivado;
4. suporte a optimistic UI apenas quando a mutacao tiver rollback honesto;
5. bom encaixe com Next App Router e Server Components.

Regras de produto:

- React Flow e a experiencia principal. O grafo tecnico nunca substitui Home,
  onboarding, planejamento nem dashboards.
- Cytoscape nao entra no produto, no roadmap nem nos spikes.
- AntV G6 fica como benchmark secundario: so entra se o spike
  Sigma/Reagraph/ECharts falhar ou se surgir uma necessidade clara de engine de
  graph-analysis mais completa.
- As escolhas finais so podem ser registradas depois de prototipos comparaveis
  com o mesmo dataset, os mesmos filtros e o mesmo criterio visual.

Copy obrigatoria:

- `Mapa de governanca: mostra o caminho de uma decisao ate resultado, com riscos e evidencias.`
- `Grafo tecnico: exploracao avancada para auditoria e diagnostico; nao e necessario para operar o dia a dia.`
- `Dashboards mostram resultados derivados; a acao governada sempre rele a fonte autoritativa.`

## QRD-28 - Resultado dos spikes da stack visual

> **Status:** parcialmente RECONCILIADO por [QRD-29](#qrd-29---reconciliacao-pos-validacao-da-owner)
> apos validacao de produto da owner na bancada. Mantido como historico da rodada 1.

**Q - Question**

Os spikes obrigatorios do QRD-27 foram executados com o mesmo dataset, os mesmos
filtros e o mesmo criterio visual. O que a evidencia sustenta cravar agora?

**R - Reasoning/Research**

Spike implementado em `frontend/app/spikes/visual-stack/` (rota interna
`/spikes/visual-stack`, fora da navegacao de produto), com camada de view-model
independente de renderer (`GovernanceMapViewModel`, `GovernanceDashboardViewModel`,
`GovernanceTableViewModel`, `GovernanceGraphViewModel`), read-model REAL da acme
(174 nos · 374 arestas · rev 03296990bfcd) e fixture sintetica tipada/seedada
(~1k/~3k nos; 2k/10k linhas). Evidencia completa, medidas e fontes oficiais em
[`../_reviews/2026-07-04-visual-stack-spike.md`](../_reviews/2026-07-04-visual-stack-spike.md).

Resumo do que foi observado:

- React Flow + ELK entregou nos ricos (copy, confianca, risco, evidencia, CTA)
  com layout automatico estavel e sem hydration warning; ECharts no mesmo
  view-model continuou parecendo grafo tecnico (sem no rico/CTA).
- MUI X Charts (Community/MIT) cobriu linha/area/stacked/gauge/drill com tema
  MUI nativo; ECharts cobriu o mesmo com tooltip/perf superiores, mas exige
  wrapper/tema manual; heatmap/funnel/sankey/treemap do MUI X sao Pro (pagos).
- MUI X Data Grid Community cobriu sorting/filtro/paginacao/colunas/densidade/
  selecao/pills com 10k linhas; limite honesto: pagina maxima de 100 linhas no
  Community. AG Grid Community tem virtualizacao melhor, mas columns tool panel/
  row grouping/pivot/Excel sao Enterprise; TanStack Table e headless e caro de
  manter para grid denso.
- Sigma.js + Graphology segurou 3.000 nos/5.153 arestas (ForceAtlas2 405ms main
  thread; acme real 17ms) com realce fino de vizinhanca/caminho; Reagraph exige
  ssr:false + three.js no bundle e assenta mais lento; ECharts force congela a
  main thread com 3k nos em layout sincrono e so fica usavel com layoutAnimation.
  Achado de SSR: sigma tambem NAO sobrevive a SSR (WebGL2RenderingContext no
  import) e entra via dynamic(ssr:false).
- TanStack Query provou cache por [workspace, recurso, filtros], stale visivel,
  invalidation pos-mutation e fail-closed real: dry-run com base-revision atual
  retornou 200 ok; com revisao forjada retornou 422 `command-stale`.
- Cytoscape nao foi instalado nem citado; AntV G6 nao foi acionado porque o
  spike primario nao falhou.

**D - Decision**

Com base na evidencia do spike:

| Superficie            | Decisao                                                                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mapas de governanca   | `@xyflow/react` (React Flow) + `elkjs` (ELK). ECharts descartado para esta superficie.                                                                                        |
| Dashboards            | `@mui/x-charts` (Community) como PRIMARIO; `echarts` aprovado como complemento quando a necessidade cair no tier Pro do MUI (funil/heatmap/sankey) ou em series muito longas. |
| Tabelas/data grids    | `@mui/x-data-grid` (Community). AG Grid e TanStack Table ficam como alternativas documentadas, nao padrao.                                                                    |
| Grafo tecnico/console | `sigma` + `graphology`. ECharts fica restrito a dashboards/visualizacoes auxiliares; Reagraph descartado.                                                                     |
| Server state          | `@tanstack/react-query` quando as telas sairem do read-only.                                                                                                                  |

Regras que continuam valendo:

- view-models independentes de renderer sao obrigatorios; lib visual nao le
  YAML/event-log e nao vira SSOT; acao governada rele fonte/sourceRevision;
- sigma e reagraph so entram via dynamic(ssr:false); ELK deve migrar para web
  worker se os mapas crescerem;
- se listas operacionais exigirem scroll infinito real (>100 linhas por pagina),
  a decisao de tabela precisa ser revisitada em novo QRD (Pro ou AG Grid);
- Cytoscape permanece banido (QRD-27).

Ponto deliberadamente NAO cravado: exclusividade de uma unica lib de graficos
para dashboards. A regra e Community-first (MUI X Charts) com ECharts aprovado
como complemento; consolidar em uma so exige evidencia futura de uso real.

## QRD-29 - Reconciliacao pos-validacao da owner

**Q - Question**

A owner navegou na bancada `/spikes/visual-stack` e trouxe validacao real de
produto que contradiz parte do QRD-28. O que a evidencia combinada (spike
rodada 1 + percepcao da owner + spike rodada 2) sustenta agora?

**R - Reasoning/Research**

Percepcoes da owner (fonte primaria de UX de produto):

- mapa: React Flow+ELK mais adequado para nao tecnicos, mas faltavam tooltips,
  filtros, busca/foco e visualizacoes otimizadas; ECharts pode existir como aba
  relacional opcional, nao como mapa principal;
- dashboards: Apache ECharts pareceu muito melhor que MUI X Charts;
- tabelas: TanStack Table pareceu muito melhor (renderizado com MUI);
- grafo tecnico: Reagraph rejeitado; Sigma e ECharts agradaram, mas falta
  seguranca sobre filtros e funcionalidades avancadas;
- server state: TanStack Query aprovado; documentar que e o React Query atual.

Rodada 2 do spike (mesma bancada, mesmos view-models) adicionou o que faltava
para decidir com seguranca: no mapa, tooltips/popovers, filtros por
tipo/confianca/risco/time/contrato, busca com autocomplete, foco de vizinhanca,
painel lateral de detalhe e legenda; nos dashboards, target vs actual, outcomes
por ciclo (valido x invalido), confianca empilhada, breakdown por objetivo e
filtro/drill nos DOIS candidatos; nas tabelas, coluna de evidencia, filtros
reais por coluna no TanStack (100% MUI), e acao governada simulada por dry-run
(read-model real passa; fixture falha fechado por command-stale); no grafo,
Reagraph removido da bancada e do package.json, busca por no, agrupamento por
tipo (clusters deterministicos identicos nos dois candidatos) e fixture ~6k;
no server state, copy explicita e queryKey visivel.

A rodada 1 permanece valida como evidencia tecnica (licencas, SSR, medidas);
o que muda e o peso da validacao de produto da owner sobre UX.

**D - Decision**

| Superficie            | Estado apos QRD-29                                                                                                                                                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mapas de governanca   | DECIDIDO: React Flow + ELK e o PRIMARIO. ECharts graph vira aba relacional OPCIONAL (secundaria), nunca o mapa principal.                                                                                                                                                          |
| Dashboards            | PROVAVEL PRIMARIO: Apache ECharts (validacao da owner + Apache-2.0 sem tier pago). Confirmar na primeira tela real de resultados antes de cravar. MUI X Charts vira alternativa.                                                                                                   |
| Tabelas/data grids    | PROVAVEL PRIMARIO: TanStack Table renderizado com MUI (headless != UI inconsistente; provado na bancada). Confirmar virtualizacao (`@tanstack/react-virtual`) em lista real. MUI X Data Grid e AG Grid ficam como alternativas documentadas.                                       |
| Grafo tecnico/console | Reagraph REJEITADO e removido. Sigma.js+Graphology x ECharts graph = PENDENTE DE DECISAO: evidencia atual indica Sigma para console denso (WebGL, reducers, 3-6k nos) e ECharts para visualizacao amigavel coerente com dashboards; a owner decide com os filtros avancados novos. |
| Server state          | DECIDIDO: TanStack Query (`@tanstack/react-query` v5 — e o React Query atual, renomeado). Escopo: server state (cache, fetching, mutations, invalidation, stale). NAO substitui banco, Context API, Zustand/Redux nem o SSOT file-first.                                           |

Regras que continuam valendo (QRD-27/28): view-models independentes de
renderer; lib visual nao le YAML/event-log nem vira SSOT; acao governada rele
fonte/sourceRevision (provado por dry-run na bancada); sigma via
dynamic(ssr:false); ELK para web worker se o mapa crescer; pagina >100 linhas
revisita a decisao de tabela; Cytoscape permanece banido.

Proxima recomendacao para as telas reais:

1. `/results` (primeira tela de dashboards reais) com Apache ECharts +
   TanStack Query — e o teste de confirmacao do "provavel primario".
2. Primeira lista operacional real (ex.: pendencias/intents) com TanStack
   Table + MUI + `@tanstack/react-virtual` — confirma o segundo "provavel".
3. Sessao curta da owner na bancada do grafo (filtros/busca/agrupamento) para
   bater o martelo Sigma x ECharts em QRD proprio.

## QRD-30 - Fontes locais, caminhos e escopo de leitura

**Q - Question**

Como o app deve cadastrar repos, pastas locais e pastas sincronizadas sem
confundir caminho do navegador, caminho da maquina local e caminho do servidor?

**R - Reasoning/Research**

O framework e file-first e precisa servir tanto um dev solo rodando o app na
propria maquina quanto uma organizacao em modo compartilhado/controlled. Em um
browser, o app nao pode simplesmente ler qualquer pasta da maquina da pessoa; a
leitura real acontece no processo do app/backend. Portanto, um campo "caminho
local" so e honesto se a UI explicar que o caminho precisa existir onde o app
esta rodando. Em modo solo local isso normalmente coincide com a maquina da
pessoa. Em modo servidor, o caminho precisa existir no servidor ou vir de um
provider conectado.

Pasta sem Git e pasta sincronizada em nuvem continuam sendo fontes reais, mas
rebaixadas: elas ajudam a comecar e podem provar snapshot/hash, mas nao provam
autoria, historico remoto nem revisao sem Git/provider versionado. GitHub e
providers similares exigem adapter/OAuth/permissao e nunca devem aparecer como
`connected` por mera declaracao.

**D - Decision**

Criar `/sources` como tela dedicada. Ela cadastra fontes com
`/api/local/work-sources`, escaneia caminho de servidor com
`/api/local/work-sources/[id]/scan` e registra snapshot escolhido no navegador
com `/api/local/work-sources/[id]/browser-scan`. A tela mostra `sourceTrust`,
hash, Git head/dirty, provider de sync e limitacoes. A UI deve dizer
explicitamente que caminho local digitado e caminho da maquina/servidor onde o
app roda. Pasta selecionada no Explorer e snapshot do navegador: entra como
`snapshot-only`, sem Git/autoria/historico. GitHub nao e campo de texto; deve
abrir o caminho de integracao/OAuth e nunca aparecer `connected` por declaracao.

## QRD-31 - Adapters de apresentacao e libs Pro/BYOL

**Q - Question**

O framework deve permitir trocar bibliotecas visuais default por versoes Pro,
Enterprise ou renderizadores externos sem transformar isso em SaaS nem criar um
segundo SSOT?

**R - Reasoning/Research**

Os defaults open-source precisam ser bons o suficiente para a release 1:
Apache ECharts para dashboards, TanStack Table + MUI para listas, React
Flow+ELK para mapa guiado e Sigma/ECharts ainda em decisao para grafo tecnico.
Ao mesmo tempo, organizacoes podem ja ter licencas MUI X Pro, AG Grid
Enterprise, servicos de exportacao ou ferramentas MCP/cloud para render. Isso
e extensibilidade de apresentacao, nao governanca.

Se um renderer puder ler YAML/event-log direto ou escrever estado autoritativo,
ele vira bypass do modelo. O contrato correto e sempre:
`governance read-model -> view-model tipado -> presentation adapter`.

**D - Decision**

Modelar esses upgrades como `presentation adapters`, separados dos governance
adapters. Exemplos: `chart-renderer`, `table-renderer`, `map-renderer`,
`technical-graph-renderer`, `chart-export-provider` e
`assistant-visualization-provider`. Nenhum deles escreve YAML/event-log, nenhum
decide gate, nenhum altera resolver. ECharts MCP e ferramentas similares podem
inspirar ou alimentar preview/export assistivo, mas nao substituem `/results`
deterministico nem os view-models tipados.

## QRD-32 - Cup/CWP como par contextual de trabalho

**Q - Question**

O app deve ter um assistente transversal em overlay, disponivel em quase todas
as telas, que ajude a pessoa usuaria a operar o framework, interpretar o grafo,
configurar fontes/integracoes e rascunhar proximos passos sem virar autoridade
ou segundo SSOT?

**R - Reasoning/Research**

O framework tem um modelo rico: workspace, governance host, fontes de trabalho,
grafo de negocio, grafo de execucao, contratos, outcomes, policies, authority,
egress e read-models derivados. Esse poder tambem cria uma barreira de
adocao. Uma pessoa nova nao deve precisar entender `GlobalRef`, event-log,
sourceRevision, matcher, trust policy ou rollup para dar o proximo passo
correto.

Ao mesmo tempo, um "chat que sabe tudo e faz tudo" quebraria os principios do
framework:

- assistente e matcher sao canais assistivos, nao decisores (QRD-24);
- policy e egress limitam contexto e provider;
- autoridade efetiva e resolvida, nao presumida pelo login;
- read-model derivado nao autoriza mutacao sem base/source revision atual;
- qualquer acao que altera governanca precisa passar por comando, resolver,
  confirmacao humana e trilha auditavel.

A solucao correta e um **Contextual Work Partner**: uma camada de coautoria e
explicacao que entende a tela atual, o foco do usuario, o workspace ativo e as
permissoes efetivas, mas recebe apenas um contexto reduzido por policy.

Naming:

- **Cup** e o nome de produto. Faz a brincadeira de "chamar um colega para uma
  xicara de cafe/cha e trabalhar junto".
- **CWP** (`contextual-work-partner`) e o nome tecnico de dominio/codigo.

Cup nao e um novo provider de IA. Cup e a experiencia transversal que pode usar
providers ja modelados (`assistant-ollama`, `assistant-openai-compatible`,
`cloud-approved`, lexical baseline, matcher provider) conforme policy,
classificacao e funcao.

Modelo mental:

```text
pagina atual
+ usuario
+ workspace
+ foco atual
+ permissao efetiva
+ classificacao dos dados
        ↓
CWP Context Resolver
        ↓
Policy + Egress Resolver
        ↓
Specialist Router
        ↓
Assistant Provider / Matcher / Lexical fallback
        ↓
Resposta, explicacao, sugestao ou rascunho
        ↓
Confirmacao humana se virar mutacao
        ↓
Audit log da interacao
```

Cup deve aparecer em tres formas:

1. **Launcher global:** botao discreto persistente que abre painel lateral.
2. **Hints inline:** pontos da tela que dizem "Cup pode ajudar com isto".
3. **Modo de coautoria:** em formularios longos, Cup ajuda a rascunhar,
   revisar lacunas e preparar dry-run.

Cup muda de especialista por contexto:

| Superficie      | Especialista CWP      | Ajuda principal                                                                  |
| --------------- | --------------------- | -------------------------------------------------------------------------------- |
| Signup          | `adoption-guide`      | conta local, demo, workspace, diferenca entre login e authority                  |
| Organizations   | `workspace-guide`     | criar workspace, anexar demo, entender local/shared/controlled                   |
| Onboarding      | `setup-guide`         | perfil, papeis, governance host, fontes, assistente, integracoes                 |
| Sources         | `source-guide`        | pasta local, Git, cloud sync, GitHub, `.governance`, `.governance-host`, trust   |
| Settings        | `configuration-guide` | coerencia com onboarding, policy, defaults, roles, providers                     |
| Planning        | `planning-guide`      | objetivos, metricas, targets, allocation e contexto progressivo                  |
| Intake/Register | `initiative-guide`    | problema, hipotese, aposta, riscos, lacunas e possiveis fontes                   |
| Triage          | `triage-guide`        | perguntas, matcher, repos, contratos, unknowns e sugestoes comparaveis           |
| Gates           | `decision-guide`      | autoridade, evidencia, risco, aceitar/rejeitar/promover sem falsificar confianca |
| Work/Contracts  | `execution-guide`     | repo-work, dependencias, contracts, compatibility window, contention             |
| Results         | `results-guide`       | outcomes, rollup, self-attested, stale, fonte, unidade e dashboard               |
| Operations      | `operations-guide`    | incidentes, follow-ups, SLO, toil e trabalho operacional                         |
| Audit/Policy    | `policy-guide`        | por que bloqueou/avisou/rebaixou e qual regra se aplica                          |
| Integrations    | `integration-guide`   | provider, egress, capabilities, health, probe, backlog                           |
| Map/Graph       | `graph-guide`         | explicar relacoes, caminhos, impacto, vizinhanca e leitura do mapa               |

Contrato minimo de contexto:

```ts
type CwpPageContext = {
  route: string;
  workspaceId: string;
  actorId: string;
  surface:
    | "signup"
    | "organizations"
    | "onboarding"
    | "home"
    | "settings"
    | "sources"
    | "planning"
    | "intake"
    | "triage"
    | "gates"
    | "work"
    | "contracts"
    | "results"
    | "operations"
    | "audit"
    | "integrations"
    | "map"
    | "console";
  focusedRefs: string[];
  visibleDataClasses: Array<"public" | "internal" | "restricted">;
  allowedActions: string[];
  blockedActions: Array<{ action: string; policyRef: string; reason: string }>;
  sourceRevision?: string;
  baseRevision?: string;
};
```

Cup pode:

- explicar a tela e a politica aplicavel;
- resumir contexto visivel;
- sugerir proximo passo;
- comparar opcoes;
- rascunhar texto;
- apontar lacunas;
- preparar dry-run de comando;
- chamar matcher ou provider de assistente quando policy permitir;
- registrar sugestao aceita/rejeitada/sobrescrita quando influenciar decisao.

Cup nao pode:

- aprovar gate;
- alterar authority;
- reduzir classificacao;
- ignorar egress;
- promover trust;
- marcar provider/fonte como conectado sem mecanismo;
- salvar mutacao autoritativa sem confirmacao humana;
- enviar contexto `restricted` a provider nao autorizado;
- usar read-model stale para executar acao.

**D - Decision**

Adotar **Cup** como nome de produto e **CWP** como nome tecnico do overlay
contextual.

Cup entra como feature estrutural do app, nao como widget posterior. Ele deve
ser implementado em fases, para validar valor de produto sem abrir superficie
de seguranca cedo demais:

| Fase | Nome                   | O que entrega                                                                  | Pode comecar antes da validacao tela-a-tela? |
| ---- | ---------------------- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| C0   | Overlay shell          | launcher global, painel lateral, estado aberto/fechado, copy estatica por rota | SIM                                          |
| C1   | Context resolver local | cada rota publica `CwpPageContext`; painel mostra contexto visivel permitido   | SIM                                          |
| C2   | Policy explainer       | explica bloqueio/aviso/rebaixamento citando `POLICY-HANDBOOK.md`               | SIM                                          |
| C3   | Specialist router      | muda modo por superficie (`source-guide`, `setup-guide`, etc.)                 | SIM, em modo deterministico                  |
| C4   | Provider assistivo     | usa Ollama/OpenAI-compatible/cloud-approved via policy/egress                  | DEPOIS de C0-C3 e configuracao de provider   |
| C5   | Draft actions          | prepara rascunho/dry-run de comando; humano confirma                           | DEPOIS de resolver/baseRevision/audit        |
| C6   | Audit de coautoria     | registra sugestao aceita/rejeitada/sobrescrita e impacto na decisao            | JUNTO de C5                                  |

As fases C0-C3 podem iniciar **antes** da validacao visual completa das telas,
porque ajudam justamente a mapear onde a pessoa se perde. Elas devem nascer sem
provider externo obrigatorio e sem capacidade de mutacao. C4-C6 dependem de
policy, egress, provider health/capability probe, baseRevision/sourceRevision e
audit log.

Regras de implementacao:

- `cwp` deve ser bounded context proprio, nao misturado a `assistant` nem a
  `matcher`;
- `assistant` e `matcher` sao providers/capabilities que Cup pode chamar;
- Cup sempre usa contexto reduzido por `context-resolver` + `policy-resolver`;
- Cup nunca le YAML/event-log direto do frontend;
- Cup nunca substitui uma tela; ele ajuda a operar a tela;
- toda rota de produto deve declarar oportunidades de Cup no
  `APP-ITERATION-MAP.md` durante a validacao visual.

## QRD-33 - Hub de integracoes e sugestoes contextuais por fluxo

**Q - Question**

Como as integracoes entram no app de forma compreensivel e segura? Deve existir
uma rota dedicada de integracoes, sugestoes por pagina/feature, explicacao de
vantagens/desvantagens e uma matriz de quem pode solicitar, aprovar ou ativar
cada tipo de integracao?

**R - Reasoning/Research**

O framework ja tem tres pecas importantes:

- catalogo versionado (`integration-catalog.yml` + `integration-catalog.md`);
- APIs locais parciais (`/api/local/integration-backlog` e
  `/api/local/integrations/[id]`);
- adapters executaveis locais para algumas classes (`assistant-ollama`,
  `git-local`, `ci-local`, `code-quality`, `observability`).

Mas isso ainda nao forma uma experiencia de produto. Hoje uma pessoa precisa
inferir demais: quais integracoes ajudam em qual tela, quais sao reais, quais
sao futuras, quem pode ativar, que permissao sera pedida, que dado sai da
maquina, qual e o risco e o que o framework ja faz sem aquela ferramenta.

Dois erros precisam ser evitados:

1. **Esconder tudo em Settings.** Isso transforma integracoes em configuracao
   tecnica tardia e perde o momento em que a pessoa entende o valor.
2. **Espalhar integracoes sem hub.** Isso cria cards soltos por telas, sem
   governanca, sem status central e sem explicacao de permissao/risco.

A solucao e dupla:

- uma rota central `/integrations`, como inventario governado de providers,
  status, permissoes, riscos, valor e owner;
- sugestoes contextuais por pagina/feature, mostrando a integracao certa no
  momento em que ela melhora o fluxo.

Exemplo:

- em `/sources`, GitHub/GitLab/Bitbucket/Drive aparecem como formas de elevar
  `sourceTrust`;
- em `/results`, observabilidade, analytics, BI e feature flags aparecem como
  fontes de actual/outcome;
- em `/work`, CI/test reports/code quality aparecem como evidencia de execucao;
- em `/triage`, service catalog, CODEOWNERS, Backstage e matcher/assistant
  aparecem como contexto para roteamento;
- em `/intake`, Jira/Linear/Azure DevOps/GitHub Issues aparecem como importers
  com contrato de SSOT/direcao de sync.

A UX precisa ensinar a regra central:

```text
O framework funciona sem integracoes externas.
Integracoes aumentam evidencia, contexto, automacao e confianca.
Nenhuma integracao substitui o SSOT file-first nem concede authority sozinha.
```

**D - Decision**

Criar uma rota dedicada **`/integrations`** e manter sugestoes contextuais por
pagina.

### Estrutura da rota `/integrations`

`/integrations` deve ter:

1. **Resumo de postura do workspace**
   - workspace-mode (`local`, `shared`, `controlled`);
   - perfil de governanca;
   - quem pode aprovar egress/security;
   - quais providers ja estao conectados, limitados ou bloqueados.

2. **Filtros humanos**
   - `Todos`;
   - `Disponivel agora`;
   - `Release 1`;
   - `Em breve`;
   - `Adiado`;
   - `Requer aprovacao`;
   - `Local / sem egress`;
   - `Cloud / egress`;
   - `Escreve estado?`;
   - `Somente evidencia/projecao`.

3. **Agrupamento por ponto de valor**
   - Fontes de trabalho;
   - Identidade e membros;
   - Assistente e matcher;
   - Catalogo tecnico;
   - Qualidade e CI;
   - Resultados e metricas;
   - Backlog/intake;
   - Release/deploy;
   - Export/visualizacao;
   - Bancos/read-models.

4. **Cards com contrato fixo**

Cada card de integracao deve mostrar:

| Campo                          | Obrigatorio | Por que importa                                              |
| ------------------------------ | ----------- | ------------------------------------------------------------ |
| `O que o framework ja entrega` | sim         | evita vender integracao como requisito                       |
| `O que melhora`                | sim         | explica valor concreto                                       |
| `Dados acessados`              | sim         | mostra superficie de privacidade                             |
| `Permissoes exigidas`          | sim         | prepara OAuth/App/token/arquivo                              |
| `Quem pode solicitar`          | sim         | separa uso comum de admin                                    |
| `Quem aprova/ativa`            | sim         | explicita authority/security                                 |
| `Riscos/limitacoes`            | sim         | evita "connected" enganoso                                   |
| `Como falha`                   | sim         | fail-closed/fail-visible                                     |
| `Como testar`                  | sim         | health/probe/smoke                                           |
| `Como desativar`               | sim         | reversibilidade operacional                                  |
| `Status`                       | sim         | `disponivel`, `release-1`, `em-breve`, `adiado`, `bloqueado` |
| `Escreve estado autoritativo?` | sim         | por default deve ser `nao`; excecao exige contrato explicito |

### Status de integracao

| Status         | Significado para a pessoa usuaria                                                  |
| -------------- | ---------------------------------------------------------------------------------- |
| `disponivel`   | existe mecanismo executavel e testavel no app/backend                              |
| `configuravel` | pode ser configurada, mas ainda precisa de health/probe/permissao para ficar ativa |
| `limited`      | conectada, mas sem capability suficiente para uma funcao                           |
| `release-1`    | compromisso de primeira release; ainda pode estar em implementacao                 |
| `em-breve`     | backlog priorizado; nao ha mecanismo ativo                                         |
| `adiado`       | conhecido, mas fora do caminho padrao ou risk-gated                                |
| `bloqueado`    | policy/egress/authority impede ativacao naquele workspace                          |
| `desativado`   | foi configurada antes, mas esta desligada ou revogada                              |

### Sugestoes contextuais

As telas nao devem empurrar todas as integracoes. Devem sugerir poucas, no
momento certo, com copy curta:

| Tela/feature     | Sugestoes principais                                                          | Copy esperada                                                                                   |
| ---------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `/signup`        | GitHub OAuth, Google, OIDC                                                    | "Login identifica voce; authority ainda depende do workspace."                                  |
| `/organizations` | GitHub OAuth, OIDC                                                            | "Conectar identidade ajuda convites, mas nao conecta repos automaticamente."                    |
| `/onboarding`    | GitHub work-source, assistant local, identity provider, Neo4j, Docker Compose | "Escolha agora ou deixe para depois; o app mostra o que fica manual."                           |
| `/sources`       | GitHub/GitLab/Bitbucket/Gitea, Drive/SharePoint, CODEOWNERS, service catalog  | "Conectar provider eleva confianca de fonte; pasta local continua valida com trust menor."      |
| `/settings`      | todas relevantes ao workspace                                                 | "Gerencie o que esta conectado, limitado, bloqueado ou em breve."                               |
| `/planning`      | analytics, BI, dbt, warehouse, product analytics                              | "Sem fonte automatica, target e actual podem ser definidos, mas medicao fica manual/rebaixada." |
| `/intake`        | Jira, Linear, Azure DevOps, GitHub Issues, knowledge base                     | "Importar backlog nao torna backlog externo o SSOT sem contrato de sync."                       |
| `/triage`        | matcher providers, CODEOWNERS, Backstage/OpsLevel/Cortex, embeddings          | "Sugestoes ajudam; decisao humana continua auditavel."                                          |
| `/work`          | CI, test reports, code coverage, code quality, code security                  | "CI/testes viram evidencia independente para repo-work."                                        |
| `/contracts`     | OpenAPI, GraphQL, protobuf/AsyncAPI, service catalog                          | "Schemas ajudam a detectar drift; contrato governado continua no modelo."                       |
| `/results`       | observability, analytics, BI, feature flags, experiment platform              | "Sem fonte verificavel, resultado pode existir como declaracao, mas nao sobe como prova forte." |
| `/operations`    | observability, incident management, deploy/release evidence, feature flags    | "Incidente e rollout precisam de eventos verificaveis para evitar texto bem-formado."           |
| `/audit`         | identity/directory, SIEM/export, storage/audit log                            | "Auditoria melhora com identidade e logs externos, mas event-log file-first permanece."         |
| `/map`           | Neo4j read-model, service catalog, graph export                               | "Read-model de grafo melhora exploracao; nao vira SSOT."                                        |
| Cup/CWP          | assistant providers, knowledge assistant, policy handbook, matcher            | "Cup usa provider permitido pela policy; se egress bloquear, explica e cai para modo local."    |

### Matriz de autoridade

| Tipo de integracao                         | Quem pode solicitar                                  | Quem aprova/ativa                                                      | Observacao                                                   |
| ------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| Interesse/backlog futuro                   | qualquer `member`                                    | nao ativa mecanismo                                                    | vira interesse/backlog, nao conexao                          |
| Local sem egress e baixo risco             | `workspace-admin`, `technical-owner`, `source-owner` | `workspace-admin` ou self-governed no solo                             | deve falhar visivel se health/probe falhar                   |
| Fonte de trabalho/repo                     | `workspace-admin`, `source-owner`, `technical-owner` | `source-owner`/`technical-owner`; `security-owner` se controlled/cloud | nao concede authority automaticamente                        |
| Assistente local loopback                  | `workspace-admin`                                    | `workspace-admin`; `security-owner` se policy exigir                   | prompt inocuo no teste inicial; sem contexto por default     |
| Assistente remoto/cloud                    | `workspace-admin`                                    | `security-owner` obrigatorio; sponsor se dado sensivel/controlled      | exige egress, allowlist, redaction e classificacao maxima    |
| Identity provider / SSO                    | `workspace-admin`, `sponsor`                         | `sponsor` + `security-owner`                                           | login nao e membership nem authority                         |
| Backlog importer                           | `workspace-admin`, `product-owner`, `sponsor`        | `sponsor` ou `workspace-admin` + contrato de sync                      | direcao de sync e campo autoritativo sao obrigatorios        |
| Observabilidade/analytics/BI               | `technical-owner`, `metric-owner`, `attester`        | `metric-owner` + `security-owner` se cloud                             | define fonte de actual/outcome; attestation continua exigida |
| CI/code quality/security                   | `technical-owner`, `source-owner`                    | `technical-owner`; `security-owner` se codigo privado sai do ambiente  | evidencia alimenta repo-work; nao decide gate sozinho        |
| Deploy/release/incident                    | `technical-owner`, `operations-owner`                | `operations-owner` + `security-owner` se cloud                         | eventos de rollout/incident precisam ser verificaveis        |
| Presentation adapter Pro/BYOL              | `workspace-admin`, `technical-owner`                 | `workspace-admin`; `cost-owner` se houver custo                        | troca renderer, nao view-model/dominio                       |
| Integracao que escreve estado autoritativo | `sponsor` ou `workspace-admin`                       | `sponsor` + `security-owner` + contrato explicito                      | excecao; precisa adapter-contract, audit e rollback          |

No perfil `solo`, a mesma pessoa pode acumular solicitacao e aprovacao, mas o
app deve marcar como `self-governed`/`auto-declarado` quando isso afetar
independencia.

### Regras de produto

- `/integrations` e o lugar central para conectar, testar, desativar e entender
  integracoes.
- Settings pode resumir integracoes, mas nao deve ser o unico lugar.
- Cada tela relevante deve ter sugestoes contextuais curtas e nao invasivas.
- Integracao cloud nunca fica `connected` sem mecanismo real de auth/permissao.
- Login GitHub/Google/OIDC nao conecta repos, Drive nem authority
  automaticamente.
- Provider conectado pode ficar `limited` se nao passar capability probe para a
  funcao desejada.
- Cup pode explicar integracoes e sugerir a proxima acao, mas nao ativa
  provider nem aprova egress sozinho.
- "Em breve" significa backlog priorizado, nao promessa de mecanismo ativo.
- Toda integracao deve declarar se le, escreve, exporta, importa, projeta ou
  apenas sugere.
- O app deve mostrar "o que funciona sem esta integracao" antes de pedir
  permissao.

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
14. Projetar o backlog de integracoes do `integration-catalog.yml` na UI, com status `disponivel`, `configuravel`, `limited`, `release 1`, `em breve`, `adiado`, `bloqueado` e `desativado`.
15. Criar `/integrations` como hub dedicado e adicionar sugestoes contextuais por tela/feature, conforme QRD-33.
16. Garantir que novas telas sigam QRD-12/13/14/15/16/17/18/19/20/21/22/23/24/25/26/27/32/33: app como superficie humana local-first, sem segundo SSOT, sem presumir SaaS pago, sem amarrar postura de workspace a vendor, sem expor banco/Docker como primeira pergunta do usuario comum, com Neo4j como read-model opcional suportado, Docker Compose como opcao oficial nao universal, Ollama externo por default, auth/membership/authority separados, providers externos GitHub/Google/OIDC sem authority automatica, governance host distribuido por fit-check, fontes sem Git com confianca explicita, politica explicavel, matcher/assistente multi-provider, planning progressivo com todos os campos disponiveis, backlog de integracoes visivel, stack visual definida, Cup/CWP como overlay contextual governado e integracoes com hub dedicado + sugestoes contextuais.
17. ~~Executar os spikes da stack visual antes de cravar dependencias finais~~ — FEITO em 2026-07-04 (rodadas 1 e 2): spikes executados em `frontend/app/spikes/visual-stack/` com read-model real + fixture sintetica e validacao da owner; estado vigente em QRD-29 (QRD-28 e historico da rodada 1); evidencia em `../_reviews/2026-07-04-visual-stack-spike.md`. Pendencias honestas: confirmar ECharts em `/results` real, confirmar TanStack Table+virtualizacao em lista real e decidir Sigma x ECharts no console com a owner. Cytoscape permanece banido.
18. Criar `governance-demo/mock-api/` com Hono + lowdb.
19. Criar seeds iniciais: workspace vazio, onboarding parcial, acme demo, workspace sem host, workspace com host local, workspace com host embutido, workspace local, workspace shared, workspace controlled, workspace controlled+neo4j, workspace docker-compose, workspace docker-compose+ollama-profile, workspace com groups/teams, workspace shared com convites pendentes, workspace shared+github, workspace shared+google, workspace controlled+oidc, workspace com cloud-synced-folder, workspace com provider-versioned-source, workspace compact com policy examples, workspace com multiplos assistant providers, workspace com planning progressivo completo e workspace com GitHub work-source conectado.
20. Adicionar scripts:

- `dev:real`;
- `dev:mock`;
- `test:e2e`;
- `mock-api:dev`;
- `mock-api:reset`.

21. Adicionar Playwright e primeira jornada e2e.
22. Adicionar MSW apenas quando houver primeiros testes de componente/hook.
23. Implementar Cup/CWP em fases C0-C3 antes da validacao tela-a-tela completa: overlay shell, context resolver local, policy explainer e specialist router deterministico. C4-C6 ficam atras de provider/policy/audit.

---

# QRD-34 - Desenvolvimento orientado por contratos de teste

**Q - Question**

Como mudar o paradigma da `governance-demo` para que cada tela, fluxo e feature
seja guiado por testes robustos antes da implementacao, inclusive quando o app
ainda nao entrega o comportamento desejado?

**R - Reasoning/Research**

O app esta em uma fase em que navegacao manual revela problemas reais de UX, mas
nao escala como mecanismo de governanca. Se cada iteracao depender da owner
abrir a tela e perceber divergencias, o produto continuara vulneravel a drift:

- onboarding salva parcialmente, mas pode reabrir no passo errado;
- Settings e onboarding podem mostrar estados diferentes;
- Sources pode cadastrar algo que Home nao reconhece;
- Integrations pode mostrar provider como conectado sem permissao/probe;
- Cup pode explicar uma coisa que a policy nao sustenta.

O framework defende que trabalho governado precisa de evidencia independente. A
propria aplicacao precisa seguir a mesma regra: funcionalidade nao deve ser
considerada pronta porque "parece funcionar" na tela; ela precisa passar por
contrato automatizado.

A pratica adequada aqui e uma combinacao de:

- **ATDD/BDD leve**: escrever comportamento esperado antes da implementacao;
- **testing trophy**: investir bastante em testes de integracao e E2E de
  comportamento, nao apenas unitarios;
- **Playwright como motor de jornadas**: bom para fluxos entre telas, trace, UI
  mode, reports e annotations;
- **mock-api seedada**: permite testar estados que ainda seriam caros de montar
  manualmente;
- **contrato YAML versionado**: torna o backlog de testes legivel para humanos,
  nao apenas para o runner;
- **fixme/expected-fail governado**: permite registrar o produto-alvo antes de
  implementar, sem esconder pendencias.

Um teste pulado sem contrato e divida invisivel. Um teste `fixme` com ID,
motivo, seed e criterio observavel e backlog executavel.

**D - Decision**

Adotar desenvolvimento orientado por contratos de teste para a `governance-demo`.

### Artefatos canonicos

1. [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md)
   - estrategia, camadas, ferramentas, estados de contrato, seeds, seletores e
     relatorios;
2. [`test/contracts/app-contracts.yml`](test/contracts/app-contracts.yml)
   - inventario governado dos comportamentos esperados;
3. specs Playwright em `test/journeys/*.spec.ts`
   - prova executavel ou backlog `fixme`;
4. [`APP-ITERATION-MAP.md`](APP-ITERATION-MAP.md)
   - status humano de iteracao, validacao visual e teste por tela.

### Stack inicial

| Necessidade                      | Escolha inicial                               |
| -------------------------------- | --------------------------------------------- |
| E2E e fluxos entre telas         | Playwright                                    |
| Relatorio inicial                | Playwright HTML + JSON + JUnit                |
| Backlog executavel               | `test.fixme` / `test.fail`                    |
| Estado controlado de app         | `mock-api` seedada                            |
| Dominio/use-cases                | Vitest futuro                                 |
| Componentes/hooks                | Testing Library + MSW futuro                  |
| Gestao visual/historico avancado | Allure futuro                                 |
| Dashboard pesado/self-hosted     | ReportPortal futuro, somente se houver escala |

### Regras

- Toda nova tela/fluxo deve nascer com contrato em YAML e teste Playwright.
- Se a implementacao ainda nao existe, o teste nasce `fixme`.
- Se a tela existe mas esta errada, preferir `expected-fail` para provar o gap.
- `skip` so pode representar configuracao nao aplicavel, nunca bug conhecido.
- Fluxos entre telas sao obrigatorios para dados que aparecem em mais de um
  lugar.
- Textos e design podem mudar; testes devem mirar comportamento, persistencia e
  efeitos observaveis.
- Se uma mudanca funcional quebra contrato, primeiro atualizar a decisao/contrato
  e so depois a implementacao.

### Suite alvo inicial

A suite alvo fica registrada em
[`test/contracts/app-contracts.yml`](test/contracts/app-contracts.yml) e nos
specs Playwright por dominio em `test/journeys/`:

- `auth-workspace.spec.ts`: conta, workspaces, logout, demo/sandbox e Home inicial;
- `onboarding.spec.ts`: perfil, responsabilidades, retomada, revisao final;
- `settings.spec.ts`: organizacao, pessoas, grupos, papeis e assistente;
- `sources.spec.ts`: governance host e fontes de trabalho;
- `integrations.spec.ts`: hub, detalhes, sugestoes contextuais e GitHub work-source;
- `cup.spec.ts`: overlay, policy explainer, draft action e limites de contexto;
- `planning-intake.spec.ts`: planejamento progressivo e registro de iniciativa;
- `triage-gate.spec.ts`: triagem, matcher advisory, gate e ativacao;
- `work-contracts.spec.ts`: repo-work, evidencia, contratos e contention;
- `results-audit.spec.ts`: resultados, mapa, operacao, auditoria e console;
- `cross-screen-consistency.spec.ts`: dados que precisam aparecer coerentes entre telas;
- `security-authority.spec.ts`: egress, stale read-model e authority.

### Criterio de pronto

Uma tela/fluxo deixa de ser "demo" quando:

1. tem contrato YAML;
2. tem teste executavel ativo;
3. passa em Playwright contra seed relevante;
4. prova reload/persistencia quando aplicavel;
5. prova consistencia com outras telas quando o dado cruza superficies;
6. atualiza `APP-ITERATION-MAP.md`.

# QRD-35 - Navegacao global, menu e subitens

> **Status:** DECIDIDO em 2026-07-06.

**Q - Question**

Como deve funcionar a navegacao global da governance-demo: barra superior,
sidebar, menu lateral, abas por area, itens e subitens, acesso ao console
tecnico, acesso ao Cup/CWP e variacao por perfil/authority?

**R - Reasoning/Research**

A navegacao ainda nao foi decidida como contrato de produto. Isso afeta todas as
telas depois de `/signup` e `/organizations`, porque a pessoa precisa entender:

- onde esta no fluxo de adocao;
- o que e configuracao inicial versus uso continuo;
- quais areas sao de trabalho humano (`Home`, `Sources`, `Planning`, `Results`,
  `Map`, `Work`) versus areas administrativas (`Settings`, `Integrations`,
  `Audit`) versus area tecnica (`Console`);
- se subitens aparecem sempre, por contexto, por autoridade ou por maturidade do
  workspace;
- como navegar em mobile/desktop sem transformar o app em console tecnico;
- onde Cup/CWP aparece como overlay transversal sem competir com a navegacao;
- como esconder ou rebaixar itens ainda indisponiveis sem criar falsa promessa.

Sem essa decisao, APP-02 pode ate funcionar tecnicamente, mas a Home do workspace
novo nao tera uma hierarquia clara para guiar proximos passos. A navegacao tambem
afeta testes e contratos: cada rota precisa ter um caminho humano observavel, e
o menu precisa respeitar authority sem usar permissao como mera decoracao visual.

**D - Decision**

A governance-demo usa navegacao global com **topbar + sidebar esquerda** no
desktop e **topbar + drawer** no mobile. Abas nao sao navegacao primaria; podem
existir apenas dentro de uma superficie especifica.

Topbar:

- workspace switcher;
- busca/command palette futura;
- launcher persistente do Cup/CWP;
- menu do usuario com logout;
- acesso ao console tecnico como entrada avancada, separada do fluxo principal.

Sidebar de primeiro nivel:

1. `Inicio`;
2. `Configurar`;
3. `Planejar`;
4. `Executar`;
5. `Acompanhar`;
6. `Auditar`;
7. `Avancado`.

Subitens iniciais:

- `Configurar`: onboarding, configuracoes, fontes de trabalho, integracoes;
- `Planejar`: ciclo, iniciativas, triagem, gates;
- `Executar`: trabalho, contratos;
- `Acompanhar`: resultados, mapa, operacoes;
- `Auditar`: auditoria;
- `Avancado`: console tecnico.

Regras:

- permissao muda a acao, nao apaga a compreensao do fluxo;
- um item pode estar `ativo`, `pendente`, `sem-host`, `sem-authority`,
  `em-breve`, `degradado` ou `oculto`;
- `oculto` e reservado para superficies sensiveis que o usuario nao deve nem
  descobrir;
- `sem-authority` bloqueia ou transforma a acao em solicitacao, mas pode manter
  leitura quando isso ajuda transparencia;
- workspace sem governance host nao vaza demo e mostra itens degradados com
  CTA para configurar/vincular host;
- Cup/CWP e overlay transversal, nao pagina primaria; ele muda o contexto por
  rota e pode explicar bloqueios, avisos e rebaixamentos;
- console tecnico e area avancada, nunca caminho obrigatorio para concluir a
  experiencia comum.

Contrato minimo APP-35:

- navegacao global existe depois de workspace selecionado;
- itens principais aparecem agrupados;
- workspace sem host mostra itens degradados e nao dados da demo;
- Cup/CWP e console tecnico aparecem como entradas distintas;
- authority altera CTA/estado, nao vira decoracao visual.
