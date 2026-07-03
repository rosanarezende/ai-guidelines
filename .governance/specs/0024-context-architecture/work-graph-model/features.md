# Features a implementar — roadmap v3 do work-graph

> **Autoridade:** o modelo tipado mora em [`model.yml`](model.yml). Este arquivo é um roteiro
> operacional: registra o que já foi provado na sim v3, o que ainda falta mecanizar e o que foi
> preservado da v2 como aprendizado.
>
> **Regra central:** o framework deve funcionar sem ferramenta externa. Adapters e integrações são
> opcionais: reduzem preenchimento manual, trazem evidência independente e conectam o grafo ao
> ecossistema existente da empresa, mas nunca viram SSOT paralelo.

Legenda: ✅ feito · 🚧 parcial · ⬜ a fazer · 🧊 histórico/arquivado.

---

## Estado atual da frente

✅ A sim ativa é [`_org-simulation-v3/`](_org-simulation-v3/). Ela substitui a v2 como dogfood
físico, mas não apaga os aprendizados da v2.

✅ Já existe:

- host central `acme-governance/`;
- repos adotados em `repos/<repo>/` com código MVP e sidecar `.governance/`;
- manifests, `context.json`, repo-work ack e repo-contract registry;
- runtime `_lib` v3 com domínio/validador, adapter file, command dry-run/execute mínimo e
  read-model de grafo;
- app operacional React/Next + Material UI em `_org-simulation-v3/_apps/governance-next/`;
- exemplos derivados file/SQLite/Neo4j/Mongo em `_org-simulation-v3/_examples/backends/`;
- smoke operacional de file + Neo4j, com Neo4j ainda como read-model/projeção;
- resolvers fail-closed para schema, outcome, repo-work, contrato, trust-policy, authority,
  break-glass, incident e verdict;
- backend file-first transacional mínimo: lock global por comando, escrita atômica, event-log
  append-only, marker de recovery para crash entre write e evento, replay por idempotency/nonce e
  fixtures de concorrência.
- segundo outcome real em `intent-checkout-stack`, tocando contrato e citando
  `acme-user-context@v4`, com todos os repo-work acks fechados por comando.

🚧 Ainda falta para considerar o work-graph pronto ponta a ponta:

- caminho operacional sem intent planejada;
- matcher executável v3;
- authoring completo no app Next/MUI;
- adapters externos como evidence providers;
- decisão posterior sobre SQLite/Neo4j/Mongo write-capable, sem quebrar file-first.

---

## Decisões fechadas nesta rodada

1. **App operacional**
   - Decisão: o app Next/MUI continua incubado dentro da sim/spec por enquanto.
   - Não é ainda o pacote oficial do framework.
   - Promoção futura exige journeys adicionais, backend transacional mínimo e authoring básico.

2. **Primeiro backend transacional**
   - Decisão: provar primeiro `file + event-log/lock`.
   - SQLite vem depois como adapter local.
   - Banco não entra para esconder problema de consistência do file-first.

3. **Neo4j**
   - Decisão: read-model derivado por padrão.
   - Uso forte: impacto, dependências, exploração de grafo, dashboard.
   - Mutação governada sempre relê YAML/event-log autoritativo.
   - Write-capable só em fase futura explícita, com a mesma suíte transacional do file backend.

4. **Authoring**
   - Decisão: começar no app web Next/MUI.
   - CLI/TUI fica para automação, adoção batch e operações repetíveis.
   - Nenhuma tela edita YAML direto; toda escrita passa por comando/envelope/dry-run.

5. **Perfil compact e dangerous mutations**
   - Decisão: compact detecta mutações dangerous, registra justificativa append-only e exige revisão retroativa em cadência.
   - Não bloqueia por padrão; hard-block no compact só entra por decisão futura explícita, com lista curta e fallback/break-glass.

6. **Capability extraction**
   - Decisão: fica dentro do framework como assistência de adoção/manutenção de manifestos.
   - Análise estática profunda fica fora ou em plugin/adapter.
   - Capability sem evidência/attestation vira `unknown`, não verdade.

