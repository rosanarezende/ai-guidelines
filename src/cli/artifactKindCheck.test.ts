import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { main } from "./artifactKindCheck.js";

function tempRepo(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "artifact-kind-"));
}

const TAXONOMY = `field: artifact-kind
kinds:
  - id: research
  - id: dogfood
  - id: pre-coding-review
`;

function writeTaxonomy(repo: string, text = TAXONOMY): void {
  const dir = path.join(repo, ".core/governance");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "artifact-taxonomy.yml"), text);
}

function writeResearch(repo: string, name: string, body: string): void {
  const dir = path.join(repo, ".governance/specs/0024-context-architecture/research");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), body);
}

const silent = { info: jest.fn(), error: jest.fn() };

describe("artifact-kind:check [BR-ARTIFACT-KIND-CHECK]", () => {
  it("DADO contrato ausente ENTÃO retorna 1", () => {
    expect(main(tempRepo(), silent)).toBe(1);
  });

  it("DADO artifact-kind válido ENTÃO retorna 0", () => {
    const repo = tempRepo();
    writeTaxonomy(repo);
    writeResearch(repo, "a.md", "---\nartifact-kind: dogfood\n---\n# x\n");
    expect(main(repo, silent)).toBe(0);
  });

  it("DADO artifact-kind fora do conjunto fechado ENTÃO retorna 1 + nome do valor", () => {
    const repo = tempRepo();
    writeTaxonomy(repo);
    writeResearch(repo, "a.md", "---\nartifact-kind: banana\n---\n# x\n");
    const errors: string[] = [];
    const code = main(repo, { info: jest.fn(), error: (m) => errors.push(m) });
    expect(code).toBe(1);
    expect(errors.join("\n")).toContain("banana");
  });

  it("DADO arquivos sem artifact-kind ENTÃO não bloqueia (advisory) e retorna 0", () => {
    const repo = tempRepo();
    writeTaxonomy(repo);
    writeResearch(repo, "sem-frontmatter.md", "# só conteúdo\n");
    writeResearch(repo, "com-kind.md", "---\nartifact-kind: research\n---\n# x\n");
    expect(main(repo, silent)).toBe(0);
  });

  it("DADO README.md em research ENTÃO é ignorado (não exige artifact-kind)", () => {
    const repo = tempRepo();
    writeTaxonomy(repo);
    writeResearch(repo, "README.md", "# índice de research, sem artifact-kind\n");
    expect(main(repo, silent)).toBe(0);
  });
});
