import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { main } from "./researchIndexCheck.js";

function tempRepo(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "research-index-"));
}

const SPECS_DIR = ".governance/specs";

function writeIndex(repo: string, text: string): void {
  const dir = path.join(repo, SPECS_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "research-index.md"), text);
}

function writeLibraryFile(repo: string, rel: string, text = "# stub\n"): void {
  const abs = path.join(repo, SPECS_DIR, "research-library", rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text);
}

const silent = { info: jest.fn(), error: jest.fn() };

describe("research-index:check [BR-RESEARCH-INDEX-CHECK]", () => {
  it("DADO índice ausente ENTÃO retorna 1", () => {
    expect(main(tempRepo(), silent)).toBe(1);
  });

  it("DADO biblioteca vazia + índice presente ENTÃO retorna 0", () => {
    const repo = tempRepo();
    writeIndex(repo, "# Research Index\n");
    expect(main(repo, silent)).toBe(0);
  });

  it("DADO todo arquivo da biblioteca indexado ENTÃO retorna 0", () => {
    const repo = tempRepo();
    writeLibraryFile(repo, "architecture/2026-05-19-lifecycle.md");
    writeIndex(repo, "# Index\n- [x](./research-library/architecture/2026-05-19-lifecycle.md)\n");
    expect(main(repo, silent)).toBe(0);
  });

  it("DADO arquivo da biblioteca fora do índice ENTÃO retorna 1 + 'não indexado'", () => {
    const repo = tempRepo();
    writeLibraryFile(repo, "architecture/2026-05-19-lifecycle.md");
    writeLibraryFile(repo, "architecture/2026-06-05-enforcement.md");
    writeIndex(repo, "# Index\n- [x](./research-library/architecture/2026-05-19-lifecycle.md)\n");
    const errors: string[] = [];
    const code = main(repo, { info: jest.fn(), error: (m) => errors.push(m) });
    expect(code).toBe(1);
    expect(errors.join("\n")).toContain("não indexado");
    expect(errors.join("\n")).toContain("2026-06-05-enforcement.md");
  });

  it("DADO README.md na biblioteca ENTÃO não exige indexação (navegacional)", () => {
    const repo = tempRepo();
    writeLibraryFile(repo, "architecture/README.md");
    writeIndex(repo, "# Index\n");
    expect(main(repo, silent)).toBe(0);
  });

  it("DADO link do índice para arquivo inexistente ENTÃO retorna 1 + 'link quebrado'", () => {
    const repo = tempRepo();
    writeIndex(repo, "# Index\n- [x](./research-library/architecture/2026-01-01-fantasma.md)\n");
    const errors: string[] = [];
    const code = main(repo, { info: jest.fn(), error: (m) => errors.push(m) });
    expect(code).toBe(1);
    expect(errors.join("\n")).toContain("link quebrado");
  });
});
