import { run } from "./main.js";

describe("ai-guidelines help público", () => {
  it("DADO --help QUANDO renderiza ENTÃO apresenta npx ai-guidelines como entrada principal", async () => {
    const infos: string[] = [];
    const errors: string[] = [];

    const exitCode = await run(["--help"], {
      logger: {
        info: (message) => infos.push(message),
        error: (message) => errors.push(message),
      },
      isTTY: false,
    });

    const out = infos.join("\n");
    expect(exitCode).toBe(0);
    expect(errors).toEqual([]);
    expect(out).toContain("npx ai-guidelines");
    expect(out).toContain("Guia interativo:         npx ai-guidelines");
    expect(out).toContain("Ex.: npx ai-guidelines init");
    expect(out).not.toContain("npm run flow -- <comando>");
    expect(out).not.toContain("Ex.: npm run flow --");
  });
});
