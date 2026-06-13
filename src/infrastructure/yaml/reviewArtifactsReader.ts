import { parse } from "yaml";
import { createHash } from "node:crypto";

/**
 * Leitor puro dos artefatos "revisão-como-artefato" (Spec 0024, Checkpoint
 * 2.4/2.4a). Vive sob o boundary YAML (`src/infrastructure/yaml/`).
 *
 * 2.4a — separação por LANE de propriedade + integridade local (tamper-EVIDENCE,
 * não tamper-proofing; ADR 0021: detectável > inquebrável):
 *   - FINDING (reviewer-owned): `reviews/c<N>-<role>.yml`. Sela a claim via
 *     `fingerprint` = sha256(id|severity|location|description)[:12]. Editar a
 *     claim sem re-selar → check vermelho. `disposition` (open|accepted|
 *     dismissed) é o ÚNICO campo que o gate lê e NÃO entra no hash (muda de
 *     propósito); sua proteção é a lane (editá-lo é diff cross-lane visível).
 *   - RESOLUÇÃO (implementer-owned): `reviews/c<N>-resolutions.yml`. O
 *     implementador propõe `action: fixed|wontfix|needs-discussion`; NÃO destrava
 *     o gate (só `disposition` do reviewer destrava).
 *   - Anti-deleção: `findings_emitted` (contagem declarada) + ids contíguos
 *     `F1..FN`. Apagar um finding quebra contagem/contiguidade → vermelho.
 */

export type FindingSeverity = "critical" | "high" | "medium" | "low";
export type FindingDisposition = "open" | "accepted" | "dismissed";
export type ReviewRole = string;
export type ReviewDecision = "approved" | "changes_requested" | "blocked";
export type GateDecision = "approved" | "changes_requested";
export type ResolutionAction = "fixed" | "wontfix" | "needs-discussion";
export type ReviewEventKind = "reaudit" | "rereview" | "verification";

export const FINDING_SEVERITIES: readonly FindingSeverity[] = ["critical", "high", "medium", "low"];
export const FINDING_DISPOSITIONS: readonly FindingDisposition[] = [
  "open",
  "accepted",
  "dismissed",
];
export const REVIEW_ROLES: readonly ReviewRole[] = ["technical_audit", "architectural_review"];
export const REVIEW_DECISIONS: readonly ReviewDecision[] = [
  "approved",
  "changes_requested",
  "blocked",
];
export const GATE_DECISIONS: readonly GateDecision[] = ["approved", "changes_requested"];
export const RESOLUTION_ACTIONS: readonly ResolutionAction[] = [
  "fixed",
  "wontfix",
  "needs-discussion",
];
export const REVIEW_EVENT_KINDS: readonly ReviewEventKind[] = [
  "reaudit",
  "rereview",
  "verification",
];

/** Severidades que bloqueiam um gate `approved` enquanto `disposition: open`. */
export const BLOCKING_SEVERITIES: readonly FindingSeverity[] = ["critical", "high"];

export interface Finding {
  readonly id: string;
  readonly severity: FindingSeverity;
  /** `<path>#L<a>-<b>` (finding de código) ou `global` (arquitetural). */
  readonly location: string;
  readonly description: string;
  readonly disposition: FindingDisposition;
  readonly fingerprint: string;
}

/**
 * Evidência de cobertura de um review SEM findings (2.4e + 2.4g). Quando
 * `findings_emitted === 0` os findings não existem para carregar a evidência —
 * então a aprovação limpa precisa ATESTAR, de forma selada: o "onde" queryável
 * (`coverage`: caminhos auditados, 2.4g), o que/como (`scope`) e o porquê (`basis`).
 * Recuperabilidade + queryabilidade: meses depois, só pelo YAML, responde "o que
 * foi auditado / onde / por que aprovou". Existe SE-E-SOMENTE-SE
 * `findings_emitted === 0` (proibido quando há findings — lá a evidência são os
 * próprios findings; `coverage` é o dual de `finding.location`).
 */
