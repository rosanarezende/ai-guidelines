// Materializa o SNAPSHOT (JSON) das projeções — é o que o app web (_viewer/) consome.
// DERIVADO (determinístico, regenerável da fonte), NÃO autoridade.
import fs from "node:fs";
import path from "node:path";
import { SIM_ROOT } from "./io.ts";
import type { RepoProjection, GovernanceProjection } from "./types.ts";

// o viewer (Vite) serve public/ na raiz → o app faz fetch("/snapshot.json"):
const OUT_FILE = path.join(SIM_ROOT, "_viewer", "public", "snapshot.json");

/** O snapshot que o viewer renderiza: os bancos de repo + o de governança. */
export interface Snapshot {
  repos: RepoProjection[];
  governance: GovernanceProjection;
}

export function materialize(repos: RepoProjection[], governance: GovernanceProjection): string {
  const snapshot: Snapshot = { repos, governance };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2) + "\n");
  return path.relative(SIM_ROOT, OUT_FILE).replaceAll(path.sep, "/");
}
