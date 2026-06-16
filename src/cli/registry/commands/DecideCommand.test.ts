import { DecideCommand } from "./DecideCommand.js";
import { buildRegistry } from "../buildRegistry.js";
import { CommandContext } from "../Command.js";
import { INTENT_CATALOG } from "../intentCatalog.js";

function ctx(prompts?: unknown): { context: CommandContext; logs: string[] } {
  const logs: string[] = [];
  return {
    logs,
    context: {
      repoRoot: process.cwd(),
      logger: { info: (m) => logs.push(m), error: (m) => logs.push(m) },
      ...(prompts ? { prompts: prompts as CommandContext["prompts"] } : {}),
    },
  };
}

describe("DecideCommand [decide]", () => {
  it("registry inclui o comando decide", () => {
    expect(buildRegistry().commandNames()).toContain("decide");
  });

  it("parse delega ao parseDecideArgs", () => {
    const a = new DecideCommand().parse(["--brief-only", "--type", "human-gate"]);
    expect(a).toMatchObject({ briefOnly: true, type: "human-gate" });
  });

  it("[70] run encaminha repoRoot + prompts (superfície humana) ao runner", async () => {
    const calls: Array<{ repoRoot: string; hasPrompts: boolean }> = [];
    const fake = (async (repoRoot: string, _args: unknown, deps: { prompts?: unknown }) => {
      calls.push({ repoRoot, hasPrompts: Boolean(deps?.prompts) });
      return 0;
    }) as unknown as ConstructorParameters<typeof DecideCommand>[0];
    const cmd = new DecideCommand(fake);
    const { context } = ctx({
      select: async () => "",
      input: async () => "",
      confirm: async () => false,
    });
    const result = await cmd.run(cmd.parse(["--brief-only"]), context);
    expect(result.exitCode).toBe(0);
    expect(calls[0].hasPrompts).toBe(true);
  });

  it("[69] catálogo de intents inclui decide (delega ao registry; sem handler duplicado)", () => {
    const intent = INTENT_CATALOG.find((i) => i.actions.some((a) => a.command === "decide"));
    expect(intent).toBeDefined();
    expect(intent!.actions.every((a) => a.command === "decide")).toBe(true);
  });

  it("[31] dispatch `decide --help` mostra ajuda e NÃO executa", async () => {
    const registry = buildRegistry();
    const { context, logs } = ctx();
    const result = await registry.dispatch(["decide", "--help"], context);
    expect(result.exitCode).toBe(0);
    expect(logs.join("\n")).toMatch(/decide/);
  });
});
