import {
  BOOTSTRAP_COMMANDS,
  BootstrapCommand,
  BootstrapCommandDefinition,
  LegacyExecuteFn,
} from "./BootstrapCommand.js";
import { CommandContext, Logger } from "../Command.js";

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
  it("DADO flags de bootstrap QUANDO parse ENTÃO preserva strings e normaliza booleanos", () => {
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
      rawOptions: {
        target: ".",
        name: "Projeto",
        providers: "claude,codex",
        features: "tdd,bdd",
        "dry-run": false,
        force: true,
        "skip-ci": true,
      },
    });
  });

  it("DADO argumento posicional QUANDO parse ENTÃO rejeita como o parser legado", () => {
    const cmd = new BootstrapCommand(definition("init"));

    expect(() => cmd.parse(["unexpected"])).toThrow(/Argumento inesperado/);
  });

  it("DADO run QUANDO executa ENTÃO chama o executor de provisionamento com o nome do comando e rawOptions", async () => {
    const calls: Array<{ mode: string; rawOptions: Record<string, unknown> }> = [];
    const execute: LegacyExecuteFn = async (mode, rawOptions) => {
      calls.push({ mode, rawOptions });
    };
    const cmd = new BootstrapCommand(definition("providers"), async () => execute);

    const result = await cmd.run(
      { rawOptions: { target: ".", providers: "claude", prune: true } },
      fakeContext()
    );

    expect(result.exitCode).toBe(0);
    expect(calls).toEqual([
      { mode: "providers", rawOptions: { target: ".", providers: "claude", prune: true } },
    ]);
  });
});
