import { InsightStore } from "../../app/ports/InsightStore.js";
import { WorkflowFileSystem } from "../../app/ports/WorkflowFileSystem.js";
import { InsightLedger } from "../../domain/insight/InsightLedger.js";
import { parseInsightsLedger, stringifyInsightsLedger } from "./insightsLedgerSerializer.js";

/** Caminho canônico do ledger (runtime-scoped, framework-wide). */
export const INSIGHTS_LEDGER_PATH = ".governance/runtime/insights.yml";

/**
 * Adapter de {@link InsightStore} sobre o {@link WorkflowFileSystem}.
 * Arquivo ausente é tratado como ledger vazio (primeira captura cria o arquivo).
 */
export class FileInsightStore implements InsightStore {
  constructor(
    private readonly fs: WorkflowFileSystem,
    private readonly path: string = INSIGHTS_LEDGER_PATH
  ) {}

  load(): InsightLedger {
    if (!this.fs.fileExists(this.path)) {
      return InsightLedger.empty();
    }
    return parseInsightsLedger(this.fs.readTextFile(this.path));
  }

  save(ledger: InsightLedger): void {
    this.fs.writeTextFile(this.path, stringifyInsightsLedger(ledger));
  }
}
