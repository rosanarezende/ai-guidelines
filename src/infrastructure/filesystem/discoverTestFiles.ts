import * as fs from "node:fs";
import * as path from "node:path";

/** Encontra arquivos `.test.ts` sob `src/` em ordem deterministica. */
export function discoverTestFiles(repoRoot: string): string[] {
  const out: string[] = [];
  const srcRoot = path.join(repoRoot, "src");
  if (!fs.existsSync(srcRoot)) return out;

  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".test.ts")) out.push(full);
    }
  };

  walk(srcRoot);
  out.sort();
  return out;
}
