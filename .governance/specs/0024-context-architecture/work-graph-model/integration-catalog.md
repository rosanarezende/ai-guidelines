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

| tipo                  | papel                                                                         |
| --------------------- | ----------------------------------------------------------------------------- |
| `evidence-provider`   | coleta sinais externos normalizados como evidência governada                  |
| `work-importer`       | importa backlog existente como proposal/register ou link de origem            |
| `identity-provider`   | resolve pessoas, times, grupos, authority e SoD                               |
| `metric-provider`     | fornece fonte, janela, revision e valor para outcome/actual                   |
| `contract-provider`   | extrai interfaces, revisions, providers, consumers e breaking-change evidence |
| `read-model-exporter` | publica grafo/dashboard derivado para consulta externa                        |
| `assistant-provider`  | gera sugestões assistivas com score, unknown, evidence e policy               |

## Prioridades

**P0 — adoção e evidência central**

- Git provider / CODEOWNERS;
- API schemas: OpenAPI, GraphQL, protobuf, AsyncAPI;
- CI, JUnit, coverage e relatórios de teste;
- observabilidade: OpenTelemetry, Prometheus, Grafana, Datadog;
- analytics/warehouse/dbt;
- Neo4j como read-model/export de grafo.

**P1 — adoção organizacional e operação**

- backlog import: Jira, Linear, Azure DevOps, GitHub Issues;
- identity/directory: Okta, Entra ID, Google Workspace, GitHub teams;
- incident tools: PagerDuty, Opsgenie, incident.io;
- feature flags/experimentation: LaunchDarkly, GrowthBook, Statsig, Optimizely, Unleash;
- service catalog: Backstage, OpsLevel, Cortex;
- quality/security: SonarQube, Semgrep, CodeQL, OSV, Dependency-Track.

**P2 — enriquecimento**

- design system: Figma, Storybook, Chromatic;
- knowledge base: Confluence, Notion, Drive/SharePoint.

## Contrato mínimo

Todo adapter precisa declarar:

- que nó/aresta alimenta;
- qual evidência produz;
- qual revisão da fonte observou;
- quando falha fechado;
- quem confirma a sugestão;
- o que ele nunca pode decidir sozinho.

Se uma integração não consegue responder isso, ela ainda é conveniente demais e governada de menos.
