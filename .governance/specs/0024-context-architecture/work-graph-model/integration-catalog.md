# Catálogo de integrações externas

> **Autoridade:** [`model.yml`](model.yml) é o SSOT do modelo. O catálogo versionado vive em
> [`integration-catalog.yml`](integration-catalog.yml).

## Princípio

O framework funciona sem integrações externas.

Integrações existem para aproveitar ferramentas que a empresa já usa, reduzir preenchimento
manual, trazer evidência independente e acelerar adoção. Elas não substituem o SSOT file-first,
não fecham gate, não aceitam verdict, não alteram actual e não autorizam mutação fora do comando
governado.

Em uma frase:

> Ferramenta externa observa. O framework resolve e governa. Humano confirma decisões relevantes.

## Tipos de adapter

| tipo                   | papel                                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| `evidence-provider`    | coleta sinais externos normalizados como evidência governada                  |
| `work-importer`        | importa backlog existente como proposal/register ou link de origem            |
| `identity-provider`    | resolve pessoas, times, grupos, authority e SoD                               |
| `metric-provider`      | fornece fonte, janela, revision e valor para outcome/actual                   |
| `contract-provider`    | extrai interfaces, revisions, providers, consumers e breaking-change evidence |
| `read-model-exporter`  | publica grafo/dashboard derivado para consulta externa                        |
| `assistant-provider`   | gera sugestões assistivas com score, unknown, evidence e policy               |
| `assistant-runtime`    | executa modelos locais/cloud por política de egress                           |
| `knowledge-assistant`  | busca/RAG corporativo para contexto, anexos e stale-doc                       |
| `coding-agent-channel` | canal optativo para agentes/CLIs de código proporem patch/review              |
| `agent-gateway`        | classe agentiva adiada/risk-gated, não habilitada por padrão                  |

## Prioridades

**P0 — adoção e evidência central**

- Git provider / CODEOWNERS;
- API schemas: OpenAPI, GraphQL, protobuf, AsyncAPI;
- CI, JUnit, coverage e relatórios de teste;
- observabilidade: OpenTelemetry, Prometheus, Grafana, Datadog;
- analytics/warehouse/dbt;
- assistant runtime local/cloud: Ollama, LM Studio, LocalAI, vLLM e endpoints compatíveis;
- Neo4j como read-model/export de grafo.

**P1 — adoção organizacional e operação**

- backlog import: Jira, Linear, Azure DevOps, GitHub Issues;
- identity/directory: Okta, Entra ID, Google Workspace, GitHub teams;
- incident tools: PagerDuty, Opsgenie, incident.io;
- deploy/release evidence: Argo Rollouts, Argo CD, Flux, GitHub Deployments;
- FinOps/custo: cloud billing export, AWS Cost Explorer, Azure Cost Management, GCP Billing;
- feature flags/experimentation: LaunchDarkly, GrowthBook, Statsig, Optimizely, Unleash;
- service catalog: Backstage, OpsLevel, Cortex;
- quality/security: SonarQube, Semgrep, CodeQL, OSV-Scanner, OSV.dev, deps.dev,
  Dependency-Track;
- knowledge assistants: Onyx, Open WebUI, AnythingLLM, Dify, Khoj;
- coding-agent channels: OpenCode, Claude Code, Codex CLI, Aider.

**P2 — enriquecimento**

- design system: Figma, Storybook, Chromatic;
- knowledge base: Confluence, Notion, Drive/SharePoint.

**Deferred — risk-gated**

- agent gateways amplos, como OpenClaw, ficam fora do caminho padrão até existirem delegação
  formal, sandbox, isolamento de secrets, TTL, limite de mutações, aprovação humana e auditoria.

## Projeção de release e backlog

A primeira integração cloud real além de autenticação é **GitHub como work-source/repo provider**.
Isso é separado de `github-oauth`: login responde quem é a pessoa; GitHub work-source responde quais
repos, PRs, commits, checks, CODEOWNERS e arquivos de governança podem alimentar o grafo.

Para a release 1, GitHub work-source deve:

- listar organizações/repos autorizados;
- permitir selecionar repos para governança;
- ler default branch, commits, PRs, checks, CODEOWNERS e `.governance/`;
- publicar `sourceTrust: provider-versioned`;
- nunca criar authority automaticamente a partir do login;
- nunca escrever estado autoritativo sem comando governado.

### Mapa por ponto do fluxo

