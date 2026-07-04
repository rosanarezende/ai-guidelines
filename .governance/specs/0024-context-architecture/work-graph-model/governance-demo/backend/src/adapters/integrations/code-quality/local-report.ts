// code-quality.ts — evidence provider de qualidade de código.
// Caminho 1 (default): parse de relatório local Sonar-compatível versionado no
// repo (reports/code-quality.json), com hash verificado. Caminho 2 (opt-in):
// SONARQUBE_URL — só sai da máquina se a política de egress permitir; senão
// falha fechado. Nunca sintetiza métricas.
import { existsSync } from "node:fs";
import path from "node:path";
import type { EvidenceProvider, IntegrationResult } from "../../../ports/IntegrationAdapter.ts";
import { resolveEgress } from "../../../application/integrations/egress-policy.ts";
import { REPOS_ROOT } from "../../../shared/paths.ts";
import { readVerifiedReport } from "../shared/verified-report.ts";

export const CODE_QUALITY_REPORT_SCHEMA = "acme.code-quality-report/v1";
export const CODE_QUALITY_REPORT_FILE = path.join("reports", "code-quality.json");

export type CodeQualityBody = {
  analyzer: string;
  issues: Array<{ rule: string; severity: string; file: string; message: string }>;
  measures: Record<string, number | string>;
};

export class CodeQualityAdapter implements EvidenceProvider {
  readonly id = "code-quality";
  readonly catalogId = "code-quality";
  readonly mayWriteAuthoritativeState = false as const;
  private readonly reposRoot: string;
  private readonly env: NodeJS.ProcessEnv;

  constructor(options: { reposRoot?: string; env?: NodeJS.ProcessEnv } = {}) {
    this.reposRoot = options.reposRoot || REPOS_ROOT;
    this.env = options.env || process.env;
  }

  describe(): { id: string; catalogId: string; mechanism: string } {
    return {
      id: this.id,
      catalogId: this.catalogId,
      mechanism:
        "parse de reports/code-quality.json (hash-verificado) por repo; SONARQUBE_URL opcional atrás da política de egress",
    };
  }

  async collect(repoId: string): Promise<IntegrationResult> {
    const observedAt = new Date().toISOString();
    const sonarUrl = this.env["SONARQUBE_URL"];
    if (sonarUrl) {
      const egress = resolveEgress(sonarUrl, this.env);
      if (!egress.allowed) {
        return {
          adapter: this.id,
          status: "egress-blocked",
          summary: `SONARQUBE_URL configurada mas bloqueada: ${egress.reason}`,
          evidence: [],
          error: egress.reason,
        };
      }
      // Implementação remota entra quando houver instância aprovada; até lá o
      // opt-in permitido ainda reporta not-configured em vez de fingir análise.
      return {
        adapter: this.id,
        status: "not-configured",
        summary: "egress permitido, mas o cliente SonarQube remoto ainda não foi mecanizado",
        evidence: [],
      };
    }
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
    const file = path.join(repoDir, CODE_QUALITY_REPORT_FILE);
    const read = readVerifiedReport<CodeQualityBody>(file, CODE_QUALITY_REPORT_SCHEMA);
    if (read.status === "missing") {
      return {
        adapter: this.id,
        status: "not-configured",
        summary: `repo "${repoId}" não publica ${CODE_QUALITY_REPORT_FILE}`,
        evidence: [],
      };
    }
    if (read.status === "invalid") {
      return {
        adapter: this.id,
        status: "unavailable",
        summary: `relatório de qualidade de "${repoId}" inválido`,
        evidence: [],
        error: read.error,
      };
    }
    const { report } = read;
    const blockers = report.body.issues.filter((issue) =>
      ["blocker", "critical"].includes(issue.severity.toLowerCase())
    );
    return {
      adapter: this.id,
      status: blockers.length ? "failed" : "ok",
      summary: blockers.length
        ? `${blockers.length} issue(s) blocker/critical em "${repoId}"`
        : `qualidade de "${repoId}": ${report.body.issues.length} issue(s), nenhuma blocker`,
      evidence: [
        {
          kind: "code-quality-report",
          source: file,
          observedAt,
          contentHash: report.contentHash,
          detail: {
            analyzer: report.body.analyzer,
            generatedAt: report.generatedAt,
            issueCount: report.body.issues.length,
            measures: report.body.measures,
          },
        },
      ],
      ...(blockers.length
        ? { error: blockers.map((issue) => `${issue.rule}: ${issue.file}`).join(" | ") }
        : {}),
    };
  }

  async test(): Promise<IntegrationResult> {
    return this.collect("acme-core-api");
  }
}
