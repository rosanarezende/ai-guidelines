// findings.ts — notas do spike por candidato (dados da tela comparativa).
// São OBSERVAÇÕES do spike, não decisão final: a autoridade de decisão é o
// QRD-27 em APP-DECISIONS.md; o relatório versionado fica em _reviews/.
import type { CandidateMeta } from "../../_candidates/shared/CandidatePanel";

export type CandidateFinding = CandidateMeta & {
  surface: "map" | "dashboard" | "table" | "graph" | "server-state";
  ux: string;
  performance: string;
  licensing: string;
  ssr: string;
  lockIn: string;
  limitations: string;
  verdict: "recomendado" | "alternativa" | "não recomendado para a superfície";
};

export const FINDINGS: CandidateFinding[] = [
  {
    id: "map-react-flow",
    surface: "map",
    name: "React Flow + ELK",
    packages: "@xyflow/react 12 + elkjs 0.11",
    license: "MIT + EPL-2.0 (elkjs)",
    ux: "Nó é componente React/MUI completo: copy, chips de confiança, risco, evidência e CTA reais. Linguagem de produto, não de console.",
    performance:
      "Layout ELK roda em ~dezenas de ms para mapas guiados (10–60 nós); elkjs bundled pesa ~1.4MB no chunk do cliente (dá para mover para web worker).",
    licensing:
      "MIT no renderer; elkjs é EPL-2.0 (weak copyleft por arquivo) — ok como dependência não modificada em produto Apache-2.0; atribuição React Flow visível no canvas (removível apenas com apoio ao projeto).",
    ssr: "Renderiza no App Router sem warning de hydration; layout assíncrono entra pós-mount com skeleton.",
    lockIn:
      "Baixo: consome GovernanceMapViewModel; trocar renderer = trocar 2 arquivos de candidato.",
    limitations:
      "Posições dependem de layout assíncrono (flash de skeleton); ELK avançado exige aprender layoutOptions.",
    verdict: "recomendado",
  },
  {
    id: "map-echarts",
    surface: "map",
    name: "ECharts graph (comparativo leve)",
    packages: "echarts 6",
    license: "Apache-2.0",
    ux: "Nó é símbolo+label: sem card rico, sem CTA clicável, copy vira tooltip. Continua parecendo grafo técnico, não fluxo guiado.",
    performance:
      "Canvas 2D leve para mapas pequenos; sem custo de layout (camadas calculadas por nós).",
    licensing: "Apache-2.0, sem restrições para self-hosted.",
    ssr: "Init pós-mount (SSR-safe); sem hydration warning.",
    lockIn: "Baixo (mesmo view-model), mas empurra UX para tooltip/formatter strings HTML.",
    limitations:
      "Não atende o critério de nós ricos com CTA; interação guiada (próximo passo clicável) teria que ser reconstruída fora do chart.",
    verdict: "não recomendado para a superfície",
  },
  {
    id: "dashboard-mui-x",
    surface: "dashboard",
    name: "MUI X Charts",
    packages: "@mui/x-charts 9 (Community)",
    license: "MIT",
    ux: "Tema MUI nativo (mesma tipografia/cores do app sem adapter); composição declarativa por props; drill via onMarkClick funciona mas é menos rico que eventos do ECharts.",
    performance:
      "SVG: séries do porte da governança ok; séries muito longas tendem a pesar antes do ECharts (canvas).",
    licensing:
      "Community MIT cobre line/bar/stacked/area/scatter/pie/gauge/radar/sparkline + zoom/pan; heatmap, funnel, sankey e treemap são Pro (pagos).",
    ssr: "Componentes React SSR-safe no App Router; sem hydration warning.",
    lockIn: "Baixo-médio: fica atrelado ao ciclo de release do MUI X; view-model isola a troca.",
    limitations:
      "Funil nativo é Pro; formatação fina de tooltip é menos flexível que formatter do ECharts.",
    verdict: "recomendado",
  },
  {
    id: "dashboard-echarts",
    surface: "dashboard",
    name: "Apache ECharts",
    packages: "echarts 6 (wrapper próprio fino)",
    license: "Apache-2.0",
    ux: "Tooltip/legenda/interações muito maduras; gauge/funil/sankey nativos; tema MUI precisa ser replicado manualmente (paleta/fonte via wrapper).",
    performance:
      "Canvas com render progressivo: melhor teto para séries longas e dashboards densos.",
    licensing: "Apache-2.0 completo, sem tier pago.",
    ssr: "Init pós-mount (SSR-safe); wrapper próprio de ~90 linhas substitui echarts-for-react.",
    lockIn: "Baixo: option é JSON serializável; wrapper fino próprio.",
    limitations:
      "Option object gigante e imperativo; tipagem do option é larga (unions enormes), menos segura que props do MUI X.",
    verdict: "alternativa",
  },
  {
    id: "table-mui-x",
    surface: "table",
    name: "MUI X Data Grid",
    packages: "@mui/x-data-grid 9 (Community)",
    license: "MIT",
    ux: "Toolbar pronta (filtro, colunas, densidade, export CSV), pills via renderCell, visual 100% MUI sem CSS frágil.",
    performance:
      "10k linhas ok no spike, mas o Community força paginação com página de no máx. 100 linhas; column virtualization é Pro.",
    licensing:
      "Community MIT cobre sorting/filtro/quick filter/paginação/seleção/densidade/CSV; página >100 linhas, header filters, resize/reorder de coluna, row grouping/pivot/tree/Excel são Pro/Premium.",
    ssr: "SSR-safe; sem hydration warning.",
    lockIn:
      "Médio: API de colunas própria do MUI X; mitigado pelas colunas canônicas no view-model.",
    limitations:
      "Sem scroll infinito no Community (paginação obrigatória ≤100/página); filtros persistíveis exigem serializar o state próprio do grid.",
    verdict: "recomendado",
  },
  {
    id: "table-tanstack",
    surface: "table",
    name: "TanStack Table (headless)",
    packages: "@tanstack/react-table 8",
    license: "MIT",
    ux: "Controle total do markup MUI, mas TODA a UI (toolbar, menus, paginação, virtualização) é código nosso — o spike já precisou de ~190 linhas para o básico.",
    performance:
      "Sem virtualização embutida: página de 500 linhas já pesa; exigiria @tanstack/react-virtual.",
    licensing: "MIT integral.",
    ssr: "SSR-safe (headless).",
    lockIn: "Mínimo em lib, máximo em código próprio a manter.",
    limitations:
      "Custo de manutenção alto para superfície de grid operacional densa; melhor guardar para tabelas pequenas customizadas.",
    verdict: "alternativa",
  },
  {
    id: "table-ag-grid",
    surface: "table",
    name: "AG Grid Community",
    packages: "ag-grid-community/react 36",
    license: "MIT (Community)",
    ux: "Grid mais completo em interação (filtros por coluna excelentes); Theming API aproxima do MUI, mas nunca fica idêntico ao design system.",
    performance: "Virtualização excelente; 10k linhas sem esforço.",
    licensing:
      "Community MIT; column tool panel, row grouping, pivot, export Excel e sidebar são Enterprise (pagos) — o caminho principal não pode depender deles.",
    ssr: "SSR-safe com módulos registrados no cliente; sem hydration warning.",
    lockIn: "Médio-alto: API própria grande; pressão natural para features Enterprise.",
    limitations:
      "Visibilidade de colunas pronta (tool panel) é Enterprise — recriada via menu MUI no spike.",
    verdict: "alternativa",
  },
  {
    id: "graph-sigma",
    surface: "graph",
    name: "Sigma.js + Graphology",
    packages: "sigma 3 + graphology 0.26",
    license: "MIT",
    ux: "Console técnico legítimo: reducers dão dimming/realce finos de vizinhança/caminho; sem componentes prontos de UI (tudo MUI nosso).",
    performance:
      "WebGL: fixture de milhares de nós navega fluida após ForceAtlas2 (~centenas de ms em main thread; dá para mover para worker).",
    licensing: "MIT (ecosistema graphology idem).",
    ssr: "O módulo sigma referencia WebGL2RenderingContext no import: NÃO sobrevive a SSR — exige dynamic(ssr:false), igual ao Reagraph (achado do spike).",
    lockIn:
      "Baixo: graphology é estrutura de dados neutra e reaproveitável (métricas, algoritmos).",
    limitations:
      "API imperativa (fora do modelo React); labels somem em densidade alta por design.",
    verdict: "recomendado",
  },
  {
    id: "graph-reagraph",
    surface: "graph",
    name: "Reagraph",
    packages: "reagraph 4 (three.js/WebGL)",
    license: "Apache-2.0",
    ux: "API React declarativa agradável (selections, foco, temas prontos); visual 3D-ish menos sóbrio para auditoria.",
    performance:
      "Aguenta centenas/poucos milhares com animação desligada, mas o custo three.js aparece antes do Sigma na fixture grande.",
    licensing: "Apache-2.0.",
    ssr: "NÃO sobrevive a SSR: exige dynamic(ssr:false); traz three.js (~600KB+) para o bundle.",
    lockIn:
      "Médio: formato próprio de nodes/edges e tema; menos primitivas de grafo que graphology.",
    limitations:
      "Sem motor de análise (caminhos/vizinhança ficam por nossa conta de qualquer forma); bundle pesado.",
    verdict: "não recomendado para a superfície",
  },
  {
    id: "graph-echarts",
    surface: "graph",
    name: "ECharts graph (série force)",
    packages: "echarts 6",
    license: "Apache-2.0",
    ux: "Mais amigável/menos console: tooltip e legenda prontas, coerente com dashboards; seleção/realce programático é mais limitado que reducers do Sigma.",
    performance:
      "Canvas 2D progressivo segura ~1-2k nós; na fixture grande o force layout degrada antes do Sigma (WebGL).",
    licensing: "Apache-2.0.",
    ssr: "Init pós-mount; SSR-safe.",
    lockIn: "Baixo (option JSON; mesma lib dos dashboards).",
    limitations:
      "Sem estrutura de grafo (BFS/caminho/impacto ficam no view-model); interatividade fina (drag/pin/lasso) limitada.",
    verdict: "alternativa",
  },
  {
    id: "server-state-tanstack-query",
    surface: "server-state",
    name: "TanStack Query",
    packages: "@tanstack/react-query 5",
    license: "MIT",
    ux: "isStale/isFetching expostos viram chips honestos de derivação; invalidation por prefixo de chave casa com workspace/sourceRevision.",
    performance: "Cache por chave elimina refetch ao alternar filtros já visitados.",
    licensing: "MIT.",
    ssr: "QueryClient por provider client-side funciona no App Router; RSC continua buscando no servidor (initialData/Hydration ficam para a fatia de produto).",
    lockIn: "Baixo-médio: hooks localizados nos componentes de dados.",
    limitations:
      "Optimistic UI só com rollback honesto (não demonstrado de propósito: mutação real exige reler SSOT).",
    verdict: "recomendado",
  },
];

export function findingById(id: string): CandidateFinding {
  const finding = FINDINGS.find((entry) => entry.id === id);
  if (!finding) throw new Error(`finding desconhecido: ${id}`);
  return finding;
}
