import * as fs from "node:fs";
import * as path from "node:path";
import { WORK_MODES, WorkPolicyParseError, parseWorkPolicy } from "./workPolicyReader.js";

function realPolicy(): string {
  return fs.readFileSync(path.join(process.cwd(), ".core/governance/work-policy.yml"), "utf-8");
}

describe("parseWorkPolicy · schema [work-policy]", () => {
  it("a policy real do repo parseia e cobre todos os modos canônicos", () => {
    const policy = parseWorkPolicy(realPolicy());
    expect(policy.version).toBe(1);
    expect(Object.keys(policy.modes).sort()).toEqual([...WORK_MODES].sort());
    for (const mode of WORK_MODES) {
      expect(policy.modes[mode].reportSections.length).toBeGreaterThan(0);
      expect(["forbidden", "explicit-work-request"]).toContain(
        policy.modes[mode].publication.commit
      );
      expect(policy.modes[mode].publication.mixedScope).toBe("forbidden");
    }
  });

  it("version != 1 falha", () => {
    expect(() => parseWorkPolicy("version: 2\nmodes: {}\n")).toThrow(/version deve ser 1/);
  });

  it("modo desconhecido falha", () => {
    const yaml = realPolicy() + "\n  bogus_mode:\n    purpose: x\n";
    expect(() => parseWorkPolicy(yaml)).toThrow(WorkPolicyParseError);
  });

  it("modo ausente falha (contrato incompleto)", () => {
    const partial = `version: 1
modes:
  blocked:
    purpose: x
    allowed_actions: []
    forbidden_actions: []
    publication: { commit: forbidden, push: forbidden, mixed_scope: forbidden }
    validations: []
    expects_resolutions: false
    pr_body_editable: false
    stop_conditions: [x]
    report_sections: [A]
`;
    expect(() => parseWorkPolicy(partial)).toThrow(/ausente/);
  });

  it("publication.mixed_scope != forbidden falha", () => {
    const yaml = realPolicy().replaceAll("mixed_scope: forbidden", "mixed_scope: allowed");
    expect(() => parseWorkPolicy(yaml)).toThrow(/mixed_scope/);
  });

  it("publication.commit fora do enum falha", () => {
    const yaml = realPolicy().replace("commit: explicit-work-request", "commit: sometimes");
    expect(() => parseWorkPolicy(yaml)).toThrow(/commit.*inválido/);
  });

  it("chave desconhecida em modo falha", () => {
    const yaml = realPolicy().replace("  current:", "  current:\n    bogus: 1");
    expect(() => parseWorkPolicy(yaml)).toThrow(/chave desconhecida "bogus"/);
  });
});
