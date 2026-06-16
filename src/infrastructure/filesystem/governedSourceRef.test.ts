import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { resolveGovernedSourcePath } from "./governedSourceRef.js";

function tmpRoot(): string {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "gsr-")));
}

function write(root: string, rel: string, content = "x"): void {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

function createSymlinkOrSkip(target: string, linkPath: string): boolean {
  try {
    fs.symlinkSync(target, linkPath);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EPERM" || code === "EACCES" || code === "ENOTSUP") {
      return false;
    }
    throw error;
  }
}

describe("resolveGovernedSourcePath · containment [F2]", () => {
  it("[F2.1] path relativo interno contido e existente", () => {
    const root = tmpRoot();
    write(root, ".core/rules/top/agents-core.md");
    const r = resolveGovernedSourcePath(root, ".core/rules/top/agents-core.md");
    expect(r.contained).toBe(true);
    expect(r.exists).toBe(true);
    expect(r.absPath).toBe(path.join(root, ".core/rules/top/agents-core.md"));
  });

  it("[F2.2] `../outside.md` é rejeitado (escapa a raiz)", () => {
    const root = tmpRoot();
    const r = resolveGovernedSourcePath(root, "../outside.md");
    expect(r.contained).toBe(false);
    expect(r.reason).toMatch(/\.\.|escapa/);
  });

  it("[F2.3] path absoluto é rejeitado", () => {
    const root = tmpRoot();
    const r = resolveGovernedSourcePath(root, path.join(root, "x.md"));
    expect(r.contained).toBe(false);
    expect(r.reason).toMatch(/absoluto/);
  });

  it("[F2.3b] drive-letter Windows é rejeitado como absoluto", () => {
    const root = tmpRoot();
    const r = resolveGovernedSourcePath(root, "C:/Windows/x.md");
    expect(r.contained).toBe(false);
    expect(r.reason).toMatch(/absoluto/);
  });

  it("[F2.4] prefixo semelhante ao repo não é containment", () => {
    const base = tmpRoot();
    const root = path.join(base, "repo");
    fs.mkdirSync(root, { recursive: true });
    fs.mkdirSync(path.join(base, "repo-evil"), { recursive: true });
    fs.writeFileSync(path.join(base, "repo-evil", "x.md"), "x");
    const r = resolveGovernedSourcePath(root, "../repo-evil/x.md");
    expect(r.contained).toBe(false);
  });

  it("[F2.5] symlink interno → interno é aceito", () => {
    const root = tmpRoot();
    write(root, ".core/real.md", "### [GG-0001] x");
    if (!createSymlinkOrSkip(path.join(root, ".core/real.md"), path.join(root, ".core/link.md"))) {
      return;
    }
    const r = resolveGovernedSourcePath(root, ".core/link.md");
    expect(r.contained).toBe(true);
    expect(r.exists).toBe(true);
  });

  it("[F2.6] symlink interno → externo é rejeitado", () => {
    const base = tmpRoot();
    const root = path.join(base, "repo");
    fs.mkdirSync(path.join(root, ".core"), { recursive: true });
    const outside = path.join(base, "outside.md");
    fs.writeFileSync(outside, "### [GG-0001] x");
    if (!createSymlinkOrSkip(outside, path.join(root, ".core/escape.md"))) {
      return;
    }
    const r = resolveGovernedSourcePath(root, ".core/escape.md");
    expect(r.contained).toBe(false);
    expect(r.reason).toMatch(/symlink/);
  });

  it("[F2.7] separadores Windows (`..\\`) não escapam", () => {
    const root = tmpRoot();
    const r = resolveGovernedSourcePath(root, "..\\outside.md");
    expect(r.contained).toBe(false);
  });

  it("[F2.8] path vazio é rejeitado", () => {
    const root = tmpRoot();
    const r = resolveGovernedSourcePath(root, "   ");
    expect(r.contained).toBe(false);
    expect(r.reason).toMatch(/vazio/);
  });

  it("[F2.9] containment não depende de existência: interno inexistente é contido mas !exists", () => {
    const root = tmpRoot();
    const r = resolveGovernedSourcePath(root, ".core/missing.md");
    expect(r.contained).toBe(true);
    expect(r.exists).toBe(false);
  });

  it("[F2.10] alvo externo é rejeitado no estágio léxico (antes de qualquer I/O)", () => {
    const base = tmpRoot();
    const root = path.join(base, "repo");
    fs.mkdirSync(root, { recursive: true });
    // O arquivo externo existe e tem conteúdo; mesmo assim a rejeição vem do
    // segmento `..` (léxica), sem absPath — logo, sem caminho para leitura.
    fs.writeFileSync(path.join(base, "secret.md"), "SEGREDO");
    const r = resolveGovernedSourcePath(root, "../secret.md");
    expect(r.contained).toBe(false);
    expect(r.absPath).toBeNull();
    expect(r.reason).toMatch(/\.\.|escapa/);
  });
});
