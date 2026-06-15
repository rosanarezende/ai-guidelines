import { HandoffFacts } from "./handoffFacts.js";
import {
  assertFreshHandoffReceipt,
  createLoadReceipt,
  describeReceiptStaleReason,
  formatReceiptAdvisory,
  specIdFromLabel,
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
    subCheckpoints: [],
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

  it("ignoreSourceIds: fonte remota volátil (pull-request) NÃO conta como divergência", () => {
    const loaded = facts({
      sources: [
        { id: "state.yml", origin: "x", status: "fresh", fingerprint: "aaa" },
        { id: "pull-request", origin: "gh", status: "fresh", fingerprint: "PR-LOADED" },
      ],
    });
    const receipt = JSON.stringify(createLoadReceipt(loaded, "seloLoaded", NOW));
    const current = facts({
      sources: [
        { id: "state.yml", origin: "x", status: "fresh", fingerprint: "aaa" }, // igual
        { id: "pull-request", origin: "gh", status: "unavailable", fingerprint: "-" }, // só o PR "mudou"
      ],
    });

    // sem ignore: selo diverge ⇒ stale-sources (falso-positivo do advisory local)
    expect(validateLoadReceipt(receipt, { facts: current, seal: "seloCurrent" }).kind).toBe(
      "stale-sources"
    );

    // com ignore: pull-request excluída ⇒ nenhuma divergência LOCAL ⇒ fresh
    expect(
      validateLoadReceipt(
        receipt,
        { facts: current, seal: "seloCurrent" },
        { ignoreSourceIds: ["pull-request"] }
      ).kind
    ).toBe("fresh");
  });

  it("ignoreSourceIds: divergência LOCAL ainda é detectada (ignore não mascara o que importa)", () => {
    const loaded = facts({
      sources: [
        { id: "state.yml", origin: "x", status: "fresh", fingerprint: "aaa" },
        { id: "pull-request", origin: "gh", status: "fresh", fingerprint: "PR" },
      ],
    });
    const receipt = JSON.stringify(createLoadReceipt(loaded, "selo1", NOW));
    const current = facts({
      sources: [
        { id: "state.yml", origin: "x", status: "fresh", fingerprint: "MUDOU" }, // fonte LOCAL mudou
        { id: "pull-request", origin: "gh", status: "unavailable", fingerprint: "-" },
      ],
    });
    const status = validateLoadReceipt(
      receipt,
      { facts: current, seal: "selo2" },
      { ignoreSourceIds: ["pull-request"] }
    );
    expect(status.kind).toBe("stale-sources");
    if (status.kind === "stale-sources") {
      expect(status.divergentSources).toEqual(["state.yml"]); // pull-request NÃO aparece
    }
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

describe("formatReceiptAdvisory · advisory-first determinístico (5 estados) [CO-3.4]", () => {
  const receipt = createLoadReceipt(facts(), "seloX", NOW);

  it("fresh → null (nenhum advisory emitido)", () => {
    expect(formatReceiptAdvisory({ kind: "fresh", receipt }, "0024")).toBeNull();
  });

  it("missing → nomeia ausência de carga + comando de recarga", () => {
    expect(formatReceiptAdvisory({ kind: "missing" }, "0024")).toBe(
      "⚠️  [advisory] retomada não reconciliada — nenhuma carga registrada. " +
        "Recarregue com: npm run guidelines -- handoff 0024"
    );
  });

  it("invalid → nomeia a razão da invalidez", () => {
    const line = formatReceiptAdvisory({ kind: "invalid", reason: "JSON ilegível" }, "0024");
    expect(line).toContain("recibo inválido (JSON ilegível)");
    expect(line).toContain("Recarregue com: npm run guidelines -- handoff 0024");
  });

  it("stale-head → diagnostica HEAD carregado × atual", () => {
    const line = formatReceiptAdvisory(
      { kind: "stale-head", receipt, currentHead: "abc9999", currentSeal: "s2" },
      "0024"
    );
    expect(line).toContain("recibo stale: HEAD carregado 5906666 ≠ HEAD atual abc9999");
  });

  it("stale-sources → nomeia as fontes divergentes", () => {
    const line = formatReceiptAdvisory(
      { kind: "stale-sources", receipt, currentSeal: "s2", divergentSources: ["state.yml", "git"] },
      "0024"
    );
    expect(line).toContain("recibo stale: fontes divergiram (state.yml, git)");
  });

  it("advisory e guarda lançante compartilham a MESMA razão (fonte única, sem switch duplicado)", () => {
    const status = {
      kind: "stale-head",
      receipt,
      currentHead: "abc9999",
      currentSeal: "s2",
    } as const;
    const reason = describeReceiptStaleReason(status);
    expect(formatReceiptAdvisory(status, "0024")).toContain(reason);
    expect(() => assertFreshHandoffReceipt(status, "0024")).toThrow(reason);
  });
});

describe("specIdFromLabel", () => {
  it("extrai o NNNN do label da spec", () => {
    expect(specIdFromLabel("0024-context-architecture")).toBe("0024");
  });
  it("devolve o label cru quando não há prefixo numérico de 4 dígitos", () => {
    expect(specIdFromLabel("foo-bar")).toBe("foo-bar");
  });
});
