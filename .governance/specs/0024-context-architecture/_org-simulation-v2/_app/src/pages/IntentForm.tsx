import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Intent } from "../api.ts";
import type {
  Contract,
  ExplorePoint,
  IntentReference,
  Stakeholder,
} from "../../../_lib/domain/model.ts";

const today = (): string => new Date().toISOString().slice(0, 10);
const rand16 = (): number => Math.floor(Math.random() * 65536); // chave estável ~16-bit (não colide na prática)
const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const clean = <T,>(arr: T[]): T[] | undefined => (arr.length ? arr : undefined);
const REF_TYPES = ["modeling", "spec", "design", "benchmark", "dashboard", "alignment", "other"];

// rótulo com selo de obrigatoriedade
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

// Cadastro/edição de INICIATIVA — grava o intent.yml de verdade (via _lib). Forma rica deliberada em
// research/2026-06-30-intent-authoring-shape-deliberation.md. Nasce draft; contratos NÃO se digitam (matcher sugere).
export function IntentForm() {
  const { id: editId } = useParams();
  const editing = Boolean(editId);
  const nav = useNavigate();

  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<NonNullable<Intent["status"]>>("draft");
  const [registeredBy, setRegisteredBy] = useState("");
  const [owner, setOwner] = useState("");
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [pBusiness, setPBusiness] = useState("");
  const [pCustomer, setPCustomer] = useState("");
  const [bcDriver, setBcDriver] = useState("");
  const [bcMetric, setBcMetric] = useState("");
  const [details, setDetails] = useState("");
  const [references, setReferences] = useState<IntentReference[]>([]);
  const [explores, setExplores] = useState<ExplorePoint[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]); // preservados (não editados aqui)
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
        setStatus(i.status ?? "draft");
        setRegisteredBy(i.registeredBy ?? "");
        setOwner(i.owner ?? "");
        setStakeholders(i.stakeholders ?? []);
        setPBusiness(i.problem?.business ?? "");
        setPCustomer(i.problem?.customer ?? "");
        setBcDriver(i.businessConnection?.driver ?? "");
        setBcMetric(i.businessConnection?.metric ?? "");
        setDetails(i.details ?? "");
        setReferences(i.references ?? []);
        setExplores(i.explores);
        setContracts(i.contracts);
        setCreatedAt(i.createdAt);
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)));
  }, [editId]);

  const effectiveId = editing ? id : id || (title ? `${slugify(title)}_${rand16()}` : "");
  const problemEmpty = !pBusiness.trim() && !pCustomer.trim();
  const exploresEmpty = explores.filter((e) => e.title.trim()).length === 0;

  const setStk = (i: number, patch: Partial<Stakeholder>): void =>
    setStakeholders((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setRef = (i: number, patch: Partial<IntentReference>): void =>
    setReferences((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setExp = (i: number, patch: Partial<ExplorePoint>): void =>
    setExplores((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));

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
    const intent: Intent = {
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
      explores: explores
        .filter((e) => e.title.trim())
        .map((e) => ({ ...e, title: e.title.trim() })),
      contracts,
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
        <Lbl req>título</Lbl>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ex.: Sistema de login (multi-repo)"
        />
      </label>
      <div className="field-row">
        <label className="field">
          <span>id {editing ? "" : "(slug do título + nº random; editável)"}</span>
          <input value={effectiveId} onChange={(e) => setId(e.target.value)} disabled={editing} />
        </label>
        {editing ? (
          <label className="field">
            <span>status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              {(["draft", "active", "paused", "done", "dropped"] as const).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        ) : (
          <label className="field">
            <span>status</span>
            <input value="draft (nasce rascunho → ativa depois)" disabled />
          </label>
        )}
      </div>

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
            quem RESPONDE pela iniciativa — pessoa (o PM) ou papel/time. Solo? você mesma. (A
            BU/time é a pasta na governança, não este campo.)
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
              placeholder="ex.: @ana / @squad-design"
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
      <p className="info-banner">
        💡 Quanto melhor você descrever o <b>problema</b> e os <b>explore-points</b>, melhores as{" "}
        <b>conexões e contratos</b> que o matcher vai sugerir (é desse texto que ele parte).
      </p>
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
          placeholder="ex.: clientes não percebem o valor das features premium e não fazem upgrade"
        />
        <Nudge show={problemEmpty}>
          descreva o problema para o matcher sugerir melhores conexões/contratos.
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
          <span>métrica de negócio impactada</span>
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
          placeholder="contexto livre, premissas, o porquê do status…"
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
        <Lbl rec>explore-points</Lbl> · o que investigar (abre as explorations)
      </h3>
      {explores.map((e, i) => (
        <div className="explore-edit" key={e.id}>
          <div className="edit-row">
            <input
              value={e.title}
              onChange={(ev) => setExp(i, { title: ev.target.value })}
              placeholder="ex.: o design system tem um formulário validado?"
            />
            <span className="exp-id">{e.id}</span>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setExplores((xs) => xs.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
          <textarea
            value={e.details ?? ""}
            onChange={(ev) => setExp(i, { details: ev.target.value || undefined })}
            rows={2}
            placeholder="ex.: valida e-mail/telefone? é acessível? cada MFE reimplementa?"
          />
        </div>
      ))}
      <Nudge show={exploresEmpty}>
        adicione ao menos 1 explore-point — é o que o matcher usa para sugerir onde investigar.
      </Nudge>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setExplores((xs) => [...xs, { id: `e${rand16()}`, title: "", details: "" }])}
      >
        + explore-point
      </button>

      <p className="hint">
        <b>contratos/conexões:</b> não se digitam aqui — depois de cadastrar, o <b>matcher</b>{" "}
        sugere as conexões no detalhe da iniciativa.
        {contracts.length > 0 && ` (${contracts.length} já anexado(s), preservado(s).)`}
      </p>

      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? "gravando…" : editing ? "salvar" : "cadastrar (rascunho)"}
        </button>
      </div>
    </form>
  );
}
