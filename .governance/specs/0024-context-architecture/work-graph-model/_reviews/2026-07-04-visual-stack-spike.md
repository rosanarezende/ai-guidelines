# Spike da stack visual da governance-demo (QRD-27)

> **Tipo:** relatório de spike comparativo (artefato de apoio, sem autoridade própria).
> **Data:** 2026-07-04.
> **Autoridade:** a decisão registrada mora em [`../governance-demo/APP-DECISIONS.md`](../governance-demo/APP-DECISIONS.md) (QRD-27/QRD-28). Este relatório é a evidência.
> **Código do spike:** `governance-demo/frontend/app/spikes/visual-stack/` (rota interna `/spikes/visual-stack`, fora da navegação de produto).

## 1. O que foi feito (FATOS)

- Criada camada de view-models independente de renderer em `frontend/app/spikes/visual-stack/_model/`:
  `GovernanceMapViewModel`, `GovernanceDashboardViewModel`, `GovernanceTableViewModel` e `GovernanceGraphViewModel`,
  derivados no servidor do read-model REAL da demo acme (`loadGovernanceSnapshot()` + `queryGraphOverview()` via `@demo/backend`).
  Nenhuma lib visual lê YAML/event-log; todos os candidatos consomem o MESMO view-model serializável.
- Criada fixture sintética tipada e reprodutível (`_model/synthetic-fixture.ts`): PRNG mulberry32 com seed fixa
  (`FIXTURE_SEED = 20260704`, sem `Math.random`), gerando grafos de ~1k/~3k nós, tabelas de 2k/10k linhas e séries por ciclo.
- Implementados 11 candidatos isolados em `_candidates/` com moldura comum (`CandidatePanel`: pacote, licença,
  status de render/hydration observado no cliente, error boundary e notas).
- Criada tela comparativa `/spikes/visual-stack` com matriz candidato × superfície, toggle de dataset
  (real × fixture), fallback textual (mapa e grafo) e notas de UX/perf/licença/SSR/lock-in por candidato.
- Dependências instaladas no workspace `acme-governance-next-app` (0 vulnerabilidades reportadas pelo npm):
  `@xyflow/react@12.11.1`, `elkjs@0.11.1`, `echarts@6.1.0`, `@mui/x-charts@9.8.0`, `@mui/x-data-grid@9.8.0`,
  `@tanstack/react-table@8.21.3`, `@tanstack/react-query@5.101.2`, `ag-grid-community@36.0.0`, `ag-grid-react@36.0.0`,
  `sigma@3.0.3`, `graphology@0.26.0`, `graphology-layout-forceatlas2@0.10.1`, `reagraph@4.32.0`.
- Verificação executada: `tsc --noEmit` do frontend limpo; `node tools/checks/check-governance-app.ts` passou
  (guards + typecheck strict do backend + testes do shell + `next build --webpack`), saída:
  `✓ governance app — TypeScript/MUI build + snapshot (174 nós · 374 arestas · 25 integrações · rev 03296990bfcd)`.
- Verificação em navegador (dev server, porta 3024): todas as seções renderam com chip `hidratado sem erro`;
  interações exercitadas (tabs, datasets, dry-runs, filtros).
- Cytoscape NÃO foi instalado, importado, citado como fallback nem sugerido — permanece banido (QRD-27).

## 2. Matriz candidato × superfície

