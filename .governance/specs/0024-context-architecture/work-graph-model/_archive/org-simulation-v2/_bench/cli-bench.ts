// cli-bench.ts — roda os agent-delegates (tier 3b: Claude/Codex/Antigravity via PLANO/login) no STRESS scenario.
// Uso: `node cli-bench.ts [claude|codex|agy]` (sem arg = os 3). Usa o plano/login do usuário, SEM API tokens (⚠️ ToS).
import type { MatchCandidate } from "../_lib/domain/routing.ts";
import { CliDelegateMatcher } from "../_lib/adapters/llm/CliDelegateMatcher.ts";
import { REPOS, NEEDS } from "./scenario.ts";

const candidates: MatchCandidate[] = REPOS.map((r) => ({
  repo: r.repo,
  capabilities: r.capabilities.map((t) => ({ text: t })),
}));

const only = process.argv[2]; // opcional: filtra por bin (claude|codex|agy)
const agents = [
  { label: "claude -p (Claude/plano)", cmd: ["claude", "-p"] },
  { label: "codex exec (OpenAI/plano)", cmd: ["codex", "exec", "--skip-git-repo-check"] },
  { label: "agy -p (Gemini/login)", cmd: ["agy", "-p"] },
].filter((a) => !only || a.cmd[0] === only);

console.log(
  `CLI-DELEGATE no stress: ${REPOS.length} repos · ${NEEDS.length} needs (plano/login, SEM tokens)\n`
);
for (const { label, cmd } of agents) {
  const matcher = new CliDelegateMatcher(cmd);
  try {
    const t0 = Date.now();
    let hits = 0;
    const misses: string[] = [];
    for (const n of NEEDS) {
      const ranked = await matcher.rank(n.need, candidates);
      const got = ranked[0]?.repo ?? "—";
      if (got === n.want) hits++;
      else misses.push(`«${n.need.slice(0, 26)}…» → ${got} (esp. ${n.want})`);
    }
    console.log(
      `${label.padEnd(28)} ${hits}/${NEEDS.length}   ${((Date.now() - t0) / 1000).toFixed(0)}s`
    );
    for (const m of misses) console.log(`    ❌ ${m}`);
  } catch (e) {
    console.log(`${label.padEnd(28)} — ${(e as Error).message.split("\n")[0]}`);
  }
}
