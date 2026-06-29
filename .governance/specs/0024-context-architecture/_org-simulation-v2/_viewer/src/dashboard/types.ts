// Tipos do db.json (a FONTE = a projeção da lib/banco; reusa os tipos da lib — single source).
import type {
  WorkProjection,
  DeliberationProjection,
  GovernanceProjection,
} from "../../../_banks/types.ts";

export interface RepoWork extends WorkProjection {
  deliberation: DeliberationProjection | null;
}

/** o db.json LOCAL de um repo (fake-api) — dado auto-contido. */
export interface RepoDb {
  repo: string;
  generatedAt: string;
  works: RepoWork[];
  explorations: WorkProjection[];
}

/** o db.json da governança (host) — a iniciativa agregada. */
export interface GovernanceDb {
  generatedAt: string;
  intents: GovernanceProjection[];
  repos: string[];
}
