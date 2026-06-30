// CliDelegateMatcher.ts — Matcher tier 3b: DELEGA a um agente JÁ INSTALADO (Claude Code / Codex / Antigravity) em
// modo headless, usando o PLANO/login do usuário — SEM API tokens. Spawna a CLI com o prompt → parseia o JSON.
// ⚠️ ToS: usar uma sub de coding-agent p/ workload de app é gray-area (ok dev/pessoal; conferir p/ produção). Ver MATCHER.md.
import { execFileSync } from "node:child_process";
import os from "node:os";
import type { Match, MatchCandidate, Matcher } from "../../domain/routing.ts";

export class CliDelegateMatcher implements Matcher {
  #cmd: string[]; // ex.: ["claude","-p"] · ["codex","exec"] · ["agy","-p"]

  constructor(cmd: string[]) {
    this.#cmd = cmd;
  }

  async rank(need: string, candidates: MatchCandidate[]): Promise<Match[]> {
    const repos = candidates
      .map((c) => `- ${c.repo}: ${c.capabilities.map((x) => x.text).join("; ")}`)
      .join("\n");
    const prompt =
      `NEED: ${need}\n\nREPOS (nome: capabilities):\n${repos}\n\n` +
      `Qual repo melhor atende o NEED? Responda APENAS com JSON, sem markdown e sem explicação: ` +
      `{"ranked":["<nome EXATO da lista>", ...]} do melhor pro pior, com TODOS os repos.`;
    const [bin, ...args] = this.#cmd;
    let out = "";
    try {
      out = execFileSync(bin, [...args, prompt], {
        encoding: "utf8",
        timeout: 120000,
        cwd: os.tmpdir(), // dir NEUTRO — o agente não mexe no repo
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch (e) {
      throw new Error(`CLI ${bin} falhou: ${(e as Error).message.split("\n")[0]}`);
    }
    const valid = new Set(candidates.map((c) => c.repo));
    // pega o ÚLTIMO bloco {...} com "ranked" (CLIs ECOAM o prompt → vários {...}; a resposta é o último que parseia)
    const blocks = out.match(/\{[^{}]*\}/g) ?? [];
    let names: string[] = [];
    for (const b of blocks.reverse()) {
      try {
        const parsed = JSON.parse(b) as { ranked?: string[] };
        if (Array.isArray(parsed.ranked)) {
          names = parsed.ranked.filter((n) => valid.has(n));
          break;
        }
      } catch {
        /* tenta o bloco anterior */
      }
    }
    const ranked: Match[] = names.map((repo, i) => ({
      repo,
      score: 100 - i,
      why: "ranqueado pelo agente",
    }));
    for (const c of candidates)
      if (!ranked.some((r) => r.repo === c.repo))
        ranked.push({ repo: c.repo, score: 0, why: "(não citado)" });
    return ranked;
  }
}