| Ponto do fluxo          | Integrações de maior valor                                                             | Uso no app                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Onboarding              | GitHub work-source, identity/directory, assistant runtime, service catalog             | reduzir atrito, explicar o que será manual vs integrado                      |
| Fontes de trabalho      | GitHub/GitLab/Bitbucket/Gitea, CODEOWNERS, Backstage/OpsLevel/Cortex, Drive/SharePoint | descobrir repos, owners, capabilities, source revisions e contexto           |
| Assistente e matcher    | Ollama, OpenAI-compatible, LiteLLM, Onyx/Open WebUI, Claude Code/Codex CLI             | sugerir matches, perguntas, resumo, policy e patches sem virar autoridade    |
| Planejamento e outcomes | BigQuery/Snowflake/dbt, PostHog/Amplitude, cloud billing, Prometheus/Grafana           | provar actual, target, janela, aggregation e attester                        |
| Execução                | CI, JUnit/coverage/Playwright, SonarQube/Semgrep/CodeQL, OSV/deps.dev, deploy/release  | provar done, testes, qualidade, supply-chain, rollout, rollback e risco      |
| Contratos               | OpenAPI, GraphQL, protobuf, AsyncAPI, Pact                                             | materializar interfaces versionadas e compatibilidade provider/consumer      |
| Incidentes/operação     | OpenTelemetry/Prometheus/Grafana, PagerDuty/Opsgenie/incident.io                       | declarar incidente com evento, severidade, timeline e follow-up verificáveis |
| Intake/backlog          | Jira, Linear, Azure DevOps, GitHub Issues, knowledge base                              | importar trabalho existente como proposal/register ou link, sem segundo SSOT |
| Grafo/read-model        | Neo4j, Graphistry, custom graph API                                                    | explorar impacto e dependências sem autorizar ação a partir do read-model    |

### Copy de UI

A tela de integrações deve mostrar explicitamente:

```text
Já disponível: Assistente local, Git local, CI local, qualidade local, segurança de dependências local, observabilidade local e Neo4j como read-model.
Primeira integração cloud da release 1: GitHub como fonte de trabalho.
Disponíveis em breve: GitLab, Bitbucket, OpenAPI/GraphQL, Jira/Linear, BigQuery/dbt, PostHog/Amplitude, PagerDuty, SonarQube/Semgrep e Backstage.
```

O texto precisa ser honesto: `em breve` significa backlog priorizado, não mecanismo ativo.

## Contrato mínimo

Todo adapter precisa declarar:

- que nó/aresta alimenta;
- qual evidência produz;
- qual revisão da fonte observou;
- quando falha fechado;
- quem confirma a sugestão;
- o que ele nunca pode decidir sozinho.

Se uma integração não consegue responder isso, ela ainda é conveniente demais e governada de menos.

Seis itens tiveram o spike mínimo mecanizado durante a incubação Guilda
(campo `local-adapter` no YAML):
`assistant-runtime-local-cloud` → `assistant-ollama` (health/models por `/api/tags` loopback +
advisory local com redação mínima), `git-provider` → `git-local` (revision/status/último commit via
git CLI), `ci-status` → `ci-local` (executa o `test.mjs` do repo e reporta exit code real),
`code-quality` (relatório local Sonar-compatível hash-verificado; endpoint remoto só com allowlist
de egress), `code-security` (relatório OSV/deps.dev hash-verificado, produzido por scanner local/CI
fora do estado autoritativo) e `observability` (relatório do `acme-obs-stack` hash-verificado,
declarado fixture).
Todos falham fechado — egress negado, evidência adulterada ou dependência ausente nunca viram
sucesso textual. O código que provava esses adapters está preservado em
`_archive/guilda-incubation-2026-07/`; a evolução executável agora pertence ao repo Guilda.

Assistentes entram pelo mesmo contrato: podem sugerir, resumir, procurar contexto ou propor patch,
mas não viram fonte da verdade. O framework precisa conseguir rodar sem eles e precisa degradar para
humano/local quando classificação ou egress bloquearem o provedor escolhido.

## Projeção no app

O produto Guilda deve projetar este catálogo em duas camadas:

1. **Hub dedicado `/integrations`:** inventário central para comparar, conectar, testar, desativar
   e explicar providers. Cada card deve mostrar o que o framework já entrega sem a integração, o que
   melhora, dados acessados, permissões exigidas, quem pode solicitar, quem aprova, riscos,
   limitações, health/probe, forma de desativar e se escreve estado autoritativo.
2. **Sugestões contextuais por fluxo:** cada tela deve sugerir poucas integrações quando elas
   elevam confiança ou reduzem trabalho manual naquele ponto. Exemplo: `/sources` sugere GitHub ou
   Drive; `/results` sugere observabilidade/analytics; `/work` sugere CI/code quality.

Settings pode resumir integrações, mas não deve ser o único lugar. O que ainda não tem mecanismo
aparece como `em breve`, não como controle efetivo. `Em breve` significa backlog priorizado, não
integração ativa.

Configuração real futura precisa virar comando governado: escolher perfil, sponsor, authority,
egress policy, source provider ou assistant runtime altera risco de governança e não pode ser apenas
estado de UI. Login externo também não concede membership, authority nem acesso a repos
automaticamente.
