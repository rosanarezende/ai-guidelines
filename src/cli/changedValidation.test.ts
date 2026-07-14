import { planChangedValidation, runChangedValidation } from "./changedValidation.js";
import { Logger } from "./registry/Command.js";

function labels(paths: readonly string[]): string[] {
  return planChangedValidation(paths).map((step) => step.label);
}

function logger(): Logger {
  return { info: () => {}, error: () => {} };
}

describe("changedValidation", () => {
  it("planeja formatação apenas para arquivos formatáveis do diff", () => {
    const steps = planChangedValidation(["src/cli/foo.ts", "dist/cli/foo.js", "README.md"]);

    const prettier = steps.find((step) => step.label.includes("formatação"));
    expect(prettier?.args).toEqual([
      "prettier",
      "--check",
      "--",
      "README.md",
      "dist/cli/foo.js",
      "src/cli/foo.ts",
    ]);
  });

  it("usa --write quando a validação local foi chamada com --fix", () => {
    const steps = planChangedValidation(["src/cli/foo.ts"], { fix: true });

    expect(steps.find((step) => step.command.includes("npx"))?.args).toContain("--write");
  });

  it("divide Prettier em lotes quando o diff tem muitos arquivos", () => {
    const many = Array.from(
      { length: 180 },
      (_, i) =>
        `.governance/specs/0024-context-architecture/work-graph-model/_org-simulation-v3/acme/repos/acme-${String(i).padStart(3, "0")}/.governance/context.json`
    );
    const steps = planChangedValidation(many);
    const prettierSteps = steps.filter((step) => step.command === "npx");

    expect(prettierSteps.length).toBeGreaterThan(1);
    expect(
      prettierSteps.every((step) => step.args.slice(0, 3).join(" ") === "prettier --check --")
    ).toBe(true);
  });

  it("aciona build quando o diff toca TypeScript em src", () => {
    expect(labels(["src/cli/foo.ts"])).toContain("Compilar TypeScript");
  });

  it("aciona script-contracts quando o diff toca contrato, docs ou workflow", () => {
    expect(
      labels([
        ".core/governance/script-contracts.yml",
        "docs/scripts.md",
        ".github/workflows/repo-validation.yml",
      ])
    ).toContain("Verificar contrato de scripts");
  });

  it("aciona checks de state quando o diff toca state/projection", () => {
    expect(
      labels([
        ".governance/specs/0024-context-architecture/state.yml",
        ".governance/runtime/specs/active.yml",
      ])
    ).toEqual(
      expect.arrayContaining([
        "Verificar state.yml operacional",
        "Verificar projection active specs",
      ])
    );
  });

  it("aciona o check do mapa vivo quando o diff toca state, gerador ou projeção gerada", () => {
    expect(
      labels([
        ".governance/specs/0024-context-architecture/state.yml",
        ".governance/specs/0024-context-architecture/assets/governed-work-map.html",
        "src/cli/governedWorkMap.ts",
      ])
    ).toContain("Verificar mapa vivo governado");
  });

  it("aciona o check do graph snapshot quando o diff toca conteúdo governado ou o derivador", () => {
    expect(labels([".governance/specs/0024-context-architecture/research/qualquer.md"])).toContain(
      "Verificar graph snapshot derivado"
    );
    expect(labels(["src/app/projections/governanceGraphSnapshot.ts"])).toContain(
      "Verificar graph snapshot derivado"
    );
    expect(labels(["src/cli/prReadyCheck.ts"])).not.toContain("Verificar graph snapshot derivado");
  });

  it("aciona review:check quando o diff toca reviews/gates", () => {
    expect(
      labels([
        ".governance/specs/0024-context-architecture/reviews/c-co-flow.yml",
        ".governance/specs/0024-context-architecture/gates/c-co-flow.yml",
      ])
    ).toContain("Verificar reviews/gates");
  });

  it("executa os passos planejados sobre os caminhos coletados", () => {
    const calls: Array<{ command: string; args: readonly string[]; cwd: string }> = [];
    const code = runChangedValidation(
      "/repo",
      {},
      {
        logger: logger(),
        collectChangedPaths: () => ["src/cli/foo.ts"],
        runner: {
          run(command, args, cwd) {
            calls.push({ command, args, cwd });
          },
        },
      }
    );

    expect(code).toBe(0);
    expect(calls.map((call) => call.args.join(" "))).toEqual(
      expect.arrayContaining([
        "diff --check",
        "run drift:check",
        "prettier --check -- src/cli/foo.ts",
        "run build",
      ])
    );
  });

  it("não executa ferramentas quando não há arquivo alterado", () => {
    const calls: string[] = [];
    const code = runChangedValidation(
      "/repo",
      {},
      {
        logger: logger(),
        collectChangedPaths: () => [],
        runner: {
          run(command) {
            calls.push(command);
          },
        },
      }
    );

    expect(code).toBe(0);
    expect(calls).toEqual([]);
  });
});
