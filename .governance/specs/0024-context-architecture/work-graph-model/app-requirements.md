# Requisitos do App de Governança Ponta-a-Ponta

> **Status:** proposta de requisitos para a próxima fatia de backend/frontend da Spec 0024.
> **Autoridade:** o modelo tipado continua em [`model.yml`](model.yml). Este documento traduz o modelo para requisitos de produto, dados, arquitetura e robustez do app.
> **Contexto:** a v2 provou `_lib`, portas, adapters e app de autoria. A v3 provou o substrato repo-first, resolvers fail-closed, red-team e dashboards estáticos. O app alvo deve unir os dois sem reintroduzir taxonomia antiga nem controles cerimoniais.

## 1. Objetivo

Construir uma aplicação utilizável de ponta a ponta por stakeholders, lideranças, produto, engenharia e donos de plataforma para governar o trabalho como grafo tipado, mantendo o repo como memória portável e permitindo assistência por IA em cada etapa sem delegar decisão à IA.

O app deve cobrir a cadeia:

```text
business-objective → target → intake → triage → gate → intent → execution-unit
→ repo-work/repo-ack → contract/outcome/incident → dashboard/verdict
```

O app não é um substituto genérico de Jira/Linear/BI. Ele é a superfície operacional do modelo file-first: escreve comandos governados, valida invariantes, deriva projeções e mostra onde a evidência é forte, fraca, stale ou ausente.

## 2. Princípios obrigatórios

1. **File-first, database-derived:** YAML/JSON governado é SSOT. Bancos e dashboards são projeções derivadas.
2. **Comando antes de mutação:** a UI nunca edita YAML diretamente; ela envia comandos com envelope.
3. **Resolver antes de exibir como verdade:** número, status, match, capability, contrato e decisão só aparecem como "válidos" depois de resolver fail-closed.
4. **IA como canal assistivo:** IA sugere, resume, detecta drift e monta rascunhos. Humano confirma, edita ou rejeita.
5. **Confiança visível:** self-attested, collapsed SoD, break-glass, stale, unverified e unknown aparecem no dashboard; nunca são escondidos.
6. **Escala colapsável:** o mesmo produto deve servir full-team, compact e solo por perfil de governança, sem impor cerimônia inútil nem permitir bypass silencioso.
7. **Sem segundo SSOT:** Neo4j/SQLite/Mongo/search index nunca viram fonte autoritativa de ação. Toda ação relê a revisão fonte antes de escrever.

## 3. Personas e permissões

| Persona                      | Precisa fazer                                                                    | Precisa ver                                                 | Não deve poder fazer sozinha                             |
| ---------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| Stakeholder executivo        | acompanhar objetivos, targets, outcomes, riscos e badges de confiança            | dashboard agregado, narrativa, decisões perigosas pendentes | alterar actual, capability, contrato ou verdict          |
| Liderança de produto/negócio | criar objectives/targets, autorizar intake, aprovar gate de intent               | funil, allocation, aging, impacto no target                 | atestar actual se também definiu target                  |
| PM/Owner de intent           | registrar problema, consolidar intent, aceitar verdict                           | triage, breakdown, outcome, blockers                        | substituir evidência técnica por texto                   |
| Tech Lead/Principal          | triagem, matcher, breakdown, contratos, review de risco                          | capacidades, contratos, dependências cross-repo             | aprovar sozinho mutação ruler-authority em perfil full   |
| Dev/Time de repo             | publicar manifest/context, reconhecer repo-work, evidenciar done/blocked/dropped | peças do repo, contratos consumidos/providos, drift         | mudar breakdown central sem comando no host              |
| Dono de contrato             | revisar revision proposal, compatibility-window, consumers                       | fila de contenção e impacto                                 | aceitar revisão com consumers omitidos                   |
| Dados/Analytics              | definir metric-definition, atestar actual/outcome                                | fontes, revisions, rollup                                   | atestar target próprio sem collapse logado               |
| SRE/Ops                      | declarar incidente, severidade, mitigação, follow-up                             | SLO, incidentes, operational bucket                         | usar incident para furar fila sem telemetria verificável |
| Auditor/Segurança            | revisar envelopes, policies, egress, red-team                                    | trilha append-only, diffs, badges, break-glass              | editar o fato auditado que está revisando                |

