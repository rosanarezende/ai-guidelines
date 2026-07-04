# Próximos passos — sim v3 após o dogfood repo-first robusto

> Autoridade: `../model.yml` é o SSOT do modelo. Este arquivo é roteiro operacional da sim v3.
> Regra: toda fase precisa de mecanismo verificável, fixture adversarial e projeção no grafo/dashboard.

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
- `backend/src/` é a runtime ativa em TypeScript strict (workspace `acme-governance-backend`, Node ≥ 22.18 com type stripping): domínio puro + ports + adapters (file, repo-first, graph-memory, integrations) + application (snapshot, graph queries, egress/redaction) + api (schemas/contratos/handlers); os `.mjs` que restam são shims/CLIs, nunca o caminho principal;
- `backend/src/domain/` materializa o contrato TypeScript compartilhado (snapshot, comandos, adoption shell, i18n, graph queries); o app consome só o SDK `@demo/backend[/domain]` — import interno/`.mjs` é barrado por guard;
- `/api/graph*` expõe graph queries reais sobre a projeção derivada (listagem, nó, adjacência, caminho, impacto de contrato, deps de intent, conflitos) com `sourceRevision` explícita; `/api/contract` publica o contrato verificável da API;
- integration adapters executáveis com política de egress fail-closed + redação mínima: `assistant-ollama` (health + advisory local), `git-local`, `ci-local`, `code-quality` e `observability`; `check-integrations.mjs` prova sucesso, falha honesta, egress bloqueado e evidência adulterada;
- `examples/backends/` materializa exemplos derivados nos 4 formatos estudados na v2: file e Neo4j completos/prioritários, SQLite e Mongo completos como read-models derivados;
- `check-backend-examples.mjs` prova o read-model file + Cypher Neo4j com hash, refs, event-log, cobertura de nós/arestas e contrato de ação;
- `load-neo4j-example.mjs --dry-run` monta o plano executável de carga Neo4j; `--apply` é fail-closed e exige `--source-hash` + credenciais HTTP explícitas;
- `frontend/` materializa a superfície operacional em React/Next + Material UI, TypeScript strict, como workspace npm com dependências explícitas, consumindo a runtime v3 por API routes e enviando comandos governados;
- o app é route-first: rotas `app/*/page.tsx` finas com gate server-side, implementação colocalizada em pastas privadas (`_view`, `_steps`, `_sections`, `_components`, `_model`, `_state`), domínio de frontend em `app/_domain` e UI compartilhada em `app/_ui`; locales `_locales/pt-br.json` vivem no menor dono estável da copy;
- o fluxo inicial é real: `/signup` cria `local-principal` (identidade LOCAL honesta, sem auth), `/organizations` cria/seleciona organizações (multi-org com contexto separado; demo `acme-*` anexável como fixture `sandbox-demo`), onboarding e status por organização; o shell local persiste file-first em `frontend/.local-state/` (JSON + event-log + lock + idempotência) via backend TS `server/adoption/` com domínio compartilhado puro em `backend/domain/adoption-shell.ts`;
- a acme deixou de ser "a realidade" do app: snapshot governado só é lido quando a organização demo está selecionada; organização nova tem Home/Settings/Console honestos e vazios;
- `GET /api/integrations/assistant/ollama/health` é o primeiro adapter local/open-source mecanizado: consulta apenas `/api/tags` no loopback, sem prompt/contexto, e bloqueia endpoint externo por padrão;
- `integration-catalog.yml` registra adapters externos opcionais como evidence providers/importers/projections; ferramentas externas potencializam adoção, mas não substituem o SSOT file-first;
- `proposal.create`, `triage.save`, `gate.decide`, `intent.activate`, `breakdown.apply`, `repo-work.ack`, `standalone.complete`, `contract.propose-revision`, `outcome.publish`, `verdict.accept`, `incident.declare` e `policy.break-glass` já têm dry-run/execute com `base-revision`, idempotency, nonce, authority resolvida, lock global por comando, escrita atômica, marker de recovery e event-log append-only;
- `verdict.accept` do `intent-cta-upgrade` foi executado no estado canônico via runtime, criando `decisions/verdicts.yml` e `events/events.jsonl` sem edição manual;
- `currentRevision()` inclui também triages, repo-work claims e repo-contract registries, então sidecar repo-local não é uma mutação invisível para stale-check;
- standalone reativo/avulso executável mora no repo (`acme/repos/<repo>/.governance/works/*.yml`); incidentes centrais moram em `acme/governance/incidents/incidents.yml` e geram follow-ups resolvíveis;
- `node backend/tools/adoption-journey.mjs` exercita código, contextos, work acknowledgements, contratos, red-team, testes locais, exemplos de backend derivados e app Next/MUI ativo.

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

