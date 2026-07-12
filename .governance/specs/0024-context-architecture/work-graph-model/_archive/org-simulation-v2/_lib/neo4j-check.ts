// neo4j-check.ts — A PROVA DA PLUGGABILITY: trocar o backend de UM repo (acme-mfe-support) pra Neo4j,
// SEM tocar domínio/derivações/view. 1) seed: lê o .governance/ via FileRepository → grava no GRAFO via
// Neo4jRepository. 2) lê DO NEO4J via a MESMA porta Repository → deriva → mostra. Pré: docker neo4j:5 (bolt 7687).
import { FileRepository } from "./adapters/file/FileRepository.ts";
import { Neo4jRepository, neo4jDriver } from "./adapters/neo4j/Neo4jRepository.ts";
import { deriveDeliberation, deriveContext } from "./domain/derive.ts";

const REPO = "acme-mfe-support";
const driver = neo4jDriver(
  process.env.NEO4J_URI ?? "bolt://localhost:7687",
  process.env.NEO4J_USER ?? "neo4j",
  process.env.NEO4J_PASSWORD ?? "simsim123"
);

async function waitForNeo4j(): Promise<void> {
  for (let i = 0; i < 30; i++) {
    try {
      await driver.verifyConnectivity();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 2000)); // espera o Neo4j aceitar conexão
    }
  }
  throw new Error("Neo4j não respondeu na 7687 a tempo");
}

try {
  await waitForNeo4j();
  console.log("✓ conectou no Neo4j (bolt 7687)");
  const file = new FileRepository(REPO);
  const graph = new Neo4jRepository(REPO, driver);

  // 1) SEED — a fonte de arquivo migra pro grafo (file backend → Neo4j backend)
  for (const w of await file.listWorks()) {
    await graph.saveWork(w);
    for (const q of await file.listQuestions(w.id)) await graph.saveQuestion(w.id, q);
    for (const r of await file.listResearches(w.id)) await graph.addResearch(w.id, r);
    for (const d of await file.listDecisions(w.id)) await graph.addDecision(w.id, d);
  }
  for (const e of await file.listExplorations()) await graph.saveExploration(e);
  console.log(`✓ seed: ${REPO} (.governance/ versionado → Neo4j)`);

  // 2) LÊ DO NEO4J (mesma porta) + deriva (mesmo domínio) — o backend é Neo4j, nada mais muda
  const works = await graph.listWorks();
  const exps = await graph.listExplorations();
  console.log(`\n── ${REPO} LIDO DO NEO4J (backend trocado; domínio/derive/view intactos) ──`);
  console.log("  works:", works.map((w) => `${w.id} [${w.kind}/${w.status}]`).join(", "));
  console.log(
    "  explorations:",
    exps.map((e) => `${e.id} [${e.status}/${e.fate}] verdict=${Boolean(e.verdict)}`).join(", ")
  );
  for (const w of works) {
    const [qs, rs, ds] = [
      await graph.listQuestions(w.id),
      await graph.listResearches(w.id),
      await graph.listDecisions(w.id),
    ];
    if (qs.length > 0 || ds.length > 0) {
      const v = deriveDeliberation(`${REPO}/${w.kind}/${w.id}`, qs, rs, ds);
      console.log(
        `  ${w.id} q/r/d: ${qs.length}q ${rs.length}r ${ds.length}d → stage ${v.stage} · ${v.cursor}`
      );
    }
  }
  const ctx = deriveContext(REPO, works, exps);
  console.log("  publica pro host:", JSON.stringify(ctx.answers));
} finally {
  await driver.close();
}
