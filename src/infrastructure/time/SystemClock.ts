import { Clock } from "../../app/ports/Clock.js";

/**
 * Adapter de {@link Clock} sobre o relógio do sistema.
 * `Date#toISOString()` emite ISO-8601 UTC com `Z` (ex.: "2026-06-03T12:00:00.000Z"),
 * compatível com a invariante ISO-8601 estrita do domínio.
 */
export class SystemClock implements Clock {
  nowIso(): string {
    return new Date().toISOString();
  }
}
