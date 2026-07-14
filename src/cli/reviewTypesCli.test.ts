/**
 * UX de configuração + prova de CONSUMIDOR (CO-4, rodada 8): um repositório
 * consumidor declara tipos customizados (security_review, mece_review) APENAS
 * na review-policy.yml — sem alterar o core TypeScript — e o catálogo,
 * o briefing e a resolução de requirements os reconhecem imediatamente.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import {
  parseTypeAddArgs,
  runReviewPolicy,
  runReviewTypeAdd,
  runReviewTypes,
} from "./reviewTypesCli.js";
import { runReviewBrief, loadReviewGovernance } from "./reviewBrief.js";
import { discover } from "./reviewCheck.js";
import { resolveReviewType } from "../app/reviews/reviewRequirements.js";

function initGitOnBranch(repo: string, branchName: string): void {
  execFileSync("git", ["init", "--quiet"], { cwd: repo, stdio: "ignore" });
  execFileSync("git", ["symbolic-ref", "HEAD", `refs/heads/${branchName}`], {
    cwd: repo,
    stdio: "ignore",
  });
}

function commitAll(repo: string, message = "fixture"): string {
  execFileSync("git", ["add", "-A"], { cwd: repo, stdio: "ignore" });
  execFileSync(
    "git",
    ["-c", "user.email=t@t", "-c", "user.name=T", "commit", "--quiet", "-m", message],
    { cwd: repo, stdio: "ignore" }
  );
  return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: repo,
    encoding: "utf8",
  }).trim();
}

const CONSUMER_POLICY = `
active_profile: solo
profiles:
  solo:
    implementation_pr:
      required_native_approvals: 0
    integration_pr:
      required_native_approvals: 0
    accepted_findings:
      require_resolution: false
      require_verification_event_for_fixed: false
    github:
      minimum_approving_reviews: 1
      require_code_owner_review: false
      dismiss_stale_reviews_on_push: false
      require_last_push_approval: false

review_types:
  security_review:
    source: repository
    enabled: true
    title: Security Review
    aliases: [security-review, revisao-de-seguranca]
    objective: Avaliar superficies de ataque e exposicao de dados.
    vectors:
      - secrets e credenciais
      - supply chain
  mece_review:
    source: repository
    enabled: true
    title: MECE Review
    aliases: [mece-review]
    objective: Avaliar se a decomposicao e MECE.
    vectors:
      - sobreposicao entre categorias
      - lacunas de cobertura

review_applicability:
  security_review:
    pr_profiles: [integration, execution]
  mece_review:
    pr_profiles: [governance, integration]

review_requirements:
  defaults:
    security_review: optional
    mece_review: optional
`;

/** Repo CONSUMIDOR mínimo (não é o ai-guidelines): contexto local não vaza. */
function consumerRepo(): string {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "review-types-cli-"));
  const spec = path.join(repo, ".governance", "specs", "0007-minha-feature");
  fs.mkdirSync(path.join(repo, ".governance", "runtime", "specs"), { recursive: true });
  fs.mkdirSync(path.join(repo, ".core", "rules", "_meta"), { recursive: true });
  fs.mkdirSync(path.join(repo, ".core", "governance"), { recursive: true });
  fs.mkdirSync(spec, { recursive: true });
  fs.writeFileSync(path.join(repo, ".core", "governance", "script-contracts.yml"), "x: y\n");
  fs.writeFileSync(
    path.join(repo, "package.json"),
    JSON.stringify({ name: "consumer-app", description: "Consumidor do framework" })
  );
  fs.writeFileSync(
    path.join(repo, "AGENTS.md"),
    "# AGENTS\n\n<AI_GUIDELINES>\n\n- Repo state beats transcript.\n\n</AI_GUIDELINES>\n"
  );
  fs.writeFileSync(
    path.join(repo, ".core", "rules", "_meta", "rules.json"),
    JSON.stringify({ schema_version: "1.0", rules: [] })
  );
  fs.writeFileSync(path.join(spec, "tasks.md"), "- [ ] **Checkpoint entrega** — x.\n");
  fs.writeFileSync(
    path.join(repo, ".governance", "runtime", "specs/active.yml"),
    [
      "version: 1",
      "active_specs:",
      "  - id: '0007'",
      "    slug: minha-feature",
      "    branch: feat/spec-0007-entrega",
      "    stage: implementation",
      "    status: active",
      "    spec_path: .governance/specs/0007-minha-feature",
      "    updated_at: '2026-06-08T00:00:00.000Z'",
    ].join("\n")
  );
  fs.writeFileSync(
    path.join(spec, "state.yml"),
    [
      "stage: implementation",
      "gate:",
      "  status: closed",
      "focus: []",
      "next: []",
      "topology:",
      "  cursor:",
      "    pr: entrega",
      "    checkpoint: checkpoint-entrega",
      "  prs:",
      "    concluded: []",
      "    active:",
      "      - id: entrega",
      "        github_pr: 7",
      "        role: execution",
      "        terminal: true",
      "        sequence: 1",
      "        checkpoints:",
      "          - checkpoint-entrega",
    ].join("\n")
  );
  fs.writeFileSync(path.join(repo, ".governance", "review-policy.yml"), CONSUMER_POLICY);
  return repo;
}

