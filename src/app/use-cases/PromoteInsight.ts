import { Insight, PromotionTarget } from "../../domain/insight/Insight.js";
import { InsightId } from "../../domain/insight/InsightId.js";
import { InsightStore } from "../ports/InsightStore.js";

export interface PromoteInsightDeps {
  readonly store: InsightStore;
}

export interface PromoteInsightInput {
  readonly id: InsightId;
  readonly target: PromotionTarget;
}

/**
 * Use case: graduar (promover) uma percepção para um artefato governado.
 * Fachada sobre {@link InsightLedger.promote} — nenhuma regra é reimplementada;
 * o domínio decide a transição e suas invariantes.
 */
export class PromoteInsight {
  constructor(private readonly deps: PromoteInsightDeps) {}

  execute(input: PromoteInsightInput): Insight {
    const ledger = this.deps.store.load();
    const promoted = ledger.promote(input.id, input.target);
    this.deps.store.save(ledger);
    return promoted;
  }
}
