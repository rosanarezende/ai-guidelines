# Prompt - Pesquisa open-source, produto, control plane e grafos

Use este prompt em Claude/LLM de pesquisa com effort alto. O objetivo nao e
implementar produto; e produzir research versionado e bem citado para apoiar
decisoes da mantenedora.

## Papel

Voce e consultor tecnico-arquitetural senior, pesquisador de estrategia
open-source e revisor adversarial. O repositorio vence qualquer narrativa da
conversa. Separe sempre **FATO** de **INTERPRETACAO**.

Nao defenda Cloudflare, GitHub, Google, Neo4j ou qualquer stack por preferencia
previa. Compare alternativas com rigor, custo, lock-in, maturidade,
self-hosting, experiencia de contribuicao, seguranca e aderencia ao modelo
file-first/governance-first.

## Base local obrigatoria

Antes de pesquisar, confirme e registre:

- branch;
- HEAD;
- working tree;
- arquivos alterados;
- PR atual se houver informacao local/gh disponivel.

Leia nesta ordem:

1. `.governance/specs/0024-context-architecture/work-graph-model/governance-demo/APP-DECISIONS.md`
   - foco em QRD-12, QRD-13, QRD-14, QRD-15, QRD-16, QRD-24, QRD-28, QRD-29,
     QRD-36, QRD-37, QRD-38, QRD-39 e QRD-40.
2. `.governance/specs/0024-context-architecture/work-graph-model/governance-demo/APP-PRODUCT-STATEMENT.md`
3. `.governance/specs/0024-context-architecture/work-graph-model/governance-demo/APP-FUNCTIONAL-SPEC.md`
4. `.governance/specs/0024-context-architecture/work-graph-model/governance-demo/APP-ITERATION-MAP.md`
5. `.governance/specs/0024-context-architecture/work-graph-model/governance-demo/ARCHITECTURE.md`
6. `.governance/specs/0024-context-architecture/work-graph-model/governance-demo/APP-COVERAGE-MATRIX.md`
7. `.governance/specs/0024-context-architecture/work-graph-model/model.yml`
8. Estrutura real de:
   - `.governance/specs/0024-context-architecture/work-graph-model/governance-demo/`
   - `.governance/specs/0024-context-architecture/work-graph-model/research/`
   - `.governance/specs/0024-context-architecture/work-graph-model/_reviews/`

## Pesquisa externa obrigatoria

Use fontes primarias sempre que possivel. Cite links em cada arquivo gerado.
Pesquise, no minimo:

### Estrategia open-source e produto

- PostHog, GitLab, Grafana, Mattermost, Plane, Twenty, OpenProject, Appsmith,
  ToolJet, Outline, Cal.com/Cal.diy, Supabase, Appwrite.
- Como esses projetos separam core, app, CLI, self-hosting, cloud opcional,
  docs, marketplace/integracoes e comunidade.
- Open-core vs fully open-source vs hosted optional.
- Licencas, contributor experience, governance de projeto e sinais de
  maturidade.
- OpenSSF Best Practices Badge, OpenSSF OSPS Baseline, Scorecard e praticas
  de seguranca para projetos OSS.

### Control plane e contas/workspaces

Compare arquiteturas para conta, workspace registry, convites e provider links
sem armazenar conteudo governado:

- Cloudflare Pages/Workers/D1;
- Supabase;
- Appwrite;
- PocketBase;
- Postgres self-hosted;
- SQLite local/server unico;
- Ory, Zitadel, Keycloak;
- Better Auth, Auth.js;
- GitHub OAuth/GitHub Apps;
- Google OAuth/OIDC;
- apenas self-hosted, sem registry operado pela mantenedora.

Avalie custo, lock-in, free tier, self-hosting, operacao, auth, multitenancy,
seguranca, segredo/tokens, portabilidade e aderencia ao modelo:

```text
identity/control plane != governance plane != content plane
```

### Produto/nome/repositorio

Pesquise praticas de:

- repos separados versus monorepo;
- pacotes internos versus produto separado;
- naming de produto open-source;
- relacao entre framework CLI e app visual;
- como projetos OSS crescem de demo/spike para produto com identidade propria.

Responda se o trabalho atual deveria:

- continuar dentro de `work-graph-model`;
- subir para a raiz de `ai-guidelines`;
- virar repo separado agora;
- virar repo separado depois de criterios objetivos.

### Grafos, Neo4j e oportunidades open-source

Pesquise oportunidades tecnicas e de comunidade em:

- Neo4j Community/Aura;
- Neo4j GraphQL;
- APOC;
- Neo4j Graph Data Science;
- GraphRAG, knowledge graph, policy graph, work graph;
- Apache AGE;
- Kuzu;
- ArcadeDB;
- Memgraph;
- FalkorDB/RedisGraph;
- ArangoDB;
- outras opcoes relevantes de graph database e graph analytics OSS;
- React Flow, ECharts, Sigma e alternativas para visualizacao stakeholder vs
  console tecnico.

