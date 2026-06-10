import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { parseRulesFromDirectory } from "./MarkdownRulesDirectorySource.js";

function ruleFile(id: string, title: string): string {
  return [
    `#### [${id}] ${title}`,
    "",
    "```yaml",
    `id: ${id}`,
    "scope: universal",
    "category: process",
    "evidence_strength: declared_heuristic",
    "sources: []",
    "applicable_languages: []",
    "tags: []",
    "```",
    "",
    `**Instruction (en):** Deterministic ordering probe ${id} with sufficient length.`,
    "",
  ].join("\n");
}

describe("MarkdownRulesDirectorySource — determinismo de ordenação", () => {
  it("DADO readdir em ordem arbitrária QUANDO parseRulesFromDirectory ENTÃO rules[] segue ordem estável por nome (DFS), não a do filesystem", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "rules-order-"));
    // Nomes de arquivo ordenam (a < b < z) ao contrário dos ids (AA < MM < ZZ):
    // se a ordem seguisse o id, seria [AA, MM, ZZ]; se seguisse readdir invertido,
    // seria [AA, ZZ, MM]. A ordem-contrato (nome/DFS) é [MM(a.md), ZZ(b.md), AA(z/c.md)].
    await fs.writeFile(path.join(dir, "a.md"), ruleFile("MM-001", "Alpha"));
    await fs.writeFile(path.join(dir, "b.md"), ruleFile("ZZ-001", "Beta"));
    await fs.mkdir(path.join(dir, "z"));
    await fs.writeFile(path.join(dir, "z", "c.md"), ruleFile("AA-001", "Gamma"));

    const realReaddir = fs.readdir.bind(fs);
    const spy = jest
      .spyOn(fs, "readdir")
      // @ts-expect-error — preserva a sobrecarga withFileTypes; só inverte a ordem retornada
      .mockImplementation(async (p: Parameters<typeof fs.readdir>[0], opts: unknown) => {
        const entries = await realReaddir(p as string, opts as never);
        return Array.isArray(entries) ? [...entries].reverse() : entries;
      });

    try {
      const result = await parseRulesFromDirectory(dir);
      expect(result.errors).toEqual([]);
      expect(result.rules.map((r) => r.id)).toEqual(["MM-001", "ZZ-001", "AA-001"]);
    } finally {
      spy.mockRestore();
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
