// org.mjs — loader + validador da org file-first. Estrutura: SCHEMAS (fail-closed) →
// load → checagem de schema → checagem semântica → resolver. Barra do red-team:
// regra sem executor é cerimônia; texto bem-formado NÃO é evidência.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ACME = path.join(here, "..", "acme");
const load = (p) => parse(readFileSync(path.join(ACME, p), "utf8"));

export function loadOrg() {
  return {
    org: load("org.yml"),
    objectives: load("business/objectives.yml").objectives,
    areas: load("business/areas.yml").areas,
    teams: load("business/teams.yml").teams,
    theses: load("business/theses.yml").theses,
    metrics: load("business/metrics.yml").metrics,
    targets: load("business/targets.yml").targets,
    repos: load("repos/repos.yml").repos,
    contracts: load("contracts/contracts.yml").contracts,
    intents: readdirSync(path.join(ACME, "intents"))
      .filter((f) => f.endsWith(".yml"))
      .map((f) => load("intents/" + f)),
    standalone: load("standalone/standalone.yml").standalone,
    outcomes: load("outcomes/outcomes.yml").outcomes || [],
  };
}

// ═════════ SCHEMAS FAIL-CLOSED (bloco I da F5) — chave desconhecida = ERRO ═════════
const APPROACHES = ["validate-first", "direct"];
const SIGNALS = ["none", "touches-contract", "operational-target"];
const PURPOSES = ["create", "sustain", "discover", "operate"];
const LIFECYCLE = ["proposed", "active", "closed", "superseded", "dropped"];
const STANDALONE_KINDS = ["fix", "dep-bump", "incident-response"];
const AGGREGATIONS = ["sum", "avg", "p99", "last"];

const SCHEMAS = {
  objective: {
    required: ["id", "level", "title", "period", "owner", "status"],
    optional: ["continues-from"],
    enums: { level: ["company"], status: LIFECYCLE },
  },
  area: { required: ["id", "title", "cascades-from", "driver", "owner"], optional: [] },
  team: { required: ["id", "area", "lead"], optional: [] },
  thesis: { required: ["id", "frames", "says", "owner"], optional: [] },
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
    optional: [],
    enums: { status: LIFECYCLE },
  },
  repo: { required: ["id", "owner", "caps"], optional: ["note", "modules"] },
  module: { required: ["id", "owner", "caps"], optional: [] },
  contract: {
    required: ["id", "revision", "owner-repo", "consumers"],
    optional: ["compatibility-window"],
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
    optional: ["thesis", "hypothesis", "decision-rule", "contracts-changed", "contracts-consumed"],
    enums: { approach: APPROACHES, signal: SIGNALS },
  },
  work: {
    required: ["id", "repo", "purpose", "desc", "review"],
    optional: ["module", "timebox", "blocked-by", "delivery-after"],
    enums: { purpose: PURPOSES },
  },
  next: { required: ["when", "then"], optional: ["gate"] },
  standalone: {
    required: ["id", "kind", "repo", "origin", "placar"],
    optional: ["review", "routed-by", "severity", "mttr", "postmortem", "follow-ups"],
    enums: { kind: STANDALONE_KINDS },
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
  "profile-declaration": {
    required: ["scope", "profile", "eligibility", "approved-by", "ttl", "review-at"],
    optional: ["badge"],
    enums: { profile: ["full", "compact", "solo"] },
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
  for (const x of o.metrics) checkSchema("metric", x, x.id, issues);
  for (const x of o.targets) checkSchema("target", x, x.id, issues);
  for (const x of o.repos) {
    checkSchema("repo", x, x.id, issues);
    for (const m of x.modules || []) checkSchema("module", m, `${x.id}#${m.id}`, issues);
  }
  for (const x of o.contracts) checkSchema("contract", x, x.id, issues);
  for (const it of o.intents) {
    checkSchema("intent", it, it.id, issues);
    for (const w of it.works || []) checkSchema("work", w, `${it.id}::${w.id}`, issues);
    for (const [k, n] of (it.next || []).entries())
      checkSchema("next", n, `${it.id}::next[${k}]`, issues);
  }
  for (const x of o.standalone) checkSchema("standalone", x, x.id, issues);
  for (const x of o.outcomes) checkSchema("outcome", x, x.id, issues);
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
    intent: new Set(o.intents.map((x) => x.id)),
    standalone: new Set(o.standalone.map((x) => x.id)),
  };
  const repoById = Object.fromEntries(o.repos.map((r) => [r.id, r]));
  const targetById = Object.fromEntries(o.targets.map((t) => [t.id, t]));
  const metricById = Object.fromEntries(o.metrics.map((m) => [m.id, m]));
  const intentById = Object.fromEntries(o.intents.map((i) => [i.id, i]));

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
  }
  for (const th of o.theses || [])
    if (!ids.obj.has(th.frames))
      err("refs", th.id, `frames "${th.frames}" não existe em objectives`);

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
    if (attRepo && attRepo.owner === t.node)
      warn(
        "self-attested-target",
        t.id,
        `a fonte que atesta (${t.attester}) é do PRÓPRIO time medido (${t.node}) — independência colapsada de fato (F9); dispensa exige colapso LOGADO`
      );
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
    const changed = it["contracts-changed"] || [];
    const consumed = it["contracts-consumed"] || [];
    for (const c of [...changed, ...consumed])
      if (!ids.contract.has(c)) err("refs", it.id, `contrato "${c}" não existe`);
    if (changed.length > 0 && it.signal !== "touches-contract")
      err("signal-contract", it.id, "muda contrato mas o sinal não é touches-contract");
    if (it.signal === "touches-contract" && changed.length === 0)
      err("signal-contract", it.id, "sinal touches-contract sem nenhum contracts-changed");

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

  // standalone
  for (const s of o.standalone) {
    if (!ids.repo.has(s.repo)) err("refs", s.id, `repo "${s.repo}" não existe`);
    if (s.kind === "incident-response" && !s.severity)
      err(
        "incident-evidence",
        s.id,
        "incident-response sem severity (a declaração exige telemetria)"
      );
  }

  // outcomes — resolver (bloco J entra aqui)
  resolveOutcomes(o, { ids, targetById, metricById, intentById, repoById }, { err, warn });

  return issues;
}

// ═════════ RESOLVER DE OUTCOMES (bloco J — preenchido a seguir) ═════════
function resolveOutcomes(o, ix, { err, warn }) {
  for (const out of o.outcomes) {
    if (!ix.ids.metric.has(out.metric)) err("refs", out.id, `metric "${out.metric}" não existe`);
    if (!ix.ids.target.has(out["contributes-to"]))
      err("refs", out.id, `contributes-to "${out["contributes-to"]}" não existe`);
  }
}