| Superfície              | Candidato                                                | Licença               | Veredito do spike                                                |
| ----------------------- | -------------------------------------------------------- | --------------------- | ---------------------------------------------------------------- |
| Mapa de governança      | **React Flow (`@xyflow/react` 12) + ELK (`elkjs` 0.11)** | MIT + EPL-2.0 (elkjs) | **Recomendado**                                                  |
| Mapa de governança      | ECharts `graph` (camadas fixas)                          | Apache-2.0            | Não recomendado para a superfície                                |
| Dashboards              | **MUI X Charts 9 (Community)**                           | MIT                   | **Recomendado (primário)**                                       |
| Dashboards              | Apache ECharts 6 (wrapper próprio)                       | Apache-2.0            | Alternativa aprovada (casos que o Community não cobre)           |
| Tabelas / data grid     | **MUI X Data Grid 9 (Community)**                        | MIT                   | **Recomendado**                                                  |
| Tabelas / data grid     | TanStack Table 8 (headless)                              | MIT                   | Alternativa (tabelas pequenas customizadas)                      |
| Tabelas / data grid     | AG Grid Community 36                                     | MIT                   | Alternativa (não adotar como padrão)                             |
| Grafo técnico / console | **Sigma.js 3 + Graphology 0.26**                         | MIT                   | **Recomendado**                                                  |
| Grafo técnico / console | Reagraph 4                                               | Apache-2.0            | Não recomendado para a superfície                                |
| Grafo técnico / console | ECharts `graph` (force)                                  | Apache-2.0            | Alternativa p/ visualizações auxiliares; não substitui o console |
| Server state            | **TanStack Query 5**                                     | MIT                   | **Recomendado**                                                  |

## 3. Evidências por superfície

### 3.1 Mapas de governança (React Flow + ELK × ECharts)

FATOS observados:

- React Flow renderizou o mapa real por objetivo (ex.: `obj-efficiency`, 27 nós, revisão `03296990bfcd`) com nós
  100% React/MUI: chips de confiança (`verified`/`pending`/`self-declared`/`break-glass`), risco, evidência
  (`attestation-collapse.reason`, fontes de outcome), próximo passo (regra `next` da intent) e CTA navegável.
- Layout ELK (`layered`, direção RIGHT) rodou pós-mount em dezenas de ms para mapas guiados; skeleton cobre o intervalo.
- Sem hydration warning no App Router (React Flow 12 suporta SSR oficialmente; usamos client-side com medição pós-mount).
- ECharts `graph` com camadas fixas renderizou o mesmo view-model, mas nó = símbolo+label: copy vira tooltip,
  CTA não existe, e a leitura permanece de "grafo técnico" — falha os critérios 2 e 6 do QRD-27.

INTERPRETAÇÃO: React Flow + ELK entrega a experiência guiada para stakeholder; ECharts não compete nessa superfície.

Pontos de atenção: `elkjs` é EPL-2.0 (weak copyleft por arquivo) — ok como dependência não modificada em produto
Apache-2.0, mas registrar; o bundle `elk.bundled.js` é pesado (~1.4MB pré-gzip) e pode ir para web worker; a
atribuição "React Flow" no canvas permanece visível (removê-la pede apoio financeiro ao projeto — manter visível).

### 3.2 Dashboards (MUI X Charts × ECharts)

FATOS observados:

- Ambos cobriram: linha, área, barras empilhadas por estado de confiança por ciclo, gauge de atingimento,
  target vs actual e drill-down série → ponto → outcomes/fontes (com selo válido/inválido por outcome).
- Scorecards e targets vêm do read-model REAL; as séries densas vêm da fixture porque os valores reais da acme são
  simbólicos ("+X%", "-Z%") — o read-model real hoje quase não tem série numérica (achado de dados, não de lib).
- MUI X Charts herdou o tema MUI sem adapter; drill via `onMarkClick` funcionou. ECharts precisou de wrapper
  próprio (~90 linhas, sem `echarts-for-react`) e replicação manual de paleta/fonte; tooltip/legenda mais ricas.
- Licença (pricing oficial MUI): Community cobre line/bar/stacked/area/scatter/pie/gauge/radar/sparkline+zoom/pan;
  **heatmap, funnel, sankey e treemap são Pro (pagos)**. ECharts é Apache-2.0 integral.
- Warning real encontrado no wrapper: `resize` síncrono dentro de ResizeObserver dispara
  `[ECharts] resize should not be called during main process` — resolvido adiando para `requestAnimationFrame`.

