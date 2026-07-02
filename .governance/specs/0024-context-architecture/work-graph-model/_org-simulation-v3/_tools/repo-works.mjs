// repo-works.mjs — acknowledgements repo-first das peças de intent.
// A intent central quebra o trabalho; o repo precisa publicar um arquivo local dizendo
// "esta peça existe aqui" + hash do breakdown + evidência de código local.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse, stringify } from "yaml";
import { ACME } from "./org.mjs";

const REPOS_DIR = path.join(ACME, "repos");
const GOVERNANCE_DIR = ".governance";
const WORK_SCHEMA = "acme.repo-work/v1";
const WORK_STATUSES = ["acknowledged", "active", "blocked", "done", "dropped"];

const readYaml = (file) => parse(readFileSync(file, "utf8"));

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
  return createHash("sha256")
    .update(JSON.stringify(stable(value)))
    .digest("hex")
    .slice(0, 12);
}

function repoDirs() {
  return readdirSync(REPOS_DIR)
    .map((name) => path.join(REPOS_DIR, name))
    .filter((full) => statSync(full).isDirectory() && existsSync(path.join(full, "package.json")))
    .sort();
}

function claimFile(repo, intentId, workId) {
  return path.join(REPOS_DIR, repo, GOVERNANCE_DIR, "works", `${intentId}--${workId}.yml`);
}

function moduleTouchpoint(moduleId) {
  const base = String(moduleId || "").replace(/^mod-/, "");
  return base ? `src/modules/${base}.mjs` : "src/index.mjs";
}

function codeTouchpoints(work) {
  return [work.module ? moduleTouchpoint(work.module) : "src/index.mjs"];
}

function breakdownPayload(intent, work) {
  return {
    intent: intent.id,
    work: {
      id: work.id,
      repo: work.repo,
      module: work.module || null,
      purpose: work.purpose,
      desc: work.desc,
      review: work.review,
      timebox: work.timebox || null,
      blockedBy: work["blocked-by"] || [],
      deliveryAfter: work["delivery-after"] || [],
    },
  };
}

function expectedClaim(intent, work) {
  const claim = {
    schema: WORK_SCHEMA,
    id: `${intent.id}::${work.id}`,
    intent: intent.id,
    work: work.id,
    repo: work.repo,
    purpose: work.purpose,
    desc: work.desc,
    review: work.review,
    status: "acknowledged",
    source: {
      kind: "central-breakdown",
      file: `acme/intents/${intent.id}.yml`,
      breakdownHash: digest(breakdownPayload(intent, work)),
    },
    code: {
      touchpoints: codeTouchpoints(work),
    },
  };
  if (work.module) claim.module = work.module;
  return claim;
}

