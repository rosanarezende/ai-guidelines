// repo-works.mjs — acknowledgements repo-first das peças de intent.
// A intent central quebra o trabalho; o repo precisa publicar um arquivo local dizendo
// "esta peça existe aqui" + hash do breakdown + evidência de código local.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse, stringify } from "yaml";
import { REPOS_ROOT, SIM_ROOT } from "./org.mjs";

const REPOS_DIR = REPOS_ROOT;
const GOVERNANCE_DIR = ".governance";
const WORK_SCHEMA = "acme.repo-work/v1";
const WORK_STATUSES = ["acknowledged", "active", "blocked", "done", "dropped"];
const LIFECYCLE_KEYS = [
  "owner",
  "started-at",
  "base-revision",
  "completed-at",
  "source-commit",
  "evidence",
  "verification",
  "blocked-by",
  "reason",
  "decision",
  "fate",
];

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
      file: `acme-governance/intents/${intent.id}.yml`,
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

function isStandaloneWork(claim) {
  return claim?.schema === "acme.standalone-work/v1" || claim?.source?.kind === "standalone";
}

export function publishRepoWorks(o) {
  const claims = deriveExpectedRepoWorks(o);
  const existingById = new Map(loadPublishedRepoWorks().map((claim) => [claim.id, claim]));
  for (const claim of claims) {
    const existing = existingById.get(claim.id) || {};
    for (const key of LIFECYCLE_KEYS) {
      if (existing[key] !== undefined) claim[key] = existing[key];
    }
    if (existing.status && existing.status !== "acknowledged") claim.status = existing.status;
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
    "owner",
    "started-at",
    "base-revision",
    "completed-at",
    "source-commit",
    "evidence",
    "verification",
    "blocked-by",
    "reason",
    "decision",
    "fate",
    "source",
    "code",
    "_file",
    "_repo",
  ]);
  const sourceKeys = new Set(["kind", "file", "breakdownHash"]);
  const codeKeys = new Set(["touchpoints"]);
  const evidenceKeys = new Set(["kind", "command", "result", "files"]);
  const verificationKeys = new Set(["checked-by", "result"]);
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
  for (const key of Object.keys(claim?.evidence || {}))
    if (!evidenceKeys.has(key)) err("repo-work-schema", `evidence.${key} é chave desconhecida`);
  for (const key of Object.keys(claim?.verification || {}))
    if (!verificationKeys.has(key))
      err("repo-work-schema", `verification.${key} é chave desconhecida`);
  if (claim?.status && !WORK_STATUSES.includes(claim.status))
    err(
      "repo-work-schema",
      `status "${claim.status}" inválido (aceitos: ${WORK_STATUSES.join(" · ")})`
    );
}

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function requireFields(claim, fields, node, issues, status) {
  const err = (rule, msg) => issues.push({ level: "error", rule, node, msg });
  for (const field of fields) {
    if (!hasText(claim[field])) err("repo-work-lifecycle", `status ${status} exige "${field}"`);
  }
}

function checkLifecycle(claim, node, issues) {
  const err = (rule, msg) => issues.push({ level: "error", rule, node, msg });
  if (claim.status === "active")
    requireFields(claim, ["owner", "started-at", "base-revision"], node, issues, "active");
  if (claim.status === "done") {
    requireFields(
      claim,
      ["owner", "started-at", "base-revision", "completed-at", "source-commit"],
      node,
      issues,
      "done"
    );
    if (!claim.evidence) err("repo-work-lifecycle", "status done exige evidence");
    if (!claim.verification) err("repo-work-lifecycle", "status done exige verification");
    for (const field of ["kind", "command", "result"]) {
      if (!hasText(claim.evidence?.[field]))
        err("repo-work-lifecycle", `status done exige evidence.${field}`);
    }
    if (!Array.isArray(claim.evidence?.files) || claim.evidence.files.length === 0)
      err("repo-work-lifecycle", "status done exige evidence.files com pelo menos um arquivo");
    for (const field of ["checked-by", "result"]) {
      if (!hasText(claim.verification?.[field]))
        err("repo-work-lifecycle", `status done exige verification.${field}`);
    }
  }
  if (claim.status === "blocked") {
    requireFields(claim, ["owner"], node, issues, "blocked");
    if (!hasText(claim["blocked-by"]) && !hasText(claim.reason))
      err("repo-work-lifecycle", "status blocked exige blocked-by ou reason rastreável");
  }
  if (claim.status === "dropped")
    requireFields(claim, ["decision", "fate"], node, issues, "dropped");
}

export function validateRepoWorks(o, options = {}) {
  const issues = [];
  const err = (rule, node, msg) => issues.push({ level: "error", rule, node, msg });
  const expected = deriveExpectedRepoWorks(o);
  const expectedById = new Map(expected.map((claim) => [claim.id, claim]));
  const publishedById = new Map();
  const authorities = new Set((o.authorities || []).map((a) => a.id));

  let published = [];
  try {
    published = options.publishedClaims || loadPublishedRepoWorks();
  } catch (e) {
    err("repo-work-parse", "repo-works", e.message);
    return issues;
  }

  for (const claim of published) {
    if (isStandaloneWork(claim)) continue;
    const node = claim.id || path.relative(SIM_ROOT, claim._file).replaceAll("\\", "/");
    if (publishedById.has(claim.id)) err("repo-work-duplicate", node, "id duplicado");
    publishedById.set(claim.id, claim);
    checkClosedSchema(claim, node, issues);
    checkLifecycle(claim, node, issues);
    if (claim.owner && !authorities.has(claim.owner))
      err("repo-work-authority", node, `owner "${claim.owner}" não resolve em authorities.yml`);
    if (claim.verification?.["checked-by"] && !authorities.has(claim.verification["checked-by"]))
      err(
        "repo-work-authority",
        node,
        `verification.checked-by "${claim.verification["checked-by"]}" não resolve em authorities.yml`
      );

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
    for (const file of claim.evidence?.files || []) {
      const full = path.join(REPOS_DIR, claim.repo || "", file);
      if (!existsSync(full))
        err("repo-work-evidence", node, `evidence.files "${file}" não existe em ${claim.repo}`);
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

  for (const outcome of o.outcomes || []) {
    const intentId = outcome["emitted-by"];
    const intentClaims = expected.filter((claim) => claim.intent === intentId);
    if (intentClaims.length === 0) continue;
    for (const expectedClaim of intentClaims) {
      const published = publishedById.get(expectedClaim.id);
      if (!published) continue;
      if (published.status === "dropped")
        err(
          "outcome-work-dropped",
          outcome.id,
          `outcome de "${intentId}" tenta somar, mas ${expectedClaim.work} foi dropped`
        );
      else if (published.status !== "done")
        err(
          "outcome-work-open",
          outcome.id,
          `outcome de "${intentId}" exige ${expectedClaim.work} done; status atual é "${published.status}"`
        );
    }
  }

  return issues;
}
