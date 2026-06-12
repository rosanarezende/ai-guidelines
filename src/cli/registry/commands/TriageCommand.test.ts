import { TriageCommand, TriageMainFn } from "./TriageCommand.js";
import { CommandContext, Logger } from "../Command.js";
import { TriageCliArgs, TriageRunOptions } from "../../triage.js";

function fakeLogger(): Logger {
  return { info: () => {}, error: () => {} };
}

function fakeContext(logger: Logger = fakeLogger()): CommandContext {
  return { repoRoot: "/repo", logger };
}

describe("TriageCommand", () => {
  it("expõe name 'triage' (o verbo 'review' migrou para ReviewCommand, que delega p/ cá)", () => {
    const cmd = new TriageCommand();
    expect(cmd.name).toBe("triage");
  });

  describe("parse", () => {
    it("DADO PR posicional válido QUANDO parse ENTÃO captura como número", () => {
      expect(new TriageCommand().parse(["35"])).toEqual({ pr: 35 });
    });

    it("DADO argv vazio QUANDO parse ENTÃO sem pr (detecta pela branch)", () => {
      expect(new TriageCommand().parse([])).toEqual({});
    });

    it("DADO PR não-inteiro QUANDO parse ENTÃO lança erro narrativo", () => {
      expect(() => new TriageCommand().parse(["abc"])).toThrow(/PR inválido/i);
    });

    it("DADO PR <= 0 QUANDO parse ENTÃO lança erro narrativo", () => {
      expect(() => new TriageCommand().parse(["-1"])).toThrow(/PR inválido/i);
      expect(() => new TriageCommand().parse(["0"])).toThrow(/PR inválido/i);
    });
  });

  describe("run", () => {
    it("DADO pr QUANDO run ENTÃO delega com triageArgs={pr} e {repoRoot, logger}", async () => {
      const calls: { opts: TriageRunOptions & { triageArgs?: TriageCliArgs } }[] = [];
      const fakeMain: TriageMainFn = async (opts) => {
        calls.push({ opts });
        return 0;
      };
      const logger = fakeLogger();
      const cmd = new TriageCommand(fakeMain);

      const result = await cmd.run({ pr: 35 }, fakeContext(logger));

      expect(result.exitCode).toBe(0);
      expect(calls).toEqual([{ opts: { repoRoot: "/repo", logger, triageArgs: { pr: 35 } } }]);
    });

    it("DADO sem pr QUANDO run ENTÃO delega com triageArgs vazio", async () => {
      const calls: { opts: TriageRunOptions & { triageArgs?: TriageCliArgs } }[] = [];
      const fakeMain: TriageMainFn = async (opts) => {
        calls.push({ opts });
        return 0;
      };
      const cmd = new TriageCommand(fakeMain);

      await cmd.run({}, fakeContext());

      expect(calls[0].opts.triageArgs).toEqual({});
    });
  });
});