export interface AuditEvidence {
  /**
   * O "onde" ESTRUTURADO (2.4g): caminhos auditados — a dimensão **enumerável** que
   * vivia escondida na prosa do `scope`. Simétrica a `finding.location` (o "onde"
   * dos problemas); torna a cobertura **queryável** sem parsing (heatmap de áreas,
   * área×modelo). Lista NÃO-vazia de tokens de caminho (forma lenient, como
   * `KnowledgeRef`: sem checar existência). NÃO é `{area, note}` nem registry nem
   * nó — só a lista; o "Area node / dashboard" é projeção derivada.
   */
  readonly coverage: readonly string[];
  /** O que/como foi inspecionado (narrativa). PERMANECE texto. */
  readonly scope: string;
  /** Por que a aprovação foi concedida — incl. riscos ponderados (narrativa). PERMANECE texto. */
  readonly basis: string;
}

/**
 * Proveniência ESTRUTURADA do executor de um review (2.4f). Diferente do `actor`
 * do Gate (decisor HUMANO, identidade social), o executor de uma auditoria é um
 * AGENTE COMPUTACIONAL — duas dimensões ORTOGONAIS (m:n entre si):
 *   - `platform`: o harness/produto que rodou (antigravity, codex-cli, claude-code, local).
 *   - `model`: o LLM totalmente-qualificado (gemini-3.1-pro-high, claude-opus-4-8, qwen3-235b).
 * VO (sem identidade própria; comparável por valor), SELADO no `review_fingerprint`
 * → proveniência tamper-evidente. O "uso de modelos/plataformas" é uma PROJEÇÃO
 * derivada sobre os reviews (CQRS) — NÃO um registry `Agent` persistido (isso
 * repetiria o over-modeling de participação m:n já rejeitado; cf. disclosureRender).
 */
export interface ExecutorProvenance {
  readonly platform: string;
  readonly model: string;
}

export interface ReviewArtifact {
  readonly checkpoint: string;
  readonly role: ReviewRole;
  /** Proveniência LEGADA (string) — reviews históricos já selados (c2.3/c2.4d),
   *  NÃO-selada. Reviews novos usam `executor`. Exatamente um dos dois. */
  readonly actor?: string;
  /** Proveniência ESTRUTURADA do executor (2.4f), SELADA. Canônica para reviews novos. */
  readonly executor?: ExecutorProvenance;
  readonly decision: ReviewDecision;
  readonly findingsEmitted: number;
  readonly findings: readonly Finding[];
  /** Presente ⟺ `findingsEmitted === 0` (evidência de aprovação limpa, selada). */
  readonly auditEvidence?: AuditEvidence;
  /**
   * Ref AUDITADO (proveniência do objeto): SHA único ou intervalo `base..head`.
   * Opcional/backward-compatible (CO-4): reviews históricos sem o campo têm
   * proveniência `unknown` — consumidores NÃO devem assumi-los "fresh".
   * SELADO no `review_fingerprint` (extensão tagueada) quando presente.
   */
  readonly subjectRef?: string;
  /** Selo VALIDADO do review (`review_fingerprint`) — referenciável por eventos scope=review. */
  readonly reviewFingerprint: string;
  readonly file: string;
}

export interface Resolution {
  readonly finding: string;
  readonly action: ResolutionAction;
  /** Commit funcional que tratou o finding (opcional; `<sha>`). Usado por `work` para validar a resolução contra o histórico. */
  readonly ref?: string;
}

export interface ResolutionArtifact {
  readonly checkpoint: string;
  readonly by: string;
  readonly resolutions: readonly Resolution[];
  readonly file: string;
}

export interface ReviewEventArtifact {
  readonly checkpoint: string;
  readonly role: ReviewRole;
  readonly eventId: string;
  readonly kind: ReviewEventKind;
  readonly executor: ExecutorProvenance;
  readonly decision: ReviewDecision;
  /**
   * Escopo da verification (CO-4, rodada 6):
   *   - "findings": revalida findings ESPECÍFICOS após resolutions (`verifies`
   *     obrigatório; comportamento histórico — eventos sem `scope` são lidos
   *     assim);
   *   - "review": revalida o REVIEW INTEIRO contra um novo HEAD/subject
   *     (review limpo com `findings_emitted: 0` incluso). `verifies` é
   *     PROIBIDO (não inventar finding artificial); o review original é
   *     identificado por checkpoint+role+`review_fingerprint` e permanece
   *     imutável — o evento é append-only e NÃO reescreve a decisão selada.
   */
  readonly scope: "findings" | "review";
  /** scope=findings: refs verificados. scope=review: vazio por contrato. */
  readonly verifies: readonly string[];
  readonly auditEvidence: AuditEvidence;
  /** scope=review: selo do review ORIGINAL referenciado (12 hex). */
  readonly reviewFingerprint?: string;
  /** scope=review: ref originalmente auditado ("unknown" quando o review não declarou). */
  readonly previousSubjectRef?: string;
  /** Ref REVALIDADO (`base..head` do delta ou SHA). Selado quando presente. */
  readonly subjectRef?: string;
  readonly file: string;
}

