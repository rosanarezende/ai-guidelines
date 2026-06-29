// seed.ts — MIGRA um repo do backend de arquivos pro seu backend declarado (ex.: Neo4j). Idempotente (upsert).
// Uso: node seed.ts <repo>   (ex.: node seed.ts acme-mfe-support, após `docker compose up -d` no repo)
import { FileRepository } from "./adapters/file/FileRepository.ts";
import { openRepository, backendOf } from "./backend.ts";

const repo = process.argv[2];
if (!repo) {
  console.error("uso: node seed.ts <repo>");
  process.exit(1);
}

const kind = backendOf(repo);
if (kind === "file") {
  console.log(`${repo}: backend é FILE (o .governance/ JÁ é a fonte) — nada a migrar.`);
  process.exit(0);
}

const file = new FileRepository(repo);
const { repo: target, close } = openRepository(repo);
try {
  for (const w of await file.listWorks()) {
    await target.saveWork(w);
    for (const q of await file.listQuestions(w.id)) await target.saveQuestion(w.id, q);
    for (const r of await file.listResearches(w.id)) await target.addResearch(w.id, r);
    for (const d of await file.listDecisions(w.id)) await target.addDecision(w.id, d);
  }
  for (const e of await file.listExplorations()) await target.saveExploration(e);
  console.log(`✓ ${repo}: .governance/ versionado → backend ${kind} (migrado/upsert)`);
} finally {
  await close();
}
