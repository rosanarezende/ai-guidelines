// api-bench.ts — tier 3a (API HOSTED): roda o Gemini API no STRESS com 3 tamanhos (barato/médio/maior). Mede acurácia + latência.
// A KEY vem de: env GEMINI_API_KEY  OU  o arquivo `_bench/.gemini-key` (gitignored). Nunca commitada. Uso: `node api-bench.ts`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { MatchCandidate } from "../_lib/domain/routing.ts";
import { GeminiApiMatcher } from "../_lib/adapters/llm/GeminiApiMatcher.ts";
import { REPOS, NEEDS } from "./scenario.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const keyFile = path.join(here, ".gemini-key");
const key = (
  process.env.GEMINI_API_KEY ?? (fs.existsSync(keyFile) ? fs.readFileSync(keyFile, "utf8") : "")
).trim();
if (!key) {
  console.error(
    "Sem chave. Crie uma FREE em https://aistudio.google.com/apikey e ponha em _bench/.gemini-key (gitignored) — ou export GEMINI_API_KEY."
  );
  process.exit(1);
}

const candidates: MatchCandidate[] = REPOS.map((r) => ({
  repo: r.repo,
  capabilities: r.capabilities.map((t) => ({ text: t })),
}));

const models = [
  { label: "gemini-2.0-flash-lite (barato)", model: "gemini-2.0-flash-lite" },
  { label: "gemini-2.5-flash (médio)", model: "gemini-2.5-flash" },
  { label: "gemini-2.5-pro (maior)", model: "gemini-2.5-pro" },
];

console.log(
  `GEMINI API no stress: ${REPOS.length} repos · ${NEEDS.length} needs (tier 3a, gasta cota)\n`
);
for (const { label, model } of models) {
  const matcher = new GeminiApiMatcher(model, key);
  try {
    const t0 = Date.now();
    let hits = 0;
    const misses: string[] = [];
    for (const n of NEEDS) {
      const ranked = await matcher.rank(n.need, candidates);
      const got = ranked[0]?.repo ?? "—";
      if (got === n.want) hits++;
      else misses.push(`«${n.need.slice(0, 24)}…» → ${got} (esp. ${n.want})`);
    }
    console.log(
      `${label.padEnd(32)} ${hits}/${NEEDS.length}   ${((Date.now() - t0) / 1000).toFixed(0)}s`
    );
    for (const m of misses) console.log(`    ❌ ${m}`);
  } catch (e) {
    console.log(`${label.padEnd(32)} — ${(e as Error).message.split("\n")[0]}`);
  }
}
