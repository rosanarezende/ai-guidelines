// repo-contexts.mjs — publicacao/validacao do substrato repo-first da v3.
// Cada repo publica .governance/context.json a partir do manifesto local + package.json + exports do src/.
// O repos.yml central continua como inventario da org, mas nao pode divergir da projecao publicada.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { ACME } from "./org.mjs";

const REPOS_DIR = path.join(ACME, "repos");
const GOVERNANCE_DIR = ".governance";
const CONTEXT_SCHEMA = "acme.repo-context/v1";

const readYaml = (file) => parse(readFileSync(file, "utf8"));
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])])
    );
  }
  return value;
}

function digest(value) {
  const text = typeof value === "string" ? value : JSON.stringify(stable(value));
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
}

function normalizeToken(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function listFiles(dir, predicate) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full, predicate));
    else if (!predicate || predicate(full)) out.push(full);
  }
  return out.sort();
}

function repoDirs() {
  return readdirSync(REPOS_DIR)
    .map((name) => path.join(REPOS_DIR, name))
    .filter((full) => statSync(full).isDirectory() && existsSync(path.join(full, "package.json")))
    .sort();
}

function localContractRef(ref) {
  const [repo, contract, ...rest] = String(ref || "").split("/");
  return repo && contract && rest.length === 0 ? { repo, contract } : null;
}

function packageDeps(pkg) {
  return Object.keys({
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  }).sort();
}

function codeExports(repoDir) {
  // Adoption-safe: inspect source text; never execute an arbitrary repo during discovery.
  const files = listFiles(path.join(repoDir, "src"), (file) => file.endsWith(".mjs"));
  const symbols = new Set();
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

function sourceHash(repoDir) {
  const src = path.join(repoDir, "src");
  const files = listFiles(src, (file) => file.endsWith(".mjs"));
  const payload = files.map((file) => ({
    file: path.relative(repoDir, file).replaceAll("\\", "/"),
    hash: digest(readFileSync(file, "utf8")),
  }));
  return digest(payload);
}

export function loadManifest(repoId) {
  const file = path.join(REPOS_DIR, repoId, GOVERNANCE_DIR, "manifest.yml");
  if (!existsSync(file)) return null;
  return readYaml(file);
}

export function loadPublishedContexts() {
  const contexts = [];
  for (const repoDir of repoDirs()) {
    const file = path.join(repoDir, GOVERNANCE_DIR, "context.json");
    if (existsSync(file)) contexts.push(readJson(file));
  }
  return contexts.sort((a, b) => a.repo.localeCompare(b.repo));
}

export async function deriveRepoContext(repoDir) {
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
      name: pkg.name,
      dependencies: packageDeps(pkg),
    },
    code: {
      entrypoint: existsSync(path.join(repoDir, "src", "index.mjs")) ? "src/index.mjs" : null,
      exports: codeExports(repoDir),
      sourceHash: sourceHash(repoDir),
    },
  };
  return { ...context, contentHash: digest(context) };
}

export function inspectRepoCode(repoDir) {
  return {
    entrypoint: existsSync(path.join(repoDir, "src", "index.mjs")) ? "src/index.mjs" : null,
    exports: codeExports(repoDir),
    sourceHash: sourceHash(repoDir),
  };
}

export async function deriveAllRepoContexts() {
  const contexts = [];
  for (const repoDir of repoDirs()) contexts.push(await deriveRepoContext(repoDir));
  return contexts.sort((a, b) => a.repo.localeCompare(b.repo));
}

export async function publishRepoContexts() {
  const contexts = await deriveAllRepoContexts();
  for (const context of contexts) {
    const out = path.join(REPOS_DIR, context.repo, GOVERNANCE_DIR, "context.json");
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(context, null, 2)}\n`);
  }
  return contexts;
}

export async function validateRepoContexts(o) {
  const issues = [];
  const err = (rule, node, msg) => issues.push({ level: "error", rule, node, msg });
  const warn = (rule, node, msg) => issues.push({ level: "warn", rule, node, msg });
  const centralRepos = new Map((o.repos || []).map((repo) => [repo.id, repo]));
  const expected = await deriveAllRepoContexts().catch((e) => {
    err("repo-context", "repos", e.message);
    return [];
  });
  const expectedByRepo = new Map(expected.map((ctx) => [ctx.repo, ctx]));
  const publishedByRepo = new Map(loadPublishedContexts().map((ctx) => [ctx.repo, ctx]));

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
    if (JSON.stringify(stable(published)) !== JSON.stringify(stable(ctx)))
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

  const providers = new Map();
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
