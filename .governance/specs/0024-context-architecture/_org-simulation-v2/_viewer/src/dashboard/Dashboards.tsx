// Componentes React do dashboard — a VIEW compartilhada (Lente 5). Prop-driven (SSR-áveis):
// servem tanto o render estático (render-dashboards.tsx via renderToStaticMarkup) quanto o app vivo.
import type { ReactNode } from "react";
import type { RepoDb, GovernanceDb } from "./types";
import type { QuestionGate, DeliberationView, ManifestGraph } from "../../../_lib/domain/derive.ts";

export const STYLE = `
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

const id = (ref: string): string => ref.split("/").pop() ?? ref;

/** página completa (html/head/style/body) — o render prepende o doctype. */
export function Page({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>{title}</title>
        <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      </head>
      <body>
        <h1>
          {title} <small>{subtitle}</small>
        </h1>
        {children}
      </body>
    </html>
  );
}

function gateBadge(q: QuestionGate): { cls: string; label: string } {
  if (q.resolved)
    return { cls: "ok", label: `RESOLVED${q.reopened ? " (reaberta→re-resolvida)" : ""}` };
  if (q.reopened) return { cls: "info", label: "REABERTA" };
  if (q.answered) return { cls: "warn", label: "respondida ≠ resolvida" };
  return { cls: "muted", label: "open" };
}

function DelibCard({ d }: { d: DeliberationView }) {
  return (
    <section className="card">
      <h2>
        Deliberação · {id(d.work)} <span className={`stage ${d.stage}`}>{d.stage}</span>
      </h2>
      <div className="meta">
        cursor (state DERIVADO): <b>{d.cursor}</b>
      </div>
      <table>
        <thead>
          <tr>
            <th>question</th>
            <th>modo</th>
            <th>gate</th>
            <th>research</th>
          </tr>
        </thead>
        <tbody>
          {d.questions.map((q) => {
            const b = gateBadge(q);
            return (
              <tr key={q.id}>
                <td>
                  <b>{q.id}</b>
                </td>
                <td>
                  <span className="mode">{q.mode ?? "?"}</span>
                </td>
                <td>
                  <span className={`badge ${b.cls}`}>{b.label}</span>
                </td>
                <td className="res">{q.researches.join(", ") || "(nenhuma)"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

/** projeta PRA DENTRO: o dashboard LOCAL, auto-contido no repo. */
export function RepoDashboard({ db }: { db: RepoDb }) {
  return (
    <>
      <section className="card">
        <h2>
          Trabalho <span className="layer int">interna · auto-contida no repo</span>
        </h2>
        <table>
          <thead>
            <tr>
              <th>work</th>
              <th>kind</th>
              <th>status</th>
              <th>dono</th>
              <th>peso</th>
              <th>blocked-by</th>
              <th>coordena</th>
            </tr>
          </thead>
          <tbody>
            {db.works.length === 0 && (
              <tr>
                <td colSpan={7} className="res">
                  (sem trabalho)
                </td>
              </tr>
            )}
            {db.works.map((w) => {
              const stCls = w.status === "done" ? "ok" : w.status === "active" ? "info" : "muted";
              return (
                <tr key={w.id}>
                  <td>
                    <b>{w.id}</b>
                  </td>
                  <td>{w.kind}</td>
                  <td>
                    <span className={`badge ${stCls}`}>{w.status}</span>
                  </td>
                  <td>{w.assignee ?? "—"}</td>
                  <td>{w.weight ?? ""}</td>
                  <td className="res">{(w.blockedBy ?? []).map(id).join(", ") || "—"}</td>
                  <td className="res">{(w.coordinatesWith ?? []).join(", ") || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {db.explorations.length > 0 && (
        <section className="card">
          <h2>
            Explorations <span className="layer int">ferramenta</span>
          </h2>
          <table>
            <thead>
              <tr>
                <th>id</th>
                <th>status</th>
                <th>fate</th>
                <th>responde</th>
              </tr>
            </thead>
            <tbody>
              {db.explorations.map((e) => (
                <tr key={e.id}>
                  <td>
                    <b>{e.id}</b>
                  </td>
                  <td>
                    <span className={`badge ${e.status === "done" ? "ok" : "muted"}`}>
                      {e.status}
                    </span>
                  </td>
                  <td>{e.fate ?? "—"}</td>
                  <td className="res">{e.answers ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {db.works.map((w) => (w.deliberation ? <DelibCard key={w.id} d={w.deliberation} /> : null))}
    </>
  );
}

/** o GRAFO DE CONHECIMENTO cross-repo (camada externa) — nós (repos) + arestas coordinates-with DERIVADAS. */
function KnowledgeCard({ k }: { k: ManifestGraph }) {
  return (
    <section className="card">
      <h2>
        Conhecimento dos repos <span className="layer ext">externa · auto-descoberta</span>
      </h2>
      <div className="meta">
        cada repo se declara no <b>manifesto</b>; o host DERIVA as arestas (provides×consumes).
      </div>

      <h3>repos (o que cada um É / provê / sabe)</h3>
      <table>
        <thead>
          <tr>
            <th>repo</th>
            <th>papel</th>
            <th>dona</th>
            <th>provê</th>
            <th>capabilities</th>
          </tr>
        </thead>
        <tbody>
          {k.nodes.map((n) => (
            <tr key={n.repo}>
              <td>
                <b>{n.repo}</b>
              </td>
              <td className="res">{n.role ?? "—"}</td>
              <td>{n.owner}</td>
              <td className="res">
                {n.provides.map((p) => `${p.name} (${p.kind})`).join(", ") || "—"}
              </td>
              <td className="res">{n.capabilities.join(" · ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>arestas cross-repo (coordinates-with — DERIVADAS, anota 1 lado)</h3>
      <ul className="q">
        {k.edges.length === 0 && <li className="res">(nenhuma)</li>}
        {k.edges.map((e) => (
          <li key={`${e.from}|${e.contract}`}>
            <b>{e.from}</b> <span className="mode">consome</span> <code>{e.contract}</code>{" "}
            <span className="mode">→ provido por</span> <b>{e.to}</b>
          </li>
        ))}
      </ul>

      {k.warnings.length > 0 && (
        <>
          <h3>checks</h3>
          <ul className="q">
            {k.warnings.map((w) => (
              <li key={w}>
                <span className="badge warn">anti-typo</span> {w}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** projeta PRA FORA: o dashboard PRINCIPAL da governança (host) — a visão geral. */
export function MainDashboard({ db }: { db: GovernanceDb }) {
  return (
    <>
      {db.governance.map((g) => (
        <section className="card" key={g.intent}>
          <h2>
            {g.title} <small>· {g.intent}</small> <span className="layer ext">visão geral</span>
          </h2>
          <div className="meta">dona: {g.owner ?? "—"}</div>
          <h3>perguntas (o gate)</h3>
          <ul className="q">
            {g.questions.map((q) => {
              const cls = q.resolved ? "ok" : q.answered ? "warn" : "muted";
              const label = q.resolved
                ? "RESOLVED"
                : q.answered
                  ? `answered · ${q.decided}`
                  : "open";
              return (
                <li key={q.id}>
                  <b>{q.id}</b> <span className={`badge ${cls}`}>{label}</span>
                </li>
              );
            })}
          </ul>
          <h3>contratos</h3>
          <div>
            {g.contracts.length === 0
              ? "(nenhum)"
              : g.contracts.map((c) => (
                  <span key={c.name} className={`badge ${c.known ? "ok" : "warn"}`}>
                    {c.name}: {c.known ? "known" : "pending"}{" "}
                  </span>
                ))}
          </div>
          <h3>breakdown (o plano — entregas por status)</h3>
          {(["active", "draft", "done"] as const).map((s) =>
            g.breaksInto[s].length ? (
              <div key={s}>
                <span className="mode">{s}:</span>{" "}
                {g.breaksInto[s].map((r) => r.split("/").slice(-2).join("/")).join(", ")}
              </div>
            ) : null
          )}
        </section>
      ))}
      {db.knowledge && <KnowledgeCard k={db.knowledge} />}
    </>
  );
}
