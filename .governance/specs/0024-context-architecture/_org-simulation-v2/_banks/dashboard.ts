// dashboard.ts — projeções HTML self-contained (Lente 5: o repo projeta PRA DENTRO e PRA FORA):
//  · LOCAL  → `<repo>/.governance/dashboard.html` — os detalhes INTERNOS do repo (works + deliberação), auto-contido.
//  · PRINCIPAL → `acme-governance/dashboard.html` — a visão GERAL da intent (gate + contratos + breakdown cross-repo).
// O humano abre o arquivo certo: detalhe interno → local do repo; iniciativa como um todo → principal.
import fs from "node:fs";
import path from "node:path";
import { SIM_ROOT } from "./io.ts";
import type {
  RepoProjection,
  WorkProjection,
  GovernanceProjection,
  DeliberationProjection,
  QuestionGate,
} from "./types.ts";

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const id = (ref: string): string => ref.split("/").pop() ?? ref;

const STYLE = `
  :root { color-scheme: light dark; }
  body { font: 14px/1.5 system-ui, -apple-system, sans-serif; margin: 2rem auto; max-width: 880px; padding: 0 1rem; }
  h1 { font-size: 1.3rem; margin-bottom: .2rem; } h1 small { font-weight: 400; opacity: .55; font-size: .72rem; display: block; }
  h2 { font-size: 1rem; margin: 0 0 .3rem; } h2 small { font-weight: 400; opacity: .6; }
  h3 { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; opacity: .55; margin: .8rem 0 .3rem; }
  .card { border: 1px solid #8884; border-radius: 10px; padding: .9rem 1.1rem; margin: 1rem 0; }
  .meta { font-size: .82rem; opacity: .75; margin-bottom: .2rem; }
  .badge { display: inline-block; padding: .04rem .5rem; border-radius: 999px; font-size: .76rem; font-weight: 600; }
  .ok { background: #1c8a4522; color: #1c8a45; } .warn { background: #b4690e22; color: #c9770f; }
  .info { background: #2563eb22; color: #3b82f6; } .muted { background: #8883; opacity: .75; }
  ul.q { list-style: none; padding: 0; margin: 0; } ul.q li { padding: .12rem 0; }
  table { border-collapse: collapse; width: 100%; font-size: .86rem; margin-top: .3rem; }
  th, td { text-align: left; padding: .33rem .5rem; border-bottom: 1px solid #8883; vertical-align: top; }
  th { font-size: .66rem; text-transform: uppercase; letter-spacing: .04em; opacity: .5; }
  .mode { font-size: .76rem; opacity: .7; } .res { font-size: .8rem; opacity: .8; }
  .stage { font-size: .74rem; padding: .06rem .5rem; border-radius: 999px; background: #b4690e22; color: #c9770f; font-weight: 600; }
  .stage.executing { background: #1c8a4522; color: #1c8a45; }
  .layer { float: right; font-size: .68rem; padding: .08rem .5rem; border-radius: 6px; opacity: .8; }
  .layer.ext { background: #2563eb18; color: #3b82f6; } .layer.int { background: #8882; }
`;

