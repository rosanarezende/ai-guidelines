import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  GOVERNED_TEXT_ROOTS,
  bufferHasNulByte,
  isTextSourceFile,
  scanTextSourcesForNul,
} from "./textSourceGuard.js";

// O byte NUL é construído por ESCAPE (`\x00`) — nunca embutido cru — para que o
// próprio fonte deste teste permaneça textual (o bug que ele protege).
const NUL = "\x00";

function tmp(): string {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "nulguard-")));
}

function write(root: string, rel: string, content: Buffer | string): void {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

describe("textSourceGuard · detecção de byte NUL [bug1]", () => {
  it("bufferHasNulByte distingue texto de conteúdo com NUL", () => {
    expect(bufferHasNulByte(Buffer.from("const x = 1;\n"))).toBe(false);
    expect(bufferHasNulByte(Buffer.from(`a${NUL}b`))).toBe(true);
  });

  it("isTextSourceFile filtra por extensão (texto sim, binário não)", () => {
    expect(isTextSourceFile("src/a.ts")).toBe(true);
    expect(isTextSourceFile("a.YML")).toBe(true);
    expect(isTextSourceFile("docs/img.png")).toBe(false);
    expect(isTextSourceFile("bin/tool")).toBe(false);
  });

  it("[4] scanner detecta NUL introduzido em fixture textual", () => {
    const repo = tmp();
    write(repo, "src/clean.ts", "const ok = true;\n");
    write(repo, "src/dirty.ts", `const k = \`a${NUL}b\`;\n`);
    expect(scanTextSourcesForNul(repo, ["src"])).toEqual(["src/dirty.ts"]);
  });

  it("[5] scanner NÃO inspeciona binários legítimos (NUL em .png é ignorado)", () => {
    const repo = tmp();
    write(repo, "assets/logo.png", Buffer.from([0x89, 0x50, 0x00, 0x4e, 0x47]));
    write(repo, "src/ok.ts", "export const x = 1;\n");
    expect(scanTextSourcesForNul(repo, ["assets", "src"])).toEqual([]);
  });

  it("[6] determinístico e POSIX-normalizado cross-platform (path separators)", () => {
    const repo = tmp();
    write(repo, path.join("src", "nested", "deep.ts"), `x${NUL}y`);
    const hits = scanTextSourcesForNul(repo, ["src"]);
    expect(hits).toEqual(["src/nested/deep.ts"]); // sempre "/", nunca "\"
  });

  it("[1][regressão] as fontes textuais governadas do repo têm ZERO byte NUL", () => {
    expect(scanTextSourcesForNul(process.cwd(), GOVERNED_TEXT_ROOTS)).toEqual([]);
  });

  it("[1] constraintsCheck.ts e compileConstraints.ts são textuais (sem NUL)", () => {
    for (const f of ["src/cli/constraintsCheck.ts", "src/app/constraints/compileConstraints.ts"]) {
      expect(bufferHasNulByte(fs.readFileSync(path.join(process.cwd(), f)))).toBe(false);
    }
  });
});
