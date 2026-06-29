// Tipos do db.json (read-models) = a FONTE são as projeções da LIB (single source — domínio + derivações).
import type { Work, Exploration, Proposal } from "../../../_lib/domain/model.ts";
import type {
  DeliberationView,
  GovernanceView,
  ManifestGraph,
} from "../../../_lib/domain/derive.ts";

export type { Proposal };

/** um work do repo + a sua deliberação derivada (null se não delibera). */
export interface RepoWork extends Work {
  deliberation: DeliberationView | null;
}

/** o db.json LOCAL de um repo (camada interna, auto-contida). */
export interface RepoDb {
  repo: string;
  generatedAt: string;
  works: RepoWork[];
  explorations: Exploration[];
}

/** o db.json da governança (host) — a iniciativa agregada + o intake. */
export interface GovernanceDb {
  generatedAt: string;
  governance: GovernanceView[];
  repos: string[];
  proposals: Proposal[];
  knowledge?: ManifestGraph; // o grafo de conhecimento cross-repo (derivado dos manifestos)
}