1. **FEITO — backend/runtime TypeScript:** `backend/src/` é domínio/aplicação/ports/adapters/api em TS strict; sobra desta fatia: migrar os CLIs grandes (`check-runtime`, `test-adversarial`, `backends/*`) de `.mjs` para `.ts` quando houver motivo funcional (hoje são checks estáveis atrás de shims).
2. **Shell local: próxima fatia.** Signup/organizações/onboarding-por-organização JÁ EXISTEM sobre `backend/src/domain/adoption-shell.ts` + `server/adoption/` (file-first, event-log, lock). Falta: vincular governance host a organização não-demo, persistir as ESCOLHAS do onboarding (perfil/papéis/fontes) como comandos governados, cadastro/aceite de pessoas e, depois, adapter de auth real (identity-provider) substituindo o cookie local não assinado.
3. **Walkthrough da owner:** percorrer no app Next/MUI v2 a cadeia `objective → target → intent → repo-work done → outcome → verdict/rollup → actual` e o caminho `incident → standalone.complete → outcome operacional`, usando [`WALKTHROUGH-ITERATION.md`](WALKTHROUGH-ITERATION.md) como doc de acompanhamento.
4. **Config persistence:** transformar a aba `Configuracoes` em comando governado quando a UX estiver validada: `profile-declaration`, authority/billing roles e assistant runtime policy precisam de resolver, nao de formulario solto.
5. **Resolver de decisão humana:** transformar alertas remanescentes em decisões append-only quando a owner escolher colapso, exceção ou correção estrutural.
6. **Portabilidade do legado v2 arquivado → v3:** completar matcher executável e authoring completo aproveitando `_archive/org-simulation-v2` como referência histórica, sem reintroduzir a taxonomia antiga nem apagar os resolvers da v3.
7. **Adapters externos — spikes locais FEITOS:** `assistant-runtime` (Ollama health + advisory), `git-provider` (git-local), `ci-status` (ci-local), `code-quality` e `observability` têm adapter executável com egress fail-closed e evidência verificável. Próximo: ligar essa evidência ao resolver de outcome/repo-work (evidence provider alimentando o dashboard, não SSOT paralelo) e o primeiro adapter genuinamente cloud atrás de allowlist.
8. **Revisão adversarial pós-R5:** pedir ao Claude Code/Fable 5 para revisar a sim com foco em outcomes de intent, outcome standalone, contrato e transação file-first.

## Comandos de aceite

```bash
cd governance-demo
node backend/tools/validate.mjs
node backend/tools/test-adversarial.mjs
node backend/tools/check-local-repo-tests.mjs
node backend/tools/check-runtime.mjs
node backend/tools/check-governance-app.mjs
node backend/tools/export-backend-examples.mjs --check
node backend/tools/check-backend-examples.mjs
node backend/tools/load-neo4j-example.mjs --dry-run
node backend/tools/check-integrations.mjs
npm --workspace acme-governance-backend run typecheck
node backend/tools/adoption-journey.mjs
```
