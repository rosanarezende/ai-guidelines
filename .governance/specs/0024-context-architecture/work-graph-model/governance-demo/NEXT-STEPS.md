# Próximos passos — sim v3 após o dogfood repo-first robusto

> Autoridade: `../model.yml` é o SSOT do modelo. Este arquivo é roteiro operacional da sim v3.
> Regra: toda fase precisa de mecanismo verificável, fixture adversarial e projeção no grafo/dashboard.

> Regra adicional do app (QRD-34): toda tela/fluxo novo ou refatorado deve nascer
> com contrato em `test/contracts/app-contracts.yml` e spec Playwright. Se ainda
> nao estiver implementado, o teste nasce `fixme` ou `expected-fail`; nao se
> implementa primeiro para testar depois.

## Estado atual

A v3 já prova uma adoção repo-first mais próxima de uma empresa que já tem seus repos:

- repos acme têm código MVP importável;
- repos críticos (`acme-core-api`, `acme-checkout`, `acme-analytics`) têm testes locais sem dependência externa;
- o host central fica em `acme/governance/`; os repos adotados ficam em `acme/repos/<repo>/`;
- cada repo tem `.governance/manifest.yml`, `context.json`, `works/*.yml` e, quando owner, `registry/contracts/*.yml`;
- o host valida `repo-context-*`, `repo-work-*` e `repo-contract-*` por resolver fail-closed;
- `intent-cta-upgrade` publica um outcome real em `acme/governance/outcomes/outcomes.yml`, com source/revision/window/attester/envelope e rollup derivado;
- `intent-checkout-stack` publica o segundo outcome real, com todas as peças repo-local `done` e
  `contract-revisions: [acme-user-context@v4]`;
- peças repo-local têm lifecycle (`acknowledged|active|blocked|done|dropped`) e outcome não soma antes de `done`;
- standalone repo-local também tem lifecycle comprovado: `fix-checkout-timeout` foi fechado por
  `standalone.complete` e publicou `out-fix-checkout-timeout-2027h1` sem intent planejada;
- `acme/governance/trust-policy.yml` materializa controles de ACL local, revogação, fallback de matcher, secret quarantine e independência do oráculo;
- `packages/domain`, `packages/contracts` e `packages/test-fixtures` materializam o shared kernel da demo: domínio puro, contratos de fronteira e fixtures/seeds reutilizáveis;
- `backend/src/` é a runtime ativa em TypeScript strict (workspace `acme-governance-backend`, Node ≥ 22.18 com type stripping): application + ports + adapters (file, repo-first, graph-memory, integrations) + api; contratos/tipos compartilhados vêm de `@demo/contracts`, funções puras browser-safe de `@demo/domain`, e validadores/digest/projeções server-only de `@demo/domain/server`; os `.mjs` que restam são shims/CLIs, nunca o caminho principal;
- `/api/graph*` expõe graph queries reais sobre a projeção derivada (listagem, nó, adjacência, caminho, impacto de contrato, deps de intent, conflitos) com `sourceRevision` explícita; `/api/contract` publica o contrato verificável da API;
- integration adapters executáveis com política de egress fail-closed + redação mínima: `assistant-ollama` (health + advisory local), `git-local`, `ci-local`, `code-quality` e `observability`; `check-integrations.mjs` prova sucesso, falha honesta, egress bloqueado e evidência adulterada;
- `backend/examples/read-models/` materializa exemplos derivados nos 4 formatos estudados na v2: file e Neo4j completos/prioritários, SQLite e Mongo completos como read-models derivados;
- `check-backend-examples.mjs` prova o read-model file + Cypher Neo4j com hash, refs, event-log, cobertura de nós/arestas e contrato de ação;
- `load-neo4j-example.ts --dry-run` monta o plano executável de carga Neo4j; `--apply` é fail-closed e exige `--source-hash` + credenciais HTTP explícitas;
- `frontend/` materializa a superfície operacional em React/Next + Material UI, TypeScript strict, como workspace npm com dependências explícitas, consumindo a runtime v3 por API routes e enviando comandos governados;
- o app é route-first: rotas `app/*/page.tsx` finas com gate server-side, implementação colocalizada em pastas privadas (`_view`, `_steps`, `_sections`, `_components`, `_model`, `_state`), domínio de frontend em `app/_domain` e UI compartilhada em `app/_ui`; locales `_locales/pt-br.json` vivem no menor dono estável da copy;
- o fluxo inicial é real: `/signup` cria `local-principal` (identidade LOCAL honesta, sem auth), `/organizations` cria/seleciona organizações (multi-org com contexto separado; demo `acme-*` anexável como fixture `sandbox-demo`), onboarding e status por organização; o shell local persiste file-first em `frontend/.local-state/` (JSON + event-log + lock + idempotência) via backend TS `server/adoption/` com domínio compartilhado puro em `@demo/domain`;
- a acme deixou de ser "a realidade" do app: snapshot governado só é lido quando a organização demo está selecionada; organização nova tem Home/Settings/Console honestos e vazios;
- `GET /api/integrations/assistant/ollama/health` é o primeiro adapter local/open-source mecanizado: consulta apenas `/api/tags` no loopback, sem prompt/contexto, e bloqueia endpoint externo por padrão;
- `integration-catalog.yml` registra adapters externos opcionais como evidence providers/importers/projections; ferramentas externas potencializam adoção, mas não substituem o SSOT file-first;
- `proposal.create`, `triage.save`, `gate.decide`, `intent.activate`, `breakdown.apply`, `repo-work.ack`, `standalone.complete`, `contract.propose-revision`, `outcome.publish`, `verdict.accept`, `incident.declare` e `policy.break-glass` já têm dry-run/execute com `base-revision`, idempotency, nonce, authority resolvida, lock global por comando, escrita atômica, marker de recovery e event-log append-only;
- `verdict.accept` do `intent-cta-upgrade` foi executado no estado canônico via runtime, criando `decisions/verdicts.yml` e `events/events.jsonl` sem edição manual;
- `currentRevision()` inclui também triages, repo-work claims e repo-contract registries, então sidecar repo-local não é uma mutação invisível para stale-check;
- standalone reativo/avulso executável mora no repo (`acme/repos/<repo>/.governance/works/*.yml`); incidentes centrais moram em `acme/governance/incidents/incidents.yml` e geram follow-ups resolvíveis;
- `node tools/journeys/adoption-journey.ts` exercita código, contextos, work acknowledgements, contratos, red-team, testes locais, exemplos de backend derivados e app Next/MUI ativo.

