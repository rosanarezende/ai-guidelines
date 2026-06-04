import { WorkflowCommand, WorkflowMainFn } from "./WorkflowCommand.js";
import { CommandContext, Logger } from "../Command.js";
import { RunPublishStateOptions } from "../../workflow.js";

function fakeLogger(): Logger {
  return { info: () => {}, error: () => {} };
}

function fakeContext(logger: Logger = fakeLogger()): CommandContext {
  return { repoRoot: "/repo", logger };
}

describe("WorkflowCommand", () => {
  describe("parse", () => {
    it("DADO argv vazio QUANDO parse ENTÃO kind wizard", () => {
      expect(new WorkflowCommand().parse([])).toEqual({ kind: "wizard" });
    });

    it("DADO publish-state + flags QUANDO parse ENTÃO kind publish-state com args kebab→camel", () => {
      expect(
        new WorkflowCommand().parse([
          "publish-state",
          "--status=active",
          "--updated-by=@rosana",
          "--title=Spec 0024",
          "--base-branch=main",
          "--last-sync-commit=abc123",
        ])
      ).toEqual({
        kind: "publish-state",
        args: {
          status: "active",
          updatedBy: "@rosana",
          title: "Spec 0024",
          baseBranch: "main",
          lastSyncCommit: "abc123",
        },
      });
    });

    it("DADO posicional desconhecido QUANDO parse ENTÃO cai no wizard (não publish-state)", () => {
      expect(new WorkflowCommand().parse(["algo"])).toEqual({ kind: "wizard" });
    });
  });

  describe("run", () => {
    it("DADO kind wizard QUANDO run ENTÃO delega workflow.main(['workflow'], {repoRoot, logger})", async () => {
      const calls: { argv: readonly string[]; opts: RunPublishStateOptions }[] = [];
      const fakeMain: WorkflowMainFn = async (argv, opts) => {
        calls.push({ argv, opts });
        return 0;
      };
      const logger = fakeLogger();
      const cmd = new WorkflowCommand(fakeMain);

      const result = await cmd.run({ kind: "wizard" }, fakeContext(logger));

      expect(result.exitCode).toBe(0);
      expect(calls).toEqual([{ argv: ["workflow"], opts: { repoRoot: "/repo", logger } }]);
    });

    it("DADO kind publish-state QUANDO run ENTÃO delega com publishStateArgs", async () => {
      const calls: { argv: readonly string[]; opts: RunPublishStateOptions }[] = [];
      const fakeMain: WorkflowMainFn = async (argv, opts) => {
        calls.push({ argv, opts });
        return 0;
      };
      const logger = fakeLogger();
      const cmd = new WorkflowCommand(fakeMain);

      await cmd.run(
        { kind: "publish-state", args: { status: "active", updatedBy: "@rosana" } },
        fakeContext(logger)
      );

      expect(calls).toEqual([
        {
          argv: ["workflow", "publish-state"],
          opts: {
            repoRoot: "/repo",
            logger,
            publishStateArgs: { status: "active", updatedBy: "@rosana" },
          },
        },
      ]);
    });
  });
});
