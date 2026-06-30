import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Register } from "../api.ts";
import type { IntentReference, Stakeholder } from "../../../_lib/domain/model.ts";

const today = (): string => new Date().toISOString().slice(0, 10);
const rand16 = (): number => Math.floor(Math.random() * 65536);
const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const clean = <T,>(arr: T[]): T[] | undefined => (arr.length ? arr : undefined);
const REF_TYPES = ["modeling", "spec", "design", "benchmark", "dashboard", "alignment", "other"];

function Lbl({ children, req, rec }: { children: ReactNode; req?: boolean; rec?: boolean }) {
  return (
    <span>
      {children}
      {req && <em className="req-tag">obrigatório</em>}
      {rec && <em className="rec-tag">recomendado</em>}
    </span>
  );
}
const Nudge = ({ show, children }: { show: boolean; children: ReactNode }): ReactNode =>
  show ? <small className="nudge">{children}</small> : null;

type Doubt = { id: string; question: string };

// Tela de REGISTRO (negócio): cadastra a CANDIDATA à intent. Só enquadramento + dúvidas em linguagem de negócio.
// Os explore-points/contratos NÃO entram aqui — a engenharia decide na TRIAGEM. Nasce status `registrada`.
export function RegisterForm() {
  const { id: editId } = useParams();
  const editing = Boolean(editId);
  const nav = useNavigate();

  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [registeredBy, setRegisteredBy] = useState("");
  const [owner, setOwner] = useState("");
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [pBusiness, setPBusiness] = useState("");
  const [pCustomer, setPCustomer] = useState("");
  const [bcDriver, setBcDriver] = useState("");
  const [bcMetric, setBcMetric] = useState("");
  const [details, setDetails] = useState("");
  const [references, setReferences] = useState<IntentReference[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [status, setStatus] = useState<Register["status"]>("registrada");
  const [createdAt, setCreatedAt] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) return;
    api
      .register(editId)
      .then((r) => {
        setId(r.id);
        setTitle(r.title);
        setStatus(r.status);
        setRegisteredBy(r.registeredBy ?? "");
        setOwner(r.owner ?? "");
        setStakeholders(r.stakeholders ?? []);
        setPBusiness(r.problem?.business ?? "");
        setPCustomer(r.problem?.customer ?? "");
        setBcDriver(r.businessConnection?.driver ?? "");
        setBcMetric(r.businessConnection?.metric ?? "");
        setDetails(r.details ?? "");
        setReferences(r.references ?? []);
        setDoubts(r.openQuestions ?? []);
        setCreatedAt(r.createdAt);
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)));
  }, [editId]);

  const effectiveId = editing ? id : id || (title ? `${slugify(title)}_${rand16()}` : "");
  const problemEmpty = !pBusiness.trim() && !pCustomer.trim();

  const setStk = (i: number, patch: Partial<Stakeholder>): void =>
    setStakeholders((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setRef = (i: number, patch: Partial<IntentReference>): void =>
    setReferences((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setDoubt = (i: number, q: string): void =>
    setDoubts((xs) => xs.map((x, j) => (j === i ? { ...x, question: q } : x)));

  async function submit(ev: FormEvent): Promise<void> {
    ev.preventDefault();
    setError(null);
    if (!title.trim()) return setError("título é obrigatório");
    if (!effectiveId.trim()) return setError("id é obrigatório");
    const problem =
      pBusiness.trim() || pCustomer.trim()
        ? { business: pBusiness.trim() || undefined, customer: pCustomer.trim() || undefined }
        : undefined;
    const businessConnection =
      bcDriver.trim() || bcMetric.trim()
        ? { driver: bcDriver.trim() || undefined, metric: bcMetric.trim() || undefined }
        : undefined;
    const reg: Register = {
      id: effectiveId.trim(),
      title: title.trim(),
      status,
      registeredBy: registeredBy.trim() || undefined,
      owner: owner.trim() || undefined,
      stakeholders: clean(stakeholders.filter((s) => s.role.trim() && s.who.trim())),
      problem,
      businessConnection,
      details: details.trim() || undefined,
      references: clean(references.filter((r) => r.label.trim())),
      openQuestions: clean(doubts.filter((d) => d.question.trim())),
      createdAt: createdAt ?? today(),
      updatedAt: today(),
    };
    setSaving(true);
    try {
      if (editing) await api.updateRegister(reg.id, reg);
      else await api.createRegister(reg);
      nav(`/triagem/${reg.id}`);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
      setSaving(false);
    }
  }

  return (
    <form className="block form" onSubmit={submit}>
      <p className="crumb">
        <Link to={editing ? `/triagem/${editId}` : "/"}>← cancelar</Link>
      </p>
      <h2>
        {editing ? `Editar registro ${title || editId}` : "Nova iniciativa (registro de negócio)"}
      </h2>
      <p className="field-hint">
        Aqui é só o <b>enquadramento de negócio</b> + suas <b>dúvidas</b>. A engenharia faz a
        triagem (explore-points, matcher, contratos) depois.
      </p>

      <label className="field">
        <Lbl req>título</Lbl>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ex.: Sistema de login (multi-repo)"
        />
      </label>
      <label className="field">
        <span>id {editing ? "" : "(slug do título + nº random; editável)"}</span>
        <input value={effectiveId} onChange={(e) => setId(e.target.value)} disabled={editing} />
      </label>

      <h3>pessoas</h3>
      <div className="field-row">
        <label className="field">
          <span>quem cadastrou</span>
          <input
            value={registeredBy}
            onChange={(e) => setRegisteredBy(e.target.value)}
            placeholder="ex.: @você"
          />
        </label>
        <label className="field">
          <Lbl rec>responsável (accountable)</Lbl>
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="ex.: @ana-pm ou @squad-growth"
          />
          <small className="field-hint">
            quem RESPONDE — pessoa ou papel/time. Solo? você mesma. (A BU/time é a pasta.)
          </small>
          <Nudge show={!owner.trim()}>defina quem responde pela iniciativa.</Nudge>
        </label>
      </div>
      <div className="field">
        <span>stakeholders (cargos/pessoas relacionadas)</span>
        {stakeholders.map((s, i) => (
          <div className="edit-row" key={i}>
            <input
              className="narrow"
              value={s.role}
              onChange={(e) => setStk(i, { role: e.target.value })}
              placeholder="ex.: PM"
            />
            <input
              value={s.who}
              onChange={(e) => setStk(i, { who: e.target.value })}
              placeholder="ex.: @ana"
            />
            <button
              type="button"
              className="btn-icon"
              onClick={() => setStakeholders((xs) => xs.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setStakeholders((xs) => [...xs, { role: "", who: "" }])}
        >
          + stakeholder
        </button>
      </div>

      <h3>enquadramento</h3>
      <label className="field">
        <Lbl rec>problema de negócio</Lbl>
        <textarea
          value={pBusiness}
          onChange={(e) => setPBusiness(e.target.value)}
          rows={2}
          placeholder="ex.: a adoção do plano Pro está estagnada há 2 trimestres"
        />
      </label>
      <label className="field">
        <Lbl rec>problema do cliente</Lbl>
        <textarea
          value={pCustomer}
          onChange={(e) => setPCustomer(e.target.value)}
          rows={2}
          placeholder="ex.: clientes não percebem o valor das features premium"
        />
        <Nudge show={problemEmpty}>
          descreva o problema — é o que orienta a engenharia na triagem.
        </Nudge>
      </label>
      <div className="field-row">
        <label className="field">
          <span>driver estratégico</span>
          <input
            value={bcDriver}
            onChange={(e) => setBcDriver(e.target.value)}
            placeholder="ex.: ampliar a receita do plano Pro"
          />
        </label>
        <label className="field">
          <span>métrica impactada</span>
          <input
            value={bcMetric}
            onChange={(e) => setBcMetric(e.target.value)}
            placeholder="ex.: taxa de upgrade Free→Pro"
          />
        </label>
      </div>
      <label className="field">
        <span>detalhes</span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          placeholder="contexto, premissas…"
        />
      </label>
      <div className="field">
        <span>referências / links</span>
        {references.map((r, i) => (
          <div className="edit-row" key={i}>
            <select
              className="narrow"
              value={r.type ?? "other"}
              onChange={(e) => setRef(i, { type: e.target.value })}
            >
              {REF_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <input
              value={r.label}
              onChange={(e) => setRef(i, { label: e.target.value })}
              placeholder="ex.: modelagem no Figma"
            />
            <input
              value={r.url ?? ""}
              onChange={(e) => setRef(i, { url: e.target.value || undefined })}
              placeholder="https://…"
            />
            <button
              type="button"
              className="btn-icon"
              onClick={() => setReferences((xs) => xs.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setReferences((xs) => [...xs, { type: "other", label: "" }])}
        >
          + link
        </button>
      </div>

      <h3>
        <Lbl rec>dúvidas</Lbl> · o que você (negócio) tem de incerteza
      </h3>
      <p className="field-hint">
        Em linguagem de negócio. A engenharia decide na triagem se vira investigação ou se responde
        direto.
      </p>
      {doubts.map((d, i) => (
        <div className="edit-row" key={d.id}>
          <input
            value={d.question}
            onChange={(e) => setDoubt(i, e.target.value)}
            placeholder="ex.: dá pra reaproveitar o formulário entre os produtos?"
          />
          <span className="exp-id">{d.id}</span>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setDoubts((xs) => xs.filter((_, j) => j !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setDoubts((xs) => [...xs, { id: `q${rand16()}`, question: "" }])}
      >
        + dúvida
      </button>

      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? "gravando…" : editing ? "salvar" : "registrar → triagem"}
        </button>
      </div>
    </form>
  );
}
