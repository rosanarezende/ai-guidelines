---
artifact-kind: research
---

# Ecossistema open-source de grafos — oportunidades

> **Frente:** Spec 0024 · work-graph-model · governance-demo
> **Data da pesquisa:** 2026-07-06
> **QRDs alvo:** QRD-39 (grafos/Neo4j/oportunidades OSS), com QRD-16 (Neo4j no 1º release como `graph-read-model`, não SSOT) e QRD-28/29 (visualização).
> **Regra:** file-first/event-log continua SSOT; read-model de grafo **não** vira SSOT sem decisão nova. Nenhum banco por inércia. Licença e lock-in avaliados com rigor.

## 1. Base verificada

**Local:**

- `model.yml` — o modelo É um grafo tipado: camadas `intent → execution-unit → repo-work`, `business-tier` recursivo (`business-objective`, `thesis`, `opportunity-area`, `target`, `metric-definition`, `outcome`, `allocation`), `support-nodes` (`contract`, `deliberation`, `intake`), `edges` com categorias (estrutura/dependência/proveniência/evidência/fecho), `envelope` fail-closed, `governance-profiles`. `physical.backend: [file, sqlite, neo4j, mongo]`; `backend-status`: "file runtime transacional aplicado; sqlite/neo4j/mongo são read-models derivados no primeiro release, não SSOT de escrita".
- `APP-DECISIONS.md` QRD-16 (Neo4j = opção de `graph-read-model` no avançado; health-check, export/rebuild, `sourceRevision`, fail-closed se stale), QRD-28/29 (React Flow+ELK p/ mapas; Sigma vs ECharts pendente p/ console técnico; TanStack Query server state).
- Backend real: `backend/src/application/queries/graph.ts` (queries de grafo derivadas), `adapters/graph-memory/`, `tools/read-models/` (export file/sqlite/neo4j/mongo + loader Neo4j dry-run).
- `_reviews/2026-07-04-visual-stack-spike.md` (medidas de render Sigma/ECharts/React Flow).

**Externas (primárias):**

- Neo4j open-core (Community GPLv3; Enterprise comercial): <https://neo4j.com/blog/news/open-core-licensing-model-neo4j-enterprise-edition/>
- Neo4j GraphQL: <https://neo4j.com/docs/graphql/current/> · GDS: <https://neo4j.com/docs/graph-data-science/current/> · APOC: <https://neo4j.com/docs/apoc/current/>
- Apache AGE: <https://age.apache.org/> · <https://github.com/apache/age>
- Kuzu (MIT, **arquivado out/2025**): <https://github.com/kuzudb/kuzu> · notícia do arquivamento: <https://biggo.com/news/202510130126_KuzuDB-embedded-graph-database-archived>
- FalkorDB (SSPLv1): <https://docs.falkordb.com/References/license.html>
- Memgraph (BSL 1.1): <https://github.com/memgraph/memgraph/blob/master/licenses/BSL.txt>
- ArangoDB (BSL 1.1 desde 3.12): <https://arango.ai/blog/update-evolving-arangodbs-licensing-model-for-a-sustainable-future/>
- ArcadeDB (Apache-2.0, multi-model, embedded): <https://arcadedb.com/> · <https://arcadedb.com/embedded.html>
- openCypher: <https://opencypher.org/> · GQL (ISO/IEC 39075:2024): padrão ISO de graph query language.

> **Confiança:** licenças de graph DB mudaram MUITO em 2023–2025. Todos os fatos de licença abaixo têm fonte; onde não abri a fonte primária do arquivo LICENSE, sinalizo.

## 2. Fatos

- **F1 — Neo4j é open-core.** Community Edition = GPLv3 (open source); Enterprise = **closed-source comercial** (código não mais público). APOC = Apache-2.0. GDS: algoritmos base GPLv3, mas a "Enterprise Edition do GDS" exige chave de licença. (Fonte: neo4j.com blog + docs GDS.)
- **F2 — Apache AGE = Apache-2.0, projeto top-level da ASF (vendor-neutral), extensão de Postgres, openCypher, suporta PG 11–18.** A empresa de origem (Bitnine) foi adquirida/renomeada, mas o projeto é governado pela ASF. (Fonte: age.apache.org + github/apache/age.)
- **F3 — Kuzu (embedded, MIT, Cypher, colunar) foi ARQUIVADO em out/2025 após aquisição pela Apple; manutenção passou a forks da comunidade (ex.: fork da Vela, RyuGraph).** (Fonte: github/kuzudb + biggo news, out/2025.)
- **F4 — Fontes "source-available" (NÃO OSI open-source):** FalkorDB = **SSPLv1**; Memgraph Community = **BSL 1.1**; ArangoDB = **BSL 1.1** desde 3.12 (Community License limita uso comercial + teto de 100 GB/cluster). (Fonte: docs/licenças respectivas.)
- **F5 — ArcadeDB = Apache-2.0, multi-model (SQL/Cypher/Gremlin/GraphQL/protocolo Mongo), embedded (JVM in-process) + client/server; fork conceitual do OrientDB; declara publicamente que "nunca mudará a licença".** Posiciona-se como substituto do Kuzu. (Fonte: arcadedb.com.)
- **F6 — O modelo já é um grafo de conhecimento/política/trabalho tipado com proveniência e fail-closed** (`model.yml`), e o backend já materializa read-models derivados (file/sqlite/neo4j/mongo) com `sourceRevision`. (Fonte: repo.)
- **F7 — openCypher e GQL (ISO/IEC 39075:2024) padronizam a linguagem de consulta de grafo;** Neo4j (Cypher), AGE, Kuzu, Memgraph, FalkorDB, ArcadeDB implementam Cypher/openCypher em graus variados. (Fonte: opencypher.org; ISO.)