INTERPRETAÇÃO: MUI X Charts como primário (coerência de design system + tipagem por props); ECharts permanece
aprovado como complemento quando a necessidade cair no tier Pro do MUI (funil/heatmap/sankey) ou em séries muito longas.

### 3.3 Tabelas / data grids (MUI X Data Grid × TanStack Table × AG Grid Community)

FATOS observados:

- Os três renderizaram as MESMAS colunas canônicas (id, tipo, título, responsável, time, repos, ciclo, status,
  confiança, risco, próximo passo, contrato, fonte) com pills, no dataset real (22 linhas) e na fixture (2k/10k linhas).
- MUI X Data Grid Community: toolbar pronta (filtro, visibilidade de colunas, densidade, export CSV), seleção,
  paginação. Limite honesto (pricing oficial): **página máxima de 100 linhas no Community**; column virtualization,
  header filters, resize/reorder de coluna, row grouping/pivot/tree/Excel são Pro/Premium.
- TanStack Table: o básico exigiu ~190 linhas de UI própria; sem virtualização embutida (página de 500 pesa;
  exigiria `@tanstack/react-virtual`).
- AG Grid Community 36: virtualização excelente com 10k linhas; **Columns Tool Panel/sidebar/row grouping/pivot/
  Excel export são Enterprise** (docs oficiais) — a visibilidade de colunas teve que ser recriada em menu MUI;
  Theming API aproxima do MUI mas não fica idêntico.

INTERPRETAÇÃO: MUI X Data Grid Community atende o caminho principal do QRD-27 sem depender de feature paga;
AG Grid só se justificaria se grids muito grandes sem paginação virarem requisito (e traria pressão Enterprise);
TanStack fica para tabelas pequenas sob medida.

### 3.4 Grafo técnico / console (Sigma.js + Graphology × Reagraph × ECharts)

FATOS observados (mesmo view-model: acme real 174 nós/374 arestas e fixtures ~1k e ~3k nós):

- Sigma.js: fixture de 3.000 nós/5.153 arestas com ForceAtlas2 síncrono em **405ms** (main thread; acme real: 17ms);
  navegação WebGL fluida; reducers deram dimming/realce de seleção, vizinhança e caminho. **Achado de SSR:** o módulo
  `sigma` referencia `WebGL2RenderingContext` na avaliação do import e **quebra o SSR do dev server** — precisa entrar
  via `dynamic(ssr:false)`, igual ao Reagraph.
- Reagraph: exige `dynamic(ssr:false)` e traz three.js para o bundle; com 3k nós renderizou, mas com assentamento
  visivelmente mais lento; warnings `THREE.Clock: deprecated` no console; API declarativa agradável; sem motor de análise.
- ECharts `graph` force: com `layoutAnimation:false` e 3k nós o cálculo síncrono **congelou a main thread**
  (página irresponsiva ~30s+); com `layoutAnimation:true` + render progressivo ficou usável, mas seleção/realce
  programático é mais limitado que os reducers do Sigma.
- Filtros (tipo/owner/time/ciclo/confiança/status/contrato/fonte), vizinhança (BFS 2 saltos), menor caminho,
  contract-impact e intent-deps foram implementados no view-model (`graph-ops.ts`) e funcionam idênticos nos três
  candidatos — a lib não decide nada; o backend continua dono das queries reais (`/api/graph/*`).

INTERPRETAÇÃO: Sigma.js + Graphology para o console técnico (graphology ainda rende algoritmos/metrics reutilizáveis);
ECharts responde a pergunta 10 do QRD-27: serve para visualizações auxiliares amigáveis, não para o console denso;
Reagraph não compensa o custo three.js sem trazer motor de grafo. AntV G6 (benchmark secundário) não foi acionado
porque o spike primário não falhou.

### 3.5 Server state (TanStack Query)

