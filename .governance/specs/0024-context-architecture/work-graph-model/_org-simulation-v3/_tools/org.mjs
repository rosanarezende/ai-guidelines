// org.mjs — carrega a org file-first (acme/) e VALIDA contra as regras do modelo (P10/P11/P12).
// O validador é o primeiro mecanismo executável da barra do red-team: regra sem executor é cerimônia.
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

const APPROACHES = ["validate-first", "direct"];
const SIGNALS = ["none", "touches-contract", "operational-target"];
const PURPOSES = ["create", "sustain", "discover", "operate"];

export function validateOrg(o) {
  const issues = [];
  const err = (rule, node, msg) => issues.push({ level: "error", rule, node, msg });
  const warn = (rule, node, msg) => issues.push({ level: "warn", rule, node, msg });

  const ids = {
    obj: new Set(o.objectives.map((x) => x.id)),
    area: new Set(o.areas.map((x) => x.id)),
    team: new Set(o.teams.map((x) => x.id)),
    repo: new Set(o.repos.map((x) => x.id)),
    metric: new Set(o.metrics.map((x) => x.id)),
    target: new Set(o.targets.map((x) => x.id)),
    contract: new Set(o.contracts.map((x) => x.id)),
    thesis: new Set((o.theses || []).map((x) => x.id)),
  };
  const repoById = Object.fromEntries(o.repos.map((r) => [r.id, r]));
  const targetById = Object.fromEntries(o.targets.map((t) => [t.id, t]));
  const metricById = Object.fromEntries(o.metrics.map((m) => [m.id, m]));

  // R1 — toda referência RESOLVE (a lei da dependência verificável, na prática)
  for (const a of o.areas)
    for (const parent of [].concat(a["cascades-from"] || []))
      if (!ids.obj.has(parent))
        err("refs", a.id, `cascades-from "${parent}" não existe em objectives`);
  for (const t of o.teams)
    if (!ids.area.has(t.area)) err("refs", t.id, `area "${t.area}" não existe`);
  for (const r of o.repos)
    if (!ids.team.has(r.owner) && !ids.area.has(r.owner))
      err("refs", r.id, `owner "${r.owner}" não é time nem área`);
  for (const c of o.contracts) {
    if (!ids.repo.has(c["owner-repo"]))
      err("refs", c.id, `owner-repo "${c["owner-repo"]}" não existe`);
    for (const cons of c.consumers || [])
      if (!ids.repo.has(cons)) err("refs", c.id, `consumer "${cons}" não existe`);
  }

  // R1b — teses (P9): a hipótese causal enquadra um objetivo que existe
  for (const th of o.theses || [])
    if (!ids.obj.has(th.frames))
      err("refs", th.id, `frames "${th.frames}" não existe em objectives`);

  // R2 — targets: refs + SoD da medição (definer ≠ attester) + attester coerente com a fonte da métrica
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
  }

  // R2b — métrica órfã (achado da owner no grafo): metric sem nenhum target é decorativa
  const usedMetrics = new Set(o.targets.map((t) => t.metric));
  for (const m of o.metrics)
    if (!usedMetrics.has(m.id))
      warn("metric-orphan", m.id, "métrica sem nenhum target — flutua no grafo (decorativa)");

  // R3 — intents: refs · abordagem · regra de ouro · sinal × contrato · primary-target coerente
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
    if (!APPROACHES.includes(it.approach))
      err("approach", it.id, `approach "${it.approach}" inválida (validate-first · direct)`);
    if (it.approach === "validate-first" && (!it.hypothesis || !it["decision-rule"]))
      err(
        "golden-rule",
        it.id,
        "validate-first EXIGE hypothesis + decision-rule (senão é cerimônia)"
      );
    if (!SIGNALS.includes(it.signal)) err("signal", it.id, `signal "${it.signal}" inválido`);
    const changed = it["contracts-changed"] || [];
    const consumed = it["contracts-consumed"] || [];
    for (const c of [...changed, ...consumed])
      if (!ids.contract.has(c)) err("refs", it.id, `contrato "${c}" não existe`);
    if (changed.length > 0 && it.signal !== "touches-contract")
      err("signal-contract", it.id, "muda contrato mas o sinal não é touches-contract");
    if (it.signal === "touches-contract" && changed.length === 0)
      err("signal-contract", it.id, "sinal touches-contract sem nenhum contracts-changed");

    // R4 — peças: refs · propósito · deps (2 tipos, sem ciclo) · review DERIVADO
    const works = it.works || [];
    if (works.length === 0) warn("works", it.id, "intent sem peças (breakdown pendente?)");
    const wIds = new Set(works.map((w) => w.id));
    for (const w of works) {
      const wid = `${it.id}::${w.id}`;
      if (!ids.repo.has(w.repo)) err("refs", wid, `repo "${w.repo}" não existe`);
      if (!PURPOSES.includes(w.purpose)) err("purpose", wid, `purpose "${w.purpose}" inválido`);
      if (w.purpose === "discover" && !w.timebox)
        warn("discover-timebox", wid, "peça discover sem timebox (regra da exploration)");
      for (const dep of [...(w["blocked-by"] || []), ...(w["delivery-after"] || [])]) {
        if (dep === w.id) err("deps", wid, "peça depende de si mesma");
        else if (!wIds.has(dep)) err("deps", wid, `dependência "${dep}" não existe nesta intent`);
      }
      const ownerRepo = repoById[w.repo];
      if (ownerRepo) {
        const expected = ownerRepo.owner === it.team ? "interno" : `externo: ${ownerRepo.owner}`;
        const declared = String(w.review || "");
        if (expected.startsWith("externo") && !declared.startsWith("externo"))
          err("review-derivation", wid, `review deveria ser "${expected}" (repo de outro dono)`);
        if (expected === "interno" && declared.startsWith("externo"))
          warn("review-derivation", wid, "review externo declarado onde o derivado é interno");
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

  // R5 — standalone: refs + incidente exige severidade (telemetria verificável)
  for (const s of o.standalone) {
    if (!ids.repo.has(s.repo)) err("refs", s.id, `repo "${s.repo}" não existe`);
    if (!s.placar) warn("placar", s.id, "standalone sem placar — nada pode sumir do dashboard");
    if (s.kind === "incident-response" && !s.severity)
      err(
        "incident-evidence",
        s.id,
        "incident-response sem severity (a declaração exige telemetria)"
      );
  }

  // R6 — declaração de perfil (F5 da P11): nunca autoatribuição livre
  const pd = o.org["profile-declaration"] || {};
  for (const f of ["scope", "profile", "eligibility", "approved-by", "ttl", "review-at"])
    if (!pd[f]) err("profile-declaration", "org", `profile-declaration sem o campo "${f}"`);

  // R7 — outcomes (quando publicarem): refs + SoD do attester (começo do resolver)
  for (const out of o.outcomes) {
    if (!ids.metric.has(out.metric)) err("refs", out.id, `metric "${out.metric}" não existe`);
    if (!ids.target.has(out["contributes-to"]))
      err("refs", out.id, `contributes-to "${out["contributes-to"]}" não existe`);
    const t = targetById[out["contributes-to"]];
    if (t && out["attested-by"] === t.definer)
      warn(
        "self-attested",
        out.id,
        "attester = definer do target → marcado self-attested (não soma no full)"
      );
    if (!out.aggregation)
      err("aggregation", out.id, "outcome sem aggregation não entra no dashboard");
  }

  return issues;
}