export interface GateArtifact {
  readonly checkpoint: string;
  readonly actor: string;
  readonly decision: GateDecision;
  readonly file: string;
}

export class ReviewArtifactParseError extends Error {
  constructor(message: string) {
    super(`Invalid review artifact: ${message}`);
    this.name = "ReviewArtifactParseError";
  }
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * `audit_evidence.coverage` (2.4g): lista NÃO-vazia de tokens de CAMINHO. Forma
 * lenient (não checa existência, como `KnowledgeRef`), mas rejeita espaço em branco
 * — coverage é o "onde" queryável, não prosa (a narrativa fica em `scope`).
 */
function parseCoverage(raw: unknown, file: string): string[] {
  if (raw === undefined || raw === null) {
    throw new ReviewArtifactParseError(
      `${file}: audit_evidence.coverage é obrigatório (lista de caminhos auditados — o "onde" queryável, simétrico a finding.location).`
    );
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ReviewArtifactParseError(
      `${file}: audit_evidence.coverage deve ser uma lista NÃO-vazia de caminhos.`
    );
  }
  const paths: string[] = [];
  for (const [i, item] of raw.entries()) {
    const p = str(item);
    if (!p) {
      throw new ReviewArtifactParseError(
        `${file}: audit_evidence.coverage[${i}] deve ser um caminho não-vazio.`
      );
    }
    if (/\s/.test(p)) {
      throw new ReviewArtifactParseError(
        `${file}: audit_evidence.coverage[${i}] ("${p}") contém espaço — coverage é lista de CAMINHOS (queryável), não prosa. A narrativa fica em scope.`
      );
    }
    paths.push(p);
  }
  return paths;
}

/**
 * Hash da CLAIM do finding (exclui `disposition`, que muda). Inclui
 * `checkpoint`+`role` (2.4b) — um bloco transplantado de outra review/checkpoint
 * não casa o hash recomputado no arquivo de destino (anti-transplante).
 */
export function fingerprintOf(parts: {
  checkpoint: string;
  role: string;
  id: string;
  severity: string;
  location: string;
  description: string;
}): string {
  // Serialização CANÔNICA (JSON array) — não concatenação textual. Elimina a
  // ambiguidade de delimitador (ex.: `\n` dentro de `location` colidindo com a
  // separação): cada campo é um elemento isolado e escapado (2.4c).
  return createHash("sha256")
    .update(
      JSON.stringify([
        parts.checkpoint,
        parts.role,
        parts.id,
        parts.severity,
        parts.location,
        parts.description,
      ])
    )
    .digest("hex")
    .slice(0, 12);
}

/**
 * Selo de ENVELOPE da review (2.4b) — sela o CONJUNTO de findings emitidos
 * (`checkpoint|role|findings_emitted|<ids>`). Fecha a "poda final": deletar o
 * último finding + decrementar `findings_emitted` muda este selo → vermelho.
 * NÃO acopla findings entre si (cada um mantém seu hash próprio); sela apenas
 * a claim de conjunto, que é do reviewer.
 */
export function reviewFingerprintOf(parts: {
  checkpoint: string;
  role: string;
  findingsEmitted: number;
  ids: readonly string[];
  auditEvidence?: AuditEvidence;
  executor?: ExecutorProvenance;
  subjectRef?: string;
}): string {
  // Base de 4 elementos (checkpoint|role|count|ids) — serialização CANÔNICA (JSON,
  // `ids` como array, não `join(",")`; 2.4c). Selos históricos SEM extensões ficam
  // byte-idênticos. As extensões OPCIONAIS (audit_evidence 2.4e, executor 2.4f)
  // entram como pares [chave, valor] TAGUEADOS em ordem fixa, num único elemento
  // final, SÓ quando há alguma → cada extensão é inequívoca (sem ambiguidade
  // posicional) e o conjunto cresce sem colidir com o passado.
  const envelope: unknown[] = [parts.checkpoint, parts.role, parts.findingsEmitted, [...parts.ids]];
  const extensions: Array<[string, unknown]> = [];
  if (parts.auditEvidence) {
    // tupla FIXA [scope, basis, coverage] — os 3 sempre presentes juntos (2.4e+2.4g).
    extensions.push([
      "audit_evidence",
      [parts.auditEvidence.scope, parts.auditEvidence.basis, [...parts.auditEvidence.coverage]],
    ]);
  }
  if (parts.executor) {
    extensions.push(["executor", [parts.executor.platform, parts.executor.model]]);
  }
  // subject_ref (CO-4): proveniência do objeto auditado. Extensão tagueada —
  // selos históricos sem o campo permanecem byte-idênticos.
  if (parts.subjectRef) {
    extensions.push(["subject_ref", parts.subjectRef]);
  }
  if (extensions.length > 0) envelope.push(extensions);
  return createHash("sha256").update(JSON.stringify(envelope)).digest("hex").slice(0, 12);
}

export function reviewEventFingerprintOf(parts: {
  checkpoint: string;
  role: string;
  eventId: string;
  kind: string;
  decision: string;
  verifies: readonly string[];
  auditEvidence: AuditEvidence;
  executor: ExecutorProvenance;
  subjectRef?: string;
  scope?: "findings" | "review";
  reviewFingerprint?: string;
  previousSubjectRef?: string;
}): string {
  const envelope: unknown[] = [
    parts.checkpoint,
    parts.role,
    parts.eventId,
    parts.kind,
    parts.decision,
    [...parts.verifies].sort(),
    [parts.auditEvidence.scope, parts.auditEvidence.basis, [...parts.auditEvidence.coverage]],
    [parts.executor.platform, parts.executor.model],
  ];
  // subject_ref (CO-4): elemento CONDICIONAL — eventos históricos sem o campo
  // mantêm o envelope (e o selo) idênticos ao formato original.
  if (parts.subjectRef) {
    envelope.push(["subject_ref", parts.subjectRef]);
  }
  // scope=review (CO-4, rodada 6): identidade do review referenciado + subject
  // anterior entram no selo — mudar scope/subject muda o fingerprint; eventos
  // históricos (sem scope ⇒ findings) mantêm o envelope byte-idêntico.
  if (parts.scope === "review") {
    envelope.push([
      "scope:review",
      parts.reviewFingerprint ?? null,
      parts.previousSubjectRef ?? null,
    ]);
  }
  return createHash("sha256").update(JSON.stringify(envelope)).digest("hex").slice(0, 12);
}

/**
 * `subject_ref` (CO-4): proveniência do OBJETO auditado — SHA único ou intervalo
 * `base..head`. Forma lenient (token sem espaço; não valida existência no git —
 * mesma postura do KnowledgeRef); opcional/backward-compatible: ausente ⇒
 * proveniência `unknown` para consumidores (nunca "fresh" por suposição).
 */
function parseSubjectRef(raw: unknown, file: string): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  // SHA curto todo-numérico (ex.: 9433e07 → notação científica; 1234567 →
  // inteiro) é lido pelo YAML como NÚMERO e perderia precisão na coerção —
  // exigir aspas é determinístico e fail-closed (bug real: flake ~1/38 SHAs).
  if (typeof raw === "number") {
    throw new ReviewArtifactParseError(
      `${file}: "subject_ref"/"previous_subject_ref" foi lido pelo YAML como NÚMERO ` +
        `(SHA todo-numérico?). Envolva o valor em aspas: subject_ref: "<sha-ou-intervalo>".`
    );
  }
  const value = str(raw);
  if (!value || /\s/.test(value)) {
    throw new ReviewArtifactParseError(
      `${file}: "subject_ref" deve ser um token sem espaços (SHA ou intervalo base..head).`
    );
  }
  return value;
}

