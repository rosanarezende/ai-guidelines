// ci-local.ts — evidence provider de verificação local: executa o comando de
// evidência que o PRÓPRIO repo define (test.mjs) e reporta o exit code real.
// Sem test.mjs => not-configured (honesto). Falha de teste => failed, nunca
// sucesso textual.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import type { EvidenceProvider, IntegrationResult } from "../../ports/IntegrationAdapter.ts";
import { REPOS_ROOT } from "../../shared/paths.ts";

const EVIDENCE_ENTRYPOINT = "test.mjs";

export class CiLocalAdapter implements EvidenceProvider {
  readonly id = "ci-local";
  readonly catalogId = "ci-status";
  readonly mayWriteAuthoritativeState = false as const;
  private readonly reposRoot: string;

  constructor(options: { reposRoot?: string } = {}) {
    this.reposRoot = options.reposRoot || REPOS_ROOT;
  }

  describe(): { id: string; catalogId: string; mechanism: string } {
    return {
      id: this.id,
      catalogId: this.catalogId,
      mechanism: `executa node ${EVIDENCE_ENTRYPOINT} definido pelo repo e reporta exit code real`,
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
    const entry = path.join(repoDir, EVIDENCE_ENTRYPOINT);
    if (!existsSync(entry)) {
      return {
        adapter: this.id,
        status: "not-configured",
        summary: `repo "${repoId}" não define ${EVIDENCE_ENTRYPOINT}`,
        evidence: [],
      };
    }
    const startedAt = Date.now();
    const result = spawnSync(process.execPath, [EVIDENCE_ENTRYPOINT], {
      cwd: repoDir,
      encoding: "utf8",
      shell: false,
      timeout: 60_000,
    });
    const durationMs = Date.now() - startedAt;
    const outputTail = `${result.stdout || ""}${result.stderr || ""}`
      .trim()
      .split(/\r?\n/)
      .slice(-5);
    const evidence = [
      {
        kind: "local-test-run",
        command: `node ${EVIDENCE_ENTRYPOINT}`,
        source: repoDir,
        observedAt,
        detail: { exitCode: result.status, durationMs, outputTail },
      },
    ];
    if (result.error) {
      return {
        adapter: this.id,
        status: "unavailable",
        summary: `não foi possível executar ${EVIDENCE_ENTRYPOINT} em "${repoId}"`,
        evidence,
        error: String(result.error.message),
      };
    }
    if (result.status !== 0) {
      return {
        adapter: this.id,
        status: "failed",
        summary: `testes locais de "${repoId}" falharam (exit ${result.status})`,
        evidence,
        error: outputTail.join(" | ") || `exit ${result.status}`,
      };
    }
    return {
      adapter: this.id,
      status: "ok",
      summary: `testes locais de "${repoId}" passaram em ${durationMs}ms`,
      evidence,
    };
  }

  async test(): Promise<IntegrationResult> {
    // acme-core-api é repo crítico com testes locais versionados
    return this.collect("acme-core-api");
  }
}
