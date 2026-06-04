import { ContinueCommand, ContinueOptions, RunContinueFn } from "./ContinueCommand.js";
import { Command, CommandContext, Logger } from "../Command.js";
import { RunOptions } from "../../workflow.js";

function fakeLogger(): Logger {
  return { info: () => {}, error: () => {} };
}

function fakeContext(logger: Logger = fakeLogger()): CommandContext {
  return { repoRoot: "/repo", logger };
}

describe("ContinueCommand", () => {
  describe("parse", () => {
    it("DADO um identifier posicional QUANDO parse ENTÃO captura como identifier", () => {
      const cmd = new ContinueCommand();
      expect(cmd.parse(["0024"])).toEqual({ identifier: "0024" });
    });

    it("DADO argv vazio QUANDO parse ENTÃO identifier ausente (continua spec corrente)", () => {
      const cmd = new ContinueCommand();
      expect(cmd.parse([])).toEqual({});
    });

    it("DADO identifier string vazia QUANDO parse ENTÃO trata como ausente", () => {
      const cmd = new ContinueCommand();
      expect(cmd.parse([""])).toEqual({});
    });
  });

  describe("run", () => {
    it("DADO identifier QUANDO run ENTÃO delega ao runContinue com {repoRoot, logger} + identifier", async () => {
      const calls: { opts: RunOptions; identifier?: string }[] = [];
      const fakeRun: RunContinueFn = async (opts, identifier) => {
        calls.push({ opts, identifier });
        return 0;
      };
      const logger = fakeLogger();
      const cmd = new ContinueCommand(fakeRun);

      const result = await cmd.run({ identifier: "0024" }, fakeContext(logger));

      expect(result.exitCode).toBe(0);
      expect(calls).toEqual([{ opts: { repoRoot: "/repo", logger }, identifier: "0024" }]);
    });

    it("DADO sem identifier QUANDO run ENTÃO delega com identifier undefined", async () => {
      const calls: { identifier?: string }[] = [];
      const fakeRun: RunContinueFn = async (_opts, identifier) => {
        calls.push({ identifier });
        return 0;
      };
      const cmd = new ContinueCommand(fakeRun);

      await cmd.run({}, fakeContext());

      expect(calls).toEqual([{ identifier: undefined }]);
    });

    it("DADO runContinue retornando código != 0 QUANDO run ENTÃO mapeia para exitCode", async () => {
      const fakeRun: RunContinueFn = async () => 1;
      const cmd = new ContinueCommand(fakeRun);

      const result = await cmd.run({}, fakeContext());

      expect(result.exitCode).toBe(1);
    });
  });

  it("expõe name 'continue' (sem aliases)", () => {
    const cmd: Command<ContinueOptions> = new ContinueCommand();
    expect(cmd.name).toBe("continue");
    expect(cmd.aliases).toBeUndefined();
  });
});
