import { Insight } from "../../domain/insight/Insight.js";
import { InsightId } from "../../domain/insight/InsightId.js";
import { Clock } from "../ports/Clock.js";
import { InsightStore } from "../ports/InsightStore.js";

export interface DiscardInsightDeps {
  readonly store: InsightStore;
  readonly clock: Clock;
}

export interface DiscardInsightInput {
  readonly id: InsightId;
  readonly reason: string;
  /** Autor da decisão — só quando DECLARADO (sem inferência de git). */
  readonly by?: string;
}

/**
 * Use case: descartar conscientemente uma percepção (anti-recaptura).
 * Fachada sobre {@link InsightLedger.discard} — sem reimplementar regras.
 * Carimba o instante via Clock.
 */
export class DiscardInsight {
  constructor(private readonly deps: DiscardInsightDeps) {}

  execute(input: DiscardInsightInput): Insight {
    const ledger = this.deps.store.load();
    const discarded = ledger.discard(input.id, input.reason, this.deps.clock.nowIso(), input.by);
    this.deps.store.save(ledger);
    return discarded;
  }
}
