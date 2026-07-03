// org-domain.mjs — domínio puro da org simulada v3. Sem filesystem; recebe snapshot carregado por uma porta/adaptador.
import { createHash } from "node:crypto";

// ═════════ SCHEMAS FAIL-CLOSED (bloco I da F5) — chave desconhecida = ERRO ═════════
const APPROACHES = ["validate-first", "direct"];
const SIGNALS = ["none", "touches-contract", "operational-target"];
const PURPOSES = ["create", "sustain", "discover", "operate"];
const LIFECYCLE = ["proposed", "active", "closed", "superseded", "dropped"];
const STANDALONE_KINDS = ["fix", "dep-bump"];
const STANDALONE_STATUSES = ["acknowledged", "active", "blocked", "done", "dropped"];
const INCIDENT_KINDS = ["incident-response"];
const INCIDENT_STATUSES = ["declared", "mitigating", "resolved", "postmortem-complete"];
const INCIDENT_SEVERITIES = ["baixa", "media", "alta", "critica"];
const VERDICTS = ["won", "lost", "inconclusive"];
const VERDICT_NEXT = ["graduation", "cleanup", "parked", "none"];
const AGGREGATIONS = ["sum", "avg", "p99", "last"];
const CONTRACT_DECISIONS = ["single-revision", "sequenced-windows", "split", "rejected", "pending"];
const ROUTING_DECISIONS = ["followed", "overrode"];
const FOLLOWUP_KINDS = ["fix", "proposal"];
const OPERATIONAL_METRICS = ["p99-latency", "incident-count", "cost-to-serve"];
const ACCESS_ACTIONS = ["read-context", "matcher-query"];
const ACCESS_DECISIONS = ["allow", "deny"];
const BREAK_GLASS_MUTATIONS = [
  "target-change",
  "rollup-change",
  "compat-window-change",
  "verdict-override",
  "break-glass",
  "profile-change",
  "metric-definition-change",
  "aggregation-change",
  "business-link-change",
];
const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{8,}\b/,
  /\bghp_[A-Za-z0-9_]{8,}\b/,
  /\bAKIA[0-9A-Z]{12,}\b/,
  /\bCPF[:=]?\s*\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/i,
];

const SCHEMAS = {
  objective: {
    required: ["id", "level", "title", "period", "owner", "status"],
    optional: ["continues-from"],
    enums: { level: ["company"], status: LIFECYCLE },
  },
  area: { required: ["id", "title", "cascades-from", "driver", "owner"], optional: [] },
  team: { required: ["id", "area", "lead"], optional: [] },
  thesis: { required: ["id", "frames", "says", "owner"], optional: [] },
  proposal: {
    required: ["id", "title", "raised-by", "authorized-by", "status"],
    optional: ["target", "note"],
    enums: { status: LIFECYCLE },
  },
  metric: {
    required: ["id", "unit", "source", "aggregation", "owner"],
    optional: [],
    enums: { aggregation: AGGREGATIONS },
  },
  target: {
    required: [
      "id",
      "node",
      "metric",
      "period",
      "expected",
      "definer",
      "attester",
      "contributes-to",
      "status",
    ],
    optional: ["attestation-collapse"],
    enums: { status: LIFECYCLE },
  },
  "attestation-collapse": {
    required: ["reason", "approved-by", "review-at", "visibility"],
    optional: [],
    enums: { visibility: ["dashboard-badge"] },
  },
  repo: { required: ["id", "owner", "caps"], optional: ["note", "modules"] },
  module: { required: ["id", "owner", "caps"], optional: [] },
  contract: {
    required: ["id", "revision", "owner-repo", "consumers"],
    optional: ["compatibility-window", "revision-proposals", "interface"],
  },
  "contract-interface": {
    required: ["kind", "version"],
    optional: ["fields", "events"],
    enums: { kind: ["object", "event-schema"] },
  },
  "contract-revision-proposal": {
    required: ["id", "revision", "breaking", "intents", "consumers", "owner-approval", "decision"],
    optional: ["compatibility-window"],
    enums: { decision: CONTRACT_DECISIONS },
  },
  intent: {
    required: [
      "id",
      "title",
      "team",
      "authorized-by",
      "primary-target",
      "approach",
      "signal",
      "works",
      "next",
    ],
    optional: [
      "thesis",
      "hypothesis",
      "decision-rule",
      "contracts-changed",
      "contracts-consumed",
      "depends-on",
    ],
    enums: { approach: APPROACHES, signal: SIGNALS },
  },
  work: {
    required: ["id", "repo", "purpose", "desc", "review"],
    optional: ["module", "timebox", "blocked-by", "delivery-after"],
    enums: { purpose: PURPOSES },
  },
  next: { required: ["when", "then"], optional: ["gate"] },
  standalone: {
    required: ["id", "kind", "repo", "origin", "source", "placar"],
    optional: [
      "schema",
      "review",
      "routing",
      "_file",
      "_repo",
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
    ],
    enums: { kind: STANDALONE_KINDS, status: STANDALONE_STATUSES },
  },
  incident: {
    required: ["id", "kind", "repo", "origin", "severity", "placar"],
    optional: [
      "status",
      "declared-by",
      "detected-at",
      "telemetry",
      "mttr",
      "postmortem",
      "follow-ups",
    ],
    enums: { kind: INCIDENT_KINDS, status: INCIDENT_STATUSES, severity: INCIDENT_SEVERITIES },
  },
  "incident-telemetry": {
    required: ["source", "event", "observed-at"],
    optional: ["query", "snapshot"],
  },
  routing: {
    required: ["matcher", "query", "selected-repo", "decision", "decided-by", "suggestions"],
    optional: ["reason", "egress", "fallback"],
    enums: { decision: ROUTING_DECISIONS },
  },
  egress: {
    required: ["classification", "allowed"],
    optional: ["provider"],
    enums: { classification: ["public", "internal", "restricted"], allowed: [true, false] },
  },
  "matcher-fallback": {
    required: ["mode", "recorded-by", "reason"],
    optional: [],
    enums: { mode: ["local-index", "manual-triage", "break-glass"] },
  },
  "matcher-suggestion": {
    required: ["repo", "score", "unknown", "evidence"],
    optional: [],
  },
  "follow-up": {
    required: ["ref", "kind", "reason"],
    optional: [],
    enums: { kind: FOLLOWUP_KINDS },
  },
  outcome: {
    required: [
      "id",
      "emitted-by",
      "source",
      "window",
      "metric",
      "value",
      "aggregation",
      "attested-by",
      "revision",
      "contract-revisions",
      "contributes-to",
      "envelope",
    ],
    optional: [],
    enums: { aggregation: AGGREGATIONS },
  },
  verdict: {
    required: [
      "id",
      "intent",
      "outcome",
      "verdict",
      "decided-by",
      "decided-at",
      "decision-rule",
      "evidence",
      "next",
    ],
    optional: ["override", "break-glass-ref", "supersedes", "reason"],
    enums: { verdict: VERDICTS, next: VERDICT_NEXT },
  },
  "profile-declaration": {
    required: ["scope", "profile", "eligibility", "approved-by", "ttl", "review-at"],
    optional: ["badge"],
    enums: { profile: ["full", "compact", "solo"] },
  },
  authority: {
    required: ["id", "kind"],
    optional: ["of", "note"],
    enums: { kind: ["sponsor", "role"] },
  },
  envelope: {
    required: ["actor", "authority", "idempotency-key", "issued-at", "nonce"],
    optional: ["base-revision", "source-commit"],
  },
  "access-request": {
    required: ["id", "actor", "action", "repo", "decision", "reason"],
    optional: ["via"],
    enums: { action: ACCESS_ACTIONS, decision: ACCESS_DECISIONS },
  },
  "authority-revocation": {
    required: ["authority", "revoked-at", "reason"],
    optional: [],
  },
  "secret-quarantine": {
    required: ["hash", "reason", "approved-by"],
    optional: [],
  },
  "break-glass": {
    required: [
      "id",
      "mutation",
      "subject",
      "reason",
      "requested-by",
      "approved-by",
      "issued-at",
      "expires-at",
      "review-at",
      "evidence",
    ],
    optional: [],
    enums: { mutation: BREAK_GLASS_MUTATIONS },
  },
  "oracle-independence": {
    required: ["attack-by", "expected-by", "approved-by"],
    optional: ["corpus"],
  },
};

