// stress-bench.ts — roda os matchers no STRESS scenario (paráfrase + texto-livre + distractors) e mede a ACURÁCIA
// (acertos vs ground-truth) + latência. Isolado do login_1. Uso: `node stress-bench.ts`. Requer Ollama + modelos.
import { LexicalMatcher } from "../_lib/domain/routing.ts";
import type { Matcher, MatchCandidate } from "../_lib/domain/routing.ts";
import { OllamaEmbedMatcher, OllamaGenerateMatcher } from "../_lib/adapters/llm/OllamaMatcher.ts";
import { REPOS, NEEDS } from "./scenario.ts";

const O = "http://localhost:11434";
const candidates: MatchCandidate[] = REPOS.map((r) => ({
  repo: r.repo,
  capabilities: r.capabilities.map((t) => ({ text: t })), // texto-livre, SEM tags (o caso difícil)
}));

const matchers: { label: string; matcher: Matcher }[] = [
  { label: "lexical (tier 0)", matcher: new LexicalMatcher() },
  { label: "embed nomic [EN] (t1)", matcher: new OllamaEmbedMatcher(O, "nomic-embed-text") },
  // NOTA: nesta máquina há DOIS daemons Ollama — ::1 (= localhost p/ o node) tem nomic/gemma3; 127.0.0.1 tem o bge-m3.
  // Por isso o bge-m3 aponta explícito p/ IPv4. Num setup de 1 daemon só, troque por `O`.
  {
    label: "embed bge-m3 [multi] (t1)",
    matcher: new OllamaEmbedMatcher("http://127.0.0.1:11434", "bge-m3"),
  },
  { label: "gen gemma3:12b (t2)", matcher: new OllamaGenerateMatcher(O, "gemma3:12b") },
];

console.log(
  `STRESS: ${REPOS.length} repos · ${NEEDS.length} needs (paráfrase, texto-livre, distractors)\n`
);
for (const { label, matcher } of matchers) {
  try {
    const t0 = Date.now();
    let hits = 0;
    const misses: string[] = [];
    for (const n of NEEDS) {
      const ranked = await matcher.rank(n.need, candidates);
      const got = ranked[0]?.repo ?? "—";
      if (got === n.want) hits++;
      else misses.push(`«${n.need.slice(0, 28)}…» → ${got} (esp. ${n.want})`);
    }
    const ms = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`${label.padEnd(20)} ${hits}/${NEEDS.length} acertos   ${ms}s`);
    for (const m of misses) console.log(`    ❌ ${m}`);
  } catch (e) {
    console.log(`${label.padEnd(20)} — indisponível: ${(e as Error).message.split("\n")[0]}`);
  }
}