function fakeLogger(): {
  lines: string[];
  logger: { info: (m: string) => void; error: (m: string) => void };
} {
  const lines: string[] = [];
  return {
    lines,
    logger: { info: (m) => lines.push(m), error: (m) => lines.push(`ERR ${m}`) },
  };
}

describe("consumidor — tipos customizados sem alterar o core [CO-4 r8]", () => {
  it("52/53 — security_review e mece_review declarados SÓ na policy entram no catálogo", () => {
    const repo = consumerRepo();
    const governance = loadReviewGovernance(repo);
    expect(governance.errors).toHaveLength(0);
    expect(resolveReviewType(governance.registry, "security-review")?.id).toBe("security_review");
    expect(resolveReviewType(governance.registry, "mece-review")?.id).toBe("mece_review");

    const { lines, logger } = fakeLogger();
    expect(runReviewTypes(repo, logger)).toBe(0);
    const out = lines.join("\n");
    expect(out).toContain("security_review");
    expect(out).toContain("mece_review");
    expect(out).toContain("origem: repository");
  });

  it("54 — contexto local do ai-guidelines NÃO vaza: catálogo do consumidor é o do consumidor", () => {
    const repo = consumerRepo();
    const governance = loadReviewGovernance(repo);
    // tipos do ai-guidelines real (security com labels específicas) não aparecem:
    // o que existe é exatamente framework defaults + os 2 do fixture.
    expect(governance.registry.types.map((t) => t.id).sort()).toEqual([
      "architectural_review",
      "mece_review",
      "security_review",
      "technical_audit",
    ]);
  });

  it("34 — briefing de tipo customizado aplicável infere CREATE (modo executável)", () => {
    const repo = consumerRepo();
    initGitOnBranch(repo, "feat/spec-0007-entrega");
    commitAll(repo);
    const { lines, logger } = fakeLogger();
    const exit = runReviewBrief(repo, "security-review", logger, null);
    const out = lines.join("\n");
    expect(exit).toBe(0);
    expect(out).toContain("Modo inferido: CREATE");
    expect(out).toContain("tipo: security_review · origem: repository");
    expect(out).toContain("c-entrega-security_review.yml");
    expect(out).toContain("requirement optional");
  });

  it("29/40 — mece_review NÃO aplicável em execution explica por quê; disabled bloqueia com diagnóstico", () => {
    const repo = consumerRepo();
    initGitOnBranch(repo, "feat/spec-0007-entrega");
    commitAll(repo);
    const { lines, logger } = fakeLogger();
    expect(runReviewBrief(repo, "mece-review", logger, null)).toBe(1);
    expect(lines.join("\n")).toContain("NÃO é aplicável neste contexto");

    // disabled: desliga o tipo na policy e pede explicitamente.
    const policyPath = path.join(repo, ".governance", "review-policy.yml");
    fs.writeFileSync(
      policyPath,
      fs
        .readFileSync(policyPath, "utf8")
        .replace(
          "  mece_review:\n    source: repository\n    enabled: true",
          "  mece_review:\n    source: repository\n    enabled: false"
        )
    );
    const second = fakeLogger();
    expect(runReviewBrief(repo, "mece-review", second.logger, null)).toBe(1);
    expect(second.lines.join("\n")).toContain("DESABILITADO");
    expect(second.lines.join("\n")).toContain("enabled: true");
  });

  it("19 — override situado no nó (state.yml) aperta optional → required e vira obrigação", () => {
    const repo = consumerRepo();
    const statePath = path.join(repo, ".governance", "specs", "0007-minha-feature", "state.yml");
    fs.writeFileSync(
      statePath,
      fs
        .readFileSync(statePath, "utf8")
        .replace(
          "        checkpoints:\n          - checkpoint-entrega",
          [
            "        checkpoints:",
            "          - checkpoint-entrega",
            "        review_requirements:",
            "          security_review:",
            "            requirement: required",
            '            reason: "Integração altera autenticação e secrets."',
            '            actor: "@rosanarezende"',
          ].join("\n")
        )
    );
    const { artifacts, errors } = discover(repo);
    expect(errors).toHaveLength(0);
    expect(artifacts.requiredReviewRolesByCheckpoint?.["checkpoint-entrega"]).toEqual([
      "security_review",
    ]);
    // proveniência do override visível no contexto topológico
    expect(
      artifacts.topologyByCheckpoint?.["checkpoint-entrega"]?.overrides?.security_review?.actor
    ).toBe("@rosanarezende");
  });

  it("`review policy` no consumidor mostra requirements efetivos do checkpoint", () => {
    const repo = consumerRepo();
    initGitOnBranch(repo, "feat/spec-0007-entrega");
    commitAll(repo);
    const { lines, logger } = fakeLogger();
    expect(runReviewPolicy(repo, logger)).toBe(0);
    const out = lines.join("\n");
    expect(out).toContain("checkpoint-entrega");
    expect(out).toContain("security_review");
    expect(out).toContain("- requirement: optional");
    expect(out).toContain("- blocking: no");
  });
});

