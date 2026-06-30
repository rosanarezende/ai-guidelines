import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Register, type MatchResult } from "../api.ts";
import type { Contract, Disposition, TriageItem } from "../../../_lib/domain/model.ts";

const today = (): string => new Date().toISOString().slice(0, 10);
const rand16 = (): number => Math.floor(Math.random() * 65536);
const DISP: Disposition[] = ["exploration", "answered", "needs-info"];

// os backends de matcher que a triagem pode SIMULAR (espectro do MATCHER.md):
const MATCHERS = [
  { kind: "lexical", label: "léxico (zero infra)", model: "" },
  { kind: "ollama-embed", label: "LLM local · embed (Ollama)", model: "bge-m3" },
  { kind: "ollama-generate", label: "LLM local · generativo (Ollama)", model: "gemma3:12b" },
  { kind: "gemini-api", label: "integração · Gemini API", model: "gemini-2.5-flash" },
];

// TRIAGEM (engenharia): lê o registro, dispõe cada dúvida, SIMULA o matcher (léxico/LLM local/API) com os campos
// editados, valida contratos, avalia viabilidade e decide o GATE (promover/descartar). D7/D8/D9/D10.
export function TriageDetail() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const [reg, setReg] = useState<Register | null>(null);
  const [items, setItems] = useState<TriageItem[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [viability, setViability] = useState("");
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // simulação do matcher
  const [mKind, setMKind] = useState("lexical");
  const [mModel, setMModel] = useState("");
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.register(id), api.triage(id)])
      .then(([r, t]) => {
        setReg(r);
        setViability(t.viability ?? "");
        setContracts(t.contracts ?? []);
        const existing = new Map((t.items ?? []).map((it) => [it.question, it]));
        setItems((r.openQuestions ?? []).map((q) => existing.get(q.id) ?? { question: q.id }));
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)));
  }, [id]);

  if (error) return <p className="error">Erro: {error}</p>;
  if (!reg) return <p className="muted">carregando…</p>;

  const questionText = (qid: string): string =>
    reg.openQuestions?.find((q) => q.id === qid)?.question ?? qid;
  // o NEED de cada dúvida usa os campos JÁ EDITADOS: descrição (contexto) + a dúvida + o detalhe do explore-point.
  const needText = (it: TriageItem): string =>
    [reg.description, questionText(it.question), it.explorePoint?.details]
      .filter(Boolean)
      .join(" — ");
  const suggestionsFor = (key: string) =>
    (match?.results.find((r) => r.key === key)?.ranked ?? []).filter((m) => m.score > 0);

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

  async function runMatch(): Promise<void> {
    setMatching(true);
    setMatchError(null);
    try {
      const needs = items.map((it) => ({ key: it.question, text: needText(it) }));
      if (needs.length === 0) {
        setMatchError("não há dúvidas para casar (o registro não trouxe dúvidas).");
        return;
      }
      setMatch(await api.match({ needs, kind: mKind, model: mModel || undefined }));
    } catch (e: unknown) {
      setMatchError(String(e instanceof Error ? e.message : e));
      setMatch(null);
    } finally {
      setMatching(false);
    }
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
        <Link to="/">← início</Link> · <Link to={`/register/${reg.id}`}>candidata</Link> ·{" "}
        <Link to="/triagem">triagem</Link>
      </p>
      <div className="detail-head">
        <div>
          <h2>{reg.title}</h2>
          <div className="meta">
            <code>{reg.id}</code> · dona {reg.owner ?? "—"}
          </div>
        </div>
        <div className="detail-actions">
          <span className={`badge st-${reg.status}`}>{reg.status}</span>
          <Link className="btn" to={`/register/${reg.id}/editar`}>
            editar registro
          </Link>
        </div>
      </div>

      {reg.description && <p className="lead">{reg.description}</p>}
      {(p?.business || p?.customer) && (
        <p className="field-hint">
          {p?.business ? `Negócio: ${p.business}` : ""}
          {p?.business && p?.customer ? " · " : ""}
          {p?.customer ? `Cliente: ${p.customer}` : ""}
        </p>
      )}

      <h3>simular matcher</h3>
      <p className="field-hint">
        Usa os campos já editados (descrição + dúvidas + detalhes) p/ sugerir os repos. Escolha o
        backend e rode — o mesmo need, do léxico ao LLM.{" "}
        <i>(Ollama precisa estar no ar; a integração precisa de key configurada.)</i>
      </p>
      <div className="field-row">
        <label className="field">
          <span>backend</span>
          <select
            value={mKind}
            onChange={(e) => {
              setMKind(e.target.value);
              setMModel(MATCHERS.find((m) => m.kind === e.target.value)?.model ?? "");
            }}
          >
            {MATCHERS.map((m) => (
              <option key={m.kind} value={m.kind}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        {mKind !== "lexical" && (
          <label className="field">
            <span>modelo</span>
            <input
              value={mModel}
              onChange={(e) => setMModel(e.target.value)}
              placeholder="modelo"
            />
          </label>
        )}
        <div className="field" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn" onClick={runMatch} disabled={matching}>
            {matching ? "rodando…" : "▶ simular"}
          </button>
        </div>
      </div>
      {matchError && <p className="error">{matchError}</p>}
      {match && (
        <p className="field-hint">
          backend: <b>{match.label}</b> · {(match.ms / 1000).toFixed(1)}s
        </p>
      )}

      <h3>triagem das dúvidas</h3>
      {items.length === 0 && <p className="muted">(o registro não trouxe dúvidas)</p>}
      {items.map((it, i) => {
        const sugg = suggestionsFor(it.question);
        return (
          <div className="explore-edit" key={it.question}>
            <div className="meta">
              <b>{questionText(it.question)}</b> <span className="exp-id">{it.question}</span>
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
                      <span className="chip" key={m.repo} title={m.why}>
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
