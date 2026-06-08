import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { renderHandoff } from "./handoff.js";

function tempRepo(): string {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-"));
  const spec = path.join(repo, ".governance", "specs", "0024-context-architecture");
  fs.mkdirSync(path.join(repo, ".core", "governance"), { recursive: true });
  fs.mkdirSync(path.join(repo, ".core", "rules", "_meta"), { recursive: true });
  fs.mkdirSync(path.join(repo, ".governance", "runtime"), { recursive: true });
  fs.mkdirSync(spec, { recursive: true });
  fs.writeFileSync(path.join(repo, "AGENTS.md"), "# AGENTS\n");
  fs.writeFileSync(path.join(repo, ".core", "governance", "script-contracts.yml"), "x: y\n");
  fs.writeFileSync(path.join(repo, ".core", "rules", "catalog.md"), "# Rules\n");
  fs.writeFileSync(path.join(repo, ".core", "rules", "_meta", "rules.json"), "{}\n");
  fs.writeFileSync(path.join(spec, "plan.md"), "# Plan\n");
  fs.writeFileSync(path.join(spec, "knowledge-backfill.yml"), "version: 1\nentries: []\n");
  fs.writeFileSync(
    path.join(repo, ".governance", "runtime", "active-specs.yml"),
    [
      "version: 1",
      "active_specs:",
      "  - id: '0024'",
      "    slug: context-architecture",
      "    branch: feat/spec-0024-co-knowledge",
      "    stage: implementation",
      "    status: active",
      "    spec_path: .governance/specs/0024-context-architecture",
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
      "next:",
      "  - 'canonical-next: co-knowledge'",
      "topology:",
      "  cursor:",
      "    pr: co-knowledge",
      "    checkpoint: checkpoint-runtime-bootstrap-readiness",
      "  prs:",
      "    concluded: []",
      "    active:",
      "      - id: co-knowledge",
      "        github_pr: 37",
      "        role: execution",
      "        terminal: false",
      "        sequence: 1",
      "        checkpoints:",
      "          - checkpoint-runtime-bootstrap-readiness",
      "    planned:",
      "      - id: integration-final",
      "        github_pr: null",
      "        role: integration",
      "        terminal: true",
      "        sequence: null",
      "        checkpoints:",
      "          - review-and-merge",
    ].join("\n")
  );
  return repo;
}

describe("handoff [ADR-0022]", () => {
  it("DADO spec resolvida por identifier QUANDO renderHandoff ENTÃO emite contexto situado", () => {
    const repo = tempRepo();

    const text = renderHandoff(repo, { identifier: "0024" }).text;

    expect(text).toContain("# Handoff situado");
    expect(text).toContain("- spec: 0024-context-architecture");
    expect(text).toContain("- cursor: co-knowledge · checkpoint-runtime-bootstrap-readiness");
    expect(text).toContain("- PR ativo: #37");
    expect(text).toContain(".core/governance/script-contracts.yml");
    expect(text).toContain("AGENTS.md e canal/stub");
    expect(text).not.toContain("[TODO humano]");
  });

  it("DADO modo hybrid QUANDO renderHandoff ENTÃO inclui slots humanos sem decidir estado", () => {
    const repo = tempRepo();

    const text = renderHandoff(repo, { identifier: "0024", hybrid: true }).text;

    expect(text).toContain("## 6. Slots humanos (hybrid)");
    expect(text).toContain("[TODO humano]");
  });
});
