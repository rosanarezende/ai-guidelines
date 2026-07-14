import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { collectStepDeliveryEvidence } from "./stepDeliveryEvidence.js";

function git(repo: string, args: readonly string[]): string {
  return execFileSync("git", [...args], {
    cwd: repo,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function write(repo: string, file: string, text: string): void {
  const abs = path.join(repo, file);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text);
}

function commit(repo: string, message: string): string {
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", message]);
  return git(repo, ["rev-parse", "--short", "HEAD"]);
}

function makeRepo(): string {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "ai-guidelines-delivery-evidence-"));
  git(repo, ["init"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  git(repo, ["config", "user.name", "Test User"]);
  return repo;
}

const TASKS = ".governance/specs/0024-context-architecture/tasks.md";

describe("etapa delivery evidence", () => {
  it("bloqueia readiness quando a etapa acabou de ser ativado", () => {
    const repo = makeRepo();
    write(
      repo,
      TASKS,
      [
        "- [x] **CO-10.2 — confronto modelo × código**: entregue.",
        "- [/] **CO-10.3 — correção integral dos gaps remanescentes**: ativa.",
      ].join("\n")
    );
    const activation = commit(repo, "docs(spec-0024): avança co-flow-convergence para CO-10.3");

    const evidence = collectStepDeliveryEvidence(repo, TASKS, "CO-10.3");

    expect(evidence).toEqual({
      status: "missing",
      activeId: "CO-10.3",
      activationCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
      reason: "CO-10.3 acabou de ser ativado e ainda não há commit de entrega depois da ativação.",
    });
    expect(evidence.status).toBe("missing");
    if (evidence.status !== "missing") throw new Error("esperava evidência missing");
    expect(evidence.activationCommit?.startsWith(activation)).toBe(true);
  });

  it("localiza ativação quando o título usa o prefixo Checkpoint (formato do active-specs:check)", () => {
    const repo = makeRepo();
    write(
      repo,
      TASKS,
      "- [ ] **Checkpoint internal-architecture-refactor-ddd-bdd** — reorganização behavior-preserving: pendente."
    );
    commit(repo, "docs(spec-0024): materializa checkpoint da continuação");
    write(
      repo,
      TASKS,
      "- [/] **Checkpoint internal-architecture-refactor-ddd-bdd** — reorganização behavior-preserving (EM EXECUÇÃO): ativa."
    );
    const activation = commit(repo, "chore(spec-0024): prepare internal architecture continuation");
    write(
      repo,
      ".governance/specs/0024-context-architecture/pull-requests/pr-46/body.md",
      "body do PR de continuação\n"
    );
    commit(repo, "docs(spec-0024): reconcile continuation node with factual pr 46");

    const evidence = collectStepDeliveryEvidence(
      repo,
      TASKS,
      "internal-architecture-refactor-ddd-bdd"
    );

    expect(evidence).toEqual({
      status: "present",
      activeId: "internal-architecture-refactor-ddd-bdd",
      activationCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
      commitsAfterActivation: 1,
    });
    expect(evidence.status).toBe("present");
    if (evidence.status !== "present") throw new Error("esperava evidência present");
    expect(evidence.activationCommit.startsWith(activation)).toBe(true);
  });

  it("bloqueia readiness quando etapa com prefixo Checkpoint acabou de ser ativada", () => {
    const repo = makeRepo();
    write(
      repo,
      TASKS,
      "- [/] **Checkpoint internal-architecture-refactor-ddd-bdd** — reorganização behavior-preserving (EM EXECUÇÃO): ativa."
    );
    commit(repo, "chore(spec-0024): prepare internal architecture continuation");

    const evidence = collectStepDeliveryEvidence(
      repo,
      TASKS,
      "internal-architecture-refactor-ddd-bdd"
    );

    expect(evidence.status).toBe("missing");
    if (evidence.status !== "missing") throw new Error("esperava evidência missing");
    expect(evidence.reason).toContain("ainda não há commit de entrega");
  });

  it("libera readiness quando existe commit de entrega depois da ativação", () => {
    const repo = makeRepo();
    write(repo, TASKS, "- [ ] **CO-10.3 — correção integral dos gaps remanescentes**: pendente.");
    commit(repo, "docs(spec-0024): materializa CO-10.3");
    write(repo, TASKS, "- [/] **CO-10.3 — correção integral dos gaps remanescentes**: ativa.");
    const activation = commit(repo, "docs(spec-0024): avança co-flow-convergence para CO-10.3");
    write(
      repo,
      ".governance/specs/0024-context-architecture/research/co-10.3-dogfood.md",
      "evidência de entrega\n"
    );
    commit(repo, "docs(spec-0024): registra dogfood do CO-10.3");

    const evidence = collectStepDeliveryEvidence(repo, TASKS, "CO-10.3");

    expect(evidence).toEqual({
      status: "present",
      activeId: "CO-10.3",
      activationCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
      commitsAfterActivation: 1,
    });
    expect(evidence.status).toBe("present");
    if (evidence.status !== "present") throw new Error("esperava evidência present");
    expect(evidence.activationCommit.startsWith(activation)).toBe(true);
  });
});
