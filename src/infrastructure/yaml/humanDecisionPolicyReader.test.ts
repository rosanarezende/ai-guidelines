import * as fs from "node:fs";
import * as path from "node:path";
import {
  HumanDecisionPolicyParseError,
  findDecisionType,
  parseHumanDecisionPolicy,
} from "./humanDecisionPolicyReader.js";

const REAL = fs.readFileSync(
  path.join(process.cwd(), ".core/governance/human-decision-policy.yml"),
  "utf-8"
);

describe("humanDecisionPolicyReader [decide]", () => {
  it("[63] parseia a policy real distribuída (.core/**) com os tipos declarados", () => {
    const policy = parseHumanDecisionPolicy(REAL);
    expect(policy.version).toBe(1);
    expect(policy.decisionTypes.map((t) => t.id)).toEqual([
      "close-dispositions",
      "mark-readiness",
      "advance-subcheckpoint",
      "human-gate",
      "open-next-node",
    ]);
    expect(policy.owner.handle).toBe("@rosanarezende");
  });

  it("mark-readiness declara mutação exclusiva de lifecycle com limites explícitos", () => {
    const policy = parseHumanDecisionPolicy(REAL);
    const mr = findDecisionType(policy, "mark-readiness")!;
    expect(mr.choices.map((c) => c.id)).toContain("mark-ready");
    expect(mr.notAuthorized.join(" ")).toMatch(/Ativar o próximo sub-checkpoint/);
    expect(mr.notAuthorized.join(" ")).toMatch(/Human Gate/);
    expect(mr.publication.mixedDiff).toBe("forbidden");
    expect(mr.requiresOwner).toBe(true);
  });

  it("open-next-node declara abertura mutante do próximo nó sem autorizar merge/gate", () => {
    const policy = parseHumanDecisionPolicy(REAL);
    const open = findDecisionType(policy, "open-next-node")!;
    expect(open.choices.map((c) => [c.id, c.mutating])).toContainEqual(["open-node", true]);
    expect(open.consequences.join(" ")).toMatch(/PR Draft stacked/);
    expect(open.notAuthorized.join(" ")).toMatch(/Fazer merge/);
    expect(open.notAuthorized.join(" ")).toMatch(/Executar Human Gate/);
    expect(open.publication.mixedDiff).toBe("forbidden");
    expect(open.requiresOwner).toBe(true);
  });

  it("close-dispositions declara 8 seções humanas + escolhas + limites", () => {
    const policy = parseHumanDecisionPolicy(REAL);
    const cd = findDecisionType(policy, "close-dispositions")!;
    expect(cd.sections).toHaveLength(8);
    expect(cd.choices.map((c) => c.id)).toEqual([
      "accept-all",
      "review-individually",
      "request-explanation",
      "request-changes",
      "cancel",
    ]);
    expect(cd.notAuthorized.length).toBeGreaterThan(0);
    expect(cd.requiresOwner).toBe(true);
    expect(cd.publication.mixedDiff).toBe("forbidden");
  });

  it("rejeita chave desconhecida na raiz", () => {
    expect(() =>
      parseHumanDecisionPolicy(
        "version: 1\nbogus: 1\nowner:\n  handle: a\n  email: b\ndecision_types: {}"
      )
    ).toThrow(HumanDecisionPolicyParseError);
  });

  it("rejeita version != 1", () => {
    expect(() =>
      parseHumanDecisionPolicy(
        "version: 2\nowner:\n  handle: a\n  email: b\ndecision_types:\n  x: {}"
      )
    ).toThrow(/version deve ser 1/);
  });

  it("rejeita mixed_diff != forbidden", () => {
    // split/join troca TODAS as ocorrências (a 1ª no arquivo está num comentário).
    const bad = REAL.split("mixed_diff: forbidden").join("mixed_diff: allowed");
    expect(() => parseHumanDecisionPolicy(bad)).toThrow(/mixed_diff/);
  });

  it("rejeita choices com id duplicado", () => {
    const yaml = `version: 1
owner: { handle: a, email: b }
decision_types:
  x:
    title: T
    purpose: P
    requires_owner: true
    sections: [{ key: k, heading: H }]
    choices:
      - { id: dup, label: A, mutating: false }
      - { id: dup, label: B, mutating: false }
    consequences: [c]
    not_authorized: [n]
    publication: { commit: after-confirmation, push: after-confirmation, mixed_diff: forbidden }
    confirmation: required
    technical_details: available`;
    expect(() => parseHumanDecisionPolicy(yaml)).toThrow(/id duplicado/);
  });
});
