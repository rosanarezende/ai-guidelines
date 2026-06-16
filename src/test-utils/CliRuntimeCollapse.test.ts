import fs from "node:fs";
import path from "node:path";

import { buildRegistry } from "../cli/registry/buildRegistry.js";

const REPO_ROOT = path.resolve(".");

function readJson(relativePath: string): any {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf-8"));
}

function walkFiles(dir: string): readonly string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const visit = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") {
          continue;
        }
        visit(absolute);
      } else if (entry.isFile()) {
        out.push(absolute);
      }
    }
  };
  visit(dir);
  return out;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function extractModuleSpecifiers(content: string): readonly string[] {
  const re = /\b(?:from|import|require)\b\s*\(?\s*["']([^"']+)["']/g;
  return [...content.matchAll(re)]
    .map((match) => match[1])
    .filter((value): value is string => {
      return value !== undefined;
    });
}

describe("CO-3.5 runtime collapse guard", () => {
  it("/cli não existe fisicamente", () => {
    expect(fs.existsSync(path.join(REPO_ROOT, "cli"))).toBe(false);
  });

  it("package.json publica somente dist como bin e não expõe /cli", () => {
    const pkg = readJson("package.json");

    expect(pkg.bin).toBe("dist/cli/main.js");
    expect(JSON.stringify(pkg.files)).not.toContain('"cli"');
    expect(JSON.stringify(pkg.files)).not.toContain("cli/");
    expect(JSON.stringify(pkg.imports ?? {})).not.toContain("./cli/");
    expect(JSON.stringify(pkg.scripts)).not.toContain("node cli/");
    expect(JSON.stringify(pkg.scripts)).not.toContain('"cli/**/*.test.mjs"');
    expect(pkg.scripts).not.toHaveProperty("guidelines:providers");
  });

  it("fontes e testes não importam runtime /cli e não reintroduzem legado", () => {
    const scannedRoots = ["src", "tests", ".github", ".core/templates", ".core/governance"];
    const violations: string[] = [];
    for (const root of scannedRoots) {
      for (const file of walkFiles(path.join(REPO_ROOT, root))) {
        const rel = normalizePath(path.relative(REPO_ROOT, file));
        if (rel === "src/test-utils/CliRuntimeCollapse.test.ts") continue;
        if (!/\.(ts|mjs|js|json|ya?ml|md|tmpl)$/.test(rel)) continue;
        const content = fs.readFileSync(file, "utf-8");

        for (const pattern of [/node\s+cli\//, /cli\/\*\*\/\*\.test\.mjs/]) {
          if (pattern.test(content)) violations.push(`${rel}: ${pattern}`);
        }

        for (const specifier of extractModuleSpecifiers(content)) {
          if (specifier.startsWith("#cli/")) {
            violations.push(`${rel}: ${specifier}`);
            continue;
          }
          if (!specifier.startsWith(".")) continue;
          const resolved = path.resolve(path.dirname(file), specifier);
          const legacyRoot = path.join(REPO_ROOT, "cli");
          if (resolved === legacyRoot || resolved.startsWith(`${legacyRoot}${path.sep}`)) {
            violations.push(`${rel}: ${specifier}`);
          }
        }

        if (!rel.endsWith(".test.ts")) {
          for (const pattern of [/LegacyExecuteFn/, /loadLegacyExecute/]) {
            if (pattern.test(content)) violations.push(`${rel}: ${pattern}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("registry ativo não registra providers", () => {
    const registry = buildRegistry();

    expect(registry.resolve("providers")).toBeUndefined();
    expect(registry.commandNames()).not.toContain("providers");
    expect(registry.renderHelp()).not.toMatch(/^\s+providers\s*$/m);
  });
});
