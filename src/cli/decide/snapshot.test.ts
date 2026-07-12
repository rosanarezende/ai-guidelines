import { parseSteps, runPrReadyExternalCheck } from "./snapshot.js";

const TASKS = `
- [x] **Checkpoint co-projection** (nó \`co-projection\`) — concluído.
- [/] **Checkpoint co-enforcement** (nó \`co-enforcement\`, seq 9 / CO-3) — em execução.
  - **Etapas internos (CO-3, PR #42; Gate único ao fim):**
    - [/] **CO-3.1 — Constraint + EnforcementBinding** (modelo): EM EXECUÇÃO.
    - [ ] **CO-3.2 — knowledge:compile + manifesto/paridade**: entrypoint humano.
    - [ ] **CO-3.3 — migração e remoção do substrato legacy**: port TS.
    - [ ] **CO-3.4 — dogfood do enforcement e recibo**: caminho não-lançante.
- [ ] **Checkpoint co-capture** (nó \`co-capture\`) — futuro.
  - [ ] **CO-5.1 — não deve aparecer** (outro checkpoint).
`;

describe("parseSteps [decide]", () => {
  it("extrai etapas do checkpoint do cursor com estado correto", () => {
    const subs = parseSteps(TASKS, "checkpoint-co-enforcement");
    expect(subs.map((s) => `${s.id}:${s.state}`)).toEqual([
      "CO-3.1:in-progress",
      "CO-3.2:pending",
      "CO-3.3:pending",
      "CO-3.4:pending",
    ]);
  });

  it("não vaza etapas de outro checkpoint", () => {
    const subs = parseSteps(TASKS, "checkpoint-co-enforcement");
    expect(subs.find((s) => s.id === "CO-5.1")).toBeUndefined();
  });

  it("checkpoint inexistente → vazio", () => {
    expect(parseSteps(TASKS, "checkpoint-inexistente")).toEqual([]);
  });
});

describe("external checks [decide]", () => {
  it("human-gate reusa pr-ready:check com o PR factual do snapshot", () => {
    const calls: Array<{ argv: readonly string[]; repoRoot: string | undefined }> = [];
    const result = runPrReadyExternalCheck("/repo", 42, (argv, options) => {
      calls.push({ argv, repoRoot: options.repoRoot });
      return 0;
    });

    expect(result.ok).toBe(true);
    expect(calls).toEqual([{ argv: ["--pr", "42"], repoRoot: "/repo" }]);
  });

  it("pr-ready:check verde vira resultado externo verde para o briefing", () => {
    const result = runPrReadyExternalCheck("/repo", 42, () => 0);
    expect(result).toEqual({ ok: true, summary: "verde" });
  });
});
