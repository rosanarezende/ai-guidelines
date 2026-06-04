import { Insight, OriginContext } from "../../domain/insight/Insight.js";
import { InsightId } from "../../domain/insight/InsightId.js";
import { Clock } from "../ports/Clock.js";
import { InsightStore } from "../ports/InsightStore.js";

export interface RecordRecurrenceDeps {
  readonly store: InsightStore;
  readonly clock: Clock;
}

export interface RecordRecurrenceInput {
  readonly id: InsightId;
  readonly origin: OriginContext;
  readonly note?: string;
}

/**
 * Use case: registrar uma recorrência (nova observação) de uma percepção
 * existente. É o que operacionaliza "promova na 2ª ocorrência": a contagem
 * acumula cross-spec, com proveniência.
 */
export class RecordRecurrence {
  constructor(private readonly deps: RecordRecurrenceDeps) {}

  execute(input: RecordRecurrenceInput): Insight {
    const ledger = this.deps.store.load();
    const updated = ledger.recordOccurrence(
      input.id,
      input.origin,
      this.deps.clock.nowIso(),
      input.note
    );
    this.deps.store.save(ledger);
    return updated;
  }
}
