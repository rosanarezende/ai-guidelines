// build-graph.mjs — projeta a org file-first num GRAFO tipado + issues do validador,
// e escreve _apps/graph.js (window.GRAPH) p/ os apps (file:// não deixa fetch — mesmo truque do _map).
// Uso: node _tools/build-graph.mjs
// F14 (revisão F5): sem timestamp — a versão é HASH do conteúdo (rodar sem mudança não suja o repo).
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";
import { parse } from "yaml";
import { deriveIntent, loadOrg, validateOrg } from "./org.mjs";
import { loadPublishedRepoContracts, validateRepoContracts } from "./repo-contracts.mjs";
import { loadPublishedContexts, validateRepoContexts } from "./repo-contexts.mjs";
import { loadPublishedRepoWorks, validateRepoWorks } from "./repo-works.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const APPS = path.join(here, "..", "_apps");
const MODEL = path.join(here, "..", "..", "model.yml");

const o = loadOrg();
const repoContextIssues = await validateRepoContexts(o);
const repoWorkIssues = validateRepoWorks(o);
const repoContractIssues = validateRepoContracts(o);
const issues = [...validateOrg(o), ...repoContextIssues, ...repoWorkIssues, ...repoContractIssues];
const repoContexts = loadPublishedContexts();
const repoWorks = loadPublishedRepoWorks();
const repoContracts = loadPublishedRepoContracts();
const repoWorkAcks = repoWorks.filter(
  (x) => x.schema === "acme.repo-work/v1" || x.source?.kind === "central-breakdown"
);

const nodes = [];
const edges = [];
const nodeIds = new Set();
const N = (id, type, label, data = {}) => {
  if (nodeIds.has(id)) return;
  nodeIds.add(id);
  nodes.push({ id, type, label, data });
};
const E = (source, target, type) =>
  edges.push({ id: `${type}:${source}->${target}`, source, target, type });

