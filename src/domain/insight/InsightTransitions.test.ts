import { GovernanceError } from "../shared/errors.js";
import { lastSeenAt, originOf, recurrenceOf, specsTouched, OriginContext } from "./Insight.js";
import {
  captureInsight,
  discardInsight,
  promoteInsight,
  recordOccurrence,
} from "./InsightTransitions.js";

const ORIGIN_0024: OriginContext = { spec: "0024", cursor: "checkpoint-2.4d" };
const ORIGIN_0025: OriginContext = { spec: "0025", cursor: null };
const T1 = "2026-06-03T10:00:00Z";
const T2 = "2026-06-20T09:00:00Z";
const TR = "2026-06-25T12:00:00Z"; // instante da transição terminal

function captured() {
  return captureInsight(
    { text: "projeção que ignora invariantes do consolidate", origin: ORIGIN_0024 },
    "PIT-0001",
    T1
  );
}

describe("captura de percepção", () => {
  it("nasce 'open' com uma ocorrência (o nascimento), recorrência 1", () => {
    const i = captured();
    expect(i.status).toBe("open");
    expect(recurrenceOf(i)).toBe(1);
    expect(i.capturedAt).toBe(T1);
    expect(originOf(i)).toEqual(ORIGIN_0024);
  });

  it("normaliza (trim) o texto da percepção", () => {
    const i = captureInsight(
      { text: "  drift SSOT→projeção  ", origin: ORIGIN_0024 },
      "PIT-0001",
      T1
    );
    expect(i.text).toBe("drift SSOT→projeção");
  });

  it("rejeita texto curto demais (rótulo, não afirmação)", () => {
    expect(() => captureInsight({ text: "curto", origin: ORIGIN_0024 }, "PIT-0001", T1)).toThrow(
      GovernanceError
    );
  });

  it("rejeita origem sem spec", () => {
    expect(() =>
      captureInsight(
        { text: "uma afirmação suficientemente longa", origin: { spec: "", cursor: null } },
        "PIT-0001",
        T1
      )
    ).toThrow(/spec é obrigatório/);
  });
});

describe("recorrência (acumulação cross-spec)", () => {
  it("registra nova observação e incrementa a recorrência", () => {
    const i = recordOccurrence(captured(), ORIGIN_0025, T2, "reapareceu no provenance render");
    expect(recurrenceOf(i)).toBe(2);
    expect(lastSeenAt(i)).toBe(T2);
    expect(specsTouched(i)).toEqual(["0024", "0025"]);
  });

  it("rejeita ocorrência fora de ordem cronológica", () => {
    expect(() => recordOccurrence(captured(), ORIGIN_0025, "2026-01-01T00:00:00Z")).toThrow(
      /não-decrescentes/
    );
  });

  it("não registra recorrência em percepção terminal", () => {
    const promoted = promoteInsight(captured(), { kind: "guardrail", ref: "GG-0004" }, TR);
    expect(() => recordOccurrence(promoted, ORIGIN_0025, T2)).toThrow(/terminal/);
  });
});

describe("promoção (graduação) e descarte — terminais", () => {
  it("promove para um artefato governado, carimbando quando (e quem, se declarado)", () => {
    const i = promoteInsight(captured(), { kind: "guardrail", ref: " GG-0004 " }, TR, " @rosana ");
    expect(i.status).toBe("promoted");
    expect(i.promotion).toEqual({ kind: "guardrail", ref: "GG-0004" });
    expect(i.resolvedAt).toBe(TR);
    expect(i.resolvedBy).toBe("@rosana");
    expect(i.discardReason).toBeUndefined();
  });

  it("promove sem autor declarado — resolvedBy omitido (sem inferência)", () => {
    const i = promoteInsight(captured(), { kind: "adr", ref: "ADR-0025" }, TR);
    expect(i.resolvedAt).toBe(TR);
    expect(i.resolvedBy).toBeUndefined();
  });

  it("descarta com motivo (anti-recaptura), carimbando quando", () => {
    const i = discardInsight(captured(), "não se sustentou", TR);
    expect(i.status).toBe("discarded");
    expect(i.discardReason).toBe("não se sustentou");
    expect(i.resolvedAt).toBe(TR);
    expect(i.promotion).toBeUndefined();
  });

  it("rejeita descarte sem motivo", () => {
    expect(() => discardInsight(captured(), "   ", TR)).toThrow(/motivo/);
  });

  it("não promove uma percepção já terminal (imutabilidade)", () => {
    const discarded = discardInsight(captured(), "ruído", TR);
    expect(() => promoteInsight(discarded, { kind: "adr", ref: "ADR-0025" }, TR)).toThrow(
      /terminal/
    );
  });
});
