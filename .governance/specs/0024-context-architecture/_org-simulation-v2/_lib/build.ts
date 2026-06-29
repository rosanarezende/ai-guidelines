// build.ts — o RUNNER da lib (substitui o _banks/run.ts central): consome os adapters File (read) + as
// derivações puras → regenera os READ-MODELS (db.json) que a view consome. Engine do workflow:
//   editar .governance/  →  node _lib/build.ts  →  db.json  →  (cd _viewer && npm run dashboards)
import fs from "node:fs";
import path from "node:path";
import { FileRepository } from "./adapters/file/FileRepository.ts";
import { FileHostRepository } from "./adapters/file/FileHostRepository.ts";
import { SIM_ROOT } from "./adapters/file/io.ts";
import { deriveDeliberation, deriveContext, deriveGovernance } from "./domain/derive.ts";
import type { RepoContext, DeliberationView, GovernanceView } from "./domain/derive.ts";
import type { Work, Exploration, Proposal } from "./domain/model.ts";

function writeDb(rel: string, data: unknown): void {
  fs.writeFileSync(path.join(SIM_ROOT, rel), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const host = new FileHostRepository();
const repos = await host.listRepos();

// 1) cada repo: read via FileRepository + deriva a deliberação por work → db.json LOCAL (camada interna)
const contexts: RepoContext[] = [];
for (const repo of repos) {
  const r = new FileRepository(repo);
  const works = await r.listWorks();
  const explorations = await r.listExplorations();

  const worksWithDelib: (Work & { deliberation: DeliberationView | null })[] = [];
  for (const w of works) {
    const [qs, rs, ds] = [
      await r.listQuestions(w.id),
      await r.listResearches(w.id),
      await r.listDecisions(w.id),
    ];
    const deliberates = qs.length > 0 || ds.length > 0;
    const deliberation = deliberates
      ? deriveDeliberation(`${repo}/${w.kind}/${w.id}`, qs, rs, ds)
      : null;
    worksWithDelib.push({ ...w, deliberation });
  }

  writeDb(`${repo}/.governance/db.json`, {
    repo,
    generatedAt: new Date().toISOString(),
    works: worksWithDelib,
    explorations,
  });
  contexts.push(deriveContext(repo, works, explorations));
  console.log(
    `🗃️  ${repo}/.governance/db.json (${works.length} works, ${explorations.length} exploration)`
  );
}

// 2) governança (host): agrega o contexto publicado → db.json do host (a visão geral)
const intents = await host.listIntents();
const proposals: Proposal[] = await host.listProposals();
const governance: GovernanceView[] = [];
for (const intent of intents) {
  governance.push(deriveGovernance(intent, await host.listDecisions(intent.id), contexts));
}
writeDb("acme-governance/db.json", {
  generatedAt: new Date().toISOString(),
  governance,
  repos,
  proposals,
});
console.log(
  `🗃️  acme-governance/db.json (${governance.length} intent, ${proposals.length} proposal)\n` +
    `📊 view: cd _viewer && npm run dashboards`
);
