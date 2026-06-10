import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { buildRuntimeBootstrapContent } from "../app/services/AgentsRuntimeBootstrap.js";

const DEFAULT_AGENTS_PATH = "AGENTS.md";

export interface RuntimeBootstrapOptions {
  readonly agentsPath?: string;
  readonly sddDir?: string;
  readonly dryRun?: boolean;
}

export interface RuntimeBootstrapResult {
  readonly changed?: boolean;
  readonly ok?: boolean;
  readonly agentsPath: string;
}

export { buildRuntimeBootstrapContent };

export function syncRuntimeBootstrap(
  repoRoot = process.cwd(),
  options: RuntimeBootstrapOptions = {}
): RuntimeBootstrapResult {
  const agentsPath = path.resolve(repoRoot, options.agentsPath ?? DEFAULT_AGENTS_PATH);
  const current = existsSync(agentsPath) ? readFileSync(agentsPath, "utf-8") : "";
  const next = buildRuntimeBootstrapContent(current, { sddDir: options.sddDir });
  const changed = current !== next;

  if (changed && !options.dryRun) {
    writeFileSync(agentsPath, next, "utf-8");
    formatAgents(agentsPath);
  }

  return { changed, agentsPath };
}

export function checkRuntimeBootstrap(
  repoRoot = process.cwd(),
  options: RuntimeBootstrapOptions = {}
): RuntimeBootstrapResult {
  const agentsPath = path.resolve(repoRoot, options.agentsPath ?? DEFAULT_AGENTS_PATH);
  const current = existsSync(agentsPath) ? readFileSync(agentsPath, "utf-8") : "";
  const next = buildRuntimeBootstrapContent(current, { sddDir: options.sddDir });
  return { ok: current === next, agentsPath };
}

export function main(argv = process.argv.slice(2), repoRoot = process.cwd()): number {
  const command = argv[0] ?? "check";

  if (command === "sync") {
    const result = syncRuntimeBootstrap(repoRoot);
    process.stdout.write(
      result.changed
        ? "✅ runtime-bootstrap:sync — AGENTS.md sincronizado.\n"
        : "✅ runtime-bootstrap:sync — AGENTS.md ja estava sincronizado.\n"
    );
    return 0;
  }

  if (command === "check") {
    const result = checkRuntimeBootstrap(repoRoot);
    if (result.ok) {
      process.stdout.write("✅ runtime-bootstrap:check — AGENTS.md stub sincronizado.\n");
      return 0;
    }
    process.stderr.write(
      "❌ runtime-bootstrap:check — AGENTS.md diverge do stub governado. Rode `yarn runtime-bootstrap:sync`.\n"
    );
    return 1;
  }

  process.stderr.write("Uso: node cli/runtime-bootstrap.mjs <sync|check>\n");
  return 2;
}

function formatAgents(agentsPath: string): void {
  try {
    execFileSync("yarn", ["prettier", "--write", agentsPath], { stdio: "ignore" });
  } catch {
    // Formatting is best-effort here; validate/format remains the authoritative gate.
  }
}