/**
 * Fingerprint TODO-NUMÉRICO sem aspas é lido pelo YAML como NÚMERO (mesma
 * classe do bug do subject_ref, rodada 7: ~1/270 selos são 12 dígitos
 * decimais — flake real de CI). `String(...)` não recupera com segurança
 * (zero à esquerda perde precisão) — rejeição determinística e orientativa.
 */
function rejectNumericFingerprint(raw: unknown, file: string, field: string): void {
  if (typeof raw === "number") {
    throw new ReviewArtifactParseError(
      `${file}: "${field}" foi lido pelo YAML como NÚMERO (fingerprint todo-numérico sem aspas). ` +
        `Envolva o valor em aspas — ou deixe "x" e re-rode: npm run review:seal -- --file ${file}.`
    );
  }
}

function parseExecutor(rawExecutor: unknown, file: string): ExecutorProvenance {
  if (!rawExecutor || typeof rawExecutor !== "object" || Array.isArray(rawExecutor)) {
    throw new ReviewArtifactParseError(
      `${file}: "executor" deve ser um mapping { platform, model }.`
    );
  }
  const ex = rawExecutor as Record<string, unknown>;
  const platform = str(ex.platform);
  if (!platform) {
    throw new ReviewArtifactParseError(
      `${file}: executor.platform é obrigatório (harness/produto: antigravity | codex-cli | claude-code | local).`
    );
  }
  const model = str(ex.model);
  if (!model) {
    throw new ReviewArtifactParseError(
      `${file}: executor.model é obrigatório (LLM totalmente-qualificado: ex. gemini-3.1-pro-high).`
    );
  }
  return { platform, model };
}