## 3. Interpretação

**A oportunidade central (INTERPRETAÇÃO):** o valor do projeto **não** é "ser mais um graph DB" nem "casar com Neo4j". É ser uma **camada open-source de governança baseada em grafo, portável entre backends de grafo** — porque o SSOT é file-first e o grafo é _projeção_. Isso é raro: quase todo produto de grafo prende você ao banco. Aqui, o banco é adapter descartável. Essa é a jogada de posicionamento que QRD-39 procura.

Consequências:

- **Neutralidade de backend é feature, não acidente.** Como `model.yml` define nós/arestas tipados e o read-model é derivado, o projeto pode oferecer **exporters/adapters** para múltiplos backends (Neo4j Cypher, AGE em Postgres, ArcadeDB embedded, SQLite recursivo) sem eleger um. Isso transforma a mudança de licença dos outros (F4) em **não-problema** para o usuário: quem não pode usar BSL/SSPL usa AGE (Apache) ou file/SQLite.
- **Neo4j: manter como opção de primeira classe (QRD-16), mas com olhos abertos ao open-core (F1).** O que é gratuito e OSS: Community (GPLv3) + APOC (Apache) + Cypher + algoritmos GDS base. O que é pago/fechado: Enterprise, GDS Enterprise, Bloom. Recomendação de produto deve usar só o tier OSS e **nunca** depender de features Enterprise para o caminho feliz.
- **Apache AGE é a peça subestimada.** Como o `operational-store` já pode ser Postgres (QRD-15), AGE dá **grafo Cypher dentro do mesmo Postgres**, Apache-2.0, ASF-governed. Para `shared`/`controlled` que já rodam Postgres, isso evita subir um segundo serviço (Neo4j) só para o read-model. É o "grafo sem novo vendor".
- **Embedded local:** Kuzu era o candidato natural, mas o arquivamento (F3) é um risco de manutenção sério — **não** adotar o upstream arquivado; se quiser embedded, ArcadeDB (Apache, F5) é a aposta mais segura, ou SQLite com CTEs recursivas para grafos pequenos (o read-model já tem adapter SQLite).
- **Evitar por licença no caminho OSS default:** FalkorDB (SSPL), Memgraph (BSL), ArangoDB (BSL). Podem existir como **adapters opcionais** para quem já os usa, mas não como recomendação default (colidem com "open-source, self-hostable" — F4).
- **Não transformar o grafo em SSOT.** QRD-16 e `model.yml` são explícitos. Toda oportunidade abaixo é de _read-model/projeção/análise_, nunca de escrita autoritativa.
- **GraphRAG/knowledge-graph:** o work graph tipado + proveniência é um substrato natural para "perguntar ao grafo" (impacto de contrato, dependências, lineage de outcome). Isso conecta com o assistente (QRD-18/24) como **advisory read-only sobre projeção**, jamais como mutação.

Visualização (fecha QRD-28/29 com o que a pesquisa sustenta): a decisão já está madura no repo — **React Flow+ELK p/ stakeholder (mapas)**, **Sigma/Graphology p/ console técnico denso**, **ECharts p/ dashboards e como aba relacional opcional**. Nada na pesquisa contradiz; o pendente (Sigma vs ECharts no console) é decisão de UX da owner, não de licença (ambos permissivos: Sigma MIT, ECharts Apache-2.0).

## 4. Matriz de alternativas — backends de grafo (como read-model derivado)

