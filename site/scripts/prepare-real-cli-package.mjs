#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const publicDir = path.join(repoRoot, "site/public");
const packageDir = path.join(publicDir, "packages");
const manifestPath = path.join(publicDir, "real-cli-package.json");
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf-8"));

function git(args) {
  try {
    return execFileSync("git", args, { cwd: repoRoot, encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

function run(command, args) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

function runNpm(args) {
  if (process.env.npm_execpath) {
    return run(process.execPath, [process.env.npm_execpath, ...args]);
  }
  return run(process.platform === "win32" ? "npm.cmd" : "npm", args);
}

function cleanGeneratedTarballs() {
  if (!existsSync(packageDir)) return;
  for (const entry of readdirSync(packageDir)) {
    if (
      /^ai-guidelines-current-[a-f0-9]+(?:-[a-f0-9]+)?\.tgz$/i.test(entry) ||
      /^ai-guidelines-\d.*\.tgz$/i.test(entry)
    ) {
      rmSync(path.join(packageDir, entry), { force: true });
    }
  }
}

function modeFromEnvironment() {
  const override = process.env.AI_GUIDELINES_REAL_CLI_SOURCE;
  if (override === "latest" || override === "current") return override;

  const productionBranch = process.env.AI_GUIDELINES_SITE_PRODUCTION_BRANCH ?? "main";
  const branch = process.env.CF_PAGES_BRANCH;
  if (process.env.CF_PAGES === "1" && branch === productionBranch) return "latest";

  return "current";
}

function writeManifest(manifest) {
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function latestManifest() {
  cleanGeneratedTarballs();
  return {
    source: "latest",
    packageSpec: "ai-guidelines@latest",
    displayCommand: "npx ai-guidelines",
    label: "versão publicada no npm",
    packageName: packageJson.name,
    packageVersion: "latest",
    generatedAt: new Date().toISOString(),
  };
}

function currentManifest() {
  mkdirSync(packageDir, { recursive: true });
  cleanGeneratedTarballs();

  const packOutput = runNpm([
    "pack",
    "--ignore-scripts",
    "--pack-destination",
    packageDir,
    "--json",
  ]);
  const [packInfo] = JSON.parse(packOutput);
  if (!packInfo?.filename) throw new Error("npm pack did not report a filename");

  const commit = git(["rev-parse", "--short", "HEAD"]) || "local";
  const branch =
    process.env.CF_PAGES_BRANCH || git(["rev-parse", "--abbrev-ref", "HEAD"]) || "local";
  const from = path.join(packageDir, packInfo.filename);
  const sha = createHash("sha256").update(readFileSync(from)).digest("hex").slice(0, 12);
  const generatedName = `ai-guidelines-current-${commit}-${sha}.tgz`;
  const to = path.join(packageDir, generatedName);
  if (from !== to) renameSync(from, to);

  return {
    source: "current",
    packageSpec: `/packages/${generatedName}`,
    displayCommand: "npx ai-guidelines",
    label: "pacote gerado desta branch",
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    branch,
    commit,
    generatedAt: new Date().toISOString(),
  };
}

const mode = modeFromEnvironment();
const manifest = mode === "latest" ? latestManifest() : currentManifest();
writeManifest(manifest);

console.log(`[site:real-package] ${manifest.source}: ${manifest.packageSpec} (${manifest.label})`);