export function deriveExpectedRepoWorks(o) {
  return (o.intents || [])
    .flatMap((intent) => (intent.works || []).map((work) => expectedClaim(intent, work)))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function loadPublishedRepoWorks() {
  const claims = [];
  for (const repoDir of repoDirs()) {
    const repo = path.basename(repoDir);
    const worksDir = path.join(repoDir, GOVERNANCE_DIR, "works");
    if (!existsSync(worksDir)) continue;
    for (const name of readdirSync(worksDir)
      .filter((file) => file.endsWith(".yml"))
      .sort()) {
      const file = path.join(worksDir, name);
      claims.push({ ...readYaml(file), _file: file, _repo: repo });
    }
  }
  return claims.sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

export function publishRepoWorks(o) {
  const claims = deriveExpectedRepoWorks(o);
  for (const claim of claims) {
    const out = claimFile(claim.repo, claim.intent, claim.work);
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, stringify(claim, { lineWidth: 100 }));
  }
  return claims;
}

function checkClosedSchema(claim, node, issues) {
  const err = (rule, msg) => issues.push({ level: "error", rule, node, msg });
  const topKeys = new Set([
    "schema",
    "id",
    "intent",
    "work",
    "repo",
    "module",
    "purpose",
    "desc",
    "review",
    "status",
    "source",
    "code",
    "_file",
    "_repo",
  ]);
  const sourceKeys = new Set(["kind", "file", "breakdownHash"]);
  const codeKeys = new Set(["touchpoints"]);
  for (const key of Object.keys(claim || {}))
    if (!topKeys.has(key)) err("repo-work-schema", `chave desconhecida "${key}"`);
  for (const key of ["schema", "id", "intent", "work", "repo", "purpose", "review", "status"])
    if (claim?.[key] === undefined || claim?.[key] === null || claim?.[key] === "")
      err("repo-work-schema", `campo obrigatório "${key}" ausente`);
  for (const key of Object.keys(claim?.source || {}))
    if (!sourceKeys.has(key)) err("repo-work-schema", `source.${key} é chave desconhecida`);
  for (const key of ["kind", "file", "breakdownHash"])
    if (!claim?.source?.[key]) err("repo-work-schema", `source.${key} ausente`);
  for (const key of Object.keys(claim?.code || {}))
    if (!codeKeys.has(key)) err("repo-work-schema", `code.${key} é chave desconhecida`);
  if (!Array.isArray(claim?.code?.touchpoints) || claim.code.touchpoints.length === 0)
    err("repo-work-evidence", "code.touchpoints precisa apontar para pelo menos um arquivo local");
  if (claim?.status && !WORK_STATUSES.includes(claim.status))
    err(
      "repo-work-schema",
      `status "${claim.status}" inválido (aceitos: ${WORK_STATUSES.join(" · ")})`
    );
}

export function validateRepoWorks(o) {
  const issues = [];
  const err = (rule, node, msg) => issues.push({ level: "error", rule, node, msg });
  const expected = deriveExpectedRepoWorks(o);
  const expectedById = new Map(expected.map((claim) => [claim.id, claim]));
  const publishedById = new Map();

  let published = [];
  try {
    published = loadPublishedRepoWorks();
  } catch (e) {
    err("repo-work-parse", "repo-works", e.message);
    return issues;
  }

  for (const claim of published) {
    const node = claim.id || path.relative(ACME, claim._file).replaceAll("\\", "/");
    if (publishedById.has(claim.id)) err("repo-work-duplicate", node, "id duplicado");
    publishedById.set(claim.id, claim);
    checkClosedSchema(claim, node, issues);

    const expectedClaim = expectedById.get(claim.id);
    if (!expectedClaim) {
      err("repo-work-orphan", node, "ack local não corresponde a nenhuma peça central ativa");
      continue;
    }
    for (const key of ["schema", "intent", "work", "repo", "module", "purpose", "review"]) {
      const actual = claim[key] || null;
      const expectedValue = expectedClaim[key] || null;
      if (actual !== expectedValue)
        err("repo-work-stale", node, `${key}="${actual}" diverge do breakdown "${expectedValue}"`);
    }
    if (claim.source?.kind !== "central-breakdown")
      err("repo-work-source", node, `source.kind "${claim.source?.kind}" não é central-breakdown`);
    if (claim.source?.file !== expectedClaim.source.file)
      err(
        "repo-work-source",
        node,
        `source.file "${claim.source?.file}" diverge de "${expectedClaim.source.file}"`
      );
    if (claim.source?.breakdownHash !== expectedClaim.source.breakdownHash)
      err(
        "repo-work-stale",
        node,
        "breakdownHash diverge — a peça central mudou e o repo ainda não reconheceu a nova versão"
      );
    for (const touchpoint of claim.code?.touchpoints || []) {
      const full = path.join(REPOS_DIR, claim.repo || "", touchpoint);
      if (!existsSync(full))
        err("repo-work-evidence", node, `touchpoint "${touchpoint}" não existe em ${claim.repo}`);
    }
  }

  for (const claim of expected) {
    if (!publishedById.has(claim.id))
      err(
        "repo-work-missing",
        claim.id,
        `repo "${claim.repo}" não publicou ack local para ${claim.intent}::${claim.work}`
      );
  }

  return issues;
}
