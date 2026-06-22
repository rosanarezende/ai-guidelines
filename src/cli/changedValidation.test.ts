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
