import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildAgentsRuntimeStub } from "#governance/monolith/compiler";
import { mergeAgentsContent } from "#governance/agents-merge";

const DEFAULT_AGENTS_PATH = resolve("AGENTS.md");

export function buildRuntimeBootstrapContent(existingContent = "", options = {}) {
  const stub = buildAgentsRuntimeStub(options.sddDir ?? ".ai-guidelines");
  return mergeAgentsContent(existingContent, stub);
}

export function syncRuntimeBootstrap(options = {}) {
  const agentsPath = resolve(options.agentsPath ?? DEFAULT_AGENTS_PATH);
  const current = existsSync(agentsPath) ? readFileSync(agentsPath, "utf-8") : "";
  const next = buildRuntimeBootstrapContent(current, options);
  const changed = current !== next;

  if (changed && !options.dryRun) {
    writeFileSync(agentsPath, next, "utf-8");
    formatAgents(agentsPath);
  }

  return { changed, agentsPath };
}

export function checkRuntimeBootstrap(options = {}) {
  const agentsPath = resolve(options.agentsPath ?? DEFAULT_AGENTS_PATH);
  const current = existsSync(agentsPath) ? readFileSync(agentsPath, "utf-8") : "";
  const next = buildRuntimeBootstrapContent(current, options);
  return { ok: current === next, agentsPath };
}

function formatAgents(agentsPath) {
  try {
    execSync(`yarn prettier --write "${agentsPath}"`, { stdio: "ignore" });
  } catch {
    // Formatting is best-effort here; validate/format remains the authoritative gate.
  }
}

function main(argv = process.argv.slice(2)) {
  const command = argv[0] ?? "check";

  if (command === "sync") {
    const result = syncRuntimeBootstrap();
    console.log(
      result.changed
        ? "✅ runtime-bootstrap:sync — AGENTS.md sincronizado."
        : "✅ runtime-bootstrap:sync — AGENTS.md ja estava sincronizado."
    );
    return 0;
  }

  if (command === "check") {
    const result = checkRuntimeBootstrap();
    if (result.ok) {
      console.log("✅ runtime-bootstrap:check — AGENTS.md stub sincronizado.");
      return 0;
    }
    console.error(
      "❌ runtime-bootstrap:check — AGENTS.md diverge do stub governado. Rode `yarn runtime-bootstrap:sync`."
    );
    return 1;
  }

  console.error("Uso: node cli/governance/runtime-bootstrap.mjs <sync|check>");
  return 2;
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  process.exitCode = main();
}