## 4. Modelo de dados operacional

### 4.1 Entidades autoritativas

O backend deve modelar, no mínimo:

- `BusinessObjective`: objetivo recursivo com `level`, `period`, `owner`, `status`, `continues-from`, `cascades-to`.
- `MetricDefinition`: definição estável de métrica, fonte, unidade, agregação e owner.
- `Target`: binding de métrica, período, expected, definer, attester, status e colapso de atestação quando houver.
- `Thesis` e `OpportunityArea`: contexto causal e área opcional de ataque.
- `Proposal` e `Register`: intake pré-intent com `authorized-by` ou `standalone` declarado.
- `Triage`: itens, disposição, matcher-run, contratos relevantes, gaps de informação e viabilidade.
- `GateDecision`: decisão append-only de ativar/descartar/reverter.
- `Intent`: objetivo de trabalho ativado, `approach`, `signal`, `primary-target`, thesis, decision-rule e vínculos.
- `ExecutionUnit`: unidade cross-repo com kind final do `model.yml`, lifecycle próprio e verdict quando aplicável.
- `RepoWork`: peça executável por repo, com `purpose`, dimensões, status e vínculos.
- `RepoWorkAck`: publicação repo-local de reconhecimento, lifecycle e evidência.
- `Contract`: nó versionado com owner, consumers, interface, revision proposals e compatibility-window.
- `Outcome`: evento governado que alimenta actual apenas se resolver válido.
- `Incident`: instrumento reativo central com severidade, telemetria, postmortem e follow-ups.
- `Deliberation`: q/r/d anexável a qualquer nó, com decisions supersedíveis.
- `Authority`, `ProfileDeclaration`, `TrustPolicy`: autoridade resolvível, perfil, egress, ACL, revogação, quarantine e oráculo.
- `RepoContext`: publicação por repo com capabilities, contracts, consumers, freshness, producer e evidence.
- `AssistantSuggestion`: saída de IA/matcher, sempre versionada com input, policy, evidence, score, unknown e decisão humana posterior.

### 4.2 Entidades derivadas/read-models

O backend deve gerar projeções, não persistir como verdade:

- `GraphReadModel`: nós e arestas tipadas para navegação.
- `DashboardReadModel`: objectives, targets, actuals, confidence badges, allocation e operational bucket.
- `QueueReadModel`: intake, triage, gates, contract contentions, incidents, break-glass reviews e stale publications.
- `RepoReadModel`: visão por repo de work, contracts, capability drift e evidence gaps.
- `TimelineReadModel`: histórico append-only de comandos, decisions, reversals e generated projections.
- `AssistantAuditReadModel`: sugestões aceitas/rejeitadas, overrides, prompt/egress policy e unknowns.

### 4.3 Identidade e referências

- Todo nó usa `GlobalRef family:namespace/id#anchor@revision` quando cruza fronteira.
- Toda deleção lógica gera tombstone.
- Reparenting, promote/discard, fork, split/merge e yearly rollover são comandos idempotentes, não renome manual.
- Ref resolvível é pré-condição para comando que dependa dela.

## 5. Arquitetura backend

### 5.1 Camadas

```text
UI / API
  → Command handlers
  → Domain model + policies + resolvers
  → Ports
      HostGovernanceRepository
      ProductRepoProjectionRepository
      PublishedProjectionStore
      EventLogStore
      ReadModelStore
      AssistantGateway
      PolicyStore
  → Adapters
      file
      sqlite
      neo4j
      mongo
      local-llm
      external-llm
```

### 5.2 Command pipeline

Todo comando passa pela mesma esteira:

1. Parse + schema fechado.
2. Envelope obrigatório: actor, authority, base-revision, idempotency-key, nonce, issued-at, classification, source-commit quando aplicável.
3. Authorization e SoD.
4. Resolver de refs e policy.
5. Invariantes de domínio.
6. Dry-run com diff humano.
7. Escrita append-only ou arquivo canônico.
8. Rebuild de read-model afetado.
9. Auditoria e emissão de notifications.