function checkSchema(type, obj, nodeId, issues) {
  const s = SCHEMAS[type];
  if (!s) return;
  const allowed = new Set([...s.required, ...s.optional]);
  for (const k of Object.keys(obj || {}))
    if (!allowed.has(k))
      issues.push({
        level: "error",
        rule: "schema-unknown-key",
        node: nodeId,
        msg: `chave desconhecida "${k}" em ${type} (typo? schema é FECHADO)`,
      });
  for (const k of s.required)
    if (obj[k] === undefined || obj[k] === null || obj[k] === "")
      issues.push({
        level: "error",
        rule: "schema-required",
        node: nodeId,
        msg: `campo obrigatório "${k}" ausente em ${type}`,
      });
  for (const [k, allowedVals] of Object.entries(s.enums || {}))
    if (obj[k] !== undefined && !allowedVals.includes(obj[k]))
      issues.push({
        level: "error",
        rule: "schema-enum",
        node: nodeId,
        msg: `"${k}: ${obj[k]}" inválido em ${type} (aceitos: ${allowedVals.join(" · ")})`,
      });
}

function checkAllSchemas(o, issues) {
  checkSchema("profile-declaration", o.org["profile-declaration"] || {}, "org", issues);
  for (const x of o.objectives) checkSchema("objective", x, x.id, issues);
  for (const x of o.areas) checkSchema("area", x, x.id, issues);
  for (const x of o.teams) checkSchema("team", x, x.id, issues);
  for (const x of o.theses || []) checkSchema("thesis", x, x.id, issues);
  for (const x of o.proposals || []) checkSchema("proposal", x, x.id, issues);
  for (const x of o.metrics) checkSchema("metric", x, x.id, issues);
  for (const x of o.targets) {
    checkSchema("target", x, x.id, issues);
    if (x["attestation-collapse"])
      checkSchema(
        "attestation-collapse",
        x["attestation-collapse"],
        `${x.id}::attestation-collapse`,
        issues
      );
  }
  for (const x of o.repos) {
    checkSchema("repo", x, x.id, issues);
    for (const m of x.modules || []) checkSchema("module", m, `${x.id}#${m.id}`, issues);
  }
  for (const x of o.contracts) {
    checkSchema("contract", x, x.id, issues);
    if (x.interface) checkSchema("contract-interface", x.interface, `${x.id}::interface`, issues);
    for (const p of x["revision-proposals"] || [])
      checkSchema("contract-revision-proposal", p, `${x.id}::${p.id}`, issues);
  }
  for (const it of o.intents) {
    checkSchema("intent", it, it.id, issues);
    for (const w of it.works || []) checkSchema("work", w, `${it.id}::${w.id}`, issues);
    for (const [k, n] of (it.next || []).entries())
      checkSchema("next", n, `${it.id}::next[${k}]`, issues);
  }
  for (const x of o.standalone) {
    checkSchema("standalone", x, x.id, issues);
    if (x.routing) {
      checkSchema("routing", x.routing, `${x.id}::routing`, issues);
      if (x.routing.egress)
        checkSchema("egress", x.routing.egress, `${x.id}::routing.egress`, issues);
      if (x.routing.fallback)
        checkSchema("matcher-fallback", x.routing.fallback, `${x.id}::routing.fallback`, issues);
      for (const [k, s] of (x.routing.suggestions || []).entries())
        checkSchema("matcher-suggestion", s, `${x.id}::routing.suggestions[${k}]`, issues);
    }
  }
  for (const x of o.incidents || []) {
    checkSchema("incident", x, x.id, issues);
    if (x.telemetry) checkSchema("incident-telemetry", x.telemetry, `${x.id}::telemetry`, issues);
    for (const [k, f] of (x["follow-ups"] || []).entries())
      checkSchema("follow-up", f, `${x.id}::follow-ups[${k}]`, issues);
  }
  for (const x of o.verdicts || []) checkSchema("verdict", x, x.id, issues);
  for (const x of o.authorities || []) checkSchema("authority", x, x.id, issues);
  for (const x of o.outcomes) {
    checkSchema("outcome", x, x.id, issues);
    if (x.envelope) checkSchema("envelope", x.envelope, `${x.id}::envelope`, issues);
  }
  for (const x of o.policy?.["access-requests"] || [])
    checkSchema("access-request", x, x.id, issues);
  for (const x of o.policy?.["authority-revocations"] || [])
    checkSchema("authority-revocation", x, `${x.authority || "revocation"}::revocation`, issues);
  for (const x of o.policy?.["secret-quarantine"] || [])
    checkSchema("secret-quarantine", x, `${x.hash || "secret"}::quarantine`, issues);
  for (const x of o.policy?.["break-glass"] || [])
    checkSchema("break-glass", x, x.id || "break-glass", issues);
  if (o.policy?.["oracle-independence"])
    checkSchema(
      "oracle-independence",
      o.policy["oracle-independence"],
      "oracle-independence",
      issues
    );
}

