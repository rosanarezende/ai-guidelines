import { Falsification, sealFalsification } from "../../domain/knowledge/Falsification.js";
import {
  FalsificationsParseError,
  parseFalsifications,
  serializeFalsifications,
} from "./falsificationsSerializer.js";

const withRef: Falsification = sealFalsification({
  id: "FAL-0002",
  claim: "claim governada derrubada",
  constrains: [{ space: "knowledge", ref: { stage: "doctrine", id: "ADR-0026" } }],
  evidence: "git-tag:evidence/x",
  falsifiesRef: { stage: "decision", id: "DEC-9999" },
  crystallizedAs: { stage: "insight", id: "PIT-0008" },
});

const minimal: Falsification = sealFalsification({
  id: "FAL-0001",
  claim: "claim auto-contida",
  constrains: [
    { space: "knowledge", ref: { stage: "decision", id: "DEC-0024-G07" } },
    { space: "work", id: "spec-0024" },
  ],
  evidence: "git-tag:evidence/merge-prematuro-falsified",
});

describe("falsificationsSerializer [BR-CO-KNOWLEDGE-SER]", () => {
  it("round-trip determinístico (serialize → parse preserva)", () => {
    const text = serializeFalsifications([withRef, minimal]);
    expect(parseFalsifications(text)).toEqual([withRef, minimal]);
  });

  it("determinismo: serializar duas vezes é byte-idêntico", () => {
    expect(serializeFalsifications([withRef])).toBe(serializeFalsifications([withRef]));
  });

  it("opcionais ausentes são OMITIDOS no YAML", () => {
    const text = serializeFalsifications([minimal]);
    expect(text).not.toContain("falsifies_ref");
    expect(text).not.toContain("crystallized_as");
    expect(text).not.toContain("captured_at");
  });

  it("falsifies_ref + work-ref fazem round-trip", () => {
    const text = serializeFalsifications([withRef]);
    expect(text).toContain("falsifies_ref: decision:DEC-9999");
    expect(parseFalsifications(text)[0].falsifiesRef).toEqual({
      stage: "decision",
      id: "DEC-9999",
    });
    const m = parseFalsifications(serializeFalsifications([minimal]))[0];
    expect(m.constrains).toContainEqual({ space: "work", id: "spec-0024" });
  });

  it("arquivo vazio → ledger vazio", () => {
    expect(parseFalsifications("")).toEqual([]);
    expect(parseFalsifications("version: 1\nfalsifications: []")).toEqual([]);
  });

  it("allowlist: chave desconhecida no registro lança", () => {
    const bad = `version: 1
falsifications:
  - id: FAL-0001
    claim: x
    fingerprint: abc
    constrains: ["knowledge:decision:DEC-1"]
    evidence: e
    bogus: 1`;
    expect(() => parseFalsifications(bad)).toThrow(FalsificationsParseError);
  });

  it("allowlist: chave desconhecida no root lança", () => {
    expect(() => parseFalsifications("version: 1\nbogus: 1")).toThrow(/unexpected top-level/);
  });

  it("constrains ausente lança", () => {
    const bad = `version: 1
falsifications:
  - id: FAL-0001
    claim: x
    fingerprint: abc
    evidence: e`;
    expect(() => parseFalsifications(bad)).toThrow(/constrains/);
  });
});