Comando sem tipo conhecido, sem ref resolvível, com base stale ou com authority revogada falha fechado.

### 5.3 Portas mínimas

```ts
interface HostGovernanceRepository {
  loadNode(ref: GlobalRef): Promise<Node | null>;
  listNodes(query: NodeQuery): Promise<Node[]>;
  appendCommand(command: GovernedCommand): Promise<CommandReceipt>;
  writeCanonicalNode(node: Node, receipt: CommandReceipt): Promise<void>;
  tombstone(ref: GlobalRef, receipt: CommandReceipt): Promise<void>;
}

interface ProductRepoProjectionRepository {
  listRepos(): Promise<RepoSummary[]>;
  loadManifest(repo: RepoId): Promise<Manifest>;
  loadContext(repo: RepoId): Promise<RepoContext>;
  loadRepoWorkAcks(repo: RepoId): Promise<RepoWorkAck[]>;
  loadRepoContracts(repo: RepoId): Promise<RepoContract[]>;
}

interface ReadModelStore {
  rebuild(scope: ProjectionScope): Promise<ProjectionReceipt>;
  getGraph(scope: GraphScope): Promise<GraphReadModel>;
  getDashboard(scope: DashboardScope): Promise<DashboardReadModel>;
  getQueues(scope: QueueScope): Promise<QueueReadModel>;
}

interface AssistantGateway {
  suggest(request: AssistantRequest): Promise<AssistantSuggestion>;
}
```

### 5.4 Backends plugáveis

| Backend | Uso correto                                                       | Restrições                                                 |
| ------- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| File    | modo solo/local, PR review, bootstrap, testes determinísticos     | lock curto, merge conflict visível, read-model pequeno     |
| SQLite  | app local/team pequeno, transações reais, fila e projection cache | ainda deriva de arquivos/event-log, não vira SSOT          |
| Neo4j   | consulta de grafo, impacto cross-repo, dashboards complexos       | read-only por padrão; comandos relêem fonte file/event-log |
| Mongo   | event/read-model flexível para artefatos heterogêneos             | schema versionado e migrations fail-closed                 |

O domínio não pode depender do adapter. Trocar backend não pode alterar o resultado dos resolvers nem os comandos aceitos.

### 5.5 Event-log e arquivos canônicos

O app deve manter dois planos:

- **Arquivos canônicos:** estado materializado legível no repo (`acme-governance/*`, `repos/<repo>/.governance/*`).
- **Event-log semântico:** comandos append-only que explicam por que o arquivo mudou.

Git sozinho não basta como log transacional: ele registra bytes, não intenção de domínio. O event-log é obrigatório para idempotência, replay, reversão de gate, auditoria e conflito concorrente.

## 6. Arquitetura frontend

### 6.1 Estrutura de produto

O app deve ter módulos navegáveis por audiência:

1. **Executive Dashboard:** objectives, targets, actuals, confidence badges, allocation, operational bucket e narrative rollup.
2. **Portfolio Planning:** criação/revisão de objectives, targets, theses, opportunity areas, allocation e yearly rollover.
3. **Intake Workspace:** proposal/register, anexos, business-link, perguntas abertas e autoria assistida.
4. **Triage Workspace:** itens, matcher, capabilities, contracts, dispositions, needs-info e viabilidade.
5. **Gate & Activation:** diff de promoção/descarte, decision append-only, rationale, override de matcher e SoD.
6. **Breakdown Planner:** execution-units, repo-works, dependencies, contract touches, release/rollback, ownership e collapse/reparent.
7. **Repo Work Board:** visão por repo/time, lifecycle, evidence, done/blocked/dropped e stale acks.
8. **Contract Coordination:** fila de contentions, revision proposals, compatibility windows, consumers e approvals.
9. **Experiment/Outcome Center:** verdicts, decision-rule, guardrails, outcomes, target contribution e forks.
10. **Incident/Ops Center:** incidents, telemetry refs, mitigations, postmortems, follow-ups e operational bucket.
11. **Capability & Adoption Center:** repos existentes, scaffold, capability extraction, context freshness e owner attestation.
12. **Policy/Audit Center:** authority registry, profile declarations, break-glass, egress, red-team, replay/nonce e dangerous-unreviewed.

