import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Register } from "../api.ts";
import type { Contract, Disposition, TriageItem } from "../../../_lib/domain/model.ts";
import type { RoutingSuggestion } from "../../../_lib/domain/routing.ts";

const today = (): string => new Date().toISOString().slice(0, 10);
const rand16 = (): number => Math.floor(Math.random() * 65536);
const DISP: Disposition[] = ["exploration", "answered", "needs-info"];

// TRIAGEM (engenharia): lê o registro de negócio, dispõe cada dúvida, vê as sugestões do matcher, valida contratos,
// avalia viabilidade e decide o GATE (promover → vira intent ativada · descartar → arquiva). D7/D8/D9.
export function TriageDetail() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const [reg, setReg] = useState<Register | null>(null);
  const [items, setItems] = useState<TriageItem[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [viability, setViability] = useState("");
  const [routing, setRouting] = useState<RoutingSuggestion[]>([]);
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([api.register(id), api.triage(id), api.registerRouting(id)])
      .then(([r, t, ro]) => {
        setReg(r);
        setViability(t.viability ?? "");
        setContracts(t.contracts ?? []);
        setRouting(ro);
        const existing = new Map((t.items ?? []).map((it) => [it.question, it]));
        setItems((r.openQuestions ?? []).map((q) => existing.get(q.id) ?? { question: q.id }));
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)));
  }, [id]);

  if (error) return <p className="error">Erro: {error}</p>;
  if (!reg) return <p className="muted">carregando…</p>;

  const questionText = (qid: string): string =>
    reg.openQuestions?.find((q) => q.id === qid)?.question ?? qid;
  const suggestionsFor = (qText: string) =>
    (routing.find((s) => s.need === qText)?.ranked ?? []).filter((m) => m.score > 0);

  const setItem = (i: number, patch: Partial<TriageItem>): void =>
    setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  function changeDisposition(i: number, d: Disposition): void {
    const it = items[i];
    if (!it) return;
    const patch: Partial<TriageItem> = { disposition: d };
    if (d === "exploration" && !it.explorePoint)
      patch.explorePoint = { id: `e${rand16()}`, title: questionText(it.question), details: "" };
    if (d === "needs-info" && !it.blockedSince) patch.blockedSince = today();
    setItem(i, patch);
  }

  const buildTriage = () => ({
    items,
    contracts,
    viability: viability.trim() || undefined,
    updatedAt: today(),
  });

  async function save(): Promise<void> {
    setBusy(true);
    setSaved(false);
    try {
      await api.saveTriage(id, buildTriage());
      const status = items.some((it) => it.disposition === "exploration")
        ? "investigacao"
        : "triagem";
      if (reg && reg.status !== status) {
        await api.updateRegister(id, { ...reg, status });
        setReg({ ...reg, status });
      }
      setSaved(true);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  async function promote(): Promise<void> {
    setBusy(true);
    try {
      await api.saveTriage(id, buildTriage());
      const intent = await api.promote(id, {
        outcome: "promoted",
        decidedBy: reg?.owner,
        decidedAt: today(),
        rationale: rationale.trim() || undefined,
        viability: viability.trim() || undefined,
      });
      nav(`/intent/${intent.id}`);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
      setBusy(false);
    }
  }

  async function discard(): Promise<void> {
    if (!confirm("Descartar esta candidata? Vai pra archived/, nada nasce em intents/.")) return;
    setBusy(true);
    try {
      await api.discard(id, {
        outcome: "discarded",
        decidedBy: reg?.owner,
        decidedAt: today(),
        rationale: rationale.trim() || undefined,
      });
      nav("/");
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
      setBusy(false);
    }
  }

  const p = reg.problem;

  return (
    <article className="block">
      <p className="crumb">
        <Link to="/">← início</Link> · <Link to="/triagem">triagem</Link>
      </p>
      <div className="detail-head">
        <div>
          <h2>{reg.title}</h2>
          <div className="meta">
            <code>{reg.id}</code> · dona {reg.owner ?? "—"}
            {reg.registeredBy ? ` · cadastrou ${reg.registeredBy}` : ""}
          </div>
        </div>
        <div className="detail-actions">
          <span className={`badge st-${reg.status}`}>{reg.status}</span>
          <Link className="btn" to={`/register/${reg.id}/editar`}>
            editar registro
          </Link>
        </div>
      </div>

      {(p?.business || p?.customer) && (
        <p className="field-hint">
          {p?.business ? `Negócio: ${p.business}` : ""}
          {p?.business && p?.customer ? " · " : ""}
          {p?.customer ? `Cliente: ${p.customer}` : ""}
        </p>
      )}

      <h3>triagem das dúvidas</h3>
      {items.length === 0 && <p className="muted">(o registro não trouxe dúvidas)</p>}
      {items.map((it, i) => {
        const qText = questionText(it.question);
        const sugg = suggestionsFor(qText);
        return (
          <div className="explore-edit" key={it.question}>
            <div className="meta">
              <b>{qText}</b> <span className="exp-id">{it.question}</span>
            </div>
            <div className="field-row">
              <label className="field">
                <span>disposição</span>
                <select
                  value={it.disposition ?? ""}
                  onChange={(e) => changeDisposition(i, e.target.value as Disposition)}
                >
                  <option value="">— a decidir —</option>
                  {DISP.map((d) => (
                    <option key={d} value={d}>
                      {d === "exploration"
                        ? "vira exploration"
                        : d === "answered"
                          ? "respondo direto"
                          : "falta info"}
                    </option>
                  ))}
                </select>
              </label>
              {sugg.length > 0 && (
                <div className="field">
                  <span>matcher sugere</span>
                  <div className="chips">
                    {sugg.map((m) => (
                      <span className="chip" key={m.repo}>
                        {m.repo} ({m.score})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {it.disposition === "exploration" && it.explorePoint && (
              <input
                value={it.explorePoint.details ?? ""}
                onChange={(e) =>
                  setItem(i, {
                    explorePoint: { ...it.explorePoint!, details: e.target.value || undefined },
                  })
                }
                placeholder="detalhe da exploration — o que precisa responder"
              />
            )}
            {it.disposition === "answered" && (
              <textarea
                value={it.answer ?? ""}
                onChange={(e) => setItem(i, { answer: e.target.value || undefined })}
                rows={2}
                placeholder="resposta direta do eng (não precisa investigar)"
              />
            )}
            {it.disposition === "needs-info" && (
              <div className="edit-row">
                <input
                  value={it.assignee ?? ""}
                  onChange={(e) => setItem(i, { assignee: e.target.value || undefined })}
                  placeholder="@quem-de-negócio precisa responder"
                />
                <span className="exp-id">bloqueado desde {it.blockedSince ?? today()}</span>
              </div>
            )}
          </div>
        );
      })}

      <h3>contratos / conexões validados</h3>
      {contracts.map((c, i) => (
        <div className="edit-row" key={i}>
          <input
            value={c.name}
            onChange={(e) =>
              setContracts((cs) => cs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
            }
            placeholder="nome do contrato"
          />
          <input
            className="narrow"
            value={c.awaits ?? ""}
            onChange={(e) =>
              setContracts((cs) =>
                cs.map((x, j) => (j === i ? { ...x, awaits: e.target.value || undefined } : x))
              )
            }
            placeholder="aguarda"
          />
          <button
            type="button"
            className="btn-icon"
            onClick={() => setContracts((cs) => cs.filter((_, j) => j !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setContracts((cs) => [...cs, { name: "" }])}
      >
        + contrato
      </button>

      <h3>viabilidade</h3>
      <textarea
        value={viability}
        onChange={(e) => setViability(e.target.value)}
        rows={2}
        placeholder="a investigação mostra que é viável? por quê?"
      />

      <div className="form-actions">
        <button className="btn" onClick={save} disabled={busy}>
          {busy ? "…" : "salvar triagem"}
        </button>
        {saved && <span className="muted"> ✓ salva</span>}
      </div>

      <h3>gate de ativação</h3>
      <textarea
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        rows={2}
        placeholder="rationale da decisão (por que promover ou descartar)"
      />
      <div className="form-actions gate-actions">
        <button className="btn primary" onClick={promote} disabled={busy}>
          promover → ativar
        </button>
        <button className="btn danger" onClick={discard} disabled={busy}>
          descartar
        </button>
      </div>
    </article>
  );
}