function parseAuditEvidence(rawEvidence: unknown, file: string): AuditEvidence {
  if (!rawEvidence || typeof rawEvidence !== "object" || Array.isArray(rawEvidence)) {
    throw new ReviewArtifactParseError(
      `${file}: "audit_evidence" obrigatório (coverage + scope + basis).`
    );
  }
  const ev = rawEvidence as Record<string, unknown>;
  const coverage = parseCoverage(ev.coverage, file);
  const scope = str(ev.scope);
  if (!scope) {
    throw new ReviewArtifactParseError(
      `${file}: audit_evidence.scope é obrigatório (o que/como foi inspecionado — narrativa).`
    );
  }
  const basis = str(ev.basis);
  if (!basis) {
    throw new ReviewArtifactParseError(
      `${file}: audit_evidence.basis é obrigatório (por que a aprovação foi concedida).`
    );
  }
  return { coverage, scope, basis };
}

export function parseReview(yamlText: string, file: string): ReviewArtifact {
  const raw: unknown = parse(yamlText);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ReviewArtifactParseError(`${file}: root must be a mapping`);
  }
  const o = raw as Record<string, unknown>;

  const checkpoint = str(o.checkpoint) ?? String(o.checkpoint ?? "");
  if (!checkpoint) throw new ReviewArtifactParseError(`${file}: "checkpoint" is required`);

  // PROVENIÊNCIA (2.4f): EXATAMENTE UMA de
  //   - `executor: { platform, model }` — canônica; agente computacional; SELADA;
  //   - `actor: <string>` — legado (reviews históricos já selados); NÃO-selada.
  // O Gate mantém `actor` (decisor humano) noutro parser.
  const rawExecutor = o.executor;
  let actor: string | undefined;
  let executor: ExecutorProvenance | undefined;
  if (rawExecutor !== undefined && rawExecutor !== null) {
    if (o.actor !== undefined && o.actor !== null) {
      throw new ReviewArtifactParseError(
        `${file}: use "executor" (canônico) OU "actor" (legado), não ambos.`
      );
    }
    executor = parseExecutor(rawExecutor, file);
  } else {
    actor = str(o.actor) ?? undefined;
    if (!actor) {
      throw new ReviewArtifactParseError(
        `${file}: proveniência obrigatória — "executor" { platform, model } (canônico) ou "actor" (legado).`
      );
    }
  }

  const role = str(o.role);
  if (!role) throw new ReviewArtifactParseError(`${file}: "role" is required`);
  if (!(REVIEW_DECISIONS as readonly string[]).includes(o.decision as string)) {
    throw new ReviewArtifactParseError(
      `${file}: "decision" must be one of ${REVIEW_DECISIONS.join("|")}`
    );
  }
  if (typeof o.findings_emitted !== "number" || !Number.isInteger(o.findings_emitted)) {
    throw new ReviewArtifactParseError(`${file}: "findings_emitted" (inteiro) é obrigatório`);
  }
  const findingsEmitted = o.findings_emitted;

  const rawFindings = o.findings === undefined || o.findings === null ? [] : o.findings;
  if (!Array.isArray(rawFindings)) {
    throw new ReviewArtifactParseError(`${file}: "findings" must be a list`);
  }

  // Anti-deleção: contagem declarada == nº de blocos.
  if (rawFindings.length !== findingsEmitted) {
    throw new ReviewArtifactParseError(
      `${file}: findings_emitted=${findingsEmitted} mas há ${rawFindings.length} finding(s) — ` +
        `deleção/inserção sem atualizar a contagem (anti-tamper).`
    );
  }

  const findings: Finding[] = [];
  for (const [i, rf] of rawFindings.entries()) {
    if (!rf || typeof rf !== "object" || Array.isArray(rf)) {
      throw new ReviewArtifactParseError(`${file}: findings[${i}] must be a mapping`);
    }
    const f = rf as Record<string, unknown>;
    const id = str(f.id);
    if (!id) throw new ReviewArtifactParseError(`${file}: findings[${i}].id is required`);
    // Anti-deleção: ids contíguos F1..FN (na ordem).
    if (id !== `F${i + 1}`) {
      throw new ReviewArtifactParseError(
        `${file}: findings[${i}].id deve ser "F${i + 1}" (ids contíguos F1..FN; recebido "${id}")`
      );
    }
    if (!(FINDING_SEVERITIES as readonly string[]).includes(f.severity as string)) {
      throw new ReviewArtifactParseError(
        `${file}: ${id}.severity must be one of ${FINDING_SEVERITIES.join("|")}`
      );
    }
    const location = str(f.location);
    if (!location) {
      throw new ReviewArtifactParseError(
        `${file}: ${id}.location é obrigatório ("<path>#L<a>-<b>" ou "global")`
      );
    }
    const description = str(f.description);
    if (!description) throw new ReviewArtifactParseError(`${file}: ${id}.description is required`);
    if (!(FINDING_DISPOSITIONS as readonly string[]).includes(f.disposition as string)) {
      throw new ReviewArtifactParseError(
        `${file}: ${id}.disposition must be one of ${FINDING_DISPOSITIONS.join("|")}`
      );
    }
    const severity = f.severity as FindingSeverity;
    const expected = fingerprintOf({
      checkpoint,
      role,
      id,
      severity,
      location,
      description,
    });
    rejectNumericFingerprint(f.fingerprint, file, `${id}.fingerprint`);
    const declared = str(f.fingerprint);
    if (declared !== expected) {
      throw new ReviewArtifactParseError(
        `${file}: ${id}.fingerprint inválido (claim alterada sem re-selar?). ` +
          `esperado: ${expected}${declared ? ` · declarado: ${declared}` : " · ausente"}`
      );
    }
    findings.push({
      id,
      severity,
      location,
      description,
      disposition: f.disposition as FindingDisposition,
      fingerprint: expected,
    });
  }

  // EVIDÊNCIA DE COBERTURA (2.4e): existe SE-E-SOMENTE-SE findings_emitted === 0.
  // Sem isto, um review sem findings é enforcement-válido mas cego para
  // recuperabilidade ("o que foi auditado / por que aprovou"). Estruturado
  // (scope + basis), OBRIGATÓRIO quando 0 findings, PROIBIDO quando há findings
  // (lá a evidência são os próprios findings) — nunca um campo opcional arbitrário.
  const rawEvidence = o.audit_evidence;
  let auditEvidence: AuditEvidence | undefined;
  if (findingsEmitted === 0) {
    if (!rawEvidence || typeof rawEvidence !== "object" || Array.isArray(rawEvidence)) {
      throw new ReviewArtifactParseError(
        `${file}: review com 0 findings exige "audit_evidence" (coverage + scope + basis) — ` +
          `evidência selada de cobertura para recuperabilidade futura.`
      );
    }
    // coverage (2.4g): o "onde" estruturado e queryável; scope/basis seguem texto.
    auditEvidence = parseAuditEvidence(rawEvidence, file);
  } else if (rawEvidence !== undefined && rawEvidence !== null) {
    throw new ReviewArtifactParseError(
      `${file}: "audit_evidence" é proibido quando há findings — a evidência são os próprios findings. Remova-o.`
    );
  }

  // Selo de ENVELOPE: fecha a "poda final" (deletar a cauda + decrementar count).
  // Sela também as extensões presentes — auditEvidence (aprovação limpa) e
  // executor (proveniência estruturada) → ambas tamper-evidentes.
  const subjectRef = parseSubjectRef(o.subject_ref, file);

  const expectedReview = reviewFingerprintOf({
    checkpoint,
    role,
    findingsEmitted,
    ids: findings.map((f) => f.id),
    ...(auditEvidence ? { auditEvidence } : {}),
    ...(executor ? { executor } : {}),
    ...(subjectRef ? { subjectRef } : {}),
  });
  rejectNumericFingerprint(o.review_fingerprint, file, "review_fingerprint");
  const declaredReview = str(o.review_fingerprint);
  if (declaredReview !== expectedReview) {
    throw new ReviewArtifactParseError(
      `${file}: review_fingerprint inválido (conjunto de findings alterado — poda/inserção sem re-selar?). ` +
        `esperado: ${expectedReview}${declaredReview ? ` · declarado: ${declaredReview}` : " · ausente"}`
    );
  }

  return {
    checkpoint,
    role,
    ...(actor ? { actor } : {}),
    ...(executor ? { executor } : {}),
    decision: o.decision as ReviewDecision,
    findingsEmitted,
    findings,
    ...(auditEvidence ? { auditEvidence } : {}),
    ...(subjectRef ? { subjectRef } : {}),
    reviewFingerprint: expectedReview,
    file,
  };
}

