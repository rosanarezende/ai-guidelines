import { Insight, PromotionTarget } from "../../domain/insight/Insight.js";
import { InsightId } from "../../domain/insight/InsightId.js";
import { Clock } from "../ports/Clock.js";
import { InsightStore } from "../ports/InsightStore.js";

export interface PromoteInsightDeps {
  readonly store: InsightStore;
  readonly clock: Clock;
}

export interface PromoteInsightInput {
  readonly id: InsightId;
  readonly target: PromotionTarget;
  /** Autor da decisão — só quando DECLARADO (sem inferência de git). */
  readonly by?: string;
}

/**
 * Use case: graduar (promover) uma percepção para um artefato governado.
 * Fachada sobre {@link InsightLedger.promote} — nenhuma regra é reimplementada;
 * o domínio decide a transição e suas invariantes. Carimba o instante via Clock.
 */
export class PromoteInsight {
  constructor(private readonly deps: PromoteInsightDeps) {}

  execute(input: PromoteInsightInput): Insight {
    const ledger = this.deps.store.load();
    const promoted = ledger.promote(input.id, input.target, this.deps.clock.nowIso(), input.by);
    this.deps.store.save(ledger);
    return promoted;
  }
}
