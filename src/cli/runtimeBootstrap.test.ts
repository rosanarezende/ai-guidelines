import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  buildRuntimeBootstrapContent,
  checkRuntimeBootstrap,
  main,
  syncRuntimeBootstrap,
} from "./runtimeBootstrap.js";

describe("runtimeBootstrap", () => {
  it("DADO AGENTS sem bloco QUANDO sync ENTÃO escreve stub preservando conteúdo humano", () => {
    const repo = mkdtempSync(path.join(tmpdir(), "runtime-bootstrap-ts-"));
    const agentsPath = path.join(repo, "AGENTS.md");
    writeFileSync(agentsPath, "# AGENTS.md\n\n## Local\n\nTexto local.\n", "utf-8");

    const result = syncRuntimeBootstrap(repo);

    expect(result.changed).toBe(true);
    const content = readFileSync(agentsPath, "utf-8");
    expect(content).toContain("Texto local.");
    expect(content).toContain("<AI_GUIDELINES>");
    expect(content).toContain("Runtime Bootstrap");
  });

  it("DADO AGENTS sincronizado QUANDO check ENTÃO retorna ok (forma do mantenedor: script local)", () => {
    const repo = mkdtempSync(path.join(tmpdir(), "runtime-bootstrap-ts-"));
    const agentsPath = path.join(repo, "AGENTS.md");
    syncRuntimeBootstrap(repo);

    expect(checkRuntimeBootstrap(repo).ok).toBe(true);
    // O stub do mantenedor usa o script local; o default (consumidores via
    // adopt) usa o bin publicado `npx ai-guidelines …`.
    expect(readFileSync(agentsPath, "utf-8")).toContain("npm run flow -- handoff [spec]");
    expect(buildRuntimeBootstrapContent("")).toContain("npx ai-guidelines handoff [spec]");
  });

  it("DADO comando desconhecido QUANDO main ENTÃO retorna 2", () => {
    expect(main(["wat"], process.cwd())).toBe(2);
  });
});