function secretHash(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

function collectSecretFindings(value, trail = [], findings = []) {
  if (typeof value === "string") {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(value)) {
        findings.push({ path: trail.join("."), value, hash: secretHash(value) });
        break;
      }
    }
    return findings;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectSecretFindings(item, [...trail, String(index)], findings)
    );
    return findings;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (trail.includes("secret-quarantine")) continue;
      collectSecretFindings(item, [...trail, key], findings);
    }
  }
  return findings;
}

export function deriveIntent(it, o) {
  const works = it.works || [];
  const repos = new Set(works.map((w) => w.repo));
  const target = (o.targets || []).find((t) => t.id === it["primary-target"]);
  const metric = target ? (o.metrics || []).find((m) => m.id === target.metric) : null;
  const hasDecisionEvidence = Boolean(it.hypothesis || it["decision-rule"]);
  const observedApproach = hasDecisionEvidence ? "validate-first" : "direct";
  let observedSignal = "none";
  if ((it["contracts-changed"] || []).length > 0) observedSignal = "touches-contract";
  else if (
    works.length > 0 &&
    works.every((w) => ["sustain", "operate"].includes(w.purpose)) &&
    metric &&
    OPERATIONAL_METRICS.includes(metric.id)
  )
    observedSignal = "operational-target";

  const multiRepo = repos.size > 1;
  let observedForm = "repo-work";
  let collapse = "collapsed";
  if (observedApproach === "validate-first") {
    observedForm = "experiment-run";
    collapse = "unit";
  } else if (observedSignal === "touches-contract" && multiRepo) {
    observedForm = "migration-wave";
    collapse = "unit";
  } else if (observedSignal === "none" && multiRepo) {
    observedForm = "delivery-slice";
    collapse = "unit";
  } else if (observedSignal === "operational-target") {
    observedForm = "operational-sustain";
  } else if (observedSignal === "touches-contract") {
    observedForm = "contract-sustain";
  }
  return {
    observedApproach,
    observedSignal,
    observedForm,
    collapse,
    repoCount: repos.size,
    reason:
      collapse === "unit"
        ? "multi-repo, validate-first ou contrato acorda coordination unit"
        : "scaling-law colapsa em repo-work/standalone",
  };
}