### 6.2 UX por perfil de governança

- **Full:** mostra SoD completo, filas separadas e blockers normativos.
- **Compact:** colapsa papéis com badges e revisão retroativa em cadência.
- **Solo:** reduz cerimônia para self-log, mas preserva histórico, badges e warnings.

O perfil muda a obrigatoriedade e o bloqueio, não o modelo de dados.

### 6.3 Estados visuais obrigatórios

Cada tela que mostra resultado derivado deve distinguir:

- valid
- warning
- stale
- blocked
- invalid
- self-attested
- collapsed
- break-glass
- unknown
- unverified

Não pode haver card verde para dado que o resolver marcou como fraco.

## 7. Assistência por IA

### 7.1 Regras globais

- Toda assistência é opcional.
- Toda saída de IA é `AssistantSuggestion`, não mutação.
- Toda sugestão carrega input hash, model/provider/locality, policy, classification, evidence, confidence, unknown e expires-at.
- Prompt injection é esperado; texto de usuário, capability e anexo são input hostil.
- Egress externo só recebe fatias aprovadas por policy; fallback local/manual é rastreável.
- Aceitar sugestão cria comando humano com referência à sugestão aceita.

### 7.2 Assistências por etapa

| Etapa                   | Assistência permitida                                                              | Dente obrigatório                                         |
| ----------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Planejamento            | sugerir estrutura de objective/target/thesis a partir de texto livre               | humano define; IA alerta drift, não bloqueia              |
| Métrica                 | detectar unidade/agregação incompatível, fonte ausente, target sem attester        | resolver de metric-definition/target                      |
| Intake                  | transformar descrição em register/proposal, extrair dúvidas, sugerir authorized-by | business-link validado no gate                            |
| Triage                  | matcher de repos/contratos/capabilities                                            | score, unknown, evidence, freshness, threshold            |
| Investigation/discovery | sugerir pergunta falsificável, timebox, stop-rule                                  | fate obrigatório e loop-budget                            |
| Breakdown               | sugerir execution-units/repo-works/owners/deps                                     | humano confirma; refs e owners resolvem                   |
| Contract impact         | detectar consumers, breaking change e compatibility-window                         | owner do contrato aprova revision proposal                |
| Repo adoption           | extrair capabilities de código/docs                                                | owner-attested-by independente ou capability vira unknown |
| Outcome                 | checar janela, fonte, unidade, aggregation e contrato derivado                     | outcome resolver fail-closed                              |
| Incident                | sugerir timeline/postmortem/follow-ups                                             | telemetria ref verificável e severidade não textual       |
| Dashboard               | gerar narrativa executiva                                                          | narrativa não altera actual nem rollup                    |
| Q/R/D                   | rascunhar research/decision                                                        | decision humana append-only                               |

## 8. Requisitos funcionais

### 8.1 Planejamento e dashboard

- Criar, revisar, fechar e versionar objectives por ciclo.
- Criar targets com metric-definition, expected, attester e allocation.
- Visualizar rollup por objective, com actual derivado apenas de outcomes válidos.
- Mostrar continuidade anual (`continues-from`, split, merge) sem migrar schema.
- Mostrar operational bucket para trabalho sem objective.

### 8.2 Intake até gate

- Criar proposal/register com `authorized-by` ou `standalone`.
- Permitir anexos com classificação, scan e política de egress.
- Gerar triage items a partir de dúvidas do negócio e itens de engenharia.
- Rodar matcher em modo lexical/local/external conforme policy.
- Registrar se o gate seguiu ou contrariou matcher, com rationale.
- Promover/descartar por comando idempotente e append-only.

### 8.3 Breakdown e execução

- Criar execution-unit quando a scaling-law exigir.
- Colapsar/reabrir unit de forma reversível.
- Gerar repo-work por repo, purpose e dimensões.
- Publicar repo-work-ack nos repos e detectar stale/missing/open/dropped.
- Bloquear outcome quando peça necessária não estiver `done`.

### 8.4 Contratos

- Listar contratos providos/consumidos por repo.
- Detectar quando uma intent toca contrato.
- Criar revision proposal quando houver contenção ou breaking change.
- Validar consumers, owner approval e compatibility-window.
- Projetar impacto cross-intent por contrato compartilhado.

