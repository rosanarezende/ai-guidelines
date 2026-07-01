import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Proposal } from "../api.ts";

const today = (): string => new Date().toISOString().slice(0, 10);
type Level = Proposal["impact"];
const LEVELS: Level[] = ["low", "medium", "high"];
const PROMOTE = ["", "delivery", "experiment", "incident", "fix", "patch", "exploration"];

// Cadastro/edição de PROPOSTA (intake) — grava em acme-governance/proposals.yml (via _lib).
export function ProposalForm() {
  const { id: editId } = useParams();
  const editing = Boolean(editId);
  const nav = useNavigate();

  const [id, setId] = useState("");
  const [what, setWhat] = useState("");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<Proposal["status"]>("open");
  const [tags, setTags] = useState("");
  const [impact, setImpact] = useState<Level>("medium");
  const [confidence, setConfidence] = useState<Level>("medium");
  const [effort, setEffort] = useState<Level>("medium");
  const [promoteTo, setPromoteTo] = useState("");
  const [raisedFrom, setRaisedFrom] = useState("");
  const [opensIntent, setOpensIntent] = useState("");
  const [discardReason, setDiscardReason] = useState("");
  const [createdAt, setCreatedAt] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      api
        .proposal(editId)
        .then((p) => {
          setId(p.id);
          setWhat(p.what);
          setOwner(p.owner);
          setStatus(p.status);
          setTags(p.tags.join(", "));
          setImpact(p.impact);
          setConfidence(p.confidence);
          setEffort(p.effort);
          setPromoteTo(p.promoteTo ?? "");
          setRaisedFrom(p.raisedFrom ?? "");
          setOpensIntent(p.opensIntent ?? "");
          setDiscardReason(p.discardReason ?? "");
          setCreatedAt(p.createdAt);
        })
        .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)));
    } else {
      api
        .proposals()
        .then((ps) => {
          const max = ps.reduce((m, p) => {
            const n = Number(p.id.replace(/\D/g, ""));
            return Number.isFinite(n) ? Math.max(m, n) : m;
          }, 0);
          setId(`prop-${String(max + 1).padStart(3, "0")}`);
        })
        .catch(() => setId("prop-001"));
    }
  }, [editId]);

  async function submit(ev: FormEvent): Promise<void> {
    ev.preventDefault();
    setError(null);
    if (!what.trim()) return setError("descrição é obrigatória");
    if (!id.trim()) return setError("id é obrigatório");
    if (!owner.trim()) return setError("dona/triador é obrigatório");
    const p: Proposal = {
      id: id.trim(),
      what: what.trim(),
      owner: owner.trim(),
      status,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      impact,
      confidence,
      effort,
      promoteTo: (promoteTo || undefined) as Proposal["promoteTo"],
      raisedFrom: raisedFrom.trim() || undefined,
      opensIntent: opensIntent.trim() || undefined,
      discardReason: discardReason.trim() || undefined,
      createdAt: createdAt ?? today(),
      updatedAt: today(),
    };
    setSaving(true);
    try {
      if (editing) await api.updateProposal(p.id, p);
      else await api.createProposal(p);
      nav(`/proposal/${p.id}`);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
      setSaving(false);
    }
  }

  return (
    <form className="block form" onSubmit={submit}>
      <p className="crumb">
        <Link to={editing ? `/proposal/${editId}` : "/"}>← cancelar</Link>
      </p>
      <h2>{editing ? `Editar ${editId}` : "Nova proposta"}</h2>

      <label className="field">
        <span>descrição * · o que se propõe</span>
        <textarea
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          rows={2}
          placeholder="testar se o suporte proativo melhora o login"
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>id</span>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={editing}
            placeholder="prop-001"
          />
        </label>
        <label className="field">
          <span>dona/triador *</span>
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="@produto-growth"
          />
        </label>
        <label className="field">
          <span>status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as Proposal["status"])}>
            <option value="open">open</option>
            <option value="promoted">promoted</option>
            <option value="dismissed">dismissed</option>
          </select>
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>impacto</span>
          <select value={impact} onChange={(e) => setImpact(e.target.value as Level)}>
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>confiança</span>
          <select value={confidence} onChange={(e) => setConfidence(e.target.value as Level)}>
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>esforço</span>
          <select value={effort} onChange={(e) => setEffort(e.target.value as Level)}>
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>promove a</span>
          <select value={promoteTo} onChange={(e) => setPromoteTo(e.target.value)}>
            {PROMOTE.map((t) => (
              <option key={t} value={t}>
                {t || "—"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>tags (separadas por vírgula)</span>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="growth, login" />
      </label>

      <div className="field-row">
        <label className="field">
          <span>levantada de (proveniência)</span>
          <input
            value={raisedFrom}
            onChange={(e) => setRaisedFrom(e.target.value)}
            placeholder="acme-mfe-support/exploration/proactive-support_1"
          />
        </label>
        <label className="field">
          <span>abre a intent</span>
          <input
            value={opensIntent}
            onChange={(e) => setOpensIntent(e.target.value)}
            placeholder="(se promovida)"
          />
        </label>
      </div>

      {status === "dismissed" && (
        <label className="field">
          <span>motivo do descarte</span>
          <input value={discardReason} onChange={(e) => setDiscardReason(e.target.value)} />
        </label>
      )}

      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? "gravando…" : editing ? "salvar" : "cadastrar"}
        </button>
      </div>
    </form>
  );
}
