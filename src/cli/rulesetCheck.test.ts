import {
  parseRuleset,
  checkProducibility,
  checkParity,
  RequiredCheck,
  RulesetParseError,
} from "./rulesetCheck.js";
import { WorkflowChecks } from "../infrastructure/yaml/workflowChecksReader.js";

function stable(
  context: string,
  workflow = "wf.yml",
  job = context,
  triggers = ["pull_request"]
): WorkflowChecks {
  return { stable: [{ context, workflow, job, triggers }], matrix: [] };
}

function rulesetJson(contexts: string[]): string {
  return JSON.stringify({
    name: "Main Governance",
    target: "branch",
    enforcement: "active",
    rules: [
      {
        type: "required_status_checks",
        parameters: {
          required_status_checks: contexts.map((c) => ({ context: c, integration_id: 15368 })),
        },
      },
    ],
  });
}

describe("parseRuleset [Checkpoint 2.2]", () => {
  it("extrai os required contexts", () => {
    const model = parseRuleset(rulesetJson(["repo-validation", "smoke"]));
    expect(model.requiredContexts.map((r) => r.context)).toEqual(["repo-validation", "smoke"]);
    expect(model.requiredContexts[0].integration_id).toBe(15368);
  });

  it("JSON inválido → RulesetParseError", () => {
    expect(() => parseRuleset("{ not json")).toThrow(RulesetParseError);
  });

  it("ruleset sem required_status_checks → lista vazia", () => {
    const model = parseRuleset(JSON.stringify({ name: "X", rules: [{ type: "deletion" }] }));
    expect(model.requiredContexts).toEqual([]);
  });
});

describe("checkProducibility (PRIMÁRIO) [Checkpoint 2.2]", () => {
  const req = (...c: string[]): RequiredCheck[] => c.map((context) => ({ context }));

  it("PASSA quando todo required tem produtor estável", () => {
    const result = checkProducibility(req("repo-validation", "smoke"), [
      stable("repo-validation"),
      stable("smoke"),
    ]);
    expect(result.ok).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  // === Teste de REGRESSÃO do bug exato (guardrails órfão) ===
  it("FALHA quando um required context não tem produtor (órfão) — o bug da Camada 0", () => {
    const result = checkProducibility(req("guardrails"), [stable("repo-validation")]);
    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      expect.objectContaining({ context: "guardrails", reason: "no-producer" }),
    ]);
    expect(result.violations[0].hint).toContain("repo-validation");
  });

  it("FALHA quando o produtor existe mas não declara gatilhos base válidos na raiz do on: (o achado do Codex no PR #33)", () => {
    // Ex: job existe, mas workflow só roda em workflow_dispatch ou release
    const result = checkProducibility(req("repo-validation"), [
      stable("repo-validation", "wf.yml", "repo-validation", ["workflow_dispatch", "release"]),
    ]);
    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      expect.objectContaining({ context: "repo-validation", reason: "missing-trigger" }),
    ]);
    expect(result.violations[0].hint).toContain("não declara eventos de CI/CD base");
  });

  it("PASSA se for provedor externo autorizado, mesmo sem workflow correspondente", () => {
    // Vercel ou Codecov injetados por fora
    const result = checkProducibility(req("vercel/preview"), [], ["vercel/preview"]);
    expect(result.ok).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("FALHA quando o required depende de expansão de matriz (codifica a lição)", () => {
    const matrixWf: WorkflowChecks = {
      stable: [],
      matrix: [
        {
          nameTemplate: "smoke / ${{ matrix.os }} / node ${{ matrix.node }}",
          staticPrefix: "smoke / ",
          workflow: "smoke-multi-os.yml",
          job: "smoke",
          triggers: ["pull_request"],
        },
      ],
    };
    const result = checkProducibility(req("smoke / ubuntu-latest / node 24.x"), [matrixWf]);
    expect(result.ok).toBe(false);
    expect(result.violations[0].reason).toBe("matrix-only");
    expect(result.violations[0].hint).toContain("agregador");
  });

  it("relata múltiplas violações de uma vez", () => {
    const result = checkProducibility(req("repo-validation", "ghost", "phantom"), [
      stable("repo-validation"),
    ]);
    expect(result.violations.map((v) => v.context)).toEqual(["ghost", "phantom"]);
  });
});

describe("checkParity (SECUNDÁRIO) [Checkpoint 2.2]", () => {
  const versioned = {
    name: "Main Governance",
    target: "branch",
    enforcement: "active",
    conditions: { ref_name: { include: ["~DEFAULT_BRANCH"], exclude: [] } },
    bypass_actors: [{ actor_id: 5, actor_type: "RepositoryRole", bypass_mode: "always" }],
    rules: [{ type: "required_status_checks", parameters: { required_status_checks: [] } }],
  };

  it("PASSA quando vivo == versionado (ignorando campos server-managed)", () => {
    const live = {
      ...versioned,
      id: 15575345,
      node_id: "RRS_x",
      created_at: "2026-04-26T18:08:10Z",
      _links: { self: { href: "..." } },
    };
    expect(checkParity(versioned, live).ok).toBe(true);
  });

  it("FALHA e localiza a chave divergente quando há drift", () => {
    const live = { ...versioned, enforcement: "disabled" };
    const result = checkParity(versioned, live);
    expect(result.ok).toBe(false);
    expect(result.differences.join("\n")).toContain("enforcement");
  });

  it("é insensível à ordem das chaves", () => {
    const reordered = {
      enforcement: "active",
      rules: versioned.rules,
      name: "Main Governance",
      target: "branch",
      conditions: versioned.conditions,
      bypass_actors: versioned.bypass_actors,
    };
    expect(checkParity(versioned, reordered).ok).toBe(true);
  });
});
