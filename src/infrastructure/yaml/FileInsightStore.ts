import { InsightStore } from "../../app/ports/InsightStore.js";
import { WorkflowFileSystem } from "../../app/ports/WorkflowFileSystem.js";
import { Insight, InsightStatus } from "../../domain/insight/Insight.js";
import { InsightLedger } from "../../domain/insight/InsightLedger.js";
import { parseInsightsLedger, stringifyInsightsLedger } from "./insightsLedgerSerializer.js";

/** Caminhos canônicos do ledger particionado por status (runtime-scoped, framework-wide). */
export const LEGACY_INSIGHTS_LEDGER_PATH = ".governance/runtime/insights.yml";
export const INSIGHTS_OPEN_PATH = ".governance/runtime/insights/open.yml";
export const INSIGHTS_PROMOTED_PATH = ".governance/runtime/insights/promoted.yml";
export const INSIGHTS_DISCARDED_PATH = ".governance/runtime/insights/discarded.yml";

export const INSIGHT_PARTITION_PATHS: Readonly<Record<InsightStatus, string>> = {
  open: INSIGHTS_OPEN_PATH,
  promoted: INSIGHTS_PROMOTED_PATH,
  discarded: INSIGHTS_DISCARDED_PATH,
};

export const INSIGHTS_LEDGER_PATHS: ReadonlyArray<string> = [
  INSIGHTS_OPEN_PATH,
  INSIGHTS_PROMOTED_PATH,
  INSIGHTS_DISCARDED_PATH,
];

/**
 * Adapter de {@link InsightStore} sobre o {@link WorkflowFileSystem}.
 * Arquivos ausentes são tratados como partições vazias (primeira captura cria
 * as partições). O path legado é aceito apenas como fallback de leitura para
 * consumidores ainda não migrados; `save` sempre escreve a estrutura nova.
 */
export class FileInsightStore implements InsightStore {
  constructor(private readonly fs: WorkflowFileSystem) {}

  load(): InsightLedger {
    const insights: Insight[] = [];
    let sawPartition = false;
    for (const path of INSIGHTS_LEDGER_PATHS) {
      if (!this.fs.fileExists(path)) continue;
      sawPartition = true;
      insights.push(...parseInsightsLedger(this.fs.readTextFile(path)).all());
    }
    if (!sawPartition && this.fs.fileExists(LEGACY_INSIGHTS_LEDGER_PATH)) {
      return parseInsightsLedger(this.fs.readTextFile(LEGACY_INSIGHTS_LEDGER_PATH));
    }
    return InsightLedger.fromArray(insights);
  }

  save(ledger: InsightLedger): void {
    const byStatus: Record<InsightStatus, Insight[]> = {
      open: [],
      promoted: [],
      discarded: [],
    };
    for (const insight of ledger.all()) {
      byStatus[insight.status].push(insight);
    }
    for (const status of Object.keys(INSIGHT_PARTITION_PATHS) as InsightStatus[]) {
      this.fs.writeTextFile(
        INSIGHT_PARTITION_PATHS[status],
        stringifyInsightsLedger(InsightLedger.fromArray(byStatus[status]))
      );
    }
  }
}