// ═════════ VALIDAÇÃO SEMÂNTICA (refs · SoD · regra de ouro · sinais · deps · review EXATO) ═════════
export function validateOrg(o) {
  const issues = [];
  const err = (rule, node, msg) => issues.push({ level: "error", rule, node, msg });
  const warn = (rule, node, msg) => issues.push({ level: "warn", rule, node, msg });

  checkAllSchemas(o, issues);

  const ids = {
    obj: new Set(o.objectives.map((x) => x.id)),
    area: new Set(o.areas.map((x) => x.id)),
    team: new Set(o.teams.map((x) => x.id)),
    repo: new Set(o.repos.map((x) => x.id)),
    metric: new Set(o.metrics.map((x) => x.id)),
    target: new Set(o.targets.map((x) => x.id)),
    contract: new Set(o.contracts.map((x) => x.id)),
    thesis: new Set((o.theses || []).map((x) => x.id)),
    proposal: new Set((o.proposals || []).map((x) => x.id)),
    intent: new Set(o.intents.map((x) => x.id)),
    standalone: new Set(o.standalone.map((x) => x.id)),
    incident: new Set((o.incidents || []).map((x) => x.id)),
    outcome: new Set((o.outcomes || []).map((x) => x.id)),
    verdict: new Set((o.verdicts || []).map((x) => x.id)),
  };
  const repoById = Object.fromEntries(o.repos.map((r) => [r.id, r]));
  const teamById = Object.fromEntries(o.teams.map((t) => [t.id, t]));
  const targetById = Object.fromEntries(o.targets.map((t) => [t.id, t]));
  const metricById = Object.fromEntries(o.metrics.map((m) => [m.id, m]));
  const intentById = Object.fromEntries(o.intents.map((i) => [i.id, i]));
  const proposalById = Object.fromEntries((o.proposals || []).map((p) => [p.id, p]));
  const outcomeById = Object.fromEntries((o.outcomes || []).map((out) => [out.id, out]));
  const authById = Object.fromEntries((o.authorities || []).map((a) => [a.id, a]));
  const resolveGlobalRef = (ref, node, field) => {
    const [kind, id, ...rest] = String(ref || "").split(":");
    if (!kind || !id || rest.length)
      return err(
        "refs",
        node,
        `${field} "${ref}" deve usar GlobalRef simples kind:id (standalone|proposal|intent|incident)`
      );
    const registry = {
      standalone: ids.standalone,
      proposal: ids.proposal,
      intent: ids.intent,
      incident: ids.incident,
    };
    if (!registry[kind])
      return err("refs", node, `${field} "${ref}" usa kind não suportado "${kind}"`);
    if (!registry[kind].has(id)) return err("refs", node, `${field} "${ref}" não resolve`);
  };
  const resolvePolicySubjectRef = (ref, node, field) => {
    const [kind, id, ...rest] = String(ref || "").split(":");
    if (!kind || !id || rest.length)
      return err("refs", node, `${field} "${ref}" deve usar GlobalRef simples kind:id`);
    const registry = {
      objective: ids.obj,
      target: ids.target,
      metric: ids.metric,
      contract: ids.contract,
      intent: ids.intent,
      proposal: ids.proposal,
      incident: ids.incident,
      standalone: ids.standalone,
      repo: ids.repo,
      team: ids.team,
      verdict: ids.verdict,
      outcome: ids.outcome,
    };
    if (!registry[kind])
      return err("refs", node, `${field} "${ref}" usa kind não suportado "${kind}"`);
    if (!registry[kind].has(id)) return err("refs", node, `${field} "${ref}" não resolve`);
  };

  // refs básicas
  for (const a of o.areas)
    for (const parent of [].concat(a["cascades-from"] || []))
      if (!ids.obj.has(parent))
        err("refs", a.id, `cascades-from "${parent}" não existe em objectives`);
  for (const t of o.teams)
    if (!ids.area.has(t.area)) err("refs", t.id, `area "${t.area}" não existe`);
  for (const r of o.repos) {
    if (!ids.team.has(r.owner) && !ids.area.has(r.owner))
      err("refs", r.id, `owner "${r.owner}" não é time nem área`);
    const modIds = new Set();
    for (const m of r.modules || []) {
      if (modIds.has(m.id)) err("refs", `${r.id}#${m.id}`, "id de módulo duplicado no repo");
      modIds.add(m.id);
      if (!ids.team.has(m.owner) && !ids.area.has(m.owner))
        err("refs", `${r.id}#${m.id}`, `owner do módulo "${m.owner}" não é time nem área`);
    }
  }
  for (const c of o.contracts) {
    if (!ids.repo.has(c["owner-repo"]))
      err("refs", c.id, `owner-repo "${c["owner-repo"]}" não existe`);
    for (const cons of c.consumers || [])
      if (!ids.repo.has(cons)) err("refs", c.id, `consumer "${cons}" não existe`);
    const proposalIds = new Set();
    const ownerRepo = repoById[c["owner-repo"]];
    for (const p of c["revision-proposals"] || []) {
      if (proposalIds.has(p.id))
        err("contract-proposal", `${c.id}::${p.id}`, "revision-proposal duplicada no contrato");
      proposalIds.add(p.id);
      if (!Array.isArray(p.intents) || p.intents.length === 0)
        err("contract-proposal", `${c.id}::${p.id}`, "revision-proposal sem intents afetadas");
      for (const iid of p.intents || []) {
        const it = intentById[iid];
        if (!it) err("refs", `${c.id}::${p.id}`, `intent "${iid}" não existe`);
        else if (!(it["contracts-changed"] || []).includes(c.id))
          err(
            "contract-proposal",
            `${c.id}::${p.id}`,
            `intent "${iid}" está na proposal mas não muda o contrato "${c.id}"`
          );
      }
      for (const cons of p.consumers || [])
        if (!ids.repo.has(cons)) err("refs", `${c.id}::${p.id}`, `consumer "${cons}" não existe`);
      if (p.breaking === true) {
        const missing = (c.consumers || []).filter((cons) => !(p.consumers || []).includes(cons));
        if (missing.length)
          err(
            "contract-proposal-consumers",
            `${c.id}::${p.id}`,
            `proposal breaking não cobre consumer(s) atuais: ${missing.join(", ")}`
          );
      }
      const approver = authById[p["owner-approval"]];
      if (!approver)
        err(
          "refs-authority",
          `${c.id}::${p.id}`,
          `owner-approval "${p["owner-approval"]}" não resolve no registry`
        );
      else if (ownerRepo && approver.of !== ownerRepo.owner)
        err(
          "contract-owner-approval",
          `${c.id}::${p.id}`,
          `owner-approval "${p["owner-approval"]}" pertence a "${approver.of}", mas o owner do contrato é "${ownerRepo.owner}"`
        );
    }
  }
  for (const th of o.theses || [])
    if (!ids.obj.has(th.frames))
      err("refs", th.id, `frames "${th.frames}" não existe em objectives`);
  for (const p of o.proposals || []) {
    resolveGlobalRef(p["raised-by"], p.id, "raised-by");
    if (!ids.obj.has(p["authorized-by"]))
      err("refs", p.id, `authorized-by "${p["authorized-by"]}" não existe em objectives`);
    if (p.target && !ids.target.has(p.target)) err("refs", p.id, `target "${p.target}" não existe`);
  }

  // bloco K — AUTORIDADES resolvem no registry: owner/lead/definer/approver não são texto
  const resolveAuth = (id, node, field) => {
    if (id && !authById[id])
      err("refs-authority", node, `${field} "${id}" não resolve no registry de autoridades`);
  };
  for (const x of o.objectives) resolveAuth(x.owner, x.id, "owner");
  for (const x of o.areas) resolveAuth(x.owner, x.id, "owner");
  for (const x of o.theses || []) resolveAuth(x.owner, x.id, "owner");
  for (const x of o.teams) resolveAuth(x.lead, x.id, "lead");
  for (const t of o.targets) {
    resolveAuth(t.definer, t.id, "definer");
    if (t["attestation-collapse"])
      resolveAuth(
        t["attestation-collapse"]["approved-by"],
        t.id,
        "attestation-collapse.approved-by"
      );
  }
  // o approver do PERFIL deve estar FORA do escopo operacional (sponsor) — F5/K
  const pd = o.org["profile-declaration"] || {};
  if (pd["approved-by"]) {
    const approver = authById[pd["approved-by"]];
    if (!approver) {
      if (ids.team.has(pd["approved-by"]) || ids.area.has(pd["approved-by"]))
        err(
          "profile-approver",
          "org",
          `approved-by "${pd["approved-by"]}" é time/área DENTRO do escopo — o perfil exige approver EXTERNO (sponsor)`
        );
      else
        err("refs-authority", "org", `approved-by "${pd["approved-by"]}" não resolve no registry`);
    } else if (approver.kind !== "sponsor")
      err(
        "profile-approver",
        "org",
        `approved-by "${pd["approved-by"]}" (${approver.kind}${approver.of ? " de " + approver.of : ""}) está DENTRO do escopo — o perfil da org inteira exige sponsor`
      );
  }

  // L9 proporcional — consultas internas também têm fronteira: não basta bloquear egress externo.
  const roleCanAccessRepo = (authorityId, repoId) => {
    const authority = authById[authorityId];
    const repo = repoById[repoId];
    if (!authority || !repo) return false;
    if (authority.kind === "sponsor") return true;
    if (authority.of === repo.owner) return true;
    const ownerTeam = teamById[repo.owner];
    if (ids.area.has(authority.of) && ownerTeam?.area === authority.of) return true;
    return false;
  };
  for (const req of o.policy?.["access-requests"] || []) {
    resolveAuth(req.actor, req.id, "actor");
    if (!ids.repo.has(req.repo)) err("query-acl", req.id, `repo "${req.repo}" não existe`);
    const allowed = roleCanAccessRepo(req.actor, req.repo);
    if (req.decision === "allow" && !allowed)
      err(
        "query-acl",
        req.id,
        `actor "${req.actor}" não tem autoridade para ${req.action} em "${req.repo}" — host local não pode virar confused deputy`
      );
    if (req.decision === "deny" && allowed)
      warn(
        "query-acl",
        req.id,
        `actor "${req.actor}" teria acesso derivado a "${req.repo}", mas a request foi negada — verifique se é política temporária`
      );
  }

  for (const rev of o.policy?.["authority-revocations"] || []) {
    resolveAuth(rev.authority, `${rev.authority || "revocation"}::revocation`, "authority");
  }

  const oracle = o.policy?.["oracle-independence"];
  if (oracle) {
    const actors = [oracle["attack-by"], oracle["expected-by"], oracle["approved-by"]];
    if (new Set(actors).size !== actors.length)
      err(
        "oracle-independence",
        "oracle-independence",
        "attack-by, expected-by e approved-by precisam ser autores distintos"
      );
  }

  const quarantinedSecrets = new Set((o.policy?.["secret-quarantine"] || []).map((x) => x.hash));
  for (const q of o.policy?.["secret-quarantine"] || [])
    resolveAuth(q["approved-by"], q.hash, "approved-by");
  const breakGlassIds = new Set();
  for (const bg of o.policy?.["break-glass"] || []) {
    if (breakGlassIds.has(bg.id)) err("break-glass", bg.id, "break-glass id duplicado");
    breakGlassIds.add(bg.id);
    resolvePolicySubjectRef(bg.subject, bg.id, "subject");
    resolveAuth(bg["requested-by"], bg.id, "requested-by");
    resolveAuth(bg["approved-by"], bg.id, "approved-by");
    if (bg["requested-by"] && bg["approved-by"] && bg["requested-by"] === bg["approved-by"])
      err(
        "break-glass-sod",
        bg.id,
        "requested-by e approved-by precisam ser autoridades distintas no perfil full"
      );
    const approver = authById[bg["approved-by"]];
    if (approver && approver.kind !== "sponsor")
      err(
        "break-glass-authority",
        bg.id,
        `break-glass aprovado por "${bg["approved-by"]}" (${approver.kind}); perfil full exige sponsor`
      );
    if (bg["issued-at"] && bg["expires-at"] && String(bg["issued-at"]) >= String(bg["expires-at"]))
      err("break-glass-window", bg.id, "expires-at precisa ser posterior a issued-at");
    if (bg["issued-at"] && bg["review-at"] && String(bg["issued-at"]) > String(bg["review-at"]))
      err("break-glass-window", bg.id, "review-at precisa ser em ou após issued-at");
    if (!Array.isArray(bg.evidence) || bg.evidence.length === 0)
      err("break-glass-evidence", bg.id, "break-glass exige evidence não-vazio");
  }
  for (const finding of collectSecretFindings(o, ["org"])) {
    if (!quarantinedSecrets.has(finding.hash))
      err(
        "secret-quarantine",
        finding.path || "org",
        `possível segredo/identificador sensível detectado (hash ${finding.hash}) sem quarantine aprovada`
      );
  }

  // targets: refs + SoD da medição + attester×fonte + independência de FATO (F9)
  for (const t of o.targets) {
    if (!ids.team.has(t.node) && !ids.obj.has(t.node))
      err("refs", t.id, `node "${t.node}" não é time nem objective`);
    if (!ids.metric.has(t.metric)) err("refs", t.id, `metric "${t.metric}" não existe`);
    if (!ids.obj.has(t["contributes-to"]))
      err("refs", t.id, `contributes-to "${t["contributes-to"]}" não existe`);
    if (t.definer && t.attester && t.definer === t.attester)
      err(
        "sod-target",
        t.id,
        "quem DEFINE o target não pode ser o único a ATESTAR (SoD da medição)"
      );
    const m = metricById[t.metric];
    if (m && t.attester && t.attester !== m.source)
      warn("attester-source", t.id, `attester "${t.attester}" ≠ source da métrica ("${m.source}")`);
    const attRepo = repoById[t.attester];
    const selfAttested = attRepo && attRepo.owner === t.node;
    const collapse = t["attestation-collapse"];
    if (selfAttested && !collapse)
      err(
        "self-attested-target",
        t.id,
        `a fonte que atesta (${t.attester}) é do PRÓPRIO time medido (${t.node}) — dispensa exige attestation-collapse LOGADO`
      );
    if (selfAttested && collapse)
      warn(
        "self-attested-target",
        t.id,
        `independência colapsada de fato (${t.attester} é do próprio ${t.node}) — ACEITA com colapso logado por ${collapse["approved-by"]}; dashboard deve marcar ${collapse.visibility}`
      );
    if (!selfAttested && collapse)
      err(
        "attestation-collapse",
        t.id,
        "attestation-collapse declarado, mas a fonte que atesta não colapsa com o time medido"
      );
    if (collapse) {
      const approver = authById[collapse["approved-by"]];
      if (approver && approver.kind !== "sponsor")
        err(
          "attestation-collapse",
          t.id,
          `attestation-collapse aprovado por "${collapse["approved-by"]}" (${approver.kind}); colapso de independência em perfil full exige sponsor`
        );
    }
  }

  // métrica órfã
  const usedMetrics = new Set(o.targets.map((t) => t.metric));
  for (const m of o.metrics)
    if (!usedMetrics.has(m.id))
      warn("metric-orphan", m.id, "métrica sem nenhum target — flutua no grafo (decorativa)");

  // intents
  for (const it of o.intents) {
    if (!ids.team.has(it.team)) err("refs", it.id, `team "${it.team}" não existe`);
    if (!ids.obj.has(it["authorized-by"]))
      err(
        "refs",
        it.id,
        `authorized-by "${it["authorized-by"]}" não existe (ou declare standalone)`
      );
    if (!ids.target.has(it["primary-target"]))
      err("refs", it.id, `primary-target "${it["primary-target"]}" não existe`);
    const pt = targetById[it["primary-target"]];
    if (pt && pt["contributes-to"] !== it["authorized-by"])
      err(
        "primary-target-coherence",
        it.id,
        `o primary-target contribui p/ "${pt["contributes-to"]}", mas a intent é autorizada por "${it["authorized-by"]}" (F2 da P11)`
      );
    if (it.thesis) {
      if (!ids.thesis.has(it.thesis)) err("refs", it.id, `thesis "${it.thesis}" não existe`);
      else {
        const th = (o.theses || []).find((x) => x.id === it.thesis);
        if (th && th.frames !== it["authorized-by"])
          warn(
            "thesis-coherence",
            it.id,
            `a tese "${it.thesis}" enquadra "${th.frames}", mas a intent é autorizada por "${it["authorized-by"]}"`
          );
      }
    }
    if (it.approach === "validate-first" && (!it.hypothesis || !it["decision-rule"]))
      err(
        "golden-rule",
        it.id,
        "validate-first EXIGE hypothesis + decision-rule (senão é cerimônia)"
      );
    const derived = deriveIntent(it, o);
    if (it.approach !== derived.observedApproach)
      warn(
        "approach-drift",
        it.id,
        `approach declarado "${it.approach}" diverge do observado "${derived.observedApproach}" (hypothesis/decision-rule)`
      );
    const changed = it["contracts-changed"] || [];
    const consumed = it["contracts-consumed"] || [];
    for (const c of [...changed, ...consumed])
      if (!ids.contract.has(c)) err("refs", it.id, `contrato "${c}" não existe`);
    for (const dep of it["depends-on"] || []) {
      if (dep === it.id) err("deps-cross-intent", it.id, "intent depende de si mesma");
      else if (!ids.intent.has(dep))
        err("deps-cross-intent", it.id, `intent dependency "${dep}" não existe`);
    }
    if (changed.length > 0 && it.signal !== "touches-contract")
      err("signal-contract", it.id, "muda contrato mas o sinal não é touches-contract");
    if (it.signal === "touches-contract" && changed.length === 0)
      err("signal-contract", it.id, "sinal touches-contract sem nenhum contracts-changed");
    if (it.signal !== derived.observedSignal)
      warn(
        "signal-drift",
        it.id,
        `signal declarado "${it.signal}" diverge do observado "${derived.observedSignal}" (${derived.observedForm})`
      );

    // peças
    const works = it.works || [];
    if (works.length === 0) warn("works", it.id, "intent sem peças (breakdown pendente?)");
    const wIds = new Set(works.map((w) => w.id));
    for (const w of works) {
      const wid = `${it.id}::${w.id}`;
      if (!ids.repo.has(w.repo)) err("refs", wid, `repo "${w.repo}" não existe`);
      if (w.purpose === "discover" && !w.timebox)
        warn("discover-timebox", wid, "peça discover sem timebox (regra da exploration)");
      for (const dep of [...(w["blocked-by"] || []), ...(w["delivery-after"] || [])]) {
        if (dep === w.id) err("deps", wid, "peça depende de si mesma");
        else if (!wIds.has(dep)) err("deps", wid, `dependência "${dep}" não existe nesta intent`);
      }
      const ownerRepo = repoById[w.repo];
      if (ownerRepo) {
        // monolito: dono é o do nó MAIS ESPECÍFICO — módulo se declarado, senão o repo (custodião)
        let owner = ownerRepo.owner;
        if (w.module) {
          const mod = (ownerRepo.modules || []).find((m) => m.id === w.module);
          if (!mod) err("refs", wid, `módulo "${w.module}" não existe em ${w.repo}`);
          else owner = mod.owner;
        } else if ((ownerRepo.modules || []).length) {
          warn(
            "monolith-module",
            wid,
            `${w.repo} tem donos por MÓDULO — declare o módulo da peça (senão o review cai no custodião)`
          );
        }
        // review pela autoridade EXATA (bloco I): prefixo não basta
        const expected = owner === it.team ? "interno" : `externo: ${owner}`;
        const declared = String(w.review || "");
        if (expected !== "interno" && declared !== expected)
          err(
            "review-derivation",
            wid,
            `review declarado "${declared}" ≠ derivado "${expected}" (dono do ${w.module ? "módulo" : "repo"} — a autoridade é EXATA, não prefixo)`
          );
        if (expected === "interno" && declared !== "interno")
          warn(
            "review-derivation",
            wid,
            `review "${declared}" declarado onde o derivado é "interno"`
          );
      }
    }
    // ciclo nas deps (união dos 2 tipos)
    const adj = Object.fromEntries(
      works.map((w) => [w.id, [...(w["blocked-by"] || []), ...(w["delivery-after"] || [])]])
    );
    const state = {};
    const dfs = (n) => {
      if (state[n] === 1) return true;
      if (state[n] === 2) return false;
      state[n] = 1;
      for (const d of adj[n] || []) if (dfs(d)) return true;
      state[n] = 2;
      return false;
    };
    for (const w of works)
      if (dfs(w.id)) {
        err("deps-cycle", `${it.id}::${w.id}`, "ciclo de dependências entre as peças");
        break;
      }
  }

  // bloco L — coordenação: contrato com múltiplas intents precisa decision explícita, e
  // dependências cross-intent formam um grafo acíclico.
  const changedByContract = new Map();
  for (const it of o.intents) {
    for (const cid of it["contracts-changed"] || []) {
      const arr = changedByContract.get(cid) || [];
      arr.push(it.id);
      changedByContract.set(cid, arr);
    }
  }
  for (const [cid, changingIntents] of changedByContract.entries()) {
    if (changingIntents.length <= 1) continue;
    const c = o.contracts.find((x) => x.id === cid);
    const proposals = (c?.["revision-proposals"] || []).filter((p) =>
      changingIntents.every((iid) => (p.intents || []).includes(iid))
    );
    if (proposals.length === 0)
      err(
        "contract-contention",
        cid,
        `múltiplas intents mudam o contrato (${changingIntents.join(", ")}) sem revision-proposal cobrindo todas`
      );
    else if (proposals.every((p) => p.decision === "pending"))
      err(
        "contract-contention",
        cid,
        `múltiplas intents mudam o contrato (${changingIntents.join(", ")}) mas a decision da revision-proposal ainda é pending`
      );
  }
  const intentDeps = Object.fromEntries(o.intents.map((it) => [it.id, it["depends-on"] || []]));
  const intentState = {};
  const visitIntent = (id) => {
    if (intentState[id] === 1) return true;
    if (intentState[id] === 2) return false;
    intentState[id] = 1;
    for (const dep of intentDeps[id] || []) if (intentById[dep] && visitIntent(dep)) return true;
    intentState[id] = 2;
    return false;
  };
  for (const it of o.intents)
    if (visitIntent(it.id)) {
      err("deps-cycle", it.id, "ciclo de dependências entre intents");
      break;
    }

  // standalone
  for (const s of o.standalone) {
    if (!ids.repo.has(s.repo)) err("refs", s.id, `repo "${s.repo}" não existe`);
    if (s._repo && s._repo !== s.repo)
      err(
        "standalone-location",
        s.id,
        `standalone repo-scoped mora em "${s._repo}", mas declara repo "${s.repo}"`
      );
    if (s.source?.kind !== "standalone")
      err("standalone-source", s.id, `source.kind "${s.source?.kind}" não é standalone`);
    if (s.routing) {
      if (!ids.repo.has(s.routing["selected-repo"]))
        err("matcher-routing", s.id, `selected-repo "${s.routing["selected-repo"]}" não existe`);
      if (s.routing["selected-repo"] && s.routing["selected-repo"] !== s.repo)
        err(
          "matcher-routing",
          s.id,
          `selected-repo "${s.routing["selected-repo"]}" diverge do repo executado "${s.repo}"`
        );
      if (!authById[s.routing["decided-by"]])
        err(
          "refs-authority",
          s.id,
          `routing.decided-by "${s.routing["decided-by"]}" não resolve no registry`
        );
      if (s.routing.egress?.allowed === false && String(s.routing.matcher).includes("external")) {
        if (!s.routing.fallback)
          err(
            "matcher-fallback",
            s.id,
            "matcher externo bloqueado por egress exige fallback rastreável (local-index/manual-triage/break-glass)"
          );
        else if (!authById[s.routing.fallback["recorded-by"]])
          err(
            "refs-authority",
            s.id,
            `routing.fallback.recorded-by "${s.routing.fallback["recorded-by"]}" não resolve no registry`
          );
      }
      const suggestions = s.routing.suggestions || [];
      if (!Array.isArray(suggestions) || suggestions.length === 0)
        err("matcher-routing", s.id, "routing sem suggestions — matcher sem evidência");
      for (const [idx, sug] of suggestions.entries()) {
        if (!ids.repo.has(sug.repo))
          err("matcher-routing", s.id, `suggestion[${idx}].repo "${sug.repo}" não existe`);
        if (sug.unknown !== true && (!Array.isArray(sug.evidence) || sug.evidence.length === 0))
          err(
            "matcher-evidence",
            s.id,
            `suggestion[${idx}] para "${sug.repo}" tem unknown=false sem evidence`
          );
      }
      const top = suggestions[0] || {};
      if (s.routing.decision === "followed") {
        if (top.repo !== s.routing["selected-repo"])
          err(
            "matcher-routing",
            s.id,
            `decision=followed mas selected-repo "${s.routing["selected-repo"]}" não é a primeira sugestão`
          );
        if (top.unknown === true)
          err("matcher-routing", s.id, "decision=followed em sugestão marcada unknown");
      }
      if (s.routing.decision === "overrode" && !s.routing.reason)
        err("matcher-routing", s.id, "decision=overrode exige reason logado");
    }
  }

  // incidents — instrumento de resposta central; follow-ups executáveis ficam em repos/proposals.
  for (const incident of o.incidents || []) {
    if (!ids.repo.has(incident.repo))
      err("refs", incident.id, `repo "${incident.repo}" não existe`);
    if (incident["declared-by"]) resolveAuth(incident["declared-by"], incident.id, "declared-by");
    if (["declared", "mitigating"].includes(incident.status)) {
      for (const field of ["declared-by", "detected-at", "telemetry"])
        if (!incident[field])
          err("incident-lifecycle", incident.id, `status ${incident.status} exige ${field}`);
    }
    if (incident.telemetry?.source && !ids.repo.has(incident.telemetry.source))
      err(
        "incident-telemetry",
        incident.id,
        `telemetry.source "${incident.telemetry.source}" não é repo publicado`
      );
    if (["resolved", "postmortem-complete"].includes(incident.status)) {
      for (const field of ["mttr", "postmortem"])
        if (!incident[field])
          err("incident-lifecycle", incident.id, `status ${incident.status} exige ${field}`);
    }
    if (!incident.status && (!incident.mttr || !incident.postmortem))
      err(
        "incident-lifecycle",
        incident.id,
        "incidente sem status explícito precisa ter mttr + postmortem para representar legado resolvido"
      );
    for (const f of incident["follow-ups"] || []) {
      resolveGlobalRef(f.ref, incident.id, "follow-up.ref");
      if (f.kind === "proposal" && !String(f.ref).startsWith("proposal:"))
        err("follow-up-ref", incident.id, `follow-up kind=proposal aponta para "${f.ref}"`);
      if (f.kind === "proposal" && String(f.ref).startsWith("proposal:")) {
        const pid = String(f.ref).slice("proposal:".length);
        const p = proposalById[pid];
        if (p && p["raised-by"] !== `incident:${incident.id}`)
          err(
            "follow-up-ref",
            incident.id,
            `proposal "${pid}" raised-by="${p["raised-by"]}" não volta para incident:${incident.id}`
          );
      }
      if (f.kind === "fix" && !String(f.ref).startsWith("standalone:"))
        err("follow-up-ref", incident.id, `follow-up kind=fix aponta para "${f.ref}"`);
    }
  }

  // outcomes — resolver (bloco J entra aqui)
  resolveOutcomes(
    o,
    { ids, targetById, metricById, intentById, repoById, authById },
    { err, warn }
  );
  validateVerdicts(o, { ids, intentById, outcomeById, breakGlassIds, authById }, { issues, err });

  return issues;
}