Limite deliberado/pendente: a v3 já prova o file backend transacional mínimo, mas ainda não migrou adapters sqlite/neo4j/mongo como portas write-capable nem read-models `db.json` por repo. Ela é a sim ativa de dogfood file-first; Neo4j já tem export, smoke e loader opcional de projeção, mas continua read-model derivado, não SSOT.

## Fases A–E fechadas nesta leva

### Fase A — primeiro outcome real

Fechado em `intent-cta-upgrade`:

- outcome válido em `acme/governance/outcomes/outcomes.yml`;
- source, revision, window, metric, aggregation, attested-by, contract-revisions e envelope resolvidos;
- grafo/dashboard projetam outcome → target → objective;
- fixtures adversariais bloqueiam outcome sem revisão, agregação incompatível, target errado, contrato omitido e self-attestation sem colapso.

### Fase B — lifecycle repo-local das peças

Fechado nos acks `.governance/works/intent-cta-upgrade--*.yml`:

- `done` exige owner, datas, base revision, source commit, evidência e verificação;
- `blocked` exige causa rastreável;
- `dropped` exige decisão/fate e não pode alimentar outcome de valor;
- outcome emitido por uma intent falha se alguma peça necessária ainda não está `done`.

### Fase C — aprofundar repos críticos

Fechado com testes locais e drift falsificável:

- `acme-core-api`: monolito modular com teste de módulos e API legada;
- `acme-checkout`: fluxo usuário + tracking;
- `acme-analytics`: schema de eventos + eventos de exposição/conversão;
- fixtures cobrem código que muda sem republicar `context.json` e contrato local que muda sem atualizar o registry central.

### Fase D — policy e confiança remanescentes

Fechado como primeira versão física de `trust-policy.yml`:

- ACL por edge/query dentro do host;
- revogação/nonce/idempotência no envelope;
- fallback rastreável quando política bloqueia matcher externo;
- quarantine de segredo colado;
- independência do oráculo do corpus.

### Fase E — destino da v2

Fechado:

