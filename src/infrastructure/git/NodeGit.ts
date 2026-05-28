import { execFileSync } from "node:child_process";
import { GitOps } from "../../app/ports/GitOps.js";

/**
 * Adapter `GitOps` que delega para `git` via `execFileSync` com args array.
 *
 * **Sempre args array, nunca string interpolada via shell** — fecha CWE-78
 * (mesmo padrão cravado em `collectLocalContext.ts` + `GhCli.ts`). Dados
 * externos (paths, messages, refs) entram como elementos do argv.
 *
 * Cravado em `[DEC-0023-L01]`. Cf. ADR 0024 seção "Operational CLI commands".
 */

// Operações locais (rev-parse, status, add, commit, tag) são rápidas.
const GIT_TIMEOUT_MS = 15_000;
// Operações de rede (push, ls-remote) podem exceder 15s em redes lentas / 2FA /
// VPN; usam um teto maior para não falhar indevidamente durante o release-prep.
const GIT_NETWORK_TIMEOUT_MS = 120_000;

export class NodeGit implements GitOps {
  constructor(private readonly cwd: string) {}

  currentBranch(): string | null {
    try {
      const out = this.exec(["rev-parse", "--abbrev-ref", "HEAD"]).trim();
      // "HEAD" significa detached HEAD; tratamos como null (mesma semântica
      // de WorkflowFileSystem.currentBranch()).
      return out === "" || out === "HEAD" ? null : out;
    } catch {
      return null;
    }
  }

  isWorkingTreeClean(): boolean {
    try {
      const out = this.exec(["status", "--porcelain"]);
      return out.trim() === "";
    } catch {
      // Se git status falha, assumimos working tree não-limpo (safer default).
      return false;
    }
  }

  add(paths: ReadonlyArray<string>): void {
    if (paths.length === 0) return;
    this.exec(["add", "--", ...paths]);
  }

  commit(message: string): void {
    this.exec(["commit", "-m", message]);
  }

  tag(name: string): void {
    this.exec(["tag", name]);
  }

  push(remote: string, refs: ReadonlyArray<string>): void {
    if (refs.length === 0) {
      throw new Error("NodeGit.push: refs array vazio — especifique o que pushar.");
    }
    this.exec(["push", remote, ...refs], GIT_NETWORK_TIMEOUT_MS);
  }

  listTags(): ReadonlyArray<string> {
    try {
      const out = this.exec(["tag", "--list"]).trim();
      return out === "" ? [] : out.split("\n").filter((line) => line !== "");
    } catch {
      return [];
    }
  }

  listRemoteTags(remote: string): ReadonlyArray<string> {
    try {
      const out = this.exec(["ls-remote", "--tags", remote], GIT_NETWORK_TIMEOUT_MS).trim();
      if (out === "") return [];
      // Output: "<sha>\trefs/tags/<name>" ou "<sha>\trefs/tags/<name>^{}" (peeled).
      // Normalizamos para nomes únicos (sem peel suffix).
      const tags = new Set<string>();
      for (const line of out.split("\n")) {
        const parts = line.split("\t");
        if (parts.length !== 2) continue;
        const ref = parts[1];
        if (!ref.startsWith("refs/tags/")) continue;
        const name = ref.replace(/^refs\/tags\//, "").replace(/\^\{\}$/, "");
        tags.add(name);
      }
      return [...tags];
    } catch {
      return [];
    }
  }

  private exec(args: ReadonlyArray<string>, timeoutMs: number = GIT_TIMEOUT_MS): string {
    return execFileSync("git", [...args], {
      cwd: this.cwd,
      encoding: "utf-8",
      timeout: timeoutMs,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
}
