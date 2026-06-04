import { CaptureDraft, Insight } from "../../domain/insight/Insight.js";
import { Clock } from "../ports/Clock.js";
import { InsightStore } from "../ports/InsightStore.js";

export interface CaptureInsightDeps {
  readonly store: InsightStore;
  readonly clock: Clock;
}

/**
 * Use case: capturar uma percepção em trânsito (baixa cerimônia).
 * Carrega o ledger, aloca id sequencial, registra a observação de nascimento
 * carimbada pelo relógio e persiste. Não decide nada — só registra.
 */
export class CaptureInsight {
  constructor(private readonly deps: CaptureInsightDeps) {}

  execute(draft: CaptureDraft): Insight {
    const ledger = this.deps.store.load();
    const insight = ledger.capture(draft, this.deps.clock.nowIso());
    this.deps.store.save(ledger);
    return insight;
  }
}