- `_archive/org-simulation-v2` fica arquivada como histórico operacional e referência de aprendizados únicos;
- `_archive/org-simulation-v3-static-apps-v1` preserva os protótipos estáticos F3/F4 (`owner`, `company`, `vendor`, `graph.js` e tools associadas);
- `governance-demo` é a única frente ativa de dogfood físico, com `frontend/` como superfície ativa.

## Próximo ciclo

1. **FEITO — backend/runtime TypeScript + shared packages:** `packages/{domain,contracts,test-fixtures}` concentram domínio, contratos e fixtures compartilhadas; `backend/src/` fica em application/ports/adapters/api em TS strict; `backend/src/application/backend-examples/` já cobre export/smoke dos exemplos derivados e entra no typecheck do backend. Os CLIs operacionais saíram de `backend/` e vivem em `tools/{checks,repo-first,read-models,journeys}` como TypeScript executado pelo Node nativo. Sobra futura: fortalecer tipos internos dos wrappers grandes e remover `backend/index.mjs`/`backend/paths.mjs` quando não forem mais necessários como shims.
2. **Declaracao de produto do app: FEITO.** [`APP-PRODUCT-STATEMENT.md`](APP-PRODUCT-STATEMENT.md) define o app como superficie humana local-first do framework, explicita o que ele nao e (SaaS pago assumido, segundo SSOT, clone de backlog) e estabelece a integracao com a CLI `ai-guidelines`.
3. **Contrato funcional do app: FEITO.** [`APP-FUNCTIONAL-SPEC.md`](APP-FUNCTIONAL-SPEC.md) descreve todas as telas/fluxos desejados e separa `UI real`, `UI parcial`, `Backend real`, `Console tecnico`, `Demo/read-only` e `Futuro`. Ele e a referencia para decidir o que criar agora e o que manter como feature futura.
4. **Decisoes QRD do app: FEITO.** [`APP-DECISIONS.md`](APP-DECISIONS.md) registra as decisoes ja tomadas sobre ambientes, mock API (`mock-api`), lowdb, Hono, MSW, Playwright/e2e, governance host, membros/papeis, subjects/grupos, natureza do app e integracao app x CLI.
5. **FEITO — Shell local R1 (backend do onboarding/adoção).** O reducer puro de `@demo/domain` + `frontend/server/adoption/` persistem por comando/event-log: perfil+regra de acúmulo, caminho guiado/avançado, workspace-mode, stack (execution/operational-store/graph-read-model/identity), pessoas/grupos/convites (token local, pending→accepted/declined/revoked/expired), papéis por subject (proposed→accepted; authority sempre DERIVADA), governance host (3 formatos + sandbox explícito, fit-check + scaffold real com sourceRevision), fontes com sourceTrust/scan real e assistente multi-provider (teste real, egress fail-closed). APIs de produto em `/api/local/*` (membros, papéis, host, fontes, assistente, integration-backlog). Sobra: telas dedicadas de membros/papéis, auth real (identity-provider) no cookie, GitHub work-source cloud (contrato modelado, kind `github`, nunca `connected` sem mecanismo).
6. **FEITO — Mock API + e2e (R0).** `governance-demo/mock-api/` (Hono + lowdb, 26 seeds resetáveis de `@demo/test-fixtures`, MESMO reducer do domínio) + `governance-demo/test/` (Playwright, jornada signup→workspace→onboarding parcial→Home). Scripts: `dev:real`/`dev:mock` (frontend), `dev`/`reset` (mock-api), `test:e2e` (test). Data source por env (`GOVERNANCE_DATA_SOURCE`), nunca localStorage; `mock-api` proibida em produção; `demo-acme` bloqueia mutações de configuração.
7. **Backend R0/R1: ENTREGUE nesta fatia.** O diagnostico que orientou a fatia foi arquivado em [`../_archive/governance-demo-docs-2026-07-05/BACKEND-R0-R1-FINDINGS.md`](../_archive/governance-demo-docs-2026-07-05/BACKEND-R0-R1-FINDINGS.md). O estado funcional vivo agora fica em [`APP-FUNCTIONAL-SPEC.md`](APP-FUNCTIONAL-SPEC.md); MSW (QRD-05) entra quando houver primeiros testes de componente/hook.
8. **Stack visual do app — spikes FEITOS e primeiras telas reais iniciadas.** Bancada em `frontend/app/spikes/visual-stack/` com view-models independentes de renderer, read-model real + fixtures sinteticas e acao governada simulada por dry-run. Estado por superficie: React Flow+ELK = em validacao real na rota `/map` sobre `/api/map/governance`; ECharts graph = aba relacional OPCIONAL futura do mapa; Apache ECharts = em validacao real na rota `/results` sobre `/api/results/dashboard`; TanStack Table+MUI+`@tanstack/react-virtual` = em validacao real na rota `/work` sobre `/api/work/items`; Reagraph = rejeitado/removido; Sigma.js+Graphology x ECharts graph no console tecnico = PENDENTE DE DECISAO. Proximo passo: transformar linhas/nos em detalhe/acoes por tipo e levar a owner de volta a bancada do grafo para bater o martelo Sigma x ECharts. Cytoscape segue banido. Evidencia: `../_reviews/2026-07-04-visual-stack-spike.md`.
9. **Fontes de trabalho — tela real iniciada.** `/sources` cadastra e escaneia fontes com APIs reais do shell local, explica caminho local vs servidor, mostra `sourceTrust`, hash, Git head/dirty e limitações. Pasta local/sincronizada/modulo tambem pode ser escolhida no Explorer como snapshot do navegador (`snapshot-only`). GitHub sai do campo de caminho e vai para integrações. Próximo: conectar essa fonte ao fluxo de publish de `context.json`/capability review e implementar GitHub como work-source cloud real.
10. **Iteracao visual da owner:** percorrer no app Next/MUI v2 a cadeia `signup -> workspace -> onboarding -> settings -> sources -> home` antes de voltar ao mapa/resultado/console. O acompanhamento vivo fica em [`APP-ITERATION-MAP.md`](APP-ITERATION-MAP.md); o walkthrough antigo foi arquivado.
11. **Cup/CWP — iniciar C0-C3 em paralelo com a iteracao visual.** QRD-32 decidiu Cup como nome de produto e CWP como nome tecnico. C0-C3 podem comecar antes de validar todas as telas: overlay shell, contexto por pagina, policy explainer deterministico e specialist router. C4-C6 (provider assistivo, draft action e audit de coautoria) ficam atras de provider/policy/egress/baseRevision/audit.
12. **Config persistence:** transformar a aba `Configuracoes` em comando governado quando a UX estiver validada: `profile-declaration`, authority/cost roles e assistant runtime policy precisam de resolver, nao de formulario solto.
13. **Resolver de decisão humana:** transformar alertas remanescentes em decisões append-only quando a owner escolher colapso, exceção ou correção estrutural.
14. **Portabilidade do legado v2 arquivado → v3:** completar matcher executável e authoring completo aproveitando `_archive/org-simulation-v2` como referência histórica, sem reintroduzir a taxonomia antiga nem apagar os resolvers da v3.
15. **Integrações — hub dedicado e sugestões contextuais:** QRD-33 decidiu que Settings não basta. Criar `/integrations` como inventário governado de providers, status, permissões, riscos, health/probe, owner e alternativa manual; cada tela também deve sugerir poucas integrações relevantes no momento em que elas elevam confiança ou reduzem trabalho manual. GitHub work-source continua primeira integração cloud real.
16. **Adapters externos — spikes locais FEITOS:** `assistant-runtime` (Ollama health + advisory), `git-provider` (git-local), `ci-status` (ci-local), `code-quality` e `observability` têm adapter executável com egress fail-closed e evidência verificável. Próximo: ligar essa evidência ao resolver de outcome/repo-work (evidence provider alimentando o dashboard, não SSOT paralelo) e o primeiro adapter genuinamente cloud atrás de allowlist.
17. **Revisão adversarial pós-iteração visual:** pedir ao Claude Code/Fable 5 uma nova revisão apenas depois de a owner percorrer o mapa visual e termos marcado o que foi iterado/validado.

## Comandos de aceite

```bash
cd governance-demo
node tools/checks/validate.ts
node tools/checks/test-adversarial.ts
node tools/checks/check-local-repo-tests.ts
node tools/checks/check-runtime.ts
node tools/checks/check-governance-app.ts
node tools/read-models/export-backend-examples.ts --check
node tools/read-models/check-backend-examples.ts
node tools/read-models/load-neo4j-example.ts --dry-run
node tools/checks/check-integrations.ts
npm --workspace acme-governance-backend run typecheck
npm --workspace acme-governance-mock-api run typecheck
npm --workspace acme-governance-mock-api run reset
npm --workspace acme-governance-e2e run test:e2e
node tools/journeys/adoption-journey.ts
```