export function parseReviewEvent(yamlText: string, file: string): ReviewEventArtifact {
  const raw: unknown = parse(yamlText);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ReviewArtifactParseError(`${file}: root must be a mapping`);
  }
  const o = raw as Record<string, unknown>;
  const checkpoint = str(o.checkpoint) ?? String(o.checkpoint ?? "");
  if (!checkpoint) throw new ReviewArtifactParseError(`${file}: "checkpoint" is required`);
  const role = str(o.role);
  if (!role) throw new ReviewArtifactParseError(`${file}: "role" is required`);
  const eventId = str(o.event_id);
  if (!eventId) throw new ReviewArtifactParseError(`${file}: "event_id" is required`);
  if (!(REVIEW_EVENT_KINDS as readonly string[]).includes(o.kind as string)) {
    throw new ReviewArtifactParseError(
      `${file}: "kind" must be one of ${REVIEW_EVENT_KINDS.join("|")}`
    );
  }
  if (!(REVIEW_DECISIONS as readonly string[]).includes(o.decision as string)) {
    throw new ReviewArtifactParseError(
      `${file}: "decision" must be one of ${REVIEW_DECISIONS.join("|")}`
    );
  }
  // scope (CO-4, rodada 6): ausente ⇒ "findings" (eventos históricos).
  const rawScope = o.scope === undefined || o.scope === null ? "findings" : o.scope;
  if (rawScope !== "findings" && rawScope !== "review") {
    throw new ReviewArtifactParseError(`${file}: "scope" must be "findings" or "review"`);
  }
  const scope = rawScope as "findings" | "review";

  const rawVerifies = o.verifies === undefined || o.verifies === null ? [] : o.verifies;
  let verifies: string[];
  let reviewFingerprint: string | undefined;
  let previousSubjectRef: string | undefined;
  if (scope === "findings") {
    if (!Array.isArray(rawVerifies) || rawVerifies.length === 0) {
      throw new ReviewArtifactParseError(
        `${file}: "verifies" deve ser uma lista NÃO-vazia de findings qualificados (<role>#F<n>) ` +
          `em scope=findings. Para revalidar um review SEM findings, use scope: review.`
      );
    }
    verifies = rawVerifies.map((v, i) => {
      const ref = str(v);
      if (!ref) throw new ReviewArtifactParseError(`${file}: verifies[${i}] deve ser string`);
      if (!ref.includes("#")) {
        throw new ReviewArtifactParseError(
          `${file}: verifies[${i}] deve ser totalmente qualificado (<role>#F<n>).`
        );
      }
      return ref;
    });
  } else {
    // scope=review: o objeto é o REVIEW inteiro — `verifies` é incoerente
    // (finding artificial foi exatamente o bug do dogfood rodada 6).
    if (Array.isArray(rawVerifies) && rawVerifies.length > 0) {
      throw new ReviewArtifactParseError(
        `${file}: scope=review NÃO aceita "verifies" (não invente finding artificial — ` +
          `o evento referencia o review por review_fingerprint).`
      );
    }
    verifies = [];
    rejectNumericFingerprint(o.review_fingerprint, file, "review_fingerprint");
    const declaredReviewFp = str(o.review_fingerprint);
    if (!declaredReviewFp || !/^[0-9a-f]{12}$/i.test(declaredReviewFp)) {
      throw new ReviewArtifactParseError(
        `${file}: scope=review exige "review_fingerprint" (12 hex) do review original referenciado.`
      );
    }
    reviewFingerprint = declaredReviewFp.toLowerCase();
    previousSubjectRef = parseSubjectRef(o.previous_subject_ref, file);
  }

  const executor = parseExecutor(o.executor, file);
  const auditEvidence = parseAuditEvidence(o.audit_evidence, file);
  const subjectRef = parseSubjectRef(o.subject_ref, file);
  if (scope === "review" && !subjectRef) {
    throw new ReviewArtifactParseError(
      `${file}: scope=review exige "subject_ref" (o objeto efetivamente revalidado).`
    );
  }
  const expected = reviewEventFingerprintOf({
    checkpoint,
    role,
    eventId,
    kind: o.kind as ReviewEventKind,
    decision: o.decision as ReviewDecision,
    verifies,
    auditEvidence,
    executor,
    ...(subjectRef ? { subjectRef } : {}),
    scope,
    ...(reviewFingerprint ? { reviewFingerprint } : {}),
    ...(previousSubjectRef ? { previousSubjectRef } : {}),
  });
  rejectNumericFingerprint(o.event_fingerprint, file, "event_fingerprint");
  const declared = str(o.event_fingerprint);
  if (declared !== expected) {
    throw new ReviewArtifactParseError(
      `${file}: event_fingerprint inválido (evento alterado sem re-selar?). ` +
        `esperado: ${expected}${declared ? ` · declarado: ${declared}` : " · ausente"}`
    );
  }
  return {
    checkpoint,
    role,
    eventId,
    kind: o.kind as ReviewEventKind,
    executor,
    decision: o.decision as ReviewDecision,
    scope,
    verifies,
    auditEvidence,
    ...(reviewFingerprint ? { reviewFingerprint } : {}),
    ...(previousSubjectRef ? { previousSubjectRef } : {}),
    ...(subjectRef ? { subjectRef } : {}),
    file,
  };
}