Avalie:

- licenca;
- maturidade;
- comunidade;
- compatibilidade com Cypher/GraphQL;
- embedded/local story;
- Docker/self-host story;
- performance/escala;
- uso como read-model derivado;
- risco de virar segundo SSOT;
- oportunidades para adapters/exporters/checks/issues.

### Google e open source

Pesquise especificamente:

- Google Open Source programs and services;
- Google Summer of Code;
- Season of Docs como referencia historica, se estiver encerrado;
- deps.dev/Open Source Insights e API;
- OSV e OSV-Scanner;
- Google Developer Program/GDG;
- Google Cloud Assured OSS, se relevante;
- ferramentas do Google que ajudam maintainer OSS sem obrigar Google Cloud.

Separe o que e:

- programa de comunidade/contribuicao;
- ferramenta de seguranca/supply chain;
- provider de login;
- opcao de cloud;
- referencia de docs/comunidade.

## Entregaveis obrigatorios

Crie ou atualize **apenas arquivos de research/review/docs**. Nao altere codigo
de produto, testes ou schemas nesta rodada.

Crie estes arquivos:

1. `.governance/specs/0024-context-architecture/work-graph-model/research/2026-07-06-oss-product-positioning-and-naming.md`
2. `.governance/specs/0024-context-architecture/work-graph-model/research/2026-07-06-control-plane-registry-options.md`
3. `.governance/specs/0024-context-architecture/work-graph-model/research/2026-07-06-work-graph-model-extraction-strategy.md`
4. `.governance/specs/0024-context-architecture/work-graph-model/research/2026-07-06-open-graph-ecosystem-opportunities.md`
5. `.governance/specs/0024-context-architecture/work-graph-model/research/2026-07-06-google-oss-programs-and-tools.md`
6. `.governance/specs/0024-context-architecture/work-graph-model/_reviews/2026-07-06-oss-strategy-synthesis.md`

## Estrutura minima de cada arquivo

Cada research deve conter:

1. **Base verificada**
   - arquivos locais lidos;
   - fontes externas consultadas;
   - data da pesquisa.
2. **Fatos**
   - fatos com fonte/link;
   - evitar conclusoes no meio dos fatos.
3. **Interpretacao**
   - leitura para este projeto;
   - trade-offs.
4. **Matriz de alternativas**
   - alternativa;
   - o que entrega;
   - custo/operacao;
   - lock-in;
   - self-hosting;
   - maturidade;
   - riscos;
   - aderencia ao modelo.
5. **Recomendacao**
   - o que decidir agora;
   - o que manter aberto;
   - o que testar antes.
6. **Impacto em QRDs**
   - quais QRDs devem ser fechados;
   - quais devem continuar research-open;
   - quais novos contratos/testes seriam necessarios.

## Perguntas que precisam de resposta objetiva

1. O control plane opcional deve ser operado por nos, apenas self-hosted ou
   ambos?
2. Se houver uma casca operada por nos, qual stack e mais apropriada para um
   primeiro release open-source de baixo custo e baixo lock-in?
3. `ai-guidelines` deve continuar nomeando tudo ou o app visual precisa de nome
   e repo/produto proprio?
4. O `work-graph-model` deve ser extraido, promovido para a raiz ou mantido na
   Spec 0024 por mais uma fase?
5. Como extrair sem perder historico, testes, docs e governanca?
6. Quais oportunidades em grafos/Neo4j sao mais valiosas e ainda nao
   exploradas?
7. Quais ferramentas/programas do Google valem como parte da estrategia
   open-source sem amarrar o produto a Google Cloud?
8. Quais decisoes devem bloquear implementacao e quais podem seguir como
   adapters futuros?

## Formato da sintese final

No arquivo `_reviews/2026-07-06-oss-strategy-synthesis.md`, entregue:

- veredito curto;
- decisoes recomendadas em ordem;
- decisoes que ainda nao devem ser tomadas;
- riscos P0/P1/P2;
- plano de migracao/extracao em fases;
- backlog de research/implementacao;
- matriz de "decidir agora vs pesquisar mais";
- prompt curto para a proxima rodada de implementacao, se alguma decisao ja
  estiver segura.

## Regras

- Repositorio vence memoria e narrativa.
- Nao use nomes reais de empresas internas da mantenedora.
- Nao transformar Cloudflare, Google, GitHub ou Neo4j em decisao por inercia.
- Nao propor SaaS fechado; o default mental e open-source, self-hostable e
  local-first quando possivel.
- Nao confundir control plane com governance plane nem content plane.
- Nao propor que read-model de grafo vire SSOT sem decisao explicita nova.
- Se uma fonte estiver desatualizada ou for incerta, diga.
- Use links diretos para fontes.
- Nao implemente codigo de produto nesta rodada.
