// check.ts — smoke do FileRepository (read no repo real + write num repo TEMP auto-limpo + derive). Rode: node check.ts
import fs from "node:fs";
import path from "node:path";
import { FileRepository } from "./adapters/file/FileRepository.ts";
import { SIM_ROOT } from "./adapters/file/io.ts";
import { deriveDeliberation } from "./domain/derive.ts";

async function readProof(): Promise<void> {
  const repo = new FileRepository("acme-design-system");
  const works = await repo.listWorks();
  const exps = await repo.listExplorations();
  console.log("── READ · acme-design-system (.governance/ versionado) ──");
  console.log(
    "  works:",
    works.map((w) => `${w.id} [${w.kind}/${w.status}/${w.assignee ?? "—"}]`).join(", ")
  );
  console.log(
    "  explorations:",
    exps.map((e) => `${e.id} [${e.status}/${e.fate}] verdict=${Boolean(e.verdict)}`).join(", ")
  );
  const wid = "form-component_1";
  const [qs, rs, ds] = [
    await repo.listQuestions(wid),
    await repo.listResearches(wid),
    await repo.listDecisions(wid),
  ];
  console.log(
    `  ${wid}: ${qs.length} questions · ${rs.length} researches · ${ds.length} decisions`
  );
  const view = deriveDeliberation(wid, qs, rs, ds);
  console.log(`  derive → stage ${view.stage} · ${view.cursor}`);
  for (const q of view.questions)
    console.log(`    ${q.id} [${q.mode}] ${q.decided} ← ${q.researches.join(",") || "(nenhuma)"}`);
}

async function writeProof(): Promise<void> {
  const name = "_writecheck"; // repo TEMP (auto-limpo no fim)
  try {
    const r = new FileRepository(name);
    await r.saveWork({
      id: "w_1",
      kind: "delivery",
      title: "demo",
      status: "active",
      assignee: "@x",
      createdAt: "2026-06-28",
    });
    await r.saveQuestion("w_1", { id: "q1", mode: "escolha", body: "schema ou imperativo?" });
    await r.addResearch("w_1", {
      id: "res-001",
      investigates: ["q1"],
      method: "análise",
      body: "schema cobre 90%",
    });
    await r.addDecision("w_1", {
      id: "d1",
      resolves: [{ question: "q1", into: "§D1" }],
      supportedBy: ["res-001"],
      status: "accepted",
      decidedAt: "2026-06-28",
    });
    // releu do disco?
    const [qs, rs, ds] = [
      await r.listQuestions("w_1"),
      await r.listResearches("w_1"),
      await r.listDecisions("w_1"),
    ];
    const view = deriveDeliberation("w_1", qs, rs, ds);
    const q1 = view.questions[0];
    console.log("\n── WRITE+READ · _writecheck (temp) ──");
    console.log(`  gravou no .governance/ e releu: ${qs.length}q ${rs.length}r ${ds.length}d`);
    console.log(
      `  derive → stage ${view.stage}; q1 = ${q1?.decided} (${q1?.resolved ? "RESOLVED" : "—"})`
    );
  } finally {
    fs.rmSync(path.join(SIM_ROOT, name), { recursive: true, force: true });
    console.log("  temp removido.");
  }
}

await readProof();
await writeProof();
