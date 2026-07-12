export const PORTAL_STORE_KINDS = ["sqlite", "postgres", "neo4j"] as const;

export type PortalStoreKind = (typeof PORTAL_STORE_KINDS)[number];

export type PortalStoreRole = "portal-transaction-store" | "governance-graph-read-model";

export type PortalStoreDecision = "local-default" | "shared-default" | "not-portal-store";

export type PortalStoreCandidate = {
  id: PortalStoreKind;
  label: string;
  role: PortalStoreRole;
  betterAuthSupported: boolean;
  decision: PortalStoreDecision;
  requires: string[];
  recommendedFor: string[];
  constraints: string[];
  summary: string;
};

export type PortalStoreSelectionInput = {
  accessPattern:
    | "solo-local"
    | "solo-git-backed"
    | "small-team-shared"
    | "controlled-organization"
    | "hosted-portal";
};

export const PORTAL_STORE_CANDIDATES: PortalStoreCandidate[] = [
  {
    id: "sqlite",
    label: "SQLite",
    role: "portal-transaction-store",
    betterAuthSupported: true,
    decision: "local-default",
    requires: ["better-auth", "@better-auth/kysely-adapter", "kysely", "better-sqlite3"],
    recommendedFor: [
      "modo local",
      "dev solo",
      "time pequeno com servidor unico",
      "piloto self-hosted simples",
    ],
    constraints: [
      "nao resolve multi-instancia",
      "backup e acesso compartilhado dependem do host onde o app roda",
      "nao substitui o governance host Git-backed",
    ],
    summary:
      "Melhor default para reduzir friccao: arquivo local/servidor unico, transacional o bastante para conta, convite e sessao.",
  },
  {
    id: "postgres",
    label: "PostgreSQL",
    role: "portal-transaction-store",
    betterAuthSupported: true,
    decision: "shared-default",
    requires: ["better-auth", "@better-auth/kysely-adapter", "kysely", "pg"],
    recommendedFor: [
      "portal compartilhado",
      "time com pessoas nao tecnicas",
      "modo controlled/security",
      "hosted portal futuro",
    ],
    constraints: [
      "exige servico Postgres e backup operacional",
      "adiciona custo/operacao em relacao ao SQLite",
      "continua sem autoridade governada por si so",
    ],
    summary:
      "Default para portal compartilhado: melhor concorrencia, operacao conhecida e caminho claro para self-hosted/hosted sem trocar modelo.",
  },
  {
    id: "neo4j",
    label: "Neo4j",
    role: "governance-graph-read-model",
    betterAuthSupported: false,
    decision: "not-portal-store",
    requires: ["exporter/read-model com sourceRevision"],
    recommendedFor: [
      "impact analysis",
      "dependency graph",
      "stakeholder map",
      "consulta tecnica avancada",
    ],
    constraints: [
      "nao deve guardar sessao/convite/conta do portal",
      "nao deve aceitar escrita autoritativa de governanca",
      "qualquer leitura precisa sourceRevision e fail-closed se stale",
    ],
    summary:
      "Excelente para grafo derivado, mas errado como store transacional de portal: cria segundo SSOT e mistura identidade com read-model.",
  },
];

export function comparePortalStoreCandidates(): PortalStoreCandidate[] {
  return PORTAL_STORE_CANDIDATES.map((candidate) => ({
    ...candidate,
    requires: [...candidate.requires],
    recommendedFor: [...candidate.recommendedFor],
    constraints: [...candidate.constraints],
  }));
}

export function selectPortalStoreCandidate(input: PortalStoreSelectionInput): PortalStoreCandidate {
  switch (input.accessPattern) {
    case "solo-local":
    case "solo-git-backed":
      return cloneCandidate("sqlite");
    case "small-team-shared":
    case "controlled-organization":
    case "hosted-portal":
      return cloneCandidate("postgres");
  }
}

export function assertNeo4jIsReadModelOnly(): boolean {
  const neo4j = PORTAL_STORE_CANDIDATES.find((candidate) => candidate.id === "neo4j");
  return (
    neo4j?.role === "governance-graph-read-model" &&
    neo4j.betterAuthSupported === false &&
    neo4j.decision === "not-portal-store"
  );
}

function cloneCandidate(id: PortalStoreKind): PortalStoreCandidate {
  const candidate = PORTAL_STORE_CANDIDATES.find((item) => item.id === id);
  if (!candidate) throw new Error(`Unknown portal store candidate: ${id}`);
  return {
    ...candidate,
    requires: [...candidate.requires],
    recommendedFor: [...candidate.recommendedFor],
    constraints: [...candidate.constraints],
  };
}
