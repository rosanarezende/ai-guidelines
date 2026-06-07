import { runActiveSpecsConsistencyCheck } from "./activeSpecsConsistencyCheck.js";

/** Índice mínimo válido com UMA entry de `stage` dado. */
function indexWith(stage: string): string {
  return `
version: 1
active_specs:
  - id: "0024"
    slug: context-architecture
    branch: feat/spec-0024-x
    stage: ${stage}
    status: active
    spec_path: .governance/specs/0024-context-architecture
    source_state_path: .governance/specs/0024-context-architecture/state.yml
    updated_at: 2026-06-06T00:00:00.000-03:00
`;
}

/** state.yml mínimo válido (schema 4-chave) com `stage` dado. */
function stateWith(stage: string): string {
  return `
stage: ${stage}
gate:
  status: closed
focus: []
next: []
`;
}

describe("CLI — active-specs:check · consistência stage↔SSOT [BR-ACTIVE-SPECS-DRIFT]", () => {
  it("DADO entry.stage == state.yml.stage QUANDO checa ENTÃO ok", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexWith("implementation"),
      readStateYml: () => stateWith("implementation"),
    });
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") expect(r.count).toBe(1);
  });

  // Regressão do bug real: 0023 listada como `closing` enquanto a SSOT dizia `done`.
  it("DADO entry.stage divergente da SSOT (closing vs done) ENTÃO falha apontando o stage stale", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexWith("closing"),
      readStateYml: () => stateWith("done"),
    });
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") {
      expect(r.failures).toHaveLength(1);
      expect(r.failures[0].id).toBe("0024");
      expect(r.failures[0].message).toMatch(/stage stale/);
      expect(r.failures[0].message).toContain("closing");
      expect(r.failures[0].message).toContain("done");
    }
  });

  it("DADO entry apontando state.yml inexistente ENTÃO falha (SSOT ausente)", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexWith("implementation"),
      readStateYml: () => null,
    });
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") {
      expect(r.failures[0].message).toMatch(/não encontrado/);
    }
  });
});
