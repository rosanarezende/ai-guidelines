// findings.ts — notas do spike por candidato (dados da tela comparativa).
// RODADA 2 (2026-07-04): reconciliado com a validação de produto da owner.
// São OBSERVAÇÕES do spike, não decisão final: a autoridade é APP-DECISIONS.md
// (QRD-27/28/29); o relatório versionado fica em _reviews/.
import type { CandidateMeta } from "../../_candidates/shared/CandidatePanel";

export type CandidateFinding = CandidateMeta & {
  surface: "map" | "dashboard" | "table" | "graph" | "server-state";
  ux: string;
  performance: string;
  licensing: string;
  ssr: string;
  lockIn: string;
  limitations: string;
  verdict:
    | "recomendado"
    | "provável primário — pendente de confirmação"
    | "alternativa"
    | "pendente de decisão"
    | "não recomendado para a superfície";
};

export const FINDINGS: CandidateFinding[] = [
  {
    id: "map-react-flow",
    surface: "map",
    name: "React Flow + ELK",
    packages: "@xyflow/react 12 + elkjs 0.11",
    license: "MIT + EPL-2.0 (elkjs)",
    ux: "Nó é componente React/MUI completo (copy, confiança, risco, evidência, CTA). Rodada 2 adicionou o que a owner apontou como faltante: tooltips, filtros (tipo/confiança/risco/time/contrato), busca, foco de vizinhança, painel de detalhe e legenda.",
    performance:
      "Layout ELK em dezenas de ms para mapas guiados (10–60 nós); elkjs bundled ~1.4MB no chunk (mover para web worker se o mapa crescer).",
    licensing:
      "MIT no renderer; elkjs EPL-2.0 (weak copyleft por arquivo) — ok como dependência não modificada; atribuição React Flow visível no canvas.",
    ssr: "Sem hydration warning no App Router; layout assíncrono pós-mount com skeleton.",
    lockIn: "Baixo: consome GovernanceMapViewModel; filtros/busca/foco vivem no view-model.",
    limitations:
      "Flash de skeleton durante o layout; opções avançadas do ELK têm curva de aprendizado.",
    verdict: "recomendado",
  },
  {
    id: "map-echarts",
    surface: "map",
    name: "ECharts (visualização relacional opcional)",
    packages: "echarts 6",
    license: "Apache-2.0",
    ux: "Leitura relacional compacta com tooltip/legenda prontas sobre o MESMO view-model filtrado. Não compete com o mapa guiado: nó não vira card rico nem CTA — papel reconciliado como ABA OPCIONAL (validação da owner).",
    performance:
      "Canvas 2D leve para mapas pequenos; sem custo de layout (camadas calculadas por nós).",
    licensing: "Apache-2.0, sem restrições para self-hosted.",
    ssr: "Init pós-mount (SSR-safe); sem hydration warning.",
    lockIn: "Baixo (mesmo view-model; option JSON).",
    limitations:
      "Copy vira tooltip; interação guiada (próximo passo clicável) não existe dentro do chart.",
    verdict: "alternativa",
  },
  {
    id: "dashboard-echarts",
    surface: "dashboard",
    name: "Apache ECharts",
    packages: "echarts 6 (wrapper próprio fino)",
    license: "Apache-2.0",
    ux: "Preferido na validação da owner. Tooltip/legenda/interações maduras; gauge/funil/sankey nativos sem tier pago; rodada 2 cobre target vs actual, outcomes por ciclo, confiança empilhada, breakdown por objetivo e drill por clique.",
    performance:
      "Canvas com render progressivo: melhor teto para séries longas e dashboards densos.",
    licensing: "Apache-2.0 completo, sem tier pago (heatmap/funil/sankey inclusos).",
    ssr: "Init pós-mount (SSR-safe); wrapper próprio fino substitui echarts-for-react.",
    lockIn: "Baixo: option é JSON serializável; wrapper próprio de ~100 linhas.",
    limitations:
      "Tema MUI replicado manualmente (paleta/fonte via wrapper); tipagem do option é larga; confirmar em telas reais antes de fechar como primário.",
    verdict: "provável primário — pendente de confirmação",
  },
  {
    id: "dashboard-mui-x",
    surface: "dashboard",
    name: "MUI X Charts",
    packages: "@mui/x-charts 9 (Community)",
    license: "MIT",
    ux: "Tema MUI nativo e composição por props; cobre os mesmos gráficos da rodada 2, mas tooltip/drill são menos ricos que os do ECharts (percepção confirmada pela owner).",
    performance: "SVG: ok no porte da governança; pesa antes do ECharts em séries longas.",
    licensing:
      "Community MIT cobre line/bar/stacked/area/gauge/radar+zoom; heatmap, funnel, sankey e treemap são Pro (pagos).",
    ssr: "SSR-safe no App Router; sem hydration warning.",
    lockIn: "Baixo-médio: atrelado ao ciclo de release do MUI X.",
    limitations: "Funil/heatmap são Pro; formatação fina de tooltip limitada.",
    verdict: "alternativa",
  },
  {
    id: "table-tanstack",
    surface: "table",
    name: "TanStack Table + MUI (headless)",
    packages: "@tanstack/react-table 8",
    license: "MIT",
    ux: "Preferido na validação da owner: 100% componentes MUI (headless ≠ UI inconsistente). Rodada 2 adicionou filtros REAIS por coluna (tipo/status/confiança/risco), mantendo sort/paginação/densidade/seleção/visibilidade.",
    performance:
      "Sem virtualização embutida: páginas de 500 linhas pesam; produção com listas grandes exige @tanstack/react-virtual (custo conhecido e aceito).",
    licensing: "MIT integral.",
    ssr: "SSR-safe (headless).",
    lockIn:
      "Mínimo em lib; a UI é nossa (custo de manutenção fica no nosso código, sob nosso controle).",
    limitations:
      "Toolbar/export/etc são código próprio; virtualização é dependência extra a validar na tela real.",
    verdict: "provável primário — pendente de confirmação",
  },
  {
    id: "table-mui-x",
    surface: "table",
    name: "MUI X Data Grid",
    packages: "@mui/x-data-grid 9 (Community)",
    license: "MIT",
    ux: "Toolbar pronta (filtro/colunas/densidade/CSV) e pills via renderCell; menos controle fino de markup que o TanStack+MUI.",
    performance:
      "Community força paginação com página máxima de 100 linhas; column virtualization é Pro.",
    licensing:
      "Community MIT cobre sorting/filtro/paginação/seleção/densidade/CSV; página >100 linhas, header filters, resize/reorder, grouping/pivot/tree/Excel são Pro/Premium.",
    ssr: "SSR-safe; sem hydration warning.",
    lockIn: "Médio: API de colunas própria do MUI X.",
    limitations:
      "Sem scroll infinito no Community; filtros persistíveis exigem serializar state próprio.",
    verdict: "alternativa",
  },
  {
    id: "table-ag-grid",
    surface: "table",
    name: "AG Grid Community",
    packages: "ag-grid-community/react 36",
    license: "MIT (Community)",
    ux: "Grid mais completo em interação, mas o visual nunca fica 100% MUI e o tool panel de colunas pronto é Enterprise.",
    performance: "Virtualização excelente; 10k linhas sem esforço.",
    licensing:
      "Community MIT; columns tool panel, row grouping, pivot, Excel export e sidebar são Enterprise (pagos).",
    ssr: "SSR-safe com módulos registrados no cliente.",
    lockIn: "Médio-alto: API grande e pressão natural para Enterprise.",
    limitations: "Só se justifica se scroll infinito em listas muito grandes virar requisito.",
    verdict: "alternativa",
  },
  {
    id: "graph-sigma",
    surface: "graph",
    name: "Sigma.js + Graphology",
    packages: "sigma 3 + graphology 0.26",
    license: "MIT",
    ux: "Console técnico: reducers dão dimming/realce finos (vizinhança/caminho/impacto/deps); rodada 2 adicionou busca e agrupamento por tipo. UI de filtros é 100% nossa (MUI).",
    performance:
      "WebGL: 3k nós/5.1k arestas com ForceAtlas2 ~405ms (main thread; 17ms no real); fixture ~6k disponível na bancada.",
    licensing: "MIT (ecossistema graphology idem).",
    ssr: "Módulo referencia WebGL2RenderingContext no import: exige dynamic(ssr:false) — achado do spike.",
    lockIn: "Baixo: graphology é estrutura de dados neutra (métricas/algoritmos reutilizáveis).",
    limitations:
      "API imperativa; labels somem em densidade alta por design. Decisão final do console pende de validação da owner com os novos filtros.",
    verdict: "pendente de decisão",
  },
  {
    id: "graph-echarts",
    surface: "graph",
    name: "ECharts graph (visualização amigável)",
    packages: "echarts 6",
    license: "Apache-2.0",
    ux: "Mais amigável/menos console (tooltip/legenda prontas, coerente com dashboards); rodada 2 adicionou agrupamento por tipo (layout none) e busca via seção. Realce programático segue mais limitado que reducers do Sigma.",
    performance:
      "Canvas 2D progressivo segura ~1-2k nós; force síncrono congela a main thread em 3k (mitigado com layoutAnimation); acima disso degrada antes do Sigma.",
    licensing: "Apache-2.0.",
    ssr: "Init pós-mount; SSR-safe.",
    lockIn: "Baixo (option JSON; mesma lib dos dashboards).",
    limitations:
      "Sem estrutura de grafo (ops vivem no view-model); melhor como visualização amigável do que como console denso.",
    verdict: "pendente de decisão",
  },
  {
    id: "graph-reagraph",
    surface: "graph",
    name: "Reagraph — REMOVIDO da bancada (rodada 2)",
    packages: "reagraph 4 (desinstalado)",
    license: "Apache-2.0",
    ux: "Rejeitado na validação da owner; visual 3D-ish menos sóbrio para auditoria. Removido da bancada e do package.json na rodada 2.",
    performance: "Custo three.js aparecia antes do Sigma na fixture grande; assentamento lento.",
    licensing: "Apache-2.0.",
    ssr: "Não sobrevive a SSR (dynamic ssr:false) + three.js (~600KB+) no bundle.",
    lockIn: "Médio; sem motor de análise de grafo.",
    limitations: "Sem evidência forte a favor; rejeitado salvo novo QRD com justificativa.",
    verdict: "não recomendado para a superfície",
  },
  {
    id: "server-state-tanstack-query",
    surface: "server-state",
    name: "TanStack Query (o React Query atual)",
    packages: "@tanstack/react-query 5",
    license: "MIT",
    ux: "Aprovado pela owner. isStale/isFetching viram chips honestos; queryKey [workspace, recurso, filtro] visível na bancada; invalidation por prefixo casa com workspace/sourceRevision.",
    performance: "Cache por chave elimina refetch ao alternar filtros já visitados.",
    licensing: "MIT.",
    ssr: "QueryClient por provider client-side ok no App Router; prefetch RSC + HydrationBoundary ficam para a fatia de produto.",
    lockIn: "Baixo-médio: hooks localizados nos componentes de dados.",
    limitations:
      "É SERVER state: não substitui banco, Context API, Zustand/Redux nem o SSOT; optimistic UI só com rollback honesto.",
    verdict: "recomendado",
  },
];

export function findingById(id: string): CandidateFinding {
  const finding = FINDINGS.find((entry) => entry.id === id);
  if (!finding) throw new Error(`finding desconhecido: ${id}`);
  return finding;
}
