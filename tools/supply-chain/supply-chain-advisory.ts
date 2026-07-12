#!/usr/bin/env node
// Advisory local de supply-chain para o proprio ai-guidelines.
//
// O script nao substitui OSV-Scanner. Ele cobre o caso leve de manutencao:
// ler package-lock.json, consultar OSV.dev para vulnerabilidades conhecidas e
// enriquecer dependencias diretas com deps.dev. O resultado e evidencia
// consultiva; por default nao bloqueia commit/CI.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as path from "node:path";

type LockPackage = {
  version?: string;
  resolved?: string;
  link?: boolean;
  dev?: boolean;
};

type PackageLock = {
  name?: string;
  version?: string;
  packages?: Record<string, LockPackage & { dependencies?: Record<string, string> }>;
};

type LockDependency = {
  name: string;
  version: string;
  path: string;
  direct: boolean;
  dev: boolean;
};

type OsvVulnerability = {
  id: string;
  modified?: string;
};

type OsvQueryResult = {
  vulns?: OsvVulnerability[];
  next_page_token?: string;
};

type DepsDevVersion = {
  versionKey?: { system?: string; name?: string; version?: string };
  licenses?: string[];
  advisoryKeys?: Array<{ id?: string }>;
  publishedAt?: string;
  isDefault?: boolean;
};

type AdvisoryReport = {
  schema: "ai-guidelines.supply-chain-advisory/v1";
  generatedAt: string;
  lockfile: string;
  dryRun: boolean;
  counts: {
    scannedPackages: number;
    directPackages: number;
    osvVulnerabilityMatches: number;
    depsDevEnrichedPackages: number;
  };
  osv: Array<{
    packageName: string;
    version: string;
    vulnerabilities: OsvVulnerability[];
  }>;
  depsDev: Array<{
    packageName: string;
    version: string;
    licenses: string[];
    advisories: string[];
    publishedAt?: string;
    isDefault?: boolean;
    status: "ok" | "not-found" | "failed" | "skipped";
    error?: string;
  }>;
};

type CliOptions = {
  lockfile: string;
  output?: string;
  dryRun: boolean;
  failOnVulns: boolean;
  maxDepsDev: number;
};

const OSV_BATCH_URL = "https://api.osv.dev/v1/querybatch";
const DEPS_DEV_VERSION_URL = "https://api.deps.dev/v3/systems/npm/packages";

function parseArgs(argv: readonly string[]): CliOptions {
  const options: CliOptions = {
    lockfile: "package-lock.json",
    dryRun: false,
    failOnVulns: process.env["SUPPLY_CHAIN_FAIL_ON_VULNS"] === "1",
    maxDepsDev: 40,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--fail-on-vulns") {
      options.failOnVulns = true;
    } else if (arg === "--lockfile") {
      options.lockfile = argv[index + 1] ?? options.lockfile;
      index += 1;
    } else if (arg === "--output") {
      options.output = argv[index + 1];
      index += 1;
    } else if (arg === "--max-deps-dev") {
      options.maxDepsDev = Number(argv[index + 1] ?? options.maxDepsDev);
      index += 1;
    } else {
      throw new Error(`Argumento desconhecido: ${arg}`);
    }
  }
  if (!Number.isFinite(options.maxDepsDev) || options.maxDepsDev < 0) {
    throw new Error("--max-deps-dev precisa ser numero >= 0");
  }
  return options;
}

function packageNameFromLockPath(lockPath: string): string | null {
  const marker = "node_modules/";
  if (!lockPath.includes(marker)) return null;
  const last = lockPath.slice(lockPath.lastIndexOf(marker) + marker.length);
  const parts = last.split("/");
  if (parts[0]?.startsWith("@")) {
    if (!parts[0] || !parts[1]) return null;
    return `${parts[0]}/${parts[1]}`;
  }
  return parts[0] || null;
}

function rootManifestDependencies(lock: PackageLock): Set<string> {
  const root = lock.packages?.[""];
  return new Set([
    ...Object.keys(root?.dependencies ?? {}),
    ...Object.keys(
      (root as { devDependencies?: Record<string, string> } | undefined)?.devDependencies ?? {}
    ),
    ...Object.keys(
      (root as { optionalDependencies?: Record<string, string> } | undefined)
        ?.optionalDependencies ?? {}
    ),
  ]);
}

function collectLockDependencies(lockfile: string): LockDependency[] {
  const lock = JSON.parse(readFileSync(lockfile, "utf8")) as PackageLock;
  const direct = rootManifestDependencies(lock);
  const seen = new Set<string>();
  const entries: LockDependency[] = [];
  for (const [lockPath, pkg] of Object.entries(lock.packages ?? {})) {
    if (!lockPath || pkg.link || !pkg.version) continue;
    const name = packageNameFromLockPath(lockPath);
    if (!name) continue;
    const key = `${name}@${pkg.version}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      name,
      version: pkg.version,
      path: lockPath,
      direct: direct.has(name),
      dev: Boolean(pkg.dev),
    });
  }
  entries.sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`));
  return entries;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function postOsvBatch(dependencies: readonly LockDependency[]): Promise<OsvQueryResult[]> {
  const results: OsvQueryResult[] = [];
  for (const group of chunk(dependencies, 100)) {
    const response = await fetch(OSV_BATCH_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        queries: group.map((dependency) => ({
          package: { ecosystem: "npm", name: dependency.name },
          version: dependency.version,
        })),
      }),
    });
    if (!response.ok) {
      throw new Error(`OSV.dev respondeu ${response.status}: ${await response.text()}`);
    }
    const body = (await response.json()) as { results?: OsvQueryResult[] };
    results.push(...(body.results ?? []));
  }
  return results;
}

