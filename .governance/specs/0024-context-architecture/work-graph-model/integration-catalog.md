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
- quality/security: SonarQube, Semgrep, CodeQL, OSV, Dependency-Track;
- knowledge assistants: Onyx, Open WebUI, AnythingLLM, Dify, Khoj;
- coding-agent channels: OpenCode, Claude Code, Codex CLI, Aider.

**P2 — enriquecimento**

- design system: Figma, Storybook, Chromatic;
- knowledge base: Confluence, Notion, Drive/SharePoint.

**Deferred — risk-gated**

- agent gateways amplos, como OpenClaw, ficam fora do caminho padrão até existirem delegação
  formal, sandbox, isolamento de secrets, TTL, limite de mutações, aprovação humana e auditoria.

## Contrato mínimo

Todo adapter precisa declarar:

- que nó/aresta alimenta;
- qual evidência produz;
- qual revisão da fonte observou;
- quando falha fechado;
- quem confirma a sugestão;
- o que ele nunca pode decidir sozinho.

Se uma integração não consegue responder isso, ela ainda é conveniente demais e governada de menos.

Assistentes entram pelo mesmo contrato: podem sugerir, resumir, procurar contexto ou propor patch,
mas não viram fonte da verdade. O framework precisa conseguir rodar sem eles e precisa degradar para
humano/local quando classificação ou egress bloquearem o provedor escolhido.