describe("`review type add` — criação declarativa na policy canônica [CO-4 r8]", () => {
  it("cria o tipo, valida, escreve na policy e o briefing o reconhece imediatamente", () => {
    const repo = consumerRepo();
    initGitOnBranch(repo, "feat/spec-0007-entrega");
    commitAll(repo);
    const args = parseTypeAddArgs([
      "compliance-review",
      "--title",
      "Compliance Review",
      "--objective",
      "Avaliar conformidade regulatória.",
      "--vector",
      "LGPD",
      "--vector",
      "auditoria externa",
      "--alias",
      "revisao-de-conformidade",
      "--applies-to",
      "execution",
      "--requirement",
      "recommended",
    ]);
    expect(args).not.toBeNull();
    const { lines, logger } = fakeLogger();
    expect(runReviewTypeAdd(repo, args!, logger)).toBe(0);
    expect(lines.join("\n")).toContain('tipo "compliance_review" criado');

    const governance = loadReviewGovernance(repo);
    expect(governance.errors).toHaveLength(0);
    const added = resolveReviewType(governance.registry, "compliance-review");
    expect(added?.id).toBe("compliance_review");
    expect(added?.source).toBe("repository");
    expect(governance.policy?.requirements?.defaults?.compliance_review).toBe("recommended");

    const brief = fakeLogger();
    expect(runReviewBrief(repo, "revisao-de-conformidade", brief.logger, null)).toBe(0);
    expect(brief.lines.join("\n")).toContain("compliance_review");
  });

  it("alias conflitante ou campos obrigatórios ausentes → nada é escrito", () => {
    const repo = consumerRepo();
    const before = fs.readFileSync(path.join(repo, ".governance", "review-policy.yml"), "utf8");

    const dup = fakeLogger();
    expect(
      runReviewTypeAdd(
        repo,
        parseTypeAddArgs(["security-review", "--title", "X", "--objective", "y", "--vector", "z"])!,
        dup.logger
      )
    ).toBe(1);
    expect(dup.lines.join("\n")).toContain("já existe no catálogo");

    const missing = fakeLogger();
    expect(runReviewTypeAdd(repo, parseTypeAddArgs(["novo-tipo"])!, missing.logger)).toBe(2);
    expect(missing.lines.join("\n")).toContain("obrigatórios");

    expect(fs.readFileSync(path.join(repo, ".governance", "review-policy.yml"), "utf8")).toBe(
      before
    );
  });
});

