# Próximos passos — sim v3 após o dogfood repo-first robusto

> Autoridade: `../model.yml` é o SSOT do modelo. Este arquivo é roteiro operacional da sim v3.
> Regra: toda fase precisa de mecanismo verificável, fixture adversarial e projeção no grafo/dashboard.

## Estado atual

A v3 já prova uma adoção repo-first mais próxima de uma empresa que já tem seus repos:

- repos acme têm código MVP importável;
- repos críticos (`acme-core-api`, `acme-checkout`, `acme-analytics`) têm testes locais sem dependência externa;
- o host central fica em `acme-governance/`; os repos adotados ficam em `repos/<repo>/`;
- cada repo tem `.governance/manifest.yml`, `context.json`, `works/*.yml` e, quando owner, `registry/contracts/*.yml`;
- o host valida `repo-context-*`, `repo-work-*` e `repo-contract-*` por resolver fail-closed;
- `intent-cta-upgrade` publica um outcome real em `acme-governance/outcomes/outcomes.yml`, com source/revision/window/attester/envelope e rollup derivado;
- `intent-checkout-stack` publica o segundo outcome real, com todas as peças repo-local `done` e
  `contract-revisions: [acme-user-context@v4]`;
- peças repo-local têm lifecycle (`acknowledged|active|blocked|done|dropped`) e outcome não soma antes de `done`;
- standalone repo-local também tem lifecycle comprovado: `fix-checkout-timeout` foi fechado por
  `standalone.complete` e publicou `out-fix-checkout-timeout-2027h1` sem intent planejada;
- `acme-governance/trust-policy.yml` materializa controles de ACL local, revogação, fallback de matcher, secret quarantine e independência do oráculo;
- `_lib/` materializa a primeira runtime DDD v3: adapter file, domínio/validador, command dry-run e read-model de grafo;
- `_lib/domain/*.ts` materializa o contrato TypeScript compartilhado para a camada de adoção, snapshot, comandos e i18n; o app reexporta esses tipos em vez de duplicá-los;
- `_examples/backends/` materializa exemplos derivados nos 4 formatos estudados na v2: file e Neo4j completos/prioritários, SQLite e Mongo completos como read-models derivados;
- `check-backend-examples.mjs` prova o read-model file + Cypher Neo4j com hash, refs, event-log, cobertura de nós/arestas e contrato de ação;
- `load-neo4j-example.mjs --dry-run` monta o plano executável de carga Neo4j; `--apply` é fail-closed e exige `--source-hash` + credenciais HTTP explícitas;
- `_apps/governance-next/` materializa a superfície operacional em React/Next + Material UI, TypeScript strict, como workspace npm com dependências explícitas, consumindo a runtime v3 por API routes e enviando comandos governados;
- o app é route-first: rotas `app/*/page.tsx` finas com gate server-side, implementação colocalizada em pastas privadas (`_view`, `_steps`, `_sections`, `_components`, `_model`, `_state`), domínio de frontend em `app/_domain` e UI compartilhada em `app/_ui`; locales `_locales/pt-br.json` vivem no menor dono estável da copy;
- o fluxo inicial é real: `/signup` cria `local-principal` (identidade LOCAL honesta, sem auth), `/organizations` cria/seleciona organizações (multi-org com contexto separado; demo `acme-*` anexável como fixture `sandbox-demo`), onboarding e status por organização; o shell local persiste file-first em `_apps/governance-next/.local-state/` (JSON + event-log + lock + idempotência) via backend TS `server/adoption/` com domínio compartilhado puro em `_lib/domain/adoption-shell.ts`;
- a acme deixou de ser "a realidade" do app: snapshot governado só é lido quando a organização demo está selecionada; organização nova tem Home/Settings/Console honestos e vazios;
- `GET /api/integrations/assistant/ollama/health` é o primeiro adapter local/open-source mecanizado: consulta apenas `/api/tags` no loopback, sem prompt/contexto, e bloqueia endpoint externo por padrão;
- `integration-catalog.yml` registra adapters externos opcionais como evidence providers/importers/projections; ferramentas externas potencializam adoção, mas não substituem o SSOT file-first;
- `proposal.create`, `triage.save`, `gate.decide`, `intent.activate`, `breakdown.apply`, `repo-work.ack`, `standalone.complete`, `contract.propose-revision`, `outcome.publish`, `verdict.accept`, `incident.declare` e `policy.break-glass` já têm dry-run/execute com `base-revision`, idempotency, nonce, authority resolvida, lock global por comando, escrita atômica, marker de recovery e event-log append-only;
- `verdict.accept` do `intent-cta-upgrade` foi executado no estado canônico via runtime, criando `decisions/verdicts.yml` e `events/events.jsonl` sem edição manual;
- `currentRevision()` inclui também triages, repo-work claims e repo-contract registries, então sidecar repo-local não é uma mutação invisível para stale-check;
- standalone reativo/avulso executável mora no repo (`repos/<repo>/.governance/works/*.yml`); incidentes centrais moram em `acme-governance/incidents/incidents.yml` e geram follow-ups resolvíveis;
- `node _tools/adoption-journey.mjs` exercita código, contextos, work acknowledgements, contratos, red-team, testes locais e grafo.

