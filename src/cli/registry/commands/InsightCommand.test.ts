import { InsightCommand, InsightMainFn } from "./InsightCommand.js";
import { CommandContext, Logger } from "../Command.js";
import { InsightRunOptions } from "../../insight.js";

function fakeLogger(): Logger {
  return { info: () => {}, error: () => {} };
}

function fakeContext(logger: Logger = fakeLogger()): CommandContext {
  return { repoRoot: "/repo", logger };
}

describe("InsightCommand", () => {
  it("DADO subcomando + args QUANDO parse ENTÃO segura o rest intacto", () => {
    const cmd = new InsightCommand();
    expect(cmd.parse(["add", "texto", "--area=cli"])).toEqual({
      rest: ["add", "texto", "--area=cli"],
    });
  });

  it("DADO argv vazio QUANDO parse ENTÃO rest vazio", () => {
    const cmd = new InsightCommand();
    expect(cmd.parse([])).toEqual({ rest: [] });
  });

  it("DADO run QUANDO delega ENTÃO reconstrói ['insight', ...rest] e passa {repoRoot, logger}", async () => {
    const calls: { argv: readonly string[]; options: InsightRunOptions }[] = [];
    const fakeMain: InsightMainFn = async (argv, options) => {
      calls.push({ argv, options });
      return 0;
    };
    const logger = fakeLogger();
    const cmd = new InsightCommand(fakeMain);

    const result = await cmd.run({ rest: ["list"] }, fakeContext(logger));

    expect(result.exitCode).toBe(0);
    expect(calls).toEqual([{ argv: ["insight", "list"], options: { repoRoot: "/repo", logger } }]);
  });

  it("DADO insight.main retornando código != 0 QUANDO run ENTÃO mapeia para exitCode", async () => {
    const fakeMain: InsightMainFn = async () => 2;
    const cmd = new InsightCommand(fakeMain);
    const result = await cmd.run({ rest: ["bogus"] }, fakeContext());
    expect(result.exitCode).toBe(2);
  });
});