7. **Integrações externas**
   - Decisão: criar catálogo versionado em [`integration-catalog.yml`](integration-catalog.yml).
   - Integrações são adapters opcionais para evidência/importação/projeção.
   - Ferramenta externa observa; o framework governa.

---

## Roadmap da sim v3

### R1 · Sanitização documental

Status: 🚧 em andamento.

- ✅ atualizar README/NEXT-STEPS para refletir F6/F7;
- ✅ registrar que app, runtime file e exemplos multi-backend existem;
- ✅ marcar que SQLite/Neo4j/Mongo transacionais ainda não existem;
- 🚧 atualizar handoff Fable 5, `model.yml`, `features.md`, `app-requirements.md`;
- 🚧 criar catálogo versionado de integrações externas.

### R2 · Revisão adversarial pós-F7

Status: ⬜ a fazer.

Objetivo: pedir revisão independente da sim robusta antes da próxima fatia de implementação.

Deve percorrer:

- `objective -> target -> intent -> repo-work done -> outcome -> verdict -> actual`;
- jornada cross-repo com contrato;
- jornada operacional/standalone;
- perfil full/compact/solo;
- stale, break-glass, SoD e self-attested target.

### R3 · File backend transacional robusto

Status: ✅ aplicado.

Objetivo: provar que file-first escreve com segurança.

Critérios:

- ✅ lock curto por comando;
- ✅ event-log semântico append-only sem read-modify-write;
- ✅ replay por event-log (`idempotency-key`/`nonce`);
- ✅ marker de recovery para escrita aplicada sem evento;
- ✅ `base-revision` stale falha fechado;
- ✅ fixtures de concorrência, lock ativo, replay e crash;
- ✅ verdict real de `intent-cta-upgrade` gravado por comando em `decisions/verdicts.yml` +
  `events/events.jsonl`.

### R4 · Segundo outcome real

Status: ✅ aplicado.

Objetivo: provar que outcome/verdict/dashboard não estão hardcoded no `intent-cta-upgrade`.

Implementado:

- `intent-checkout-stack` teve suas 7 peças repo-local fechadas como `done` via `repo-work.ack`;
- `out-checkout-stack-2027h2` foi publicado via `outcome.publish`;
- o outcome cita `contract-revisions: [acme-user-context@v4]`, exercitando a dependência
  verificável de contrato;
- `check-runtime.mjs` agora falha se esse outcome ou a contract-revision sumirem.

### R5 · Operacional sem intent

Status: ⬜ a fazer.

Objetivo: provar que trabalho reativo/standalone entra no bucket operacional sem sumir do grafo.

Critérios:

- standalone repo-local com evidence;
- incidente com follow-up resolvível;
- outcome operacional sem `primary-target` de objetivo;
- dashboard mostra custo/risco fora do rollup de objectives.

### R6 · Matcher executável v3

Status: ⬜ a fazer.

Objetivo: substituir fixture/pacote de capability review por matcher real, mantendo ele advisory.

Critérios:

- consome `context.json` e manifestos v3;
- respeita trust-policy/egress/classification;
- emite `score`, `unknown`, `evidence`, `freshness`, `policy`;
- capability sem evidence/owner attestation não pesa igual;
- decisão humana registra `followed|overrode` + rationale.

### R7 · Authoring completo no app Next/MUI

Status: ⬜ a fazer.

Ordem sugerida:

1. intake/register/proposal;
2. triage com matcher/dúvidas/contratos;
3. gate/activation com diff append-only;
4. breakdown planner;
5. repo-work ack e contract revision;
6. outcome/verdict.

Critérios:

- sem edição direta de YAML pela UI;
- dry-run antes de escrita;
- resolver error vira bloqueio compreensível;
- cada card distingue valid/warning/stale/blocked/self-attested/break-glass.

### R8 · Adapters externos como evidence providers

Status: ⬜ a fazer.

Fonte: [`integration-catalog.yml`](integration-catalog.yml).

Primeiras famílias candidatas:

- API/contract schemas: OpenAPI, GraphQL, protobuf, AsyncAPI;
- CI/test reports: GitHub Actions, GitLab CI, Jenkins, JUnit, coverage;
- deploy/release evidence: Argo Rollouts, Argo CD, Flux, GitHub Deployments;
- observability/metrics: OpenTelemetry, Prometheus, Grafana, Datadog;
- FinOps/custo: cloud billing export, AWS Cost Explorer, Azure Cost Management, GCP Billing;
- code quality/security: SonarQube, Semgrep, CodeQL, OSV, Dependency-Track;
- repo ownership/catalog: CODEOWNERS, GitHub teams, Backstage;
- backlog import: Jira, Linear, Azure DevOps;
- assistant runtime: Ollama, LM Studio, LocalAI, vLLM e endpoints OpenAI-compatible;
- knowledge assistant: Onyx/Open WebUI/AnythingLLM/Dify/Khoj como busca/contexto, não autoridade;
- coding-agent channel: OpenCode, Claude Code, Codex CLI, Aider como canal optativo;
- agent gateway: classe adiada/risk-gated; só depois de delegação formal, sandbox, secrets isolation e auditoria.

### R9 · SQLite/Neo4j/Mongo transacionais

Status: ⬜ futuro, depois do file backend transacional.

Direção:

- SQLite primeiro candidato a adapter local transacional;
- Neo4j continua read-model derivado por padrão;
- Neo4j write-capable só com contrato explícito e mesma suíte do file backend;
- Mongo/event-store opcional apenas com migration registry e fail-closed.

---

## Matriz v2 -> v3

| aprendizado/feature da v2                | estado na v3                                                               | próximo passo                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `.governance/` por repo + host agregador | ✅ migrado e endurecido                                                    | manter base física.                                                                  |
| `context.json` publicado                 | ✅ migrado com freshness                                                   | adicionar envelope/ttl/producer real.                                                |
| Manifesto/capabilities                   | ✅ migrado com candidates/review packet                                    | owner-attested-by/observed-from com dente real.                                      |
| Matcher léxico/local/API                 | 🚧 conceito preservado; executor v3 ainda não existe                       | implementar R6.                                                                      |
| `_lib` DDD                               | ✅ base v3 criada + file transaction mínimo                                | próximo dente: matcher/authoring, não bypassar command runtime.                      |
| Backends file/sqlite/neo4j/mongo         | 🚧 file transacional mínimo + exemplos derivados; Neo4j loader dry-run     | R9 depois, com a mesma suíte transacional do file backend.                           |
| Read-models                              | 🚧 graph read-model v3 existe; snapshots multi-backend existem             | persistência operacional depois do file backend.                                     |
| App de autoria                           | 🚧 app Next/MUI existe com comandos principais; autoria completa ainda não | R7.                                                                                  |
| Scaffold de repo novo                    | 🚧 foco atual é adoção de repos existentes                                 | manter separado de create-new-repo.                                                  |
| `backend.yml` por repo                   | ⬜ modelado como futuro (`physical.por-repo-futuro`), sem executor         | não aceitar como evidência até existir adapter real.                                 |
| Templates v2                             | 🧊 arquivados em `_archive/templates-v2`                                   | usar `_org-simulation-v3/_templates` como fonte ativa.                               |
| q/r/d físico por work/repo               | ⬜ não migrado fisicamente                                                 | reintroduzir só quando houver comando/resolver, sem vazar histórico privado de repo. |
| Visualização                             | ✅ owner/company static apps + app Next/MUI                                | static apps são projeções; Next/MUI é superfície operacional em incubação.           |

---

## Perguntas ainda abertas

1. Qual caso operacional sem intent deve ser o primeiro: incidente, dep-bump ou bug standalone?
2. Quais adapters externos entram no primeiro spike: contracts, CI, observabilidade, ownership, assistant runtime ou deploy evidence?
3. Quando o app incubado deixa de ser sim e vira pacote do framework?

---

## Fora de escopo imediato

- transformar Jira/Linear em SSOT;
- tornar Neo4j write-capable antes do file backend transacional;
- análise estática profunda dentro do core;
- automação que fecha gate sem humano;
- BI genérico;
- editor visual de schema;
- treinar modelo próprio de IA.