Limite deliberado/pendente: a v3 já prova o file backend transacional mínimo, mas ainda não migrou adapters sqlite/neo4j/mongo como portas write-capable nem read-models `db.json` por repo. Ela é a sim ativa de dogfood file-first; Neo4j já tem export, smoke e loader opcional de projeção, mas continua read-model derivado, não SSOT.

## Fases A–E fechadas nesta leva

### Fase A — primeiro outcome real

Fechado em `intent-cta-upgrade`:

- outcome válido em `acme-governance/outcomes/outcomes.yml`;
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

- `_org-simulation-v2` fica arquivada como histórico operacional e referência de aprendizados únicos;
- `_org-simulation-v3` é a única frente ativa de dogfood físico.

## Próximo ciclo

1. **Backend/runtime TypeScript como fatia própria:** migrar `_lib` herdado em `.mjs` para domínio/aplicação/ports/adapters em TypeScript incremental, começando pelos contratos usados pelo app. Não misturar com nova UX.
2. **Shell local: próxima fatia.** Signup/organizações/onboarding-por-organização JÁ EXISTEM sobre `_lib/domain/adoption-shell.ts` + `server/adoption/` (file-first, event-log, lock). Falta: vincular governance host a organização não-demo, persistir as ESCOLHAS do onboarding (perfil/papéis/fontes) como comandos governados, cadastro/aceite de pessoas e, depois, adapter de auth real (identity-provider) substituindo o cookie local não assinado.
3. **Walkthrough da owner:** percorrer no app Next/MUI v2 a cadeia `objective → target → intent → repo-work done → outcome → verdict/rollup → actual` e o caminho `incident → standalone.complete → outcome operacional`, usando [`WALKTHROUGH-ITERATION.md`](WALKTHROUGH-ITERATION.md) como doc de acompanhamento.
4. **Config persistence:** transformar a aba `Configuracoes` em comando governado quando a UX estiver validada: `profile-declaration`, authority/billing roles e assistant runtime policy precisam de resolver, nao de formulario solto.
5. **Resolver de decisão humana:** transformar alertas remanescentes em decisões append-only quando a owner escolher colapso, exceção ou correção estrutural.
6. **Portabilidade v2 → v3:** completar matcher executável e authoring completo, sem reintroduzir a taxonomia antiga nem apagar os resolvers da v3.
7. **Adapters externos:** escolher o primeiro spike de integração do catálogo (contracts, CI, observabilidade, ownership, assistant runtime ou deploy evidence) como evidence provider, não como SSOT paralelo. Prioridade prática: `assistant-runtime-local-cloud` (Ollama/LM Studio/LocalAI/vLLM), `git-provider`, `ci-status` e `observability`.
8. **Revisão adversarial pós-R5:** pedir ao Claude Code/Fable 5 para revisar a sim com foco em outcomes de intent, outcome standalone, contrato e transação file-first.

## Comandos de aceite

```bash
cd _org-simulation-v3
node _tools/validate.mjs
node _tools/test-adversarial.mjs
node _tools/check-local-repo-tests.mjs
node _tools/check-runtime.mjs
node _tools/check-governance-app.mjs
node _tools/export-backend-examples.mjs --check
node _tools/check-backend-examples.mjs
node _tools/load-neo4j-example.mjs --dry-run
node _tools/adoption-journey.mjs
node _tools/build-graph.mjs
```