function validateVerdicts(o, ix, { issues, err }) {
  const verdictIds = new Set();
  const latestByIntent = new Map();
  for (const verdict of o.verdicts || []) {
    if (verdictIds.has(verdict.id)) err("verdict", verdict.id, "verdict id duplicado");
    verdictIds.add(verdict.id);
    if (verdict.intent && !ix.ids.intent.has(verdict.intent))
      err("refs", verdict.id, `intent "${verdict.intent}" não existe`);
    if (verdict.outcome && !ix.ids.outcome.has(verdict.outcome))
      err("refs", verdict.id, `outcome "${verdict.outcome}" não existe`);
    const intent = ix.intentById[verdict.intent];
    const outcome = ix.outcomeById[verdict.outcome];
    if (intent && !(intent.next || []).some((next) => next.gate === "accept-verdict"))
      err(
        "verdict-gate",
        verdict.id,
        `intent "${intent.id}" não declara gate accept-verdict no próximo passo`
      );
    if (intent && outcome && outcome["emitted-by"] !== intent.id)
      err(
        "verdict-outcome",
        verdict.id,
        `outcome "${outcome.id}" emitted-by="${outcome["emitted-by"]}" não pertence à intent "${intent.id}"`
      );
    const outcomeErrors = issues.filter(
      (issue) => issue.level === "error" && issue.node === verdict.outcome
    );
    if (outcome && outcomeErrors.length)
      err(
        "verdict-outcome",
        verdict.id,
        `outcome "${outcome.id}" tem erro(s) e não pode sustentar verdict`
      );
    if (verdict["decided-by"] && !ix.authById[verdict["decided-by"]])
      err(
        "refs-authority",
        verdict.id,
        `decided-by "${verdict["decided-by"]}" não resolve no registry`
      );
    if (!Array.isArray(verdict.evidence) || verdict.evidence.length === 0)
      err("verdict-evidence", verdict.id, "verdict exige evidence não-vazio");
    if (verdict.override === true) {
      if (!verdict["break-glass-ref"])
        err("verdict-override", verdict.id, "override exige break-glass-ref");
      else if (!ix.breakGlassIds.has(verdict["break-glass-ref"]))
        err(
          "verdict-override",
          verdict.id,
          `break-glass-ref "${verdict["break-glass-ref"]}" não resolve`
        );
    }
    if (verdict.supersedes && !verdictIds.has(verdict.supersedes))
      err("verdict-supersedes", verdict.id, `supersedes "${verdict.supersedes}" não resolve`);
    const previous = latestByIntent.get(verdict.intent);
    if (previous && !verdict.supersedes)
      err(
        "verdict-duplicate",
        verdict.id,
        `intent "${verdict.intent}" já tem verdict "${previous}" — novo verdict precisa supersedes`
      );
    latestByIntent.set(verdict.intent, verdict.id);
  }
}

