import { Insight } from "../../domain/insight/Insight.js";
import { InsightId } from "../../domain/insight/InsightId.js";
import { InsightStore } from "../ports/InsightStore.js";

export interface DiscardInsightDeps {
  readonly store: InsightStore;
}

export interface DiscardInsightInput {
  readonly id: InsightId;
  readonly reason: string;
}

/**
 * Use case: descartar conscientemente uma percepção (anti-recaptura).
 * Fachada sobre {@link InsightLedger.discard} — sem reimplementar regras.
 */
export class DiscardInsight {
  constructor(private readonly deps: DiscardInsightDeps) {}

  execute(input: DiscardInsightInput): Insight {
    const ledger = this.deps.store.load();
    const discarded = ledger.discard(input.id, input.reason);
    this.deps.store.save(ledger);
    return discarded;
  }
}
