import { HandoffFacts } from "./handoffFacts.js";
import {
  assertFreshHandoffReceipt,
  createLoadReceipt,
  validateLoadReceipt,
} from "./handoffReceipt.js";

function facts(overrides: Partial<HandoffFacts> = {}): HandoffFacts {
  return {
    spec: {
      label: "0024-context-architecture",
      path: ".governance/specs/0024-context-architecture",
    },
    contract: null,
    stage: "implementation",
    gateStatus: "closed",
    cursor: { pr: "co-projection", checkpoint: "checkpoint-co-projection" },
    activeNode: { id: "co-projection", githubPr: 41, sequence: 8, terminal: false },
    nextPlannedNode: null,
    narrativeNextHead: null,
    git: {
      branch: "feat/spec-0024-co-projection",
      head: "5906666",
      workingTreeClean: true,
      ahead: 0,
      behind: 0,
      upstream: "origin/feat/spec-0024-co-projection",
    },
    pullRequest: null,
    lifecycle: null,
    tasks: [],
    insights: [],
    driftWarnings: [],
    sources: [
      { id: "state.yml", origin: "spec/state.yml", status: "fresh", fingerprint: "aaa111" },
      { id: "git", origin: "git local", status: "fresh", fingerprint: "bbb222" },
    ],
    ...overrides,
  };
}

const NOW = () => new Date("2026-06-11T12:00:00.000Z");

describe("handoffReceipt · contrato de carga (puro) [CO-4]", () => {
  it("createLoadReceipt registra só fatos operacionais mínimos (sem narrativa/segredos)", () => {
    const receipt = createLoadReceipt(facts(), "selo12345678", NOW);

    expect(Object.keys(receipt).sort()).toEqual([
      "branch",
      "command",
      "contractVersion",
      "degraded",
      "head",
      "loadedAt",
      "sourceSeal",
      "sources",
      "specId",
    ]);
    expect(receipt.specId).toBe("0024");
    expect(receipt.head).toBe("5906666");
    expect(receipt.sourceSeal).toBe("selo12345678");
    expect(receipt.command).toBe("npm run guidelines -- handoff 0024");
    expect(receipt.sources).toEqual({ "state.yml": "aaa111", git: "bbb222" });
    expect(JSON.stringify(receipt)).not.toMatch(/##|canonical-next|Escopo/);
  });

  it("registra degradação factual (fontes não-fresh) sem inventar estado", () => {
    const receipt = createLoadReceipt(
      facts({
        sources: [
          { id: "state.yml", origin: "x", status: "fresh", fingerprint: "aaa111" },
          { id: "pull-request", origin: "gh", status: "unavailable", fingerprint: "-" },
        ],
      }),
      "selo",
      NOW
    );
    expect(receipt.degraded).toEqual(["pull-request"]);
  });

  it("fresh: mesmo HEAD + mesmo selo (loadedAt NÃO participa)", () => {
    const receipt = createLoadReceipt(facts(), "seloX", NOW);
    const muchLater = JSON.stringify({ ...receipt, loadedAt: "2030-01-01T00:00:00.000Z" });

    const status = validateLoadReceipt(muchLater, { facts: facts(), seal: "seloX" });

    expect(status.kind).toBe("fresh");
  });

  it("stale-head: HEAD mudou → diagnóstico com carregado × atual", () => {
    const receipt = JSON.stringify(createLoadReceipt(facts(), "seloX", NOW));
    const current = facts({ git: { ...facts().git, head: "abc9999" } });

    const status = validateLoadReceipt(receipt, { facts: current, seal: "seloY" });

    expect(status.kind).toBe("stale-head");
    if (status.kind === "stale-head") {
      expect(status.receipt.head).toBe("5906666");
      expect(status.currentHead).toBe("abc9999");
      expect(status.currentSeal).toBe("seloY");
    }
  });

  it("stale-sources: mesmo HEAD, fonte mudou → nomeia a(s) fonte(s) divergente(s)", () => {
    const receipt = JSON.stringify(createLoadReceipt(facts(), "seloX", NOW));
    const current = facts({
      sources: [
        { id: "state.yml", origin: "spec/state.yml", status: "fresh", fingerprint: "MUDOU" },
        { id: "git", origin: "git local", status: "fresh", fingerprint: "bbb222" },
      ],
    });

    const status = validateLoadReceipt(receipt, { facts: current, seal: "seloZ" });

    expect(status.kind).toBe("stale-sources");
    if (status.kind === "stale-sources") {
      expect(status.divergentSources).toEqual(["state.yml"]);
      expect(status.receipt.sourceSeal).toBe("seloX");
      expect(status.currentSeal).toBe("seloZ");
    }
  });

  it("missing: sem recibo persistido", () => {
    expect(validateLoadReceipt(null, { facts: facts(), seal: "s" }).kind).toBe("missing");
  });

  it("invalid: JSON ilegível, campo ausente ou contrato divergente", () => {
    expect(validateLoadReceipt("{nao-json", { facts: facts(), seal: "s" }).kind).toBe("invalid");
    expect(validateLoadReceipt("{}", { facts: facts(), seal: "s" }).kind).toBe("invalid");
    const wrongVersion = JSON.stringify({
      ...createLoadReceipt(facts(), "s", NOW),
      contractVersion: "999",
    });
    const status = validateLoadReceipt(wrongVersion, { facts: facts(), seal: "s" });
    expect(status.kind).toBe("invalid");
    if (status.kind === "invalid") expect(status.reason).toContain("contractVersion");
  });

  it("assertFreshHandoffReceipt: guarda p/ comandos mutantes futuros lança com comando de recarga", () => {
    expect(() => assertFreshHandoffReceipt({ kind: "missing" }, "0024")).toThrow(
      /npm run guidelines -- handoff 0024/
    );
    const receipt = createLoadReceipt(facts(), "seloX", NOW);
    expect(() =>
      assertFreshHandoffReceipt(
        { kind: "stale-head", receipt, currentHead: "abc", currentSeal: "s2" },
        "0024"
      )
    ).toThrow(/HEAD carregado 5906666/);
    expect(() => assertFreshHandoffReceipt({ kind: "fresh", receipt }, "0024")).not.toThrow();
  });
});