// ═════════ RESOLVER DE OUTCOMES (bloco J da F5) — FAIL-CLOSED p/ somar, VISÍVEL p/ exibir ═════════
// O único insumo do target.actual é um outcome que passe AQUI. Texto bem-formado não é evidência.
function resolveOutcomes(o, ix, { err, warn }) {
  const seenIdempotency = new Map();
  const seenNonce = new Map();
  const revokedAtByAuthority = new Map(
    (o.policy?.["authority-revocations"] || []).map((r) => [r.authority, r["revoked-at"]])
  );
  for (const out of o.outcomes) {
    // refs resolvem
    if (!ix.ids.metric.has(out.metric)) err("refs", out.id, `metric "${out.metric}" não existe`);
    if (!ix.ids.target.has(out["contributes-to"]))
      err("refs", out.id, `contributes-to "${out["contributes-to"]}" não existe`);
    const intentEmitter = ix.intentById[out["emitted-by"]] || null;
    const standaloneEmitter = o.standalone.find((s) => s.id === out["emitted-by"]) || null;
    const emitter = intentEmitter || standaloneEmitter;
    if (!emitter)
      err("refs", out.id, `emitted-by "${out["emitted-by"]}" não é intent nem standalone`);
    if (standaloneEmitter) {
      if (standaloneEmitter.status !== "done")
        err(
          "standalone-outcome",
          out.id,
          `standalone "${standaloneEmitter.id}" precisa estar done antes de emitir outcome`
        );
      if (!standaloneEmitter.evidence || !standaloneEmitter.verification)
        err(
          "standalone-outcome",
          out.id,
          `standalone "${standaloneEmitter.id}" precisa de evidence + verification antes de emitir outcome`
        );
    }

    // janela fechada e válida
    const w = out.window || {};
    if (!w.start || !w.end || String(w.start) >= String(w.end))
      err("window-invalid", out.id, `window inválida (start "${w.start}" · end "${w.end}")`);

    const m = ix.metricById[out.metric];
    if (m) {
      // agregação DEVE bater com a metric-definition
      if (out.aggregation !== m.aggregation)
        err(
          "aggregation-mismatch",
          out.id,
          `aggregation "${out.aggregation}" ≠ da metric-definition ("${m.aggregation}")`
        );
      // unidade do value deve aparecer no value (coerência fraca — warn)
      if (m.unit && !String(out.value).includes(m.unit))
        warn("unit-mismatch", out.id, `value "${out.value}" não aparenta a unidade "${m.unit}"`);
      // fonte: o attester deveria ser a source da métrica
      if (out["attested-by"] !== m.source)
        warn(
          "attester-source",
          out.id,
          `attested-by "${out["attested-by"]}" ≠ source da métrica ("${m.source}")`
        );
    }

    const t = ix.targetById[out["contributes-to"]];
    if (t) {
      // target FROZEN não recebe actual (F9 da P11)
      if (t.status !== "active")
        err(
          "target-frozen",
          out.id,
          `target "${t.id}" está "${t.status}" — não recebe actual novo (vai ao continuador ou fica unassigned VISÍVEL)`
        );
      // independência REAL do attester (cadeia de ownership) — no perfil full, self-attested NÃO soma
      const attRepo = ix.repoById[out["attested-by"]];
      const attOwner = attRepo ? attRepo.owner : null;
      const collapse = t["attestation-collapse"];
      if (out["attested-by"] === t.definer)
        err(
          "self-attested",
          out.id,
          `attester "${out["attested-by"]}" também define o target — self-attested NÃO soma no perfil full`
        );
      if (attOwner && attOwner === t.node && !collapse)
        err(
          "self-attested",
          out.id,
          `attester "${out["attested-by"]}" (owner: ${attOwner}) colapsa com o time medido — self-attested sem attestation-collapse NÃO soma no perfil full`
        );
      if (attOwner && attOwner === t.node && collapse)
        warn(
          "self-attested",
          out.id,
          `attester "${out["attested-by"]}" (owner: ${attOwner}) colapsa com o time medido — outcome entra apenas como self-attested VISÍVEL (${collapse.visibility})`
        );
    }

    // rollup: o outcome soma no primary-target da intent emissora (F2) — desvio exige decision
    if (emitter && ix.intentById[out["emitted-by"]]) {
      const it = ix.intentById[out["emitted-by"]];
      if (it["primary-target"] && out["contributes-to"] !== it["primary-target"])
        err(
          "rollup-coherence",
          out.id,
          `outcome soma em "${out["contributes-to"]}" mas o primary-target da intent é "${it["primary-target"]}" (desvio exige decision explícita)`
        );
      // contratos: os MUDADOS pela intent DEVEM estar citados com revisão (derivado, não autodeclarado)
      for (const c of it["contracts-changed"] || []) {
        const cited = (out["contract-revisions"] || []).some((cr) =>
          String(cr).startsWith(c + "@")
        );
        if (!cited)
          err(
            "blocked-contract",
            out.id,
            `a intent muda o contrato "${c}" mas o outcome não cita "${c}@<revision>" — BLOCKED (dependência verificável)`
          );
      }
    }
    // toda contract-revision citada deve referir contrato existente
    for (const cr of out["contract-revisions"] || []) {
      const cid = String(cr).split("@")[0];
      if (!ix.ids.contract.has(cid))
        err("refs", out.id, `contract-revision "${cr}" refere contrato inexistente`);
    }

    // envelope L8 mínimo (conteúdo; a RESOLUÇÃO da authority entra no bloco K)
    const env = out.envelope || {};
    for (const f of ["actor", "authority", "idempotency-key", "issued-at", "nonce"])
      if (!env[f])
        err("envelope", out.id, `envelope sem "${f}" — actual-publish é mutação PERIGOSA`);
    if (env.authority && !ix.authById[env.authority])
      err(
        "refs-authority",
        out.id,
        `envelope.authority "${env.authority}" não resolve no registry (bloco K)`
      );
    if (env.authority && env["issued-at"] && revokedAtByAuthority.has(env.authority)) {
      const revokedAt = revokedAtByAuthority.get(env.authority);
      if (String(env["issued-at"]) >= String(revokedAt))
        err(
          "authority-revoked",
          out.id,
          `authority "${env.authority}" foi revogada em ${revokedAt}; envelope emitido em ${env["issued-at"]}`
        );
    }
    if (env["idempotency-key"]) {
      const previous = seenIdempotency.get(env["idempotency-key"]);
      if (previous)
        err(
          "envelope-replay",
          out.id,
          `idempotency-key reutilizada por "${previous}" — replay/duplicata`
        );
      seenIdempotency.set(env["idempotency-key"], out.id);
    }
    if (env.nonce) {
      const previous = seenNonce.get(env.nonce);
      if (previous)
        err("envelope-replay", out.id, `nonce reutilizado por "${previous}" — replay/duplicata`);
      seenNonce.set(env.nonce, out.id);
    }
  }
}
