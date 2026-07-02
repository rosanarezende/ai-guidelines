// generate.mjs — gera data.js a partir de ../model.yml (fecha o loop SSOT → artefato).
//   node generate.mjs          → reescreve data.js
//   node generate.mjs --check  → sai 1 se data.js divergir do model.yml (sem escrever)
// A comparação do --check é SEMÂNTICA (avalia o JS), então o prettier pode reformatar data.js à vontade.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parse } from "yaml";

const here = path.dirname(fileURLToPath(import.meta.url));
const MODEL_YML = path.join(here, "..", "model.yml");
const DATA_JS = path.join(here, "data.js");

const m = parse(readFileSync(MODEL_YML, "utf8"));

// ── projeções ────────────────────────────────────────────────────────────────
const toWorks = (list = []) => list.map((w) => ({ r: w.repo, p: w.purpose, d: w.desc }));

const layers = [
  {
    id: "intent",
    ax: m.layers.intent.is,
    vals: [
      ...m.layers.intent.approach.map((t) => ({ t, p: "approach" })),
      ...m.layers.intent.signal.map((t) => ({ t, p: "signal" })),
    ],
  },
  {
    id: "execution-unit",
    ax: `${m.layers["execution-unit"].is} · ${m.layers["execution-unit"].optional}`,
    vals: Object.keys(m.layers["execution-unit"].kinds).map((t) => ({ t })),
  },
  {
    id: "repo-work",
    ax: m.layers["repo-work"].is,
    vals: Object.keys(m.layers["repo-work"].purpose).map((t) => ({ t, p: t })),
  },
];

const examples = (m.examples || []).map((ex) => {
  if (ex.contract && typeof ex.contract === "object") {
    const c = ex.contract;
    return {
      id: ex.id,
      label: ex.label,
      contractCard: {
        id: c.id,
        sub: `owner: ${c.owner} · consumers: ${c.consumers} · compatibility-window: ${c["compatibility-window"]}`,
        unit: { kind: "migrations", title: "as iniciativas que dependem dele" },
        works: (ex.migrations || []).map((g) => ({
          r: `intent · ${g.intent}`,
          p: [g.approach, g.signal].filter(Boolean).join(" + "),
          d: g.does,
        })),
        note: ex.note,
      },
    };
  }
  const u = ex["execution-unit"];
  const out = {
    id: ex.id,
    label: ex.label,
    intent: ex.intent ?? null,
    unit: u ? { kind: u.kind, title: u.title, owns: u.owns } : null,
    works: toWorks(ex["repo-works"]),
    note: ex.note,
  };
  if (typeof ex.contract === "string") out.contract = ex.contract;
  if (ex.fork) out.fork = `${ex.fork.kind} — ${ex.fork.desc}`;
  return out;
});

// fases sem acento no SSOT → label com acento no mapa; agrupa fases consecutivas com o mesmo "quem"
const PHASE_LABEL = {
  investigacao: "investigação",
  ativacao: "ativação",
  execucao: "execução",
  coordenacao: "coordenação",
};
const phaseLabel = (p) => PHASE_LABEL[p] || p;

const sim = m.simulation.orgs.map((o) => {
  const rows = [];
  for (const [phase, who] of Object.entries(o.participation)) {
    const last = rows[rows.length - 1];
    if (last && last.who === who) last.phases.push(phase);
    else rows.push({ phases: [phase], who });
  }
  const out = {
    label: o.label,
    sod: o.sod,
    participation: rows.map((r) => ({
      phase:
        r.phases.length > 1
          ? `${phaseLabel(r.phases[0])} → ${phaseLabel(r.phases[r.phases.length - 1])}`
          : phaseLabel(r.phases[0]),
      who: r.who,
    })),
    gaps: o.gaps,
  };
  if (o["degenerate-mode"]) out.degenerate = o["degenerate-mode"];
  return out;
});

const finding = m.simulation.finding["mechanized-by"]
  ? `${m.simulation.finding.says} Mecanizada por: ${m.simulation.finding["mechanized-by"]}.`
  : m.simulation.finding.says;

const bex = m["business-tier"].example;
const graph = {
  objective: bex.objective,
  thesis: bex.thesis,
  opportunities: bex.opportunities,
  intent: bex.intent,
  unit: bex.unit,
  works: toWorks(bex.works),
  outcome: bex.outcome,
  measurement: bex.measurement,
  rollup: bex.rollup,
};

const scalingLaw = `${m["scaling-law"].says} (aplica-se a: ${m["scaling-law"]["applies-to"].join(" · ")} — executada por governance-profiles)`;

const gp = m["governance-profiles"];
const profiles = {
  law: gp.law,
  items: Object.entries(gp.profiles).map(([id, p]) => ({
    id,
    for: p.for,
    nodes: p.nodes,
    gates: Array.isArray(p.gates) ? p.gates.join(" · ") : p.gates,
    sod: p.sod,
    required: p["required-fields"],
    enforcement: p.enforcement,
  })),
};

const decisionPoints = Object.keys(m["decision-points"]).join(" · ");

// approach × signal aplicado → alimenta o flow-explorer.html
const ap = m["approach-model"];
const flowExplorer = ap
  ? {
      status: ap.status,
      provocation: ap.provocation,
      approach: ap.approach,
      signals: ap.signals,
      reviewRule: ap["review-rule"],
      depsRule: ap["deps-rule"],
      exampleOrg: ap["example-org"],
      derivation: ap.derivation,
      consequences: ap.consequences,
      noApproach: ap["no-approach-paths"],
      renames: ap.renames,
    }
  : null;

const MODEL = {
  layers,
  examples,
  sim,
  finding,
  graph,
  scalingLaw,
  profiles,
  decisionPoints,
  flowExplorer,
};

// ── cobertura (F12) — o gerador DECLARA o que projeta e imprime o que omite a cada run.
// "em sinc" no --check vale só p/ o SUBCONJUNTO projetado; mudança em seção omitida não altera o _map.
const PROJECTED_KEYS = new Set([
  "meta", // não-visual
  "layers",
  "examples",
  "simulation",
  "business-tier", // só o .example é projetado
  "scaling-law",
  "governance-profiles",
  "decision-points", // só os nomes
  "approach-model", // → flow-explorer.html
]);
const omitted = Object.keys(m).filter((k) => !PROJECTED_KEYS.has(k));
console.log(`ℹ coverage — NÃO projetadas no mapa: ${omitted.join(", ")}`);

// ── emissão / verificação ────────────────────────────────────────────────────
const banner =
  "// data.js — GERADO por generate.mjs a partir de ../model.yml — NÃO editar à mão.\n" +
  "// Regenerar: node generate.mjs · Verificar sync: node generate.mjs --check\n";
const output = banner + "window.MODEL = " + JSON.stringify(MODEL, null, 2) + ";\n";

if (process.argv.includes("--check")) {
  let existing;
  try {
    const src = readFileSync(DATA_JS, "utf8");
    const sandbox = {};
    new Function("window", src)(sandbox);
    existing = sandbox.MODEL;
  } catch (e) {
    console.error(`✗ não consegui avaliar ${DATA_JS}: ${e.message}`);
    process.exit(1);
  }
  if (JSON.stringify(existing) === JSON.stringify(MODEL)) {
    console.log("✓ data.js em sinc com model.yml");
  } else {
    console.error("✗ data.js DIVERGE do model.yml — rode: node generate.mjs");
    process.exit(1);
  }
} else {
  writeFileSync(DATA_JS, output);
  console.log(`✓ data.js gerado de model.yml (${Object.keys(MODEL).join(", ")})`);
}
