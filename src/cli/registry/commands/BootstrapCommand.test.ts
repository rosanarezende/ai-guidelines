import {
  BOOTSTRAP_COMMANDS,
  BootstrapCommand,
  BootstrapCommandDefinition,
} from "./BootstrapCommand.js";
import { CommandContext, Logger } from "../Command.js";
import { readFileSync } from "node:fs";
import path from "node:path";

function fakeContext(): CommandContext {
  const logger: Logger = { info: () => {}, error: () => {} };
  return { repoRoot: "/repo", logger };
}

function definition(name: BootstrapCommandDefinition["name"]): BootstrapCommandDefinition {
  const found = BOOTSTRAP_COMMANDS.find((cmd) => cmd.name === name);
  if (!found) throw new Error(`missing test definition: ${name}`);
  return found;
}

describe("BootstrapCommand", () => {
  it("DADO flags de bootstrap QUANDO parse ENTÃO preserva argv bruto para o delivery novo", () => {
    const cmd = new BootstrapCommand(definition("adopt"));

    expect(
      cmd.parse([
        "--target",
        ".",
        "--name=Projeto",
        "--providers=claude,codex",
        "--features=tdd,bdd",
        "--dry-run=false",
        "--force",
        "--skip-ci",
      ])
    ).toEqual({
      argv: [
        "--target",
        ".",
        "--name=Projeto",
        "--providers=claude,codex",
        "--features=tdd,bdd",
        "--dry-run=false",
        "--force",
        "--skip-ci",
      ],
    });
  });

  it("DADO argumento posicional QUANDO parse ENTÃO preserva para o parser tipado rejeitar no delivery", () => {
    const cmd = new BootstrapCommand(definition("init"));

    expect(cmd.parse(["unexpected"])).toEqual({ argv: ["unexpected"] });
  });

  it.each(["init", "adopt", "update", "check-budget"] as const)(
    "DADO run(%s) QUANDO executa ENTÃO chama o delivery novo",
    async (name) => {
      const calls: Array<{ repoRoot: string; argv: readonly string[] }> = [];
      const cmd = new BootstrapCommand(definition(name), (repoRoot) => ({
        async dispatch(argv, _context) {
          calls.push({ repoRoot, argv });
          return { exitCode: name === "check-budget" ? 3 : 0 };
        },
      }));

      const result = await cmd.run({ argv: ["--target", ".", "--dry-run"] }, fakeContext());

      expect(result.exitCode).toBe(name === "check-budget" ? 3 : 0);
      expect(calls).toEqual([
        { repoRoot: path.resolve(process.cwd()), argv: [name, "--target", ".", "--dry-run"] },
      ]);
    }
  );

  it("DADO registry ativo QUANDO lista comandos bootstrap ENTÃO providers não existe", () => {
    expect(BOOTSTRAP_COMMANDS.map((command) => command.name)).toEqual([
      "init",
      "adopt",
      "update",
      "check-budget",
    ]);
  });

  it("DADO contrato do flip QUANDO inspeciona BootstrapCommand ENTÃO não há loader legado ativo", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src", "cli", "registry", "commands", "BootstrapCommand.ts"),
      "utf-8"
    );

    expect(source).not.toContain("LegacyExecuteFn");
    expect(source).not.toContain("loadLegacyExecute");
    expect(source).not.toContain("cli/app/engine.mjs");
  });
});
