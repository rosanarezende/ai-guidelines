// repo-contexts.ts — publicação/validação do substrato repo-first da v3.
// Cada repo publica .governance/context.json a partir do manifesto local + package.json + exports do src/.
// O repos.yml central continua como inventário da org, mas não pode divergir da projeção publicada.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import type { GovernanceIssue, OrgSnapshot } from "@demo/domain/server";
import { digestText12, stableSorted } from "@demo/domain/server";
import { REPOS_ROOT } from "../fs/paths.ts";

const REPOS_DIR = REPOS_ROOT;
const GOVERNANCE_DIR = ".governance";
const CONTEXT_SCHEMA = "acme.repo-context/v1";

type Manifest = Record<string, unknown> & {
  owner?: string;
  role?: string;
  domain?: string;
  modules?: Array<Record<string, unknown>>;
  provides?: Array<{ name: string } & Record<string, unknown>>;
  consumes?: Array<{ contract: string } & Record<string, unknown>>;
  capabilities?: Array<{ tags?: string[] } & Record<string, unknown>>;
  architecture?: Record<string, unknown>;
};

export type PublishedRepoContext = {
  schema: string;
  repo: string;
  owner?: string;
  role?: string;
  domain?: string;
  modules: Array<{ capabilities?: Array<{ tags?: string[] }> } & Record<string, unknown>>;
  provides: Array<{ name: string } & Record<string, unknown>>;
  consumes: Array<{ contract: string } & Record<string, unknown>>;
  capabilities: Array<{ tags?: string[] } & Record<string, unknown>>;
  architecture: Record<string, unknown>;
  package: { name?: string; dependencies: string[] };
  code: { entrypoint: string | null; exports: string[]; sourceHash: string };
  contentHash?: string;
};

const readYaml = (file: string): Manifest => parse(readFileSync(file, "utf8")) as Manifest;
const readJson = (file: string): Record<string, unknown> =>
  JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;

function digest(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(stableSorted(value));
  return digestText12(text);
}

function normalizeToken(value: unknown): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function listFiles(dir: string, predicate?: (file: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full, predicate));
    else if (!predicate || predicate(full)) out.push(full);
  }
  return out.sort();
}

function repoDirs(): string[] {
  return readdirSync(REPOS_DIR)
    .map((name) => path.join(REPOS_DIR, name))
    .filter((full) => statSync(full).isDirectory() && existsSync(path.join(full, "package.json")))
    .sort();
}

function localContractRef(ref: unknown): { repo: string; contract: string } | null {
  const [repo, contract, ...rest] = String(ref || "").split("/");
  return repo && contract && rest.length === 0 ? { repo, contract } : null;
}

function packageDeps(pkg: Record<string, unknown>): string[] {
  return Object.keys({
    ...((pkg["dependencies"] as Record<string, unknown>) || {}),
    ...((pkg["devDependencies"] as Record<string, unknown>) || {}),
  }).sort();
}

function codeExports(repoDir: string): string[] {
  // Adoption-safe: inspect source text; never execute an arbitrary repo during discovery.
  const files = listFiles(path.join(repoDir, "src"), (file) => file.endsWith(".mjs"));
  const symbols = new Set<string>();
  const direct = /\bexport\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g;
  const named = /\bexport\s*\{([^}]+)\}/g;
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(direct)) symbols.add(match[1]);
    for (const match of text.matchAll(named)) {
      for (const raw of match[1].split(",")) {
        const name = raw
          .trim()
          .split(/\s+as\s+/i)
          .pop()
          ?.trim();
        if (name && /^[A-Za-z_$][\w$]*$/.test(name)) symbols.add(name);
      }
    }
  }
  return [...symbols].sort();
}

function sourceHash(repoDir: string): string {
  const src = path.join(repoDir, "src");
  const files = listFiles(src, (file) => file.endsWith(".mjs"));
  const payload = files.map((file) => ({
    file: path.relative(repoDir, file).replaceAll("\\", "/"),
    hash: digest(readFileSync(file, "utf8")),
  }));
  return digest(payload);
}

