// osv-report.ts — evidence provider de supply-chain.
// Lê um relatório local OSV/deps.dev hash-verificado. O adapter não consulta
// rede e não escreve estado autoritativo; a coleta live fica em ferramenta
// explícita/CI, e o app consome apenas evidência materializada.
import { existsSync } from "node:fs";
import path from "node:path";
import type { EvidenceProvider, IntegrationResult } from "../../../ports/IntegrationAdapter.ts";
import { REPOS_ROOT } from "../../fs/paths.ts";
import { readVerifiedReport } from "../shared/verified-report.ts";

export const CODE_SECURITY_REPORT_SCHEMA = "acme.code-security-report/v1";
export const CODE_SECURITY_REPORT_FILE = path.join("reports", "code-security.json");

export type CodeSecurityBody = {
  scanner: "osv-scanner" | "osv-dev" | "custom";
  lockfile: string;
  scannedPackages: number;
  vulnerabilities: Array<{
    id: string;
    packageName: string;
    installedVersion: string;
    source: "osv.dev" | "deps.dev" | "manual";
    severity?: "critical" | "high" | "medium" | "low" | "unknown";
    fixedVersion?: string;
  }>;
  depsDev?: {
    enrichedPackages: number;
    licensesObserved: string[];
  };
};

function blockingVulnerabilities(body: CodeSecurityBody): CodeSecurityBody["vulnerabilities"] {
  return body.vulnerabilities.filter((vulnerability) =>
    ["critical", "high"].includes(vulnerability.severity ?? "unknown")
  );
}

export class CodeSecurityAdapter implements EvidenceProvider {
  readonly id = "code-security";
  readonly catalogId = "code-security";
  readonly mayWriteAuthoritativeState = false as const;
  private readonly reposRoot: string;

  constructor(options: { reposRoot?: string } = {}) {
    this.reposRoot = options.reposRoot || REPOS_ROOT;
  }

  describe(): { id: string; catalogId: string; mechanism: string } {
    return {
      id: this.id,
      catalogId: this.catalogId,
      mechanism:
        "parse de reports/code-security.json (OSV/deps.dev hash-verificado); coleta live roda fora do estado autoritativo",
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

    const file = path.join(repoDir, CODE_SECURITY_REPORT_FILE);
    const read = readVerifiedReport<CodeSecurityBody>(file, CODE_SECURITY_REPORT_SCHEMA);
    if (read.status === "missing") {
      return {
        adapter: this.id,
        status: "not-configured",
        summary: `repo "${repoId}" não publica ${CODE_SECURITY_REPORT_FILE}`,
        evidence: [],
      };
    }
    if (read.status === "invalid") {
      return {
        adapter: this.id,
        status: "unavailable",
        summary: `relatório de segurança de "${repoId}" inválido`,
        evidence: [],
        error: read.error,
      };
    }

    const { report } = read;
    const blockers = blockingVulnerabilities(report.body);
    return {
      adapter: this.id,
      status: blockers.length ? "failed" : "ok",
      summary: blockers.length
        ? `${blockers.length} vulnerabilidade(s) critical/high em "${repoId}"`
        : `segurança de dependências de "${repoId}": ${report.body.vulnerabilities.length} achado(s), nenhum critical/high`,
      evidence: [
        {
          kind: "code-security-report",
          source: file,
          observedAt,
          contentHash: report.contentHash,
          detail: {
            scanner: report.body.scanner,
            generatedAt: report.generatedAt,
            lockfile: report.body.lockfile,
            scannedPackages: report.body.scannedPackages,
            vulnerabilityCount: report.body.vulnerabilities.length,
            depsDev: report.body.depsDev,
          },
        },
      ],
      ...(blockers.length
        ? {
            error: blockers
              .map(
                (vulnerability) =>
                  `${vulnerability.id}: ${vulnerability.packageName}@${vulnerability.installedVersion}`
              )
              .join(" | "),
          }
        : {}),
    };
  }

  async test(): Promise<IntegrationResult> {
    return this.collect("acme-core-api");
  }
}