### 8.5 Outcomes e verdicts

- Publicar outcome com fonte, janela, métrica, value, aggregation, attester, revision, contracts e envelope.
- Resolver outcome antes de somar em target.
- Aceitar verdict de experiment-run apenas com outcome válido ou override perigoso.
- Criar forks `graduation`, `cleanup` ou novo `experiment/discovery` conforme verdict.

### 8.6 Incidentes e operação

- Declarar incident apenas com telemetria/severidade verificável.
- Acompanhar declarar → mitigar → resolver → postmortem.
- Gerar follow-ups para standalone/proposal com referência reversa.
- Mostrar custo/risco operacional no dashboard.

### 8.7 Adoção de repos existentes

- Descobrir repos e criar sidecar mínimo sem sobrescrever.
- Gerar pacote de capability review.
- Permitir patch assistido por IA para manifest, nunca aplicar sem owner.
- Publicar context.json com freshness e producer.
- Detectar capability inflada, omitida ou stale por evidência estática e histórico.

## 9. Requisitos não funcionais

### 9.1 Segurança e privacidade

- Classificação obrigatória em nós sensíveis e anexos.
- Secret scanning antes de persistir/publicar.
- ACL por edge/query no host, não só egress externo.
- Policy de egress por taint/classification.
- Agent delegation com principal humano, workload-id, escopo, TTL, max-mutations e revogação.
- Nenhum token/chave em YAML versionado.

### 9.2 Concorrência e consistência

- Todo comando exige `base-revision`.
- Conflito concorrente falha com diff de rebase humano.
- Idempotency-key e nonce impedem replay.
- Read-model deve declarar source revision.
- Ação a partir de dashboard stale é bloqueada até reler fonte.

### 9.3 Auditabilidade

- Dangerous mutations aparecem em fila própria.
- q/r/d é alerta/soft-mandatory conforme perfil, não decoração.
- Break-glass tem TTL, reviewer e retro-review.
- Toda assistência aceita/rejeitada é rastreável.
- Export de auditoria por nó, por comando e por target.

### 9.4 Performance e escala

- Modo local deve abrir rápido em file backend.
- Host enterprise deve indexar N repos incrementalmente por content hash.
- Projeções devem ser reconstruídas por escopo afetado, não por full scan obrigatório.
- Matcher deve suportar cache por context revision e policy revision.
- Graph UI deve paginar/agrupar por objective, repo, contract e risk.

### 9.5 Operabilidade

- Health checks de adapters, policy store, read-model freshness e assistant gateways.
- Migrations versionadas e fail-closed.
- Backup/replay do event-log.
- Observabilidade de comandos: latency, validation failures, stale rate, matcher unknown rate, assistant acceptance rate.

## 10. API mínima

### 10.1 Commands

- `POST /commands/objective.create`
- `POST /commands/target.define`
- `POST /commands/intake.register`
- `POST /commands/triage.save`
- `POST /commands/gate.decide`
- `POST /commands/intent.activate`
- `POST /commands/breakdown.apply`
- `POST /commands/repo-work.ack`
- `POST /commands/contract.propose-revision`
- `POST /commands/outcome.publish`
- `POST /commands/verdict.accept`
- `POST /commands/incident.declare`
- `POST /commands/policy.break-glass`

Cada resposta retorna `CommandReceipt`, arquivos/projeções afetados e warnings/blocks.

### 10.2 Queries

- `GET /graph`
- `GET /dashboards/company`
- `GET /dashboards/objective/:id`
- `GET /queues/intake`
- `GET /queues/triage`
- `GET /queues/contracts`
- `GET /queues/incidents`
- `GET /repos/:id`
- `GET /nodes/:globalRef`
- `GET /audit/:globalRef`

### 10.3 Assistant

- `POST /assist/objective`
- `POST /assist/intake`
- `POST /assist/triage-match`
- `POST /assist/breakdown`
- `POST /assist/capability-extraction`
- `POST /assist/contract-impact`
- `POST /assist/outcome-check`
- `POST /assist/dashboard-narrative`

