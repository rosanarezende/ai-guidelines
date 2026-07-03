// graph-read-model.mjs — projecao derivada da runtime v3; sem escrita em disco.
import { deriveIntent } from "../domain/org-domain.mjs";

const GLOBAL_REF_KINDS = [
  "authority",
  "contract",
  "incident",
  "intent",
  "metric",
  "objective",
  "proposal",
  "repo",
  "standalone",
  "target",
  "team",
  "thesis",
];

function findGlobalRef(value) {
  const pattern = new RegExp(`\\b(${GLOBAL_REF_KINDS.join("|")}):([A-Za-z0-9_.#-]+)\\b`);
  const match = String(value || "").match(pattern);
  return match ? { kind: match[1], id: match[2] } : null;
}

export function buildGraphReadModel({
  org,
  issues = [],
  profiles = null,
  repoContexts = [],
  repoWorks = [],
  repoContracts = [],
}) {
  const nodes = [];
  const edges = [];
  const nodeIds = new Set();
  const edgeIds = new Set();
  const N = (id, type, label, data = {}) => {
    if (nodeIds.has(id)) return;
    nodeIds.add(id);
    nodes.push({ id, type, label, data });
  };
  const E = (source, target, type) => {
    const id = `${type}:${source}->${target}`;
    if (edgeIds.has(id)) return;
    edgeIds.add(id);
    edges.push({ id, source, target, type });
  };

  const repoWorkAcks = repoWorks.filter(
    (x) => x.schema === "acme.repo-work/v1" || x.source?.kind === "central-breakdown"
  );

  for (const x of org.objectives) N(x.id, "objective", x.title, x);
  for (const x of org.areas) {
    N(x.id, "area", x.title, x);
    for (const parent of [].concat(x["cascades-from"] || [])) E(parent, x.id, "cascades-to");
  }
  for (const x of org.theses || []) {
    N(x.id, "thesis", x.says, x);
    E(x.frames, x.id, "framed-by");
  }
  for (const x of org.proposals || []) {
    N(x.id, "proposal", x.title, x);
    E(x["authorized-by"], x.id, "authorizes");
    if (x.target) E(x.id, x.target, "proposes-for");
    const raisedBy = findGlobalRef(x["raised-by"]);
    if (raisedBy) E(raisedBy.id, x.id, "raises");
  }
  for (const x of org.authorities || []) {
    N(x.id, "authority", x.id, x);
    if (x.of) E(x.id, x.of, "belongs-to");
  }
  for (const x of org.teams) {
    N(x.id, "team", x.id, x);
    E(x.area, x.id, "has-team");
  }
  for (const x of org.repos) {
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
  for (const x of org.contracts) {
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
  for (const x of org.metrics) N(x.id, "metric", x.id, x);
  for (const x of org.targets) {
    N(x.id, "target", x.expected, x);
    E(x.node, x.id, "has-target");
    E(x.id, x.metric, "uses-metric");
    E(x.id, x["contributes-to"], "contributes-to");
    E(x.definer, x.id, "defines");
    if (x.attester) E(x.id, x.attester, "attested-by");
    if (x["attestation-collapse"])
      E(x["attestation-collapse"]["approved-by"], x.id, "approves-collapse");
  }
  for (const x of org.outcomes) {
    N(x.id, "outcome", `${x.metric}: ${x.value}`, x);
    E(x["emitted-by"], x.id, "emits");
    E(x.id, x["contributes-to"], "contributes-to");
    E(x.id, x.metric, "measures");
    E(x.id, x["attested-by"], "attested-by");
    if (x.envelope?.authority) E(x.envelope.authority, x.id, "authorizes-mutation");
  }
  for (const x of org.policy?.["access-requests"] || []) {
    N(x.id, "access-request", `${x.action}: ${x.repo}`, x);
    E(x.actor, x.id, "requests");
    E(x.id, x.repo, x.decision === "allow" ? "allowed-read" : "denied-read");
  }
  for (const it of org.intents) {
    N(it.id, "intent", it.title, { ...it, derived: deriveIntent(it, org) });
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
  for (const s of org.standalone) {
    N(s.id, "standalone", `${s.kind}: ${s.id}`, s);
    E(s.id, s.repo, "in-repo");
    if (s.origin) {
      const originRef = findGlobalRef(s.origin);
      if (originRef) {
        E(originRef.id, s.id, "raises");
      } else {
        const originId = `origin:${s.id}`;
        N(originId, "origin", s.origin, { text: s.origin, target: s.id });
        E(originId, s.id, "raises");
      }
    }
  }
  for (const x of org.incidents || []) {
    N(x.id, "incident", `${x.severity}: ${x.id}`, x);
    E(x.repo, x.id, "handles-incident");
    for (const f of x["follow-ups"] || []) {
      const followUpRef = findGlobalRef(f.ref);
      if (followUpRef) E(x.id, followUpRef.id, "raises");
    }
  }

  return {
    company: org.org.company,
    profileDeclaration: org.org["profile-declaration"],
    nodes,
    edges,
    issues,
    profiles,
  };
}
