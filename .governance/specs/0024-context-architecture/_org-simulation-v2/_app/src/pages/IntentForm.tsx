import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Intent } from "../api.ts";

type Explore = { id: string; subject: string };
type Contract = { name: string; awaits?: string };

const today = (): string => new Date().toISOString().slice(0, 10);
const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Cadastro/edição de INICIATIVA — grava o intent.yml de verdade (via _lib). A intent NÃO delibera:
// só title/owner/status + explore-points (o que investigar) + contratos.
export function IntentForm() {
  const { id: editId } = useParams();
  const editing = Boolean(editId);
  const nav = useNavigate();

  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<NonNullable<Intent["status"]>>("active");
  const [explores, setExplores] = useState<Explore[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [createdAt, setCreatedAt] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) return;
    api
      .intent(editId)
      .then((i) => {
        setId(i.id);
        setTitle(i.title);
        setOwner(i.owner ?? "");
        setStatus(i.status ?? "active");
        setExplores(i.explores);
        setContracts(i.contracts);
        setCreatedAt(i.createdAt);
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)));
  }, [editId]);

  const effectiveId = editing ? id : id || (title ? `${slugify(title)}_1` : "");

  const setExplore = (i: number, patch: Partial<Explore>): void =>
    setExplores((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setContract = (i: number, patch: Partial<Contract>): void =>
    setContracts((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  async function submit(ev: FormEvent): Promise<void> {
    ev.preventDefault();
    setError(null);
    if (!title.trim()) return setError("título é obrigatório");
    if (!effectiveId.trim()) return setError("id é obrigatório");
    const intent: Intent = {
      id: effectiveId.trim(),
      title: title.trim(),
      owner: owner.trim() || undefined,
      status,
      explores: explores.filter((e) => e.id.trim() && e.subject.trim()),
      contracts: contracts.filter((c) => c.name.trim()),
      createdAt: createdAt ?? today(),
      updatedAt: today(),
    };
    setSaving(true);
    try {
      if (editing) await api.updateIntent(intent.id, intent);
      else await api.createIntent(intent);
      nav(`/intent/${intent.id}`);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
      setSaving(false);
    }
  }

  return (
    <form className="block form" onSubmit={submit}>
      <p className="crumb">
        <Link to={editing ? `/intent/${editId}` : "/"}>← cancelar</Link>
      </p>
      <h2>{editing ? `Editar ${title || editId}` : "Nova iniciativa"}</h2>

      <label className="field">
        <span>título *</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sistema de login"
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>id {editing ? "" : "(gerado do título; editável)"}</span>
          <input
            value={effectiveId}
            onChange={(e) => setId(e.target.value)}
            disabled={editing}
            placeholder="login_1"
          />
        </label>
        <label className="field">
          <span>dona</span>
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="@ana-pm" />
        </label>
        <label className="field">
          <span>status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="done">done</option>
            <option value="dropped">dropped</option>
          </select>
        </label>
      </div>

      <div className="field">
        <span>explore-points · o que investigar</span>
        {explores.map((e, i) => (
          <div className="edit-row" key={i}>
            <input
              className="narrow"
              value={e.id}
              onChange={(ev) => setExplore(i, { id: ev.target.value })}
              placeholder="e1"
            />
            <input
              value={e.subject}
              onChange={(ev) => setExplore(i, { subject: ev.target.value })}
              placeholder="o design system tem um form validado?"
            />
            <button
              type="button"
              className="btn-icon"
              onClick={() => setExplores((xs) => xs.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setExplores((xs) => [...xs, { id: `e${xs.length + 1}`, subject: "" }])}
        >
          + explore-point
        </button>
      </div>

      <div className="field">
        <span>contratos · o que a feature coordena</span>
        {contracts.map((c, i) => (
          <div className="edit-row" key={i}>
            <input
              value={c.name}
              onChange={(ev) => setContract(i, { name: ev.target.value })}
              placeholder="form-component"
            />
            <input
              className="narrow"
              value={c.awaits ?? ""}
              onChange={(ev) => setContract(i, { awaits: ev.target.value || undefined })}
              placeholder="aguarda e1"
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
      </div>

      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? "gravando…" : editing ? "salvar" : "cadastrar"}
        </button>
      </div>
    </form>
  );
}