| Alternativa                | Licença                    | Embedded/local           | Docker/self-host  | Cypher/GQL         | Maturidade         | Lock-in/risco                        | Aderência (read-model derivado)                              |
| -------------------------- | -------------------------- | ------------------------ | ----------------- | ------------------ | ------------------ | ------------------------------------ | ------------------------------------------------------------ |
| **Neo4j Community**        | GPLv3 (Enterprise fechado) | não (server)             | sim               | Cypher nativo      | alta               | open-core: features-chave pagas (F1) | boa como opção avançada (QRD-16); não depender de Enterprise |
| **Apache AGE**             | Apache-2.0 (ASF)           | via Postgres             | sim (extensão PG) | openCypher         | alta               | baixíssimo (vendor-neutral)          | **ótima** p/ quem já usa Postgres; "grafo sem novo serviço"  |
| **ArcadeDB**               | Apache-2.0                 | **sim (JVM in-process)** | sim               | Cypher/Gremlin/SQL | média/alta         | baixo (promessa de licença estável)  | boa p/ embedded/local; runtime JVM é fator                   |
| **SQLite (CTE recursiva)** | domínio público            | sim (já no app)          | n/a               | SQL (sem Cypher)   | alta               | nenhum                               | boa p/ grafos pequenos; já existe adapter                    |
| **Kuzu (upstream)**        | MIT                        | sim                      | n/a               | Cypher             | **arquivado (F3)** | manutenção parada; depender de fork  | **evitar upstream**; só fork community se necessário         |
| **FalkorDB**               | **SSPLv1**                 | não                      | sim               | Cypher             | alta (GraphRAG)    | source-available, não OSI (F4)       | só adapter opcional; fora do default OSS                     |
| **Memgraph**               | **BSL 1.1**                | não                      | sim               | Cypher             | alta               | source-available (F4)                | só adapter opcional                                          |
| **ArangoDB**               | **BSL 1.1**                | não                      | sim               | AQL (não Cypher)   | alta               | source-available + teto 100GB (F4)   | fora do default                                              |

## 5. Recomendação

**Decidir agora:**

1. **Posicionamento (resposta à pergunta 6):** cravar a tese "**camada de governança em grafo, portável entre backends**" como diferencial. A oportunidade OSS mais valiosa e ainda não explorada é o **conjunto de adapters/exporters de grafo neutros de vendor** derivados do `model.yml` (Cypher para Neo4j/AGE, embedded para ArcadeDB, SQLite recursivo), com `sourceRevision` e fail-closed embutidos.
2. **1º release (confirma QRD-16):** manter **Neo4j Community** como opção de `graph-read-model` no avançado **e adicionar Apache AGE** como a opção Apache-2.0 "grafo no Postgres" para stacks que já usam Postgres. Ambos consomem o mesmo export derivado.
3. **Embedded/local:** usar **SQLite (CTE recursiva)** para grafos pequenos (já existe) e registrar **ArcadeDB** como candidato embedded futuro. **Não** adotar Kuzu upstream (arquivado).
4. **Fora do default OSS:** FalkorDB/Memgraph/ArangoDB só como adapters opcionais explicitamente marcados "source-available", nunca no caminho recomendado.
5. **Visualização:** confirmar QRD-28/29 (React Flow+ELK / Sigma / ECharts). O pendente Sigma-vs-ECharts é UX, não licença.

**Manter aberto:**

- Sigma vs ECharts no console técnico (decisão de UX da owner — QRD próprio).
- ArcadeDB embedded como default local (depende de aceitar runtime JVM).
- GraphRAG/consulta assistida sobre a projeção (depende de QRD-18/24 e egress).

**Testar antes:**

- **Spike AGE:** exportar o read-model derivado para Apache AGE no mesmo Postgres do `operational-store` e rodar as mesmas queries de `graph.ts` (impacto de contrato, deps de intent, conflitos), provando paridade com o adapter Neo4j e `sourceRevision`/fail-closed idênticos. Barato e alto valor de posicionamento.

## 6. Impacto em QRDs

- **Confirmar QRD-16** (Neo4j Community como opção; não SSOT) e **estendê-lo** com Apache AGE como segunda opção OSS.
- **Avançar QRD-39 (segue research-open):** registrar a tese "portável entre backends", a matriz de licenças, o veto de Kuzu-upstream/BSL/SSPL no default, e o backlog de adapters como oportunidades OSS (issues/roadmap).
- **Fechar QRD-28/29 na parte de visualização** que a pesquisa sustenta; deixar Sigma-vs-ECharts para QRD próprio.
- **Novos contratos/checks sugeridos (não implementar nesta rodada):**
  - `ADAPTER`: exporter AGE (Cypher em Postgres) espelhando o exporter Neo4j.
  - `CHECK`: teste de paridade "mesmas queries de grafo → mesmo resultado em file/SQLite/Neo4j/AGE" com `sourceRevision`.
  - `GUARD`: read-model de grafo nunca é destino de escrita governada (reforça QRD-16 no lint).
  - `DOC`: marcar backends source-available (SSPL/BSL) como opcionais no catálogo de integrações.
