import { WorkCommand } from "./WorkCommand.js";
import { buildRegistry } from "../buildRegistry.js";
import { CommandContext } from "../Command.js";

function ctx(): { context: CommandContext; logs: string[] } {
  const logs: string[] = [];
  return {
    logs,
    context: {
      repoRoot: process.cwd(),
      logger: { info: (m) => logs.push(m), error: (m) => logs.push(m) },
    },
  };
}

describe("WorkCommand · CLI e descoberta [work]", () => {
  it("[32] registry inclui o comando work", () => {
    expect(buildRegistry().commandNames()).toContain("work");
  });

  it("[38] --no-remote e --authorization são parseados", () => {
    const cmd = new WorkCommand();
    expect(cmd.parse(["--no-remote"]).noRemote).toBe(true);
    expect(cmd.parse(["--authorization", "explicit-work-request"]).authorization).toBe(
      "explicit-work-request"
    );
    expect(cmd.parse(["--authorization=explicit-work-request"]).authorization).toBe(
      "explicit-work-request"
    );
    expect(cmd.parse([]).authorization).toBeUndefined();
  });

  it("run delega ao briefing com remoteOverride null quando --no-remote", async () => {
    const calls: Array<{ remote: unknown; auth: unknown }> = [];
    const fake = ((_repo: string, _logger: unknown, remote: unknown, auth: unknown) => {
      calls.push({ remote, auth });
      return 0;
    }) as unknown as ConstructorParameters<typeof WorkCommand>[0];
    const cmd = new WorkCommand(fake);
    const { context } = ctx();
    const result = await cmd.run(
      { noRemote: true, authorization: "explicit-work-request" },
      context
    );
    expect(result.exitCode).toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0].remote).toBeNull();
    expect(calls[0].auth).toBe("explicit-work-request");
  });

  it("[31] dispatch `work --help` mostra ajuda e NÃO executa o briefing", async () => {
    let called = false;
    const fake = (() => {
      called = true;
      return 0;
    }) as unknown as ConstructorParameters<typeof WorkCommand>[0];
    const registry = buildRegistry();
    // Substitui a entrada `work` por uma com runBriefFn instrumentado.
    (registry as unknown as { byKey: Map<string, unknown> }).byKey.set(
      "work",
      new WorkCommand(fake)
    );
    const { context, logs } = ctx();
    const result = await registry.dispatch(["work", "--help"], context);
    expect(result.exitCode).toBe(0);
    expect(called).toBe(false);
    expect(logs.join("\n")).toMatch(/work/);
  });
});