function shell(title: string, subtitle: string, inner: string): string {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>${STYLE}</style></head>
<body>
  <h1>${esc(title)} <small>${esc(subtitle)}</small></h1>
  ${inner}
</body></html>`;
}

function gateBadge(q: QuestionGate): string {
  const [cls, label] = q.resolved
    ? ["ok", `RESOLVED${q.reopened ? " (reaberta→re-resolvida)" : ""}`]
    : q.reopened
      ? ["info", "REABERTA"]
      : q.answered
        ? ["warn", "respondida ≠ resolvida"]
        : ["muted", "open"];
  return `<span class="badge ${cls}">${esc(label)}</span>`;
}

function workRow(w: WorkProjection): string {
  const stCls = w.status === "done" ? "ok" : w.status === "active" ? "info" : "muted";
  return `<tr><td><b>${esc(id(w.ref))}</b></td><td>${esc(w.kind)}</td><td><span class="badge ${stCls}">${esc(w.status)}</span></td><td>${esc(w.assignee ?? "—")}</td><td>${esc(w.weight ?? "")}</td><td class="res">${esc((w.blockedBy ?? []).map(id).join(", ") || "—")}</td><td class="res">${esc((w.coordinatesWith ?? []).join(", ") || "—")}</td></tr>`;
}

function delibCard(d: DeliberationProjection): string {
  const rows = d.questions
    .map(
      (q) =>
        `<tr><td><b>${esc(q.id)}</b></td><td><span class="mode">${esc(q.mode ?? "?")}</span></td><td>${gateBadge(q)}</td><td class="res">${esc(q.researches.join(", ") || "(nenhuma)")}</td></tr>`
    )
    .join("");
  return `<section class="card">
    <h2>Deliberação · ${esc(id(d.work))} <span class="stage ${esc(d.stage)}">${esc(d.stage)}</span></h2>
    <div class="meta">cursor (state DERIVADO): <b>${esc(d.cursor)}</b></div>
    <table><thead><tr><th>question</th><th>modo</th><th>gate</th><th>research</th></tr></thead><tbody>${rows}</tbody></table>
  </section>`;
}

/** projeta PRA DENTRO: o dashboard LOCAL, auto-contido no próprio repo. */
export function materializeRepoDashboard(
  rp: RepoProjection,
  deliberations: DeliberationProjection[]
): string {
  const mine = deliberations.filter((d) => d.work.startsWith(`${rp.repo}/`));
  const works =
    rp.works.map(workRow).join("") || `<tr><td colspan="7" class="res">(sem trabalho)</td></tr>`;
  const expl = rp.explorations.length
    ? `<section class="card"><h2>Explorations <span class="layer int">ferramenta</span></h2>
      <table><thead><tr><th>id</th><th>status</th><th>fate</th><th>responde</th></tr></thead><tbody>${rp.explorations
        .map(
          (e) =>
            `<tr><td><b>${esc(id(e.ref))}</b></td><td><span class="badge ${e.status === "done" ? "ok" : "muted"}">${esc(e.status)}</span></td><td>${esc(e.fate ?? "—")}</td><td class="res">${esc(e.answers ?? "—")}</td></tr>`
        )
        .join("")}</tbody></table></section>`
    : "";
  const inner = `
  <section class="card">
    <h2>Trabalho <span class="layer int">interna · auto-contida no repo</span></h2>
    <table><thead><tr><th>work</th><th>kind</th><th>status</th><th>dono</th><th>peso</th><th>blocked-by</th><th>coordena</th></tr></thead><tbody>${works}</tbody></table>
  </section>
  ${expl}
  ${mine.map(delibCard).join("\n  ")}`;
  const out = path.join(SIM_ROOT, rp.repo, ".governance", "dashboard.html");
  fs.writeFileSync(
    out,
    shell(
      `${rp.repo} — dashboard local`,
      "auto-contido no repo · projeta PRA DENTRO · regenera com node _banks/run.ts",
      inner
    ),
    "utf8"
  );
  return path.relative(SIM_ROOT, out);
}

/** projeta PRA FORA: o dashboard PRINCIPAL da governança — a visão geral da iniciativa. */
export function materializeMainDashboard(governances: GovernanceProjection[]): string {
  const inner = governances
    .map((g) => {
      const qs = g.questions
        .map((q) => {
          const cls = q.resolved ? "ok" : q.answered ? "warn" : "muted";
          const label = q.resolved ? "RESOLVED" : q.answered ? `answered · ${q.decision}` : "open";
          return `<li><b>${esc(q.id)}</b> <span class="badge ${cls}">${esc(label)}</span></li>`;
        })
        .join("");
      const cs =
        g.contracts
          .map(
            (c) =>
              `<span class="badge ${c.known ? "ok" : "warn"}">${esc(c.name)}: ${c.known ? "known" : "pending"}</span>`
          )
          .join(" ") || "(nenhum)";
      const plan =
        (["active", "draft", "done"] as const)
          .map((s) => {
            const refs = g.breaksInto[s];
            return refs.length
              ? `<div><span class="mode">${s}:</span> ${esc(refs.map((r) => r.split("/").slice(-2).join("/")).join(", "))}</div>`
              : "";
          })
          .join("") || "(sem trabalho)";
      return `<section class="card">
    <h2>${esc(g.title)} <small>· ${esc(g.intent)}</small> <span class="layer ext">visão geral</span></h2>
    <div class="meta">dona: ${esc(g.owner ?? "—")}</div>
    <h3>perguntas (o gate)</h3><ul class="q">${qs}</ul>
    <h3>contratos</h3><div>${cs}</div>
    <h3>breakdown (o plano — entregas por status)</h3>${plan}
  </section>`;
    })
    .join("\n  ");
  const out = path.join(SIM_ROOT, "acme-governance", "dashboard.html");
  fs.writeFileSync(
    out,
    shell(
      "Dashboard principal",
      "visão geral das iniciativas (cross-repo) · regenera com node _banks/run.ts",
      inner
    ),
    "utf8"
  );
  return path.relative(SIM_ROOT, out);
}