for (const x of o.objectives) N(x.id, "objective", x.title, x);
for (const x of o.areas) {
  N(x.id, "area", x.title, x);
  for (const parent of [].concat(x["cascades-from"] || [])) E(parent, x.id, "cascades-to");
}
for (const x of o.theses || []) {
  N(x.id, "thesis", x.says, x);
  E(x.frames, x.id, "framed-by");
}
for (const x of o.proposals || []) {
  N(x.id, "proposal", x.title, x);
  E(x["authorized-by"], x.id, "authorizes");
  if (x.target) E(x.id, x.target, "proposes-for");
  const [kind, id] = String(x["raised-by"] || "").split(":");
  if (kind && id) E(id, x.id, "raises");
}
for (const x of o.authorities || []) {
  N(x.id, "authority", x.id, x);
  if (x.of) E(x.id, x.of, "belongs-to");
}
for (const x of o.teams) {
  N(x.id, "team", x.id, x);
  E(x.area, x.id, "has-team");
}
for (const x of o.repos) {
  N(x.id, "repo", x.id, x);
  E(x.owner, x.id, "owns");
  for (const m of x.modules || []) {
    const mid = `${x.id}#${m.id}`;
    N(mid, "module", m.id, { ...m, repo: x.id });
    E(x.id, mid, "has-module");
    E(m.owner, mid, "owns");
  }
}
for (const x of repoContexts) {
  const cid = `${x.repo}::context`;
  N(cid, "repo-context", `${x.repo} context`, x);
  E(x.repo, cid, "publishes-context");
}
for (const x of repoWorkAcks) {
  const wid = `${x.id}::repo-ack`;
  N(wid, "repo-work-ack", `${x.repo}/${x.work}`, x);
  E(x.repo, wid, "publishes-work");
  E(wid, `${x.intent}::${x.work}`, "acknowledges-work");
  for (const touchpoint of x.code?.touchpoints || []) {
    const tid = `${x.repo}::${touchpoint}`;
    N(tid, "code-touchpoint", touchpoint, { repo: x.repo, path: touchpoint });
    E(wid, tid, "evidenced-by");
    E(x.repo, tid, "contains-code");
  }
}
for (const x of repoContracts) {
  const cid = `${x.ownerRepo}::contract::${x.id}`;
  N(cid, "repo-contract", `${x.id}@${x.revision}`, x);
  E(x.ownerRepo, cid, "publishes-contract-registry");
  E(cid, x.id, "backs-contract");
  for (const touchpoint of x.code?.touchpoints || []) {
    const tid = `${x.ownerRepo}::${touchpoint}`;
    N(tid, "code-touchpoint", touchpoint, { repo: x.ownerRepo, path: touchpoint });
    E(cid, tid, "evidenced-by");
    E(x.ownerRepo, tid, "contains-code");
  }
}
for (const x of o.contracts) {
  N(x.id, "contract", `${x.id}@${x.revision}`, x);
  E(x["owner-repo"], x.id, "publishes");
  for (const c of x.consumers || []) E(x.id, c, "consumed-by");
  for (const p of x["revision-proposals"] || []) {
    const pid = `${x.id}::${p.id}`;
    N(pid, "contract-revision-proposal", `${x.id}@${p.revision}`, { ...p, contract: x.id });
    E(x.id, pid, "has-revision-proposal");
    E(p["owner-approval"], pid, "approves");
    for (const iid of p.intents || []) E(iid, pid, "coordinates");
    for (const c of p.consumers || []) E(pid, c, "affects-consumer");
  }
}
for (const x of o.metrics) N(x.id, "metric", x.id, x);
for (const x of o.targets) {
  N(x.id, "target", x.expected, x);
  E(x.node, x.id, "has-target");
  E(x.id, x.metric, "uses-metric");
  E(x.id, x["contributes-to"], "contributes-to");
  E(x.definer, x.id, "defines");
  if (x.attester) E(x.id, x.attester, "attested-by");
  if (x["attestation-collapse"])
    E(x["attestation-collapse"]["approved-by"], x.id, "approves-collapse");
}
for (const x of o.outcomes) {
  N(x.id, "outcome", `${x.metric}: ${x.value}`, x);
  E(x["emitted-by"], x.id, "emits");
  E(x.id, x["contributes-to"], "contributes-to");
  E(x.id, x.metric, "measures");
  E(x.id, x["attested-by"], "attested-by");
  if (x.envelope?.authority) E(x.envelope.authority, x.id, "authorizes-mutation");
}
for (const x of o.policy?.["access-requests"] || []) {
  N(x.id, "access-request", `${x.action}: ${x.repo}`, x);
  E(x.actor, x.id, "requests");
  E(x.id, x.repo, x.decision === "allow" ? "allowed-read" : "denied-read");
}
for (const it of o.intents) {
  N(it.id, "intent", it.title, { ...it, derived: deriveIntent(it, o) });
  E(it["authorized-by"], it.id, "authorizes");
  E(it.team, it.id, "runs");
  if (it["primary-target"]) E(it.id, it["primary-target"], "primary-target");
  if (it.thesis) E(it.thesis, it.id, "informs");
  for (const c of it["contracts-changed"] || []) E(it.id, c, "changes");
  for (const c of it["contracts-consumed"] || []) E(it.id, c, "consumes");
  for (const dep of it["depends-on"] || []) E(it.id, dep, "depends-on");
  for (const w of it.works || []) {
    const wid = `${it.id}::${w.id}`;
    N(wid, "work", w.id, { ...w, intent: it.id });
    E(it.id, wid, "piece");
    E(wid, w.repo, "in-repo");
    if (w.module) E(wid, `${w.repo}#${w.module}`, "in-module");
    for (const d of w["blocked-by"] || []) E(wid, `${it.id}::${d}`, "blocked-by");
    for (const d of w["delivery-after"] || []) E(wid, `${it.id}::${d}`, "delivery-after");
  }
}
for (const s of o.standalone) {
  N(s.id, "standalone", `${s.kind}: ${s.id}`, s);
  E(s.id, s.repo, "in-repo");
  if (s.origin) {
    const [kind, id] = String(s.origin || "").split(":");
    if (kind && id) E(id, s.id, "raises");
  }
}
for (const x of o.incidents || []) {
  N(x.id, "incident", `${x.severity}: ${x.id}`, x);
  E(x.repo, x.id, "handles-incident");
  for (const f of x["follow-ups"] || []) {
    const [kind, id] = String(f.ref || "").split(":");
    if (kind && id) E(x.id, id, "raises");
  }
}

// perfis de governança (snapshot do model.yml) — p/ o app das empresas
const model = parse(readFileSync(MODEL, "utf8"));
const profiles = model["governance-profiles"] || null;

const body = { company: o.org.company, nodes, edges, issues, profiles };
const contentHash = createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 12);

const GRAPH = {
  contentHash,
  company: o.org.company,
  profileDeclaration: o.org["profile-declaration"],
  nodes,
  edges,
  issues,
  profiles,
};

mkdirSync(APPS, { recursive: true });
const graphSource =
  "// graph.js — GERADO por _tools/build-graph.mjs a partir de acme-governance/ + repos/ + model.yml — NÃO editar à mão.\n" +
  "window.GRAPH = " +
  JSON.stringify(GRAPH, null, 2) +
  ";\n";
const graphPath = path.join(APPS, "graph.js");
const prettierOptions = (await prettier.resolveConfig(graphPath)) || {};
writeFileSync(
  graphPath,
  await prettier.format(graphSource, { ...prettierOptions, parser: "babel" })
);
console.log(
  `✓ graph.js gerado — ${nodes.length} nós · ${edges.length} arestas · ${issues.length} issue(s) do validador`
);