export function loadManifest(repoId: string): Manifest | null {
  const file = path.join(REPOS_DIR, repoId, GOVERNANCE_DIR, "manifest.yml");
  if (!existsSync(file)) return null;
  return readYaml(file);
}

export function loadPublishedContexts(): PublishedRepoContext[] {
  const contexts: PublishedRepoContext[] = [];
  for (const repoDir of repoDirs()) {
    const file = path.join(repoDir, GOVERNANCE_DIR, "context.json");
    if (existsSync(file)) contexts.push(readJson(file) as unknown as PublishedRepoContext);
  }
  return contexts.sort((a, b) => a.repo.localeCompare(b.repo));
}

export async function deriveRepoContext(repoDir: string): Promise<PublishedRepoContext> {
  const repoId = path.basename(repoDir);
  const manifestFile = path.join(repoDir, GOVERNANCE_DIR, "manifest.yml");
  const packageFile = path.join(repoDir, "package.json");
  if (!existsSync(manifestFile)) throw new Error(`${repoId}: missing .governance/manifest.yml`);
  const manifest = readYaml(manifestFile);
  const pkg = readJson(packageFile);
  const context = {
    schema: CONTEXT_SCHEMA,
    repo: repoId,
    owner: manifest.owner,
    role: manifest.role,
    domain: manifest.domain,
    modules: manifest.modules || [],
    provides: manifest.provides || [],
    consumes: manifest.consumes || [],
    capabilities: manifest.capabilities || [],
    architecture: manifest.architecture || {},
    package: {
      name: pkg["name"] as string | undefined,
      dependencies: packageDeps(pkg),
    },
    code: {
      entrypoint: existsSync(path.join(repoDir, "src", "index.mjs")) ? "src/index.mjs" : null,
      exports: codeExports(repoDir),
      sourceHash: sourceHash(repoDir),
    },
  } as PublishedRepoContext;
  return { ...context, contentHash: digest(context) };
}

export function inspectRepoCode(repoDir: string): {
  entrypoint: string | null;
  exports: string[];
  sourceHash: string;
} {
  return {
    entrypoint: existsSync(path.join(repoDir, "src", "index.mjs")) ? "src/index.mjs" : null,
    exports: codeExports(repoDir),
    sourceHash: sourceHash(repoDir),
  };
}

export async function deriveAllRepoContexts(): Promise<PublishedRepoContext[]> {
  const contexts: PublishedRepoContext[] = [];
  for (const repoDir of repoDirs()) contexts.push(await deriveRepoContext(repoDir));
  return contexts.sort((a, b) => a.repo.localeCompare(b.repo));
}

