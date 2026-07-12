// mongo-check.ts — prova o MongoRepository (DOCUMENTO): seed do acme-design-system (q/r/d RICO) → Mongo →
// lê de volta pela MESMA porta → deriva. Mostra o adapter de documento aguentando questions/researches/decisions.
// Pré: docker run -d --name mongo-sim -p 27017:27017 mongo:7. Rode: node mongo-check.ts
import { MongoClient } from "mongodb";
import { FileRepository } from "./adapters/file/FileRepository.ts";
import { MongoRepository } from "./adapters/mongo/MongoRepository.ts";
import { deriveDeliberation } from "./domain/derive.ts";

const REPO = "acme-design-system";
const client = new MongoClient(process.env.MONGO_URI ?? "mongodb://localhost:27017");

try {
  await client.connect();
  const db = client.db("governance");
  const file = new FileRepository(REPO);
  const mongo = new MongoRepository(REPO, db);

  // seed: arquivos → documentos
  for (const w of await file.listWorks()) {
    await mongo.saveWork(w);
    for (const q of await file.listQuestions(w.id)) await mongo.saveQuestion(w.id, q);
    for (const r of await file.listResearches(w.id)) await mongo.addResearch(w.id, r);
    for (const d of await file.listDecisions(w.id)) await mongo.addDecision(w.id, d);
  }
  for (const e of await file.listExplorations()) await mongo.saveExploration(e);
  console.log(`✓ seed: ${REPO} (.governance/ → MongoDB, coleção "governance")`);

  // lê DO MONGO (mesma porta) + deriva (mesmo domínio)
  const works = await mongo.listWorks();
  console.log(`\n── ${REPO} LIDO DO MONGODB (documento; domínio/derive INTACTOS) ──`);
  console.log("  works:", works.map((w) => `${w.id} [${w.kind}/${w.status}]`).join(", "));
  for (const w of works) {
    const [qs, rs, ds] = [
      await mongo.listQuestions(w.id),
      await mongo.listResearches(w.id),
      await mongo.listDecisions(w.id),
    ];
    if (qs.length > 0 || ds.length > 0) {
      const v = deriveDeliberation(`${REPO}/${w.kind}/${w.id}`, qs, rs, ds);
      console.log(
        `  ${w.id} q/r/d: ${qs.length}q ${rs.length}r ${ds.length}d → stage ${v.stage} · ${v.cursor}`
      );
    }
  }
} finally {
  await client.close();
}
