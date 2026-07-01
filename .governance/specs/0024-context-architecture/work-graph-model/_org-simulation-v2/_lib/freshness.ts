// freshness.ts — LINT (roda no pre-commit): o context.json VERSIONADO de cada repo bate com o que o backend
// geraria AGORA? Se houver DRIFT, FALHA → o dev roda `node _lib/build.ts` e dá `git add`. Garante que o repo
// continua a FONTE DA VERDADE (a projeção PUBLICADA não pode divergir da fonte). Backend fora = não dá pra
// verificar → warn (não falha; confia no último publish). Modelo: research/2026-06-29-governance-aggregates-...
import fs from "node:fs";
import path from "node:path";
import { FileHostRepository } from "./adapters/file/FileHostRepository.ts";
import { SIM_ROOT, exists } from "./adapters/file/io.ts";
import { openRepository, backendOf } from "./backend.ts";
import { deriveContext } from "./domain/derive.ts";

const host = new FileHostRepository();
const repos = await host.listRepos();
let drift = false;

for (const repoName of repos) {
  const rel = `${repoName}/.governance/context.json`;
  const { repo: r, close } = openRepository(repoName);
  try {
    const fresh = deriveContext(repoName, await r.listWorks(), await r.listExplorations());
    const committed = exists(rel)
      ? (JSON.parse(fs.readFileSync(path.join(SIM_ROOT, rel), "utf8")) as unknown)
      : null;
    if (JSON.stringify(fresh) !== JSON.stringify(committed)) {
      drift = true;
      console.error(
        `❌ ${repoName}: context.json DESATUALIZADO (drift vs o backend ${backendOf(repoName)}).`
      );
    } else {
      console.log(`✅ ${repoName}: context.json fresco.`);
    }
  } catch {
    console.warn(
      `⚠️  ${repoName} [${backendOf(repoName)}]: backend fora — freshness não verificada (confia no último publish).`
    );
  } finally {
    await close();
  }
}

if (drift) {
  console.error(
    "\n→ rode `node _lib/build.ts` e `git add` os context.json. A FONTE é o `.governance/` — a projeção publicada não pode driftar."
  );
  process.exit(1);
}
console.log("freshness: ok");