describe("security universal no consumidor — briefing por perfil [CO-4 r8 clarificação]", () => {
  /** Policy com security SEM applicability (universal) + required em integration. */
  const UNIVERSAL_SECURITY_POLICY = `
active_profile: solo
profiles:
  solo:
    implementation_pr:
      required_native_approvals: 0
    integration_pr:
      required_native_approvals: 0
    accepted_findings:
      require_resolution: false
      require_verification_event_for_fixed: false
    github:
      minimum_approving_reviews: 1
      require_code_owner_review: false
      dismiss_stale_reviews_on_push: false
      require_last_push_approval: false

review_types:
  security_review:
    source: repository
    enabled: true
    title: Security Review
    aliases: [security-review]
    objective: Avaliar superficies de ataque e exposicao de dados.
    vectors:
      - secrets e credenciais
      - supply chain

review_requirements:
  defaults:
    security_review: optional
  rules:
    - id: require-security-for-integration
      priority: 200
      when:
        pr_profile: integration
      set:
        security_review: required
`;

  function repoWithNodeRole(role: "execution" | "governance" | "integration"): string {
    const repo = consumerRepo();
    const statePath = path.join(repo, ".governance", "specs", "0007-minha-feature", "state.yml");
    fs.writeFileSync(
      statePath,
      [
        "stage: implementation",
        "gate:",
        "  status: closed",
        "focus: []",
        "next: []",
        "topology:",
        "  cursor:",
        "    pr: entrega",
        "    checkpoint: checkpoint-entrega",
        "  prs:",
        "    concluded: []",
        "    active:",
        "      - id: entrega",
        "        github_pr: 7",
        `        role: ${role}`,
        "        terminal: true",
        `        sequence: ${role === "execution" ? "1" : "null"}`,
        "        checkpoints:",
        "          - checkpoint-entrega",
      ].join("\n")
    );
    fs.writeFileSync(
      path.join(repo, ".governance", "review-policy.yml"),
      UNIVERSAL_SECURITY_POLICY
    );
    initGitOnBranch(repo, "feat/spec-0007-entrega");
    commitAll(repo);
    return repo;
  }

  it("17/18 — pedido explícito em execution/governance gera briefing: applicable yes · optional · não bloqueia", () => {
    for (const role of ["execution", "governance"] as const) {
      const repo = repoWithNodeRole(role);
      const { lines, logger } = fakeLogger();
      expect(runReviewBrief(repo, "security-review", logger, null)).toBe(0);
      const out = lines.join("\n");
      expect(out).toContain("Modo inferido: CREATE");
      expect(out).toContain("requirement optional");
      expect(out).toContain("aplicabilidade: yes");
      expect(out).toContain("não bloqueia Ready/gate");
      expect(out).not.toContain("NÃO é aplicável");
      expect(out).not.toContain("DESABILITADO");
    }
  });

  it("20 — pedido explícito em integration gera briefing: required (rule, repository-policy) · BLOQUEIA enquanto missing", () => {
    const repo = repoWithNodeRole("integration");
    const { lines, logger } = fakeLogger();
    expect(runReviewBrief(repo, "security-review", logger, null)).toBe(0);
    const out = lines.join("\n");
    expect(out).toContain("Modo inferido: CREATE");
    expect(out).toContain("requirement required");
    expect(out).toContain("rule:require-security-for-integration · repository-policy");
    expect(out).toContain("BLOQUEIA Ready/gate");
  });

  it("25/29 — universal sem applicability: handoff-level statuses do consumidor não bloqueiam em execution", () => {
    const repo = repoWithNodeRole("execution");
    const { lines, logger } = fakeLogger();
    expect(runReviewPolicy(repo, logger)).toBe(0);
    const out = lines.join("\n");
    expect(out).toContain("security_review");
    expect(out).toContain("- applicable: yes");
    expect(out).toContain("- requirement: optional (fonte: repo-default)");
    expect(out).toContain("- blocking: no");
    expect(out).not.toContain("unknown");
  });
});
