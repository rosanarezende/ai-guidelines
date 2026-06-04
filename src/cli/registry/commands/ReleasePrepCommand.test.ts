import { ReleasePrepCommand, ReleasePrepMainFn } from "./ReleasePrepCommand.js";
import { CommandContext, Logger } from "../Command.js";
import { ReleasePrepCliArgs, ReleasePrepRunOptions } from "../../release-prep.js";

function fakeLogger(): Logger {
  return { info: () => {}, error: () => {} };
}

function fakeContext(logger: Logger = fakeLogger()): CommandContext {
  return { repoRoot: "/repo", logger };
}

describe("ReleasePrepCommand", () => {
  describe("parse", () => {
    it("DADO flags string + boolean QUANDO parse ENTÃO mapeia kebab→camel", () => {
      expect(
        new ReleasePrepCommand().parse([
          "--version=9.9.9",
          "--remote=origin",
          "--dry-run",
          "--skip-working-tree-check",
        ])
      ).toEqual({
        version: "9.9.9",
        remote: "origin",
        dryRun: true,
        skipWorkingTreeCheck: true,
      });
    });

    it("DADO argv vazio QUANDO parse ENTÃO args vazio (sem flags)", () => {
      expect(new ReleasePrepCommand().parse([])).toEqual({});
    });

    it("DADO só --version QUANDO parse ENTÃO só version (booleans ausentes não viram false explícito)", () => {
      expect(new ReleasePrepCommand().parse(["--version=1.0.0"])).toEqual({ version: "1.0.0" });
    });

    it("DADO --version na forma com ESPAÇO + boolean QUANDO parse ENTÃO consome valor certo (regressão corrigida)", () => {
      expect(new ReleasePrepCommand().parse(["--version", "9.9.9", "--dry-run"])).toEqual({
        version: "9.9.9",
        dryRun: true,
      });
    });
  });

  describe("run", () => {
    it("DADO args QUANDO run ENTÃO delega com releasePrepArgs + {repoRoot, logger}", async () => {
      const calls: { opts: ReleasePrepRunOptions & { releasePrepArgs?: ReleasePrepCliArgs } }[] =
        [];
      const fakeMain: ReleasePrepMainFn = async (_argv, opts) => {
        calls.push({ opts });
        return 0;
      };
      const logger = fakeLogger();
      const cmd = new ReleasePrepCommand(fakeMain);

      const result = await cmd.run({ version: "9.9.9", dryRun: true }, fakeContext(logger));

      expect(result.exitCode).toBe(0);
      expect(calls).toEqual([
        {
          opts: {
            repoRoot: "/repo",
            logger,
            releasePrepArgs: { version: "9.9.9", dryRun: true },
          },
        },
      ]);
    });
  });
});
