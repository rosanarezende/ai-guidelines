// git-local.ts — evidence provider do git da máquina. Descobre os repos adotados,
// lê revision/status/último commit via CLI local (sem rede). Se o git não estiver
// disponível ou o caminho não estiver em um work-tree, reporta unavailable —
// nunca inventa hash.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { EvidenceProvider, IntegrationResult } from "../../ports/IntegrationAdapter.ts";
import { REPOS_ROOT } from "../../shared/paths.ts";

function git(cwd: string, args: string[]): { ok: boolean; stdout: string; error?: string } {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", shell: false, timeout: 15_000 });
  if (result.error) return { ok: false, stdout: "", error: String(result.error.message) };
  if (result.status !== 0)
    return {
      ok: false,
      stdout: "",
      error: (result.stderr || "").trim() || `exit ${result.status}`,
    };
  return { ok: true, stdout: (result.stdout || "").trim() };
}

export function discoverLocalRepos(reposRoot = REPOS_ROOT): string[] {
  if (!existsSync(reposRoot)) return [];
  return readdirSync(reposRoot)
    .filter((name) => statSync(path.join(reposRoot, name)).isDirectory())
    .filter((name) => existsSync(path.join(reposRoot, name, "package.json")))
    .sort();
}

export class GitLocalAdapter implements EvidenceProvider {
  readonly id = "git-local";
  readonly catalogId = "git-provider";
  readonly mayWriteAuthoritativeState = false as const;
  private readonly reposRoot: string;

  constructor(options: { reposRoot?: string } = {}) {
    this.reposRoot = options.reposRoot || REPOS_ROOT;
  }

  describe(): { id: string; catalogId: string; mechanism: string } {
    return {
      id: this.id,
      catalogId: this.catalogId,
      mechanism: "git CLI local: rev-parse/log/status por diretório de repo adotado",
    };
  }

  async collect(repoId: string): Promise<IntegrationResult> {
    const observedAt = new Date().toISOString();
    const repoDir = path.join(this.reposRoot, repoId);
    if (!existsSync(repoDir)) {
      return {
        adapter: this.id,
        status: "failed",
        summary: `repo "${repoId}" não existe em ${this.reposRoot}`,
        evidence: [],
        error: "repo desconhecido",
      };
    }
    const inside = git(repoDir, ["rev-parse", "--is-inside-work-tree"]);
    if (!inside.ok || inside.stdout !== "true") {
      return {
        adapter: this.id,
        status: "unavailable",
        summary: `git indisponível ou "${repoId}" fora de um work-tree`,
        evidence: [],
        error: inside.error || inside.stdout,
      };
    }
    const head = git(repoDir, ["rev-parse", "HEAD"]);
    const lastCommit = git(repoDir, ["log", "-1", "--format=%H|%cI|%s", "--", "."]);
    const status = git(repoDir, ["status", "--porcelain", "--", "."]);
    if (!head.ok || !lastCommit.ok || !status.ok) {
      return {
        adapter: this.id,
        status: "unavailable",
        summary: `git falhou ao inspecionar "${repoId}"`,
        evidence: [],
        error: head.error || lastCommit.error || status.error,
      };
    }
    const [commitHash, committedAt, subject] = lastCommit.stdout.split("|");
    const dirtyFiles = status.stdout ? status.stdout.split(/\r?\n/).filter(Boolean).length : 0;
    return {
      adapter: this.id,
      status: "ok",
      summary: `HEAD ${head.stdout.slice(0, 12)} · último commit no repo ${commitHash?.slice(0, 12)} · ${dirtyFiles} arquivo(s) sujo(s)`,
      evidence: [
        {
          kind: "git-revision",
          command: "git rev-parse HEAD && git log -1 -- . && git status --porcelain -- .",
          source: repoDir,
          observedAt,
          contentHash: commitHash?.slice(0, 12),
          detail: {
            head: head.stdout,
            lastCommit: { hash: commitHash, committedAt, subject },
            dirtyFiles,
          },
        },
      ],
    };
  }

  async test(): Promise<IntegrationResult> {
    const repos = discoverLocalRepos(this.reposRoot);
    if (!repos.length) {
      return {
        adapter: this.id,
        status: "not-configured",
        summary: "nenhum repo local descoberto",
        evidence: [],
      };
    }
    return this.collect(repos[0]);
  }
}
