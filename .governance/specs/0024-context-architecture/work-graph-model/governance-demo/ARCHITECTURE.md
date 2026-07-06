# Governance Demo Architecture

Status: active
Owner: work-graph-model / governance-demo
Last updated: 2026-07-05

## 1. Objetivo

Este documento explica a arquitetura da `governance-demo` para humanos e
agentes de IA manterem a aplicacao sem criar multiplas SSOTs.

A demo combina quatro ideias:

1. **DDD / shared kernel** para regras puras e linguagem do dominio.
2. **Hexagonal architecture** para separar dominio, casos de uso, portas e
   adapters.
3. **Monorepo packages** para compartilhar contratos entre frontend, backend,
   mock-api e testes sem fazer cada camada importar detalhes internos de outra.
4. **File-first governance** para manter YAML/event-log como fonte autoritativa
   de governanca; bancos, grafos e dashboards sao projecoes ou adapters.

O ponto central: trocar frontend, mock-api, banco, renderer ou provider externo
nao pode trocar o modelo. O fluxo correto e sempre:

```text
arquivo/event-log autoritativo
  -> dominio puro / contratos tipados
  -> application services
  -> ports
  -> adapters
  -> view-models
  -> UI/renderers
```

## 2. Problema que esta arquitetura resolve

Sem uma fronteira compartilhada explicita, a demo tende a espalhar os mesmos
conceitos em varios lugares:

- tipos de workspace no backend;
- estados do onboarding no frontend;
- seeds da mock-api com shape proprio;
- testes com fixtures que nao passam pelo mesmo dominio;
- schemas de API duplicados em handlers e clientes.

Isso cria multiplas SSOTs. O sintoma pratico e uma tela parecer correta, mas a
mock-api aceitar outro shape, o backend persistir outro estado e o teste validar
um terceiro contrato.

## 3. Estrutura vigente

A demo agora esta organizada por packages compartilhados e bordas concretas:

```text
governance-demo/
  packages/
    domain/        # shared kernel: tipos, reducers, policies, grafo e projeções puras
    contracts/     # comandos, DTOs, schemas e erros compartilhados
    test-fixtures/ # seeds, personas e builders para mock-api/testes
  backend/       # runtime TS: application, ports, adapters e API
  frontend/      # Next/MUI, rotas, views, shell local
  mock-api/      # fake/dev API com o mesmo reducer do domínio
  test/          # Playwright/e2e
  tools/         # checks, smokes, publishers e jornadas da sim
  acme/          # org ficticia e repos adotados
```

Regra vigente: frontend, backend, mock-api, testes e tools nao importam dominio
por caminho interno do backend. O contrato comum do produto sai de
`@demo/contracts` e `@demo/test-fixtures`; funcoes puras browser-safe saem de
`@demo/domain`; validadores, digest e projeções server-only saem de
`@demo/domain/server`.

## 4. Arquitetura adotada

A estrutura adotada para a demo e:

```text
governance-demo/
  packages/
    domain/
      src/
        workspace/
        authority/
        sources/
        onboarding/
        policy/
        graph/
    contracts/
      src/
        commands/
        api/
        errors/
        schemas/
    test-fixtures/
      src/
        seeds/
        builders/
        personas/

  backend/
    src/
      application/
      ports/
      adapters/
      api/

  frontend/
    app/
    server/
    lib/

  mock-api/
    src/

  test/
  tools/
  acme/
```

### 4.1 `packages/domain`

Contem o shared kernel: tipos, value objects, invariantes e politicas puras.

Entrypoints:

- `@demo/domain`: browser-safe. Pode ser importado por frontend, mock-api,
  testes e backend quando precisar de reducers, funcoes puras ou constantes que
  nao dependem de Node.
- `@demo/domain/server`: Node-only. Pode ser importado por backend, tools e
  testes de backend quando precisar de validadores, digest, projeções repo-first
  ou build de read-model. E proibido no frontend.

Pode conter:

- `Workspace`, `Organization`, `GovernanceHost`, `WorkSource`;
- `Authority`, `RoleAssignment`, `Invite`, `Group`, `Team`;
- `SourceTrust`, `WorkspaceMode`, `AssistantProvider`;
- reducers puros e state machines;
- funcoes puras como `resolveWorkspaceAuthority`,
  `deriveSourceTrust`, `deriveAdoptionStatus`.

Nao pode conter:

- `fs`, `path`, `process`, `next/*`, `react`, `hono`, `yaml`;
- acesso a banco;
- HTTP;
- componentes visuais;
- comandos shell;
- imports de `backend/`, `frontend/`, `mock-api/`, `test/` ou `tools/`.

### 4.2 `packages/contracts`

Contem contratos de fronteira:

- command contracts (`local.workspace.create`, `local.role.assign`, etc.);
- DTOs de API;
- schemas de validacao runtime;
- `messageKey` e erros tipados;
- JSON Schema quando necessario;
- versoes de contrato.

Regra: se frontend, backend, mock-api e testes precisam concordar no shape, o
shape mora aqui, nao duplicado em cada camada.

### 4.3 `packages/test-fixtures`

Contem seeds e builders reutilizados por mock-api e testes.

Pode conter:

- seeds de workspace;
- personas;
- builders de comandos;
- fixtures de authority, sources e integrations.

Nao pode conter regra de produto nova. Fixture nao decide comportamento; ela so
monta estados para o dominio e os contratos testarem.

## 5. Dependency rule

Dependencias permitidas:

```text
packages/domain       -> nada interno da demo
packages/contracts    -> packages/domain
packages/test-fixtures-> packages/domain + packages/contracts

backend               -> packages/domain/server + packages/contracts
mock-api              -> packages/domain + packages/contracts + packages/test-fixtures
frontend              -> packages/domain + packages/contracts
test                  -> packages/domain + packages/contracts + packages/test-fixtures
tools                 -> packages/* + backend application quando for check operacional
```

Dependencias proibidas:

```text
packages/domain       -> backend/frontend/mock-api/test/tools
packages/contracts    -> backend/frontend/mock-api/test/tools
frontend              -> @demo/domain/server
frontend              -> backend/src/adapters ou backend internals
mock-api              -> frontend
backend               -> frontend
test fixtures         -> UI components
```

Regra pratica: se um import parece atravessar uma fronteira "porque e mais
facil", provavelmente esta criando segunda SSOT.

## 6. Hexagonal boundary

O backend deve ficar assim:

```text
backend/src/
  application/  # casos de uso: orquestram dominio e portas
  ports/        # interfaces: repository, event-log, graph source, providers
  adapters/     # file, git, ollama, reports, graph memory, etc.
  api/          # handlers, schemas HTTP, mapping de erro
```

Regras:

- dominio nao conhece adapter;
- application conhece portas, nao implementacoes concretas;
- adapter traduz mundo externo para contrato interno;
- API nao contem regra de negocio; ela valida request, chama use-case e mapeia
  resposta/erro.

## 7. Frontend boundary

O frontend deve consumir contratos e view-models, nao YAML/event-log cru.

```text
frontend/app/<route>/
  page.tsx
  _view/
  _components/
  _hooks/
  _locales/
  _model/
```

Regras:

- componente visual nao decide authority;
- tela nao inventa estado que o dominio nao conhece;
- copy fica colocalizada em `_locales/pt-br.json`;
- mutacao passa por command/API, nao por escrita direta;
- dados derivados chegam como view-model tipado.

## 8. Mock-api boundary

A mock-api existe para validar experiencia de produto em desenvolvimento e
teste. Ela nao e segunda implementacao de regra.

Regras:

- usa o mesmo reducer/contratos do dominio;
- seeds vem de `packages/test-fixtures`;
- pode simular IO, mas deve marcar simulacao;
- nao pode aceitar shape que o backend real rejeitaria;
- nao pode produzir authority, sourceTrust ou estado de onboarding por regra
  propria.

## 9. Tests boundary

Os testes seguem a piramide descrita em `TESTING-STRATEGY.md`:

- dominio/invariante em `node:test`;
- API in-memory na mock-api;
- rota real HTTP com Playwright `request`;
- E2E/journey com Playwright browser apenas quando o browser e necessario.

Fixtures e seeds devem vir de `packages/test-fixtures`. Teste nao deve montar
um shape alternativo que nao passaria pelos contratos.

## 10. Presentation adapters

Renderers e bibliotecas visuais sao adapters de apresentacao, nao modelo.

Exemplos:

- `chart-renderer`: Apache ECharts default; adapter Pro/cloud opcional;
- `table-renderer`: TanStack Table + MUI default; adapter Pro opcional;
- `map-renderer`: React Flow + ELK default;
- `technical-graph-renderer`: Sigma ou ECharts Graph, pendente de decisao;
- `assistant-visualization-provider`: Cup/MCP/local assistant para sugerir
  visualizacao, nunca gravar estado.

Contrato obrigatorio:

```text
read-model -> view-model tipado -> renderer adapter
```

Trocar renderer nao pode mudar:

- permissao;
- rollup;
- filtro de seguranca;
- semantica de target/outcome;
- sourceRevision;
- estado autoritativo.

## 11. Guardrails da reorganizacao

Esta arquitetura precisa permanecer mecanizada. A reorganizacao nao termina
quando os arquivos sao movidos; termina quando os checks impedem regressao.

Guardrails obrigatorios:

1. `packages/domain` nao importa `backend`, `frontend`, `mock-api`, `test` nem
   `tools`.
2. `packages/contracts` concentra schemas/DTOs/comandos compartilhados.
3. `packages/test-fixtures` concentra seeds/personas/builders.
4. Frontend/mock-api/test nao importam `backend/src/domain`.
5. Backend continua hexagonal: application -> ports -> adapters.
6. Mock-api usa o mesmo reducer/contratos do produto.
7. Guards falham se a fronteira antiga reaparecer.
8. Docs apontam para a nova estrutura.

Critério de aceite continuo:

- `packages/domain` nao importa `backend`, `frontend`, `mock-api`, `test` nem
  `tools`;
- `packages/contracts` concentra schemas/DTOs/comandos compartilhados;
- `packages/test-fixtures` concentra seeds/personas/builders;
- frontend/mock-api/test nao importam `backend/src/domain`;
- backend continua hexagonal: application -> ports -> adapters;
- mock-api usa o mesmo reducer/contratos do produto;
- guards falham se a fronteira antiga reaparecer;
- docs apontam para a nova estrutura.

## 12. Checklist para humanos e agentes

Antes de adicionar uma feature:

- O conceito e regra pura? Va para `packages/domain`.
- E shape de API/comando/erro? Va para `packages/contracts`.
- E seed/persona/fixture? Va para `packages/test-fixtures`.
- E orquestracao de caso de uso? Va para `backend/src/application`.
- E IO externo? Va para `backend/src/adapters`.
- E tela/componente? Va para `frontend/app/<route>`.
- E check/smoke/dogfood operacional? Va para `tools/`.

Antes de aceitar um PR:

- Existe apenas uma fonte para cada tipo/contrato?
- O mock usa o mesmo dominio/contrato do backend real?
- O frontend nao importou adapter/backend interno?
- O teste nao inventou shape alternativo?
- O renderer nao decide regra de negocio?
- O read-model declara `sourceRevision` quando pode gerar acao?

## 13. Anti-patterns

Evitar:

- `shared/` generico sem dono;
- componentes UI dentro de pacotes de dominio;
- schema duplicado em route handler e client;
- seed que passa no mock mas nao no backend real;
- teste e2e para invariante que caberia em `node:test`;
- provider externo decidindo estado autoritativo;
- dashboard somando dado que nao passou pelo resolver;
- imports de `backend/src/adapters` no frontend.

## 14. Regra curta

Se a informacao precisa ser verdadeira para backend, frontend, mock-api e
testes, ela nao pertence a nenhum deles isoladamente. Ela pertence a
`packages/domain`, `packages/contracts` ou `packages/test-fixtures`, conforme a
natureza da informacao.