FATOS observados (contra a API local real):

- Cache por chave `[workspace, rota, filtros]`; alternar filtro de tipo já visitado voltou instantâneo (cache hit).
- `sourceRevision`/`projectedAt`/`derived:true` da resposta expostos como chips; `isStale` (staleTime 30s) visível.
- Mutation (dry-run governado) → `invalidateQueries` por prefixo do workspace → refetch observado na rede.
- Fail-closed comprovado ponta a ponta: dry-run com `base-revision` atual → **200 `ok:true` com receipt**;
  com revisão forjada → **422 `command-stale: base-revision "revisao-antiga-forjada" diverge da revisão atual "03296990bfcd"`**.
  O runtime releu o SSOT no servidor; o cache do cliente nunca decidiu nada.
- Encaixe App Router: QueryClient por provider client-side funcionou; a doc oficial recomenda, para a fatia de
  produto, prefetch em Server Components + `HydrationBoundary` (não exercitado aqui de propósito).

INTERPRETAÇÃO: adotar TanStack Query quando as telas saírem do read-only, com a regra de chave
`[workspace, recurso, sourceRevision/filtros]` e invalidation pós-mutation. Optimistic UI só com rollback honesto.

## 4. Riscos e limitações do spike

- Fixture sintética tem topologia plausível mas não reproduz a densidade de arestas de uma org real grande;
  os números de performance são indicativos, não benchmark formal.
- Interações verificadas em dev server (webpack build passou; produção não foi servida para clique-a-clique).
- Acessibilidade coberta no nível "fallback textual + navegação básica"; auditoria a11y formal não foi feita.
- Séries numéricas reais quase não existem no host da acme; quando outcomes reais numéricos existirem, o drill-down
  real deve ser re-exercitado.
- MUI X v9 Community limita página do grid a 100 linhas — se listas operacionais precisarem de scroll infinito real,
  a decisão da superfície de tabela precisa ser revisitada (Pro ou AG Grid).
- ELK roda na main thread; para mapas grandes mover para web worker.

## 5. Fontes consultadas

- React Flow SSR/SSG (suporte oficial desde v12): <https://reactflow.dev/learn/advanced-use/ssr-ssg-configuration>
- React Flow layout ELK: <https://reactflow.dev/examples/layout/elkjs>
- Apache ECharts (graph/série/dataset): <https://echarts.apache.org/> e <https://apache.github.io/echarts-handbook/en/concepts/dataset/>
- MUI X pricing/feature split (Data Grid e Charts, Community × Pro × Premium): <https://mui.com/pricing/>
- MUI X Charts: <https://mui.com/x/react-charts/> · MUI X Data Grid: <https://mui.com/x/react-data-grid/>
- AG Grid licenciamento (Community MIT × Enterprise): <https://www.ag-grid.com/react-data-grid/licensing/>
- AG Grid Columns Tool Panel (Enterprise): <https://www.ag-grid.com/react-data-grid/tool-panel-columns/>
- TanStack Query Advanced SSR (App Router/RSC): <https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr>
- TanStack Table: <https://tanstack.com/table/latest>
- Sigma.js: <https://www.sigmajs.org/> · Graphology: <https://graphology.github.io/>
- Reagraph: <https://reagraph.dev/>
- Versões/licenças/peer deps conferidas no registro npm em 2026-07-04 (`npm view <pkg> version license peerDependencies`).

## 6. Recomendação

Registrar em `APP-DECISIONS.md` (QRD-28): React Flow+ELK (mapas), MUI X Charts primário + ECharts complementar
(dashboards), MUI X Data Grid (tabelas), Sigma.js+Graphology (grafo técnico) e TanStack Query (server state).
Único ponto deliberadamente NÃO cravado: o par dashboards fica com regra de uso (Community-first, ECharts quando o
tier Pro seria exigido), porque a evidência não sustenta exclusividade de uma única lib para todos os gráficos.
