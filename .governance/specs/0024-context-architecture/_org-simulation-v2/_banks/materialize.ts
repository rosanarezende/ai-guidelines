// Materializa o SNAPSHOT (JSON) das projeções — é o que o app web (_viewer/) consome.
// DERIVADO (determinístico, regenerável da fonte), NÃO autoridade.
import fs from "node:fs";
import path from "node:path";
import { SIM_ROOT } from "./io.ts";
import type { RepoProjection, GovernanceProjection } from "./types.ts";

const OUT_DIR = path.join(SIM_ROOT, "_banks", "_out");

/** O snapshot que o viewer renderiza: os bancos de repo + o de governança. */
export interface Snapshot {
  repos: RepoProjection[];
  governance: GovernanceProjection;
}

export function materialize(repos: RepoProjection[], governance: GovernanceProjection): string[] {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const snapshot: Snapshot = { repos, governance };
  const json = JSON.stringify(snapshot, null, 2);

  // (1) o JSON canônico (machine-readable, p/ tooling / futuro dashboard hospedado):
  const jsonFile = path.join(OUT_DIR, "snapshot.json");
  fs.writeFileSync(jsonFile, json + "\n");

  // (2) o mesmo dado como global, p/ o viewer abrir via file:// (sem servidor nem fetch/CORS):
  const jsFile = path.join(OUT_DIR, "snapshot.js");
  fs.writeFileSync(jsFile, `// GERADO pelo banco — NÃO EDITAR.\nwindow.__SNAPSHOT__ = ${json};\n`);

  return [jsonFile, jsFile].map((f) => path.relative(SIM_ROOT, f).replaceAll(path.sep, "/"));
}
