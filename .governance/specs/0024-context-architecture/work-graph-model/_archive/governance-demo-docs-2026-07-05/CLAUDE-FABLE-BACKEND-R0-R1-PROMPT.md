# Prompt para Claude Fable — implementar backend R0/R1 da governance-demo

Use este prompt em uma sessao nova do Claude Code/Fable 5 com effort alto.

```text
Voce e Claude Code/Fable 5 atuando como implementador tecnico principal no repo `ai-guidelines`.
Branch esperada: `feat/spec-0024-artifact-taxonomy-and-model-review-contract`.
O repositorio vence qualquer memoria, transcript ou output de agente. Nao use nomes reais de empresas; mantenha a org ficticia `acme-*`.

OBJETIVO DA FATIA
Implementar o backend R0/R1 da `governance-demo`, para que o frontend possa sair do prototipo e validar a jornada de onboarding/adocao ponta a ponta.

R0 = harness de desenvolvimento/teste de produto:
- `governance-demo/mock-api/` com Hono + lowdb + TypeScript;
- seeds resetaveis;
- scripts de dev/teste;
- primeira jornada Playwright;
- data source switch `real-runtime | mock-api | demo-acme`.

R1 = backend real do onboarding/adocao inicial:
- persistir escolhas de onboarding como estado real;
- pessoas/grupos/convites/papeis/authority derivada;
- governance host fit-check + scaffold/link;
- fontes de trabalho iniciais com sourceTrust;
- assistente/integracoes configuraveis;
- APIs de produto para o frontend.

LEIA PRIMEIRO, NESTA ORDEM
1. `.governance/specs/0024-context-architecture/work-graph-model/model.yml`
2. `.governance/specs/0024-context-architecture/work-graph-model/governance-demo/APP-PRODUCT-STATEMENT.md`
3. `.governance/specs/0024-context-architecture/work-graph-model/governance-demo/APP-DECISIONS.md`
4. `.governance/specs/0024-context-architecture/work-graph-model/governance-demo/APP-FUNCTIONAL-SPEC.md`
5. `.governance/specs/0024-context-architecture/work-graph-model/governance-demo/BACKEND-R0-R1-FINDINGS.md`
6. `.governance/specs/0024-context-architecture/work-graph-model/integration-catalog.yml`
7. `.governance/specs/0024-context-architecture/work-graph-model/governance-demo/README.md`
8. `.governance/specs/0024-context-architecture/work-graph-model/governance-demo/NEXT-STEPS.md`
9. Implementacao atual:
   - `governance-demo/backend/src/`
   - `governance-demo/frontend/server/adoption/`
   - `governance-demo/frontend/app/api/`
   - `governance-demo/frontend/app/`

CONTRATO DE IMPLEMENTACAO
- Nao reabrir decisoes QRD-01 a QRD-26 sem fato novo forte.
- Nao fazer reescrita total do app.
- Nao mover o SSOT para banco. File-first continua autoridade.
- Mock API valida experiencia, nao governanca real.
- Backend real deve continuar com arquitetura hexagonal:
  - domain puro;
  - application/use-cases;
  - ports;
  - adapters;
  - api/contracts/handlers;
  - route handlers Next finos.
- Feature nova entra em TypeScript. Nao adicionar `.mjs` novo para dominio/aplicacao.
- Nao importar internals do backend no frontend: usar SDK/export publico.
- Nenhuma integracao externa pode escrever estado autoritativo diretamente.
- GitHub login, GitHub OAuth e GitHub work-source sao fluxos separados.
- Authority nunca e derivada automaticamente de login.
- Neo4j e read-model derivado opcional, nunca SSOT.
- Nao usar `git commit --no-verify`.

ESCOPO R0 DETALHADO
1. Criar `governance-demo/mock-api/`:
   - Hono + lowdb + TypeScript;
   - package/workspace coerente com a estrutura atual;
   - contrato de API documentado;
   - persistencia em JSON resetavel;
   - dados locais gitignored quando mutaveis.

2. Seeds obrigatorias:
   - workspace vazio;
   - onboarding parcial;
   - acme demo;
   - workspace sem host;
   - workspace com host local;
   - workspace com host embutido;
   - workspace local;
   - workspace shared;
   - workspace controlled;
   - workspace controlled+neo4j;
   - workspace docker-compose;
   - workspace docker-compose+ollama-profile;
   - workspace com groups/teams;
   - workspace shared com convites pendentes;
   - workspace shared+github;
   - workspace shared+google;
   - workspace controlled+oidc;
   - workspace com cloud-synced-folder;
   - workspace com provider-versioned-source;
   - workspace compact com policy examples;
   - workspace com multiplos assistant providers;
   - workspace com planning progressivo completo;
   - workspace com GitHub work-source conectado.

3. Scripts:
   - `dev:real`;
   - `dev:mock`;
   - `mock-api:dev`;
   - `mock-api:reset`;
   - `test:e2e`.

4. Data source:
   - implementar switch claro por env:
     - `GOVERNANCE_DATA_SOURCE=real-runtime`
     - `GOVERNANCE_DATA_SOURCE=mock-api`
     - `GOVERNANCE_DATA_SOURCE=demo-acme`
   - o frontend nao deve consultar `localStorage` para decidir fonte de verdade.

5. Playwright:
   - adicionar primeira jornada e2e:
     signup -> criar workspace -> onboarding parcial -> Home com card de continuar;
   - rodar contra mock-api seed resetavel;
   - nao fazer suite enorme agora.

ESCOPO R1 DETALHADO
1. Expandir `backend/src/domain/adoption-shell.ts` e/ou dominio equivalente para suportar:
   - account/principal;
   - workspace;
   - membership;
   - group/team/service-account/external-group subjects;
   - invite token;
   - role assignment;
   - authority derivada;
   - governance-profile;
   - accumulation rule;
   - workspace-mode;
   - execution-mode;
   - operational-store;
   - graph-read-model;
   - assistant providers/defaults por funcao;
   - integration status/backlog projection;
   - governance host;
   - work sources.

2. Criar comandos/use-cases reais para:
   - salvar perfil de governanca;
   - salvar regra de acumulo sensivel;
   - salvar workspace-mode;
   - salvar execution-mode;
   - salvar operational-store;
   - salvar graph-read-model;
   - convidar pessoa;
   - aceitar/recusar/revogar convite;
   - criar grupo/time;
   - atribuir papel a pessoa/grupo/time/service-account/external-group como proposta;
   - resolver authority efetiva;
   - criar/linkar governance host;
   - rodar fit-check do host;
   - adicionar fonte de trabalho;
   - escanear fonte;
   - publicar estado de sourceTrust;
   - salvar configuracao de assistant provider;
   - testar provider local;
   - salvar default por funcao;
   - expor backlog de integracoes conforme `integration-catalog.yml`.

3. Governance host:
   suportar os tres formatos decididos:
   - pasta local dedicada: `<workspace-slug>-governance/`;
   - repo dedicado com o mesmo nome fisico;
   - host embutido em repo existente: `.governance-host/`.
   Tambem suportar sandbox explicito, sem chamar isso de organizacao governada.

4. Fontes de trabalho:
   - Git local;
   - pasta local sem Git;
   - pasta sincronizada em nuvem com trust rebaixado;
   - contrato inicial para GitHub work-source/repo provider;
   - `sourceTrust` explicito;
   - provider/version id;
   - freshness;
   - explicacao visivel de limitacao.

5. APIs de produto:
   criar handlers/route handlers para o frontend nao precisar montar comando generico manualmente:
   - `/api/local/signup` pode ser mantida/ajustada;
   - `/api/local/organizations`;
   - `/api/local/onboarding/...`;
   - `/api/local/members/...`;
   - `/api/local/roles/...`;
   - `/api/local/governance-host/...`;
   - `/api/local/work-sources/...`;
   - `/api/local/assistant/...`;
   - `/api/local/integration-backlog`.
   Os nomes finais podem variar, mas precisam estar documentados e tipados.

6. Persistencia real:
   - reaproveitar lock/event-log/idempotencia de `frontend/server/adoption/infrastructure/file-state-store.ts`
     ou mover para lugar mais adequado sem quebrar o contrato;
   - toda mutacao local precisa virar comando/evento;
   - recarregar app precisa preservar estado;
   - estado corrompido deve falhar de forma visivel, nao sobrescrever silenciosamente.

NAO INCLUIR NESTA FATIA
- UI completa de planning;
- intake/triage/gate completos;
- matcher completo;
- outcomes/verdicts novos;
- incident lifecycle completo;
- auth cloud real com troca de token persistida;
- GitHub live OAuth/App completo se isso ampliar demais; modele o contrato e permita mock/seed.
- SQLite/Neo4j/Mongo write-capable;
- transformar Neo4j em SSOT.

FRONTEND MINIMO PERMITIDO
Fazer apenas ajustes necessarios para consumir os novos endpoints e provar a jornada. Nao redesenhar o app inteiro.
Se alguma tela ainda ficar mockada, marcar explicitamente no texto/estado.

VERIFICACOES ESPERADAS
Use checks proporcionais. Nao rode validacoes pesadas sem necessidade, mas garanta:
- typecheck do backend;
- typecheck do frontend se tocar app;
- check do app se tocar rotas/frontend;
- mock-api reset + smoke;
- primeira jornada Playwright;
- `git diff --check`.

Tambem atualize:
- `README.md`;
- `NEXT-STEPS.md`;
- `APP-FUNCTIONAL-SPEC.md` se a API/fluxo mudar;
- `BACKEND-R0-R1-FINDINGS.md` se algum achado for fechado ou alterado.

CRITERIO DE ACEITE
Ao final, uma pessoa deve conseguir:
1. criar conta local;
2. criar workspace;
3. escolher caminho padrao ou avancado;
4. salvar perfil de governanca;
5. convidar/adicionar pessoa ou seguir solo com degradacao visivel;
6. atribuir papeis como propostas;
7. escolher modo do workspace;
8. escolher/linkar/criar governance host ou declarar sandbox;
9. adicionar ao menos uma fonte de trabalho;
10. configurar ou dispensar assistente;
11. ver integracoes disponiveis/release-1/em-breve/adiadas;
12. recarregar o app e ver estado preservado;
13. rodar e2e contra mock-api;
14. demonstrar leitura basica contra backend real local.

SAIDA ESPERADA DO CLAUDE
1. Base verificada: branch, HEAD, working tree, arquivos lidos.
2. O que implementou, separado por R0 e R1.
3. Arquitetura final e principais arquivos.
4. Como rodar dev real, dev mock, reset e e2e.
5. Checks executados e resultados.
6. Riscos residuais reais.
7. Commit criado, se houver autorizacao nesta sessao; nunca usar `--no-verify`.
```
