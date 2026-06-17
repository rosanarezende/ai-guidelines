import { ClackPrompts } from "./ClackPrompts.js";

type ClackModule = typeof import("@clack/prompts");

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

describe("ClackPrompts", () => {
  it("delegates grouped multiselect to Clack groupMultiselect", async () => {
    const calls: unknown[] = [];
    const clack = {
      groupMultiselect: async (options: unknown) => {
        calls.push(options);
        return ["claude"];
      },
      isCancel: () => false,
    } as unknown as ClackModule;

    const prompts = new ClackPrompts(async () => clack);

    const selected = await prompts.groupMultiselect({
      message: "Providers",
      groups: {
        Runtime: [{ name: "Claude", value: "claude", hint: "CLAUDE.md" }],
        Editorial: [{ name: "Cursor", value: "cursor" }],
      },
      defaultValues: ["claude"],
      required: true,
      groupSpacing: 1,
    });

    expect(selected).toEqual(["claude"]);
    expect(calls).toEqual([
      {
        message: "Providers",
        options: {
          Runtime: [{ label: "Claude", value: "claude", hint: "CLAUDE.md" }],
          Editorial: [{ label: "Cursor", value: "cursor" }],
        },
        initialValues: ["claude"],
        required: true,
        maxItems: undefined,
        groupSpacing: 1,
      },
    ]);
  });

  it("delegates taskList to Clack tasks and preserves task execution", async () => {
    const executed: string[] = [];
    const clack = {
      tasks: async (
        tasks: Array<{ readonly title: string; readonly task: () => Promise<void> }>
      ) => {
        for (const task of tasks) {
          executed.push(task.title);
          await task.task();
        }
      },
    } as unknown as ClackModule;
    const prompts = new ClackPrompts(async () => clack);

    await prompts.taskList([
      {
        title: "diff check",
        task: async () => {
          executed.push("ran diff");
        },
      },
    ]);

    expect(executed).toEqual(["diff check", "ran diff"]);
  });

  it("delegates status and taskLog to Clack visual primitives", async () => {
    const logCalls: string[] = [];
    const group = (name: string) => ({
      message: (message: string) => logCalls.push(`group:${name}:message:${message}`),
      success: (message: string) => logCalls.push(`group:${name}:success:${message}`),
      error: (message: string) => logCalls.push(`group:${name}:error:${message}`),
    });
    const clack = {
      log: {
        info: (message: string) => logCalls.push(`info:${message}`),
        success: (message: string) => logCalls.push(`success:${message}`),
        warning: (message: string) => logCalls.push(`warning:${message}`),
        error: (message: string) => logCalls.push(`error:${message}`),
        step: (message: string) => logCalls.push(`step:${message}`),
      },
      taskLog: (options: { readonly title?: string }) => {
        logCalls.push(`taskLog:${options.title ?? ""}`);
        return {
          message: (message: string) => logCalls.push(`message:${message}`),
          group,
          success: (message: string) => logCalls.push(`done:${message}`),
          error: (message: string) => logCalls.push(`fail:${message}`),
        };
      },
    } as unknown as ClackModule;
    const prompts = new ClackPrompts(async () => clack);

    await prompts.status("warn", "blocked");
    await prompts.status("step", "checking");
    const taskLog = prompts.taskLog({ title: "checks" });
    taskLog.message("start");
    taskLog.group("ci").success("green");
    taskLog.success("finished");
    await flushMicrotasks();

    expect(logCalls).toEqual([
      "warning:blocked",
      "step:checking",
      "taskLog:checks",
      "message:start",
      "group:ci:success:green",
      "done:finished",
    ]);
  });
});
