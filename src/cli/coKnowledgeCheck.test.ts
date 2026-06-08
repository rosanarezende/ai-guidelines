import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Falsification, sealFalsification } from "../domain/knowledge/Falsification.js";
import { GovernedRef } from "../domain/knowledge/GovernedRef.js";
import { serializeFalsifications } from "../infrastructure/yaml/falsificationsSerializer.js";
import { main, runCoKnowledgeCheck } from "./coKnowledgeCheck.js";

const DEC: GovernedRef = { space: "knowledge", ref: { stage: "decision", id: "DEC-0024-G07" } };

function fal(over: Partial<Omit<Falsification, "fingerprint">> = {}): Falsification {
  return sealFalsification({
    id: "FAL-0001",
    claim: "claim derrubada",
    constrains: [DEC],
    evidence: "git-tag:evidence/x",
    ...over,
  });
}

describe("co-knowledge:check [BR-CO-KNOWLEDGE-CHECK]", () => {
  describe("runCoKnowledgeCheck", () => {
    it("DADO falsification bem-formada e selada ENTÃO 0 achados", () => {
      const r = runCoKnowledgeCheck({ falsifications: [fal()], activeInsightIds: new Set() });
      expect(r.structural).toEqual([]);
      expect(r.reopened).toEqual([]);
    });

    it("F2: fingerprint stale (claim adulterada) → structural", () => {
      const tampered = { ...fal(), claim: "adulterada após o selo" };
      const r = runCoKnowledgeCheck({ falsifications: [tampered], activeInsightIds: new Set() });
      expect(r.structural.map((f) => f.code)).toContain("FAL_FINGERPRINT_STALE");
    });

    it("F4a: falsifiesRef de insight ATIVO (open) → reopened", () => {
      const f = fal({ falsifiesRef: { stage: "insight", id: "PIT-0001" } });
      const r = runCoKnowledgeCheck({
        falsifications: [f],
        activeInsightIds: new Set(["PIT-0001"]),
      });
      expect(r.reopened.map((x) => x.code)).toContain("FAL_REOPENED_REF");
    });

    it("F4a: falsifiesRef AUSENTE (dogfood FAL-0001) → SEM reopened", () => {
      const r = runCoKnowledgeCheck({
        falsifications: [fal()],
        activeInsightIds: new Set(["PIT-0001"]),
      });
      expect(r.reopened).toEqual([]);
    });

    it("F4a: falsifiesRef de insight NÃO-ativo → SEM reopened", () => {
      const f = fal({ falsifiesRef: { stage: "insight", id: "PIT-9999" } });
      const r = runCoKnowledgeCheck({
        falsifications: [f],
        activeInsightIds: new Set(["PIT-0001"]),
      });
      expect(r.reopened).toEqual([]);
    });
  });

  describe("main (advisory-first)", () => {
    let tmp: string;
    beforeEach(() => {
      tmp = fs.mkdtempSync(path.join(os.tmpdir(), "coknow-"));
    });
    afterEach(() => {
      fs.rmSync(tmp, { recursive: true, force: true });
    });

    function write(content: string): void {
      const abs = path.join(tmp, ".governance/runtime/falsifications.yml");
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf-8");
    }
    function capture() {
      const lines: string[] = [];
      return {
        logger: { info: (m: string) => lines.push(m), error: (m: string) => lines.push(m) },
        text: () => lines.join("\n"),
      };
    }

    it("sem falsifications.yml → exit 0 (nada a checar)", () => {
      const { logger, text } = capture();
      expect(main(tmp, logger)).toBe(0);
      expect(text()).toContain("Nada a checar");
    });

    it("ledger íntegro → exit 0 + ✅", () => {
      write(serializeFalsifications([fal()]));
      const { logger, text } = capture();
      expect(main(tmp, logger)).toBe(0);
      expect(text()).toContain("✅");
    });

    it("falsification adulterada (F2) → exit 0 (advisory) + ⚠️", () => {
      write(serializeFalsifications([{ ...fal(), claim: "adulterada após o selo" }]));
      const { logger, text } = capture();
      expect(main(tmp, logger)).toBe(0); // advisory-first: NUNCA bloqueia
      expect(text()).toContain("⚠️");
      expect(text()).toContain("FAL_FINGERPRINT_STALE");
    });
  });
});
