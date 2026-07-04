// observability.ts — evidence provider de métricas operacionais em desenvolvimento.
// Lê o relatório publicado pelo stack de observabilidade da org demo
// (acme-obs-stack/reports/operational-metrics.json) com hash verificado.
// É honesto por construção: fixture verificável, declarada como fixture —
// nunca telemetria em tempo real fingida.
import path from "node:path";
import type { EvidenceProvider, IntegrationResult } from "../../../ports/IntegrationAdapter.ts";
import { REPOS_ROOT } from "../../../shared/paths.ts";
import { readVerifiedReport } from "../shared/verified-report.ts";

export const OBSERVABILITY_REPORT_SCHEMA = "acme.operational-metrics/v1";
export const OBSERVABILITY_SOURCE_REPO = "acme-obs-stack";
export const OBSERVABILITY_REPORT_FILE = path.join("reports", "operational-metrics.json");

export type OperationalMetricsBody = {
  mode: "fixture" | "live";
  window: { start: string; end: string };
  metrics: Array<{ id: string; repo: string; value: string; unit: string }>;
};

export class ObservabilityAdapter implements EvidenceProvider {
  readonly id = "observability";
  readonly catalogId = "observability";
  readonly mayWriteAuthoritativeState = false as const;
  private readonly reportFile: string;

  constructor(options: { reportFile?: string } = {}) {
    this.reportFile =
      options.reportFile ||
      path.join(REPOS_ROOT, OBSERVABILITY_SOURCE_REPO, OBSERVABILITY_REPORT_FILE);
  }

  describe(): { id: string; catalogId: string; mechanism: string } {
    return {
      id: this.id,
      catalogId: this.catalogId,
      mechanism:
        "parse do relatório hash-verificado publicado pelo acme-obs-stack (fixture declarada; live entra como provider futuro)",
    };
  }

  async collect(repoId: string): Promise<IntegrationResult> {
    const result = await this.test();
    if (result.status !== "ok") return result;
    const detail = result.evidence[0]?.detail as { metrics?: OperationalMetricsBody["metrics"] };
    const repoMetrics = (detail?.metrics || []).filter((metric) => metric.repo === repoId);
    if (!repoMetrics.length) {
      return {
        adapter: this.id,
        status: "not-configured",
        summary: `relatório operacional não cobre o repo "${repoId}"`,
        evidence: result.evidence,
      };
    }
    return {
      ...result,
      summary: `${repoMetrics.length} métrica(s) operacionais para "${repoId}"`,
      evidence: [
        {
          ...result.evidence[0],
          detail: { ...detail, metrics: repoMetrics },
        },
      ],
    };
  }

  async test(): Promise<IntegrationResult> {
    const observedAt = new Date().toISOString();
    const read = readVerifiedReport<OperationalMetricsBody>(
      this.reportFile,
      OBSERVABILITY_REPORT_SCHEMA
    );
    if (read.status === "missing") {
      return {
        adapter: this.id,
        status: "not-configured",
        summary: `sem relatório operacional em ${this.reportFile}`,
        evidence: [],
      };
    }
    if (read.status === "invalid") {
      return {
        adapter: this.id,
        status: "unavailable",
        summary: "relatório operacional inválido — evidência não utilizável",
        evidence: [],
        error: read.error,
      };
    }
    const { report } = read;
    return {
      adapter: this.id,
      status: "ok",
      summary: `${report.body.metrics.length} métrica(s) operacionais (${report.body.mode}) na janela ${report.body.window.start}..${report.body.window.end}`,
      evidence: [
        {
          kind: "operational-metrics-report",
          source: this.reportFile,
          observedAt,
          contentHash: report.contentHash,
          detail: {
            mode: report.body.mode,
            generatedAt: report.generatedAt,
            window: report.body.window,
            metrics: report.body.metrics,
          },
        },
      ],
    };
  }
}