export async function publishRepoContexts(): Promise<PublishedRepoContext[]> {
  const contexts = await deriveAllRepoContexts();
  for (const context of contexts) {
    const out = path.join(REPOS_DIR, context.repo, GOVERNANCE_DIR, "context.json");
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(context, null, 2)}\n`);
  }
  return contexts;
}

export type ValidateRepoContextsOptions = {
  expectedContexts?: PublishedRepoContext[];
  publishedContexts?: PublishedRepoContext[];
};

export async function validateRepoContexts(
  o: OrgSnapshot,
  options: ValidateRepoContextsOptions = {}
): Promise<GovernanceIssue[]> {
  const issues: GovernanceIssue[] = [];
  const err = (rule: string, node: string, msg: string): void => {
    issues.push({ level: "error", rule, node, msg });
  };
  const warn = (rule: string, node: string, msg: string): void => {
    issues.push({ level: "warn", rule, node, msg });
  };
  const centralRepos = new Map((o.repos || []).map((repo) => [repo.id, repo]));
  const expected =
    options.expectedContexts ||
    (await deriveAllRepoContexts().catch((e: Error) => {
      err("repo-context", "repos", e.message);
      return [] as PublishedRepoContext[];
    }));
  const expectedByRepo = new Map(expected.map((ctx) => [ctx.repo, ctx]));
  const publishedByRepo = new Map(
    (options.publishedContexts || loadPublishedContexts()).map((ctx) => [ctx.repo, ctx])
  );

  for (const repo of o.repos || []) {
    const ctx = expectedByRepo.get(repo.id);
    if (!ctx) {
      err("repo-context", repo.id, "repo central sem package/manifest local publicavel");
      continue;
    }
    const published = publishedByRepo.get(repo.id);
    if (!published) {
      err("repo-context", repo.id, "repo sem .governance/context.json publicado");
      continue;
    }
    if (JSON.stringify(stableSorted(published)) !== JSON.stringify(stableSorted(ctx)))
      err("repo-context-stale", repo.id, "context.json diverge do manifesto/package/src atuais");
    if (ctx.owner !== repo.owner)
      err(
        "repo-context-owner",
        repo.id,
        `owner publicado "${ctx.owner}" diverge do repos.yml "${repo.owner}"`
      );

    const manifestTags = new Set([
      ...ctx.capabilities.flatMap((cap) => (cap.tags || []).map(normalizeToken)),
      ...ctx.modules.flatMap((mod) =>
        (mod.capabilities || []).flatMap((cap) => (cap.tags || []).map(normalizeToken))
      ),
    ]);
    for (const cap of repo.caps || []) {
      if (!manifestTags.has(normalizeToken(cap)))
        err(
          "repo-context-caps",
          repo.id,
          `cap "${cap}" do repos.yml nao aparece como tag publicada`
        );
    }
  }

  for (const ctx of expected) {
    if (!centralRepos.has(ctx.repo))
      warn(
        "repo-context-orphan",
        ctx.repo,
        "repo com contexto publicado fora do repos.yml central"
      );
  }

  const providers = new Map<string, Record<string, unknown>>();
  for (const ctx of expected) {
    for (const p of ctx.provides || [])
      providers.set(`${ctx.repo}/${p.name}`, { repo: ctx.repo, ...p });
  }

  for (const ctx of expected) {
    for (const c of ctx.consumes || []) {
      const ref = localContractRef(c.contract);
      if (!ref)
        err(
          "repo-context-contract-ref",
          ctx.repo,
          `consume "${c.contract}" nao usa <repo>/<contract>`
        );
      else if (!providers.has(c.contract))
        err(
          "repo-context-contract-ref",
          ctx.repo,
          `consume "${c.contract}" sem provider publicado`
        );
    }

    const deps = (ctx.package.dependencies || [])
      .filter((dep) => dep.startsWith("@acme-sim/"))
      .map((dep) => dep.replace("@acme-sim/", ""));
    for (const depRepo of deps) {
      const hasConsume = (ctx.consumes || []).some((c) =>
        String(c.contract).startsWith(`${depRepo}/`)
      );
      if (!hasConsume)
        err(
          "repo-context-dependency",
          ctx.repo,
          `package depende de "${depRepo}", mas o manifesto nao consome nenhum contrato dele`
        );
    }
  }

  for (const contract of o.contracts || []) {
    const ownerRef = `${contract["owner-repo"]}/${contract.id}`;
    if (!providers.has(ownerRef))
      err("repo-context-contract", contract.id, `owner-repo nao publica contrato "${ownerRef}"`);
    for (const consumer of contract.consumers || []) {
      const ctx = expectedByRepo.get(consumer);
      const consumes = (ctx?.consumes || []).some((c) => c.contract === ownerRef);
      if (!consumes)
        err(
          "repo-context-contract",
          contract.id,
          `consumer "${consumer}" nao consome "${ownerRef}" no manifesto`
        );
    }
  }

  return issues;
}
