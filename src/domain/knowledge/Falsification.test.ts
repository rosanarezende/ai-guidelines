import {
  Falsification,
  falsificationFingerprint,
  normalizeClaim,
  sealFalsification,
  validateFalsification,
} from "./Falsification.js";
import { GovernedRef } from "./GovernedRef.js";
import { KnowledgeRef } from "./KnowledgeRef.js";

const DEC: GovernedRef = { space: "knowledge", ref: { stage: "decision", id: "DEC-0024-G07" } };
const PIT: KnowledgeRef = { stage: "insight", id: "PIT-0008" };

function baseInput(
  over: Partial<Omit<Falsification, "fingerprint">> = {}
): Omit<Falsification, "fingerprint"> {
  return {
    id: "FAL-0001",
    claim: "restrição de evento é enforçável em superfície de estado contínuo",
    constrains: [DEC],
    evidence: "git-tag:evidence/merge-prematuro-falsified",
    crystallizedAs: PIT,
    ...over,
  };
}

describe("Falsification · negativo de 1ª classe [BR-CO-KNOWLEDGE-FAL]", () => {
  describe("fingerprint (tamper-evidence + identidade)", () => {
    it("determinístico: mesmo payload → mesmo fp (12 hex)", () => {
      const a = falsificationFingerprint(baseInput());
      const b = falsificationFingerprint(baseInput());
      expect(a).toBe(b);
      expect(a).toMatch(/^[0-9a-f]{12}$/);
    });

    it("variação SUPERFICIAL (whitespace) → mesmo fp", () => {
      const a = falsificationFingerprint(baseInput());
      const b = falsificationFingerprint(
        baseInput({
          claim: "  restrição de evento   é enforçável\nem superfície de estado contínuo  ",
        })
      );
      expect(a).toBe(b);
    });

    it("troca de claim (semântica) → fp diferente", () => {
      expect(falsificationFingerprint(baseInput({ claim: "claim A" }))).not.toBe(
        falsificationFingerprint(baseInput({ claim: "claim B totalmente outra" }))
      );
    });

    it("deslocamento de alvo constrains → fp diferente", () => {
      expect(falsificationFingerprint(baseInput())).not.toBe(
        falsificationFingerprint(baseInput({ constrains: [{ space: "work", id: "spec-0024" }] }))
      );
    });

    it("falsifiesRef presente vs ausente (null) → fp diferente", () => {
      expect(falsificationFingerprint(baseInput())).not.toBe(
        falsificationFingerprint(baseInput({ falsifiesRef: { stage: "decision", id: "DEC-9999" } }))
      );
    });
  });

  describe("validateFalsification (F1–F3 + selo F2)", () => {
    it("DADO Falsification selada e bem-formada ENTÃO zero violações", () => {
      expect(validateFalsification(sealFalsification(baseInput()))).toEqual([]);
    });

    it("dogfood: falsifiesRef AUSENTE é válido (claim auto-contida)", () => {
      expect(
        validateFalsification(sealFalsification(baseInput({ falsifiesRef: undefined })))
      ).toEqual([]);
    });

    it("F2: claim adulterada sem re-selar → FAL_FINGERPRINT_STALE", () => {
      const f = { ...sealFalsification(baseInput()), claim: "claim adulterada após o selo" };
      expect(validateFalsification(f).map((v) => v.code)).toContain("FAL_FINGERPRINT_STALE");
    });

    it("F1: falsifiesRef malformado → FAL_FALSIFIES_MALFORMED", () => {
      const f = sealFalsification(
        baseInput({ falsifiesRef: { stage: "decision", id: "garbage" } })
      );
      expect(validateFalsification(f).map((v) => v.code)).toContain("FAL_FALSIFIES_MALFORMED");
    });

    it("F3: constrains vazio → FAL_CONSTRAINS_EMPTY", () => {
      const f = sealFalsification(baseInput({ constrains: [] }));
      expect(validateFalsification(f).map((v) => v.code)).toContain("FAL_CONSTRAINS_EMPTY");
    });

    it("F3: constrains malformado → FAL_CONSTRAINS_MALFORMED", () => {
      const f = sealFalsification(
        baseInput({
          constrains: [{ space: "knowledge", ref: { stage: "doctrine", id: "garbage" } }],
        })
      );
      expect(validateFalsification(f).map((v) => v.code)).toContain("FAL_CONSTRAINS_MALFORMED");
    });

    it("claim/evidence vazias → FAL_CLAIM_EMPTY + FAL_EVIDENCE_EMPTY", () => {
      const codes = validateFalsification(
        sealFalsification(baseInput({ claim: "   ", evidence: "" }))
      ).map((v) => v.code);
      expect(codes).toEqual(expect.arrayContaining(["FAL_CLAIM_EMPTY", "FAL_EVIDENCE_EMPTY"]));
    });

    it("id fora de FAL-NNNN → FAL_ID_MALFORMED", () => {
      expect(
        validateFalsification(sealFalsification(baseInput({ id: "FALS-1" }))).map((v) => v.code)
      ).toContain("FAL_ID_MALFORMED");
    });
  });

  it("normalizeClaim colapsa whitespace + trim", () => {
    expect(normalizeClaim("  a   b\n c ")).toBe("a b c");
  });
});