Endpoints de assistência nunca escrevem estado. Eles retornam `AssistantSuggestion`.

## 11. Critérios de aceite da primeira implementação

### Slice 1 — runtime v3

- Domínio v3 tipado sem `WorkKind` antigo.
- Portas v3 implementadas com adapter file.
- Comando com envelope, base-revision, idempotency e nonce.
- Reuso dos resolvers da v3 atual como biblioteca, não scripts soltos.
- `validate.mjs` e red-team continuam passando.

### Slice 2 — authoring app

- UI cria proposal/register, triage, gate, intent e breakdown sem editar YAML direto.
- Matcher lexical/local funcionando com contrato `score/unknown/evidence/freshness`.
- Dry-run de gate mostra arquivos e projeções afetadas.
- Rejeita comando stale ou sem authority resolvida.

### Slice 3 — dashboards

- Dashboard mostra objective → target → actual derivado.
- Outcome inválido/stale/self-attested não soma, mas aparece com badge.
- Operational bucket mostra standalone e incidents.
- Ação iniciada no dashboard relê source revision antes de escrever.

### Slice 4 — repo adoption

- App conduz adoção de repo existente.
- Capability extraction gera sugestão revisável.
- Owner attestation vira comando.
- Context freshness e repo-work/contract publication aparecem por repo.

### Slice 5 — backend plugável

- SQLite implementa as mesmas portas e passa a mesma suíte.
- Neo4j é read-model de grafo ou adapter explícito, sem virar SSOT de ação.
- Mongo/event-store opcional só entra com migration registry e fail-closed.

## 12. Falsificações obrigatórias

Antes de considerar o app robusto, a suíte deve provar que:

- YAML com chave desconhecida falha.
- Ação via read-model stale falha.
- IA sugere repo sem evidence e a ação não passa.
- Capability inflada não atestada vira unknown.
- Registro com prompt injection não altera policy/classification.
- Outcome sem revision ou com aggregation divergente não soma.
- Self-attested target sem colapso logado falha.
- Break-glass vencido continua bloqueando.
- Contract contention sem decision não deixa rollout seguir.
- Standalone fora do repo correto falha.
- Agent delegation revogada não executa comando.
- External LLM proibido por classification exige fallback rastreável.

## 13. Fora de escopo inicial

- Substituir Jira/Linear como tracker universal.
- BI genérico com exploração livre de dados.
- Editor visual completo de graph schema.
- Automação que fecha gate sem humano.
- Escrita direta em repo de produto sem PR/hook/policy.
- Treinar modelo próprio de IA.

## 14. Perguntas abertas

1. O app operacional deve morar dentro desta spec como sim avançada ou virar pacote do framework?
2. O primeiro backend transacional deve ser SQLite ou event-log file + lock?
3. Neo4j deve ser adapter write-capable ou read-model estritamente derivado?
4. O authoring app deve começar como web app local ou CLI TUI com UI depois?
5. Quais dangerous mutations entram em bloqueio hard no perfil compact?
6. Qual é o limite entre capability extraction aceitável e análise estática de código que vira ferramenta separada?

## 15. Estado da decisão Opção A

Decisão executada na base da v3: portar a `_org-simulation-v2/_lib` para uma runtime DDD v3 antes
de iniciar UI/API nova.

- **Opção A adotada:** `_org-simulation-v3/_lib` agora contém domínio/validador,
  `FileGovernanceRepository`, command dry-run e read-model de grafo.
- **Opção B:** criar backend HTTP fino sobre os scripts v3 atuais e refatorar depois.
- **Motivo:** a opção B acelera tela, mas cristaliza scripts como domínio e repete o erro que a v3
  acabou de expor: texto/projeção parecendo mecanismo.
- **Estado complementar:** `_org-simulation-v3/_examples/backends/` agora contém exemplos derivados
  nos quatro formatos (`file`, `neo4j`, `sqlite`, `mongo`), gerados por runtime e verificados por
  `export-backend-examples --check`.
- **Próxima decisão:** implementar escrita real por comandos/event-log e escolher o primeiro backend
  transacional (`file` com lock/event-log ou SQLite) sem transformar banco/read-model em SSOT.