async function getDepsDevVersion(dependency: LockDependency): Promise<DepsDevVersion | null> {
  const url = `${DEPS_DEV_VERSION_URL}/${encodeURIComponent(dependency.name)}/versions/${encodeURIComponent(
    dependency.version
  )}`;
  const response = await fetch(url);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`deps.dev respondeu ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as DepsDevVersion;
}

async function buildReport(options: CliOptions): Promise<AdvisoryReport> {
  const lockfile = path.resolve(options.lockfile);
  const dependencies = collectLockDependencies(lockfile);
  const directDependencies = dependencies.filter((dependency) => dependency.direct);
  if (options.dryRun) {
    return {
      schema: "ai-guidelines.supply-chain-advisory/v1",
      generatedAt: new Date().toISOString(),
      lockfile,
      dryRun: true,
      counts: {
        scannedPackages: dependencies.length,
        directPackages: directDependencies.length,
        osvVulnerabilityMatches: 0,
        depsDevEnrichedPackages: 0,
      },
      osv: [],
      depsDev: directDependencies.slice(0, options.maxDepsDev).map((dependency) => ({
        packageName: dependency.name,
        version: dependency.version,
        licenses: [],
        advisories: [],
        status: "skipped",
      })),
    };
  }

  const osvResults = await postOsvBatch(dependencies);
  const osv = dependencies
    .map((dependency, index) => ({
      packageName: dependency.name,
      version: dependency.version,
      vulnerabilities: osvResults[index]?.vulns ?? [],
    }))
    .filter((entry) => entry.vulnerabilities.length > 0);

  const depsDev: AdvisoryReport["depsDev"] = [];
  for (const dependency of directDependencies.slice(0, options.maxDepsDev)) {
    try {
      const version = await getDepsDevVersion(dependency);
      if (!version) {
        depsDev.push({
          packageName: dependency.name,
          version: dependency.version,
          licenses: [],
          advisories: [],
          status: "not-found",
        });
        continue;
      }
      depsDev.push({
        packageName: dependency.name,
        version: dependency.version,
        licenses: version.licenses ?? [],
        advisories: (version.advisoryKeys ?? []).map((item) => item.id ?? "").filter(Boolean),
        publishedAt: version.publishedAt,
        isDefault: version.isDefault,
        status: "ok",
      });
    } catch (error) {
      depsDev.push({
        packageName: dependency.name,
        version: dependency.version,
        licenses: [],
        advisories: [],
        status: "failed",
        error: (error as Error).message,
      });
    }
  }

  return {
    schema: "ai-guidelines.supply-chain-advisory/v1",
    generatedAt: new Date().toISOString(),
    lockfile,
    dryRun: false,
    counts: {
      scannedPackages: dependencies.length,
      directPackages: directDependencies.length,
      osvVulnerabilityMatches: osv.reduce(
        (total, entry) => total + entry.vulnerabilities.length,
        0
      ),
      depsDevEnrichedPackages: depsDev.filter((entry) => entry.status === "ok").length,
    },
    osv,
    depsDev,
  };
}

function writeReport(output: string | undefined, report: AdvisoryReport): void {
  if (!output) return;
  const absolute = path.resolve(output);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(report, null, 2)}\n`);
}

function printSummary(report: AdvisoryReport): void {
  console.log(
    [
      `supply-chain advisory (${report.dryRun ? "dry-run" : "live"})`,
      `packages=${report.counts.scannedPackages}`,
      `direct=${report.counts.directPackages}`,
      `osv-vulns=${report.counts.osvVulnerabilityMatches}`,
      `deps-dev=${report.counts.depsDevEnrichedPackages}`,
    ].join(" · ")
  );
  for (const finding of report.osv.slice(0, 20)) {
    const ids = finding.vulnerabilities.map((vuln) => vuln.id).join(", ");
    console.log(`- ${finding.packageName}@${finding.version}: ${ids}`);
  }
  if (report.osv.length > 20) {
    console.log(`- ... ${report.osv.length - 20} pacote(s) adicionais com match OSV`);
  }
}

async function main(): Promise<number> {
  const options = parseArgs(process.argv.slice(2));
  const report = await buildReport(options);
  writeReport(options.output, report);
  printSummary(report);
  if (options.failOnVulns && report.counts.osvVulnerabilityMatches > 0) {
    console.error("SUPPLY_CHAIN_FAIL_ON_VULNS ativo: vulnerabilidades OSV encontradas.");
    return 1;
  }
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`supply-chain advisory falhou: ${(error as Error).message}`);
    process.exitCode = 1;
  });
