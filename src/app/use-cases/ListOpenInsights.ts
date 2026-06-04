import { Insight } from "../../domain/insight/Insight.js";
import { InsightStore } from "../ports/InsightStore.js";

export interface ListOpenInsightsDeps {
  readonly store: InsightStore;
}

/** Use case: consultar as percepções vivas (status `open`). */
export class ListOpenInsights {
  constructor(private readonly deps: ListOpenInsightsDeps) {}

  execute(): ReadonlyArray<Insight> {
    return this.deps.store.load().open();
  }
}
