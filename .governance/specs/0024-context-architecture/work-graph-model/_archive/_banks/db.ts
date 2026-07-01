// db.ts — o "fake-api" da Lente 5: materializa o DADO local, auto-contido, que cada nó é dono.
//  · writeRepoDb  → `<repo>/.governance/db.json` — o dado INTERNO do repo (works + deliberação + explorations).
//  · writeGovernanceDb → `acme-governance/db.json` — o HOST: agrega o que os repos publicam (a iniciativa).
// O contrato (a forma do db.json) é estável; hoje a fonte é o "fake" (derivado do .governance/), no futuro o real.
import fs from "node:fs";
import path from "node:path";
import { SIM_ROOT } from "./io.ts";
import type { RepoProjection, DeliberationProjection, GovernanceProjection } from "./types.ts";

function writeJson(rel: string, data: unknown): string {
  fs.writeFileSync(path.join(SIM_ROOT, rel), `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return rel;
}

/** fake-api: o db.json LOCAL do repo — dado auto-contido (works com sua deliberação + explorations). */
export function writeRepoDb(rp: RepoProjection, deliberations: DeliberationProjection[]): string {
  const works = rp.works.map((w) => ({
    ...w,
    deliberation: deliberations.find((d) => d.work === w.ref) ?? null,
  }));
  return writeJson(`${rp.repo}/.governance/db.json`, {
    repo: rp.repo,
    generatedAt: new Date().toISOString(),
    works,
    explorations: rp.explorations,
  });
}

/** host: o db.json da governança — agrega o que os repos publicam (a visão geral da iniciativa). */
export function writeGovernanceDb(governances: GovernanceProjection[], repos: string[]): string {
  return writeJson("acme-governance/db.json", {
    generatedAt: new Date().toISOString(),
    intents: governances,
    repos,
  });
}