export function parseResolutions(yamlText: string, file: string): ResolutionArtifact {
  const raw: unknown = parse(yamlText);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ReviewArtifactParseError(`${file}: root must be a mapping`);
  }
  const o = raw as Record<string, unknown>;
  const checkpoint = str(o.checkpoint) ?? String(o.checkpoint ?? "");
  if (!checkpoint) throw new ReviewArtifactParseError(`${file}: "checkpoint" is required`);
  const by = str(o.by);
  if (!by) throw new ReviewArtifactParseError(`${file}: "by" is required`);
  const rawRes = o.resolutions === undefined || o.resolutions === null ? [] : o.resolutions;
  if (!Array.isArray(rawRes)) {
    throw new ReviewArtifactParseError(`${file}: "resolutions" must be a list`);
  }
  const resolutions: Resolution[] = [];
  for (const [i, rr] of rawRes.entries()) {
    if (!rr || typeof rr !== "object" || Array.isArray(rr)) {
      throw new ReviewArtifactParseError(`${file}: resolutions[${i}] must be a mapping`);
    }
    const r = rr as Record<string, unknown>;
    const finding = str(r.finding);
    if (!finding)
      throw new ReviewArtifactParseError(`${file}: resolutions[${i}].finding is required`);
    if (!(RESOLUTION_ACTIONS as readonly string[]).includes(r.action as string)) {
      throw new ReviewArtifactParseError(
        `${file}: resolutions[${i}].action must be one of ${RESOLUTION_ACTIONS.join("|")}`
      );
    }
    const ref = str(r.ref);
    resolutions.push({
      finding,
      action: r.action as ResolutionAction,
      ...(ref ? { ref } : {}),
    });
  }
  return { checkpoint, by, resolutions, file };
}

export function parseGate(yamlText: string, file: string): GateArtifact {
  const raw: unknown = parse(yamlText);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ReviewArtifactParseError(`${file}: root must be a mapping`);
  }
  const o = raw as Record<string, unknown>;
  const checkpoint = str(o.checkpoint) ?? String(o.checkpoint ?? "");
  if (!checkpoint) throw new ReviewArtifactParseError(`${file}: "checkpoint" is required`);
  const actor = str(o.actor);
  if (!actor) throw new ReviewArtifactParseError(`${file}: "actor" is required`);
  if (!(GATE_DECISIONS as readonly string[]).includes(o.decision as string)) {
    throw new ReviewArtifactParseError(
      `${file}: "decision" must be one of ${GATE_DECISIONS.join("|")}`
    );
  }
  return { checkpoint, actor, decision: o.decision as GateDecision, file };
}
