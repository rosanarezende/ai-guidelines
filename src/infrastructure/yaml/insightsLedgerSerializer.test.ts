import { OriginContext } from "../../domain/insight/Insight.js";
import { InsightLedger } from "../../domain/insight/InsightLedger.js";
import {
  InsightsLedgerParseError,
  parseInsightsLedger,
  stringifyInsightsLedger,
} from "./insightsLedgerSerializer.js";

const ORIGIN: OriginContext = { spec: "0024", cursor: "checkpoint-2.4d" };
const T1 = "2026-06-03T10:00:00.000Z";
const T2 = "2026-06-20T09:00:00.000Z";

function seeded(): InsightLedger {
  const ledger = InsightLedger.empty();
  const a = ledger.capture(
    { text: "projeção que ignora invariantes do consolidate", origin: ORIGIN },
    T1
  );
  ledger.recordOccurrence(a.id, { spec: "0025", cursor: null }, T2, "reapareceu no provenance");
  const b = ledger.capture({ text: "segunda percepção a graduar", origin: ORIGIN }, T1);
  ledger.promote(b.id, { kind: "guardrail", ref: "GG-0004" }, T2, "@rosana");
  const c = ledger.capture({ text: "terceira percepção descartável", origin: ORIGIN }, T1);
  ledger.discard(c.id, "não se sustentou", T2);
  return ledger;
}

describe("insightsLedgerSerializer (round-trip)", () => {
  it("preserva o ledger byte-equivalente em parse(stringify(x))", () => {
    const original = seeded();
    const yaml = stringifyInsightsLedger(original);
    const reparsed = parseInsightsLedger(yaml);
    // round-trip estável: stringify de novo deve bater exatamente.
    expect(stringifyInsightsLedger(reparsed)).toBe(yaml);
    // e os dados sobrevivem.
    expect(reparsed.all().map((i) => i.id)).toEqual(["PIT-0001", "PIT-0002", "PIT-0003"]);
    const a = reparsed.find("PIT-0001");
    expect(a?.occurrences).toHaveLength(2);
    expect(a?.occurrences[1].origin).toEqual({ spec: "0025", cursor: null });
    expect(reparsed.find("PIT-0002")?.promotion).toEqual({ kind: "guardrail", ref: "GG-0004" });
    expect(reparsed.find("PIT-0002")?.resolvedAt).toBe(T2);
    expect(reparsed.find("PIT-0002")?.resolvedBy).toBe("@rosana");
    expect(reparsed.find("PIT-0003")?.discardReason).toBe("não se sustentou");
    expect(reparsed.find("PIT-0003")?.resolvedAt).toBe(T2);
  });

  it("omite cursor null e links vazios do YAML", () => {
    const ledger = InsightLedger.empty();
    ledger.capture(
      { text: "percepção minimalista de origem", origin: { spec: "0024", cursor: null } },
      T1
    );
    const yaml = stringifyInsightsLedger(ledger);
    expect(yaml).not.toContain("cursor:");
    expect(yaml).not.toContain("links:");
  });

  it("arquivo vazio ⇒ ledger vazio", () => {
    expect(parseInsightsLedger("").size()).toBe(0);
  });

  it("rejeita chave desconhecida no registro (allowlist estrita)", () => {
    const bad = `version: 1\ninsights:\n  - id: PIT-0001\n    text: percepção válida longa\n    status: open\n    captured_at: ${T1}\n    occurrences:\n      - { at: ${T1}, spec: "0024" }\n    bogus: x\n`;
    expect(() => parseInsightsLedger(bad)).toThrow(InsightsLedgerParseError);
  });

  it("propaga invariante de domínio (promoted sem alvo) na fronteira de persistência", () => {
    const bad = `version: 1\ninsights:\n  - id: PIT-0001\n    text: percepção válida longa\n    status: promoted\n    captured_at: ${T1}\n    occurrences:\n      - { at: ${T1}, spec: "0024" }\n`;
    expect(() => parseInsightsLedger(bad)).toThrow(/alvo válido/);
  });
});
