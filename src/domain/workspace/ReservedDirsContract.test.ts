/**
 * [BR-CLI-WORKSPACE-RESERVED] Contrato de reservas canônicas em `.governance/`.
 *
 * Drift guard simples: o conjunto exato de reservas (`intake`, `handoff`,
 * `telemetry`) é parte do contrato publicado em `ARCHITECTURE.md` §H e em
 * `docs/cli/ai-guidelines-cli.md`. Alterar o conjunto sem atualizar os docs
 * deve falhar o pipeline. Mantém o domínio TS como SSOT do conjunto.
 */
import { RESERVED_GOVERNANCE_DIRS } from "./MigrationPlan.js";

describe("RESERVED_GOVERNANCE_DIRS — contrato canônico [DEC-0021-B02]", () => {
  it("DADO o domínio ENTÃO declara exatamente intake/handoff/telemetry", () => {
    expect([...RESERVED_GOVERNANCE_DIRS]).toEqual(["intake", "handoff", "telemetry"]);
  });

  it("DADO a lista ENTÃO é congelada (ordem estável, sem duplicatas)", () => {
    const set = new Set(RESERVED_GOVERNANCE_DIRS);
    expect(set.size).toBe(RESERVED_GOVERNANCE_DIRS.length);
  });
});
