import { createHash } from "node:crypto";
import { formatGovernedRef, GovernedRef, isWellFormedGovernedRef } from "./GovernedRef.js";
import { formatRef, isWellFormedRef, KnowledgeRef } from "./KnowledgeRef.js";

/**
 * `Falsification` — o **negativo de 1ª classe** do domínio Knowledge (CO-2).
 *
 * Registra que uma PROPOSIÇÃO foi mostrada falsa. **NÃO** é um {@link KnowledgeStage}
 * (o pipeline insight→…→doctrine é maturação POSITIVA) e **NÃO** é um atributo de
 * outro nó: é um tipo de nó ORTOGONAL. Uma `Falsification` SEMPRE falsifica uma
 * `claim` (texto, obrigatório) — o que é OPCIONAL é a existência PRÉVIA dessa claim
 * como nó governado (`falsifiesRef`). É exatamente a lacuna que o CO-2 fecha: o
 * sistema capturava o aprendizado positivo (um insight) mas nunca reificava a claim
 * derrubada, que podia ser silenciosamente reaberta.
 *
 * `constrains` (≥1) aponta as superfícies de decisão GOVERNADAS que a falsificação
 * restringe — {@link GovernedRef} para refs EXISTENTES/deriváveis, NÃO uma entidade
 * "DecisionSurface" persistida (INV-4 / ADR 0026).
 */
export interface Falsification {
  /** Identidade `FAL-NNNN`. */
  readonly id: string;
  /** A proposição falsificada (o conteúdo negado). Obrigatório. */
  readonly claim: string;
  /** Sela `claim_norm + falsifiesRef|null + constrainsSorted` (tamper-evidence + identidade). */
  readonly fingerprint: string;
  /** Superfícies de decisão governadas restringidas. Não-vazio. */
  readonly constrains: ReadonlyArray<GovernedRef>;
  /** Evidência da falsificação (ex.: `git-tag:evidence/...`). Não-vazia. */
  readonly evidence: string;
  /** A claim falsa COMO nó — só quando ela já era governada (opcional). */
  readonly falsifiesRef?: KnowledgeRef;
  /** A lição positiva cristalizada (ex.: `insight:PIT-0008`) — opcional. */
  readonly crystallizedAs?: KnowledgeRef;
  /** Quando foi capturada (ISO) — opcional; consistência com ledgers runtime. */
  readonly capturedAt?: string;
}

export const FALSIFICATION_ID_PATTERN = /^FAL-\d{4,}$/;

/**
 * Normalização **SUPERFICIAL** da claim: colapsa whitespace + trim. Resiste só a
 * variação de FORMATAÇÃO, **NÃO a paráfrase semântica** (exigiria NLP/LLM, proibido
 * no runtime — ADR 0018). O fingerprint é tamper-evidence + identidade do registro,
 * não detector de equivalência semântica.
 */
export function normalizeClaim(claim: string): string {
  return claim.replace(/\s+/g, " ").trim();
}

/**
 * Fingerprint canônico (sha256 do JSON-array, padrão do `reviewArtifactsReader`).
 * Sela a claim (normalizada) + o ref falsificado (`formatRef` ou `null`) + os alvos
 * `constrains` ordenados canonicamente — para que reabrir por paráfrase trivial
 * (formatação) ou por deslocamento de alvo seja VISÍVEL.
 */
export function falsificationFingerprint(parts: {
  claim: string;
  falsifiesRef?: KnowledgeRef;
  constrains: ReadonlyArray<GovernedRef>;
}): string {
  const falsifies = parts.falsifiesRef ? formatRef(parts.falsifiesRef) : null;
  const constrainsSorted = parts.constrains.map(formatGovernedRef).sort();
  return createHash("sha256")
    .update(JSON.stringify([normalizeClaim(parts.claim), falsifies, constrainsSorted]))
    .digest("hex")
    .slice(0, 12);
}

/** Sela uma Falsification calculando o `fingerprint` a partir do conteúdo. */
export function sealFalsification(input: Omit<Falsification, "fingerprint">): Falsification {
  return { ...input, fingerprint: falsificationFingerprint(input) };
}

export interface FalsificationViolation {
  readonly code: string;
  readonly message: string;
}

/**
 * Invariantes ESTRUTURAIS (F1–F3) + selo (F2). Puro; sem I/O. A anti-reabertura
 * por ref (F4a) precisa do grafo/nós ativos e vive no `co-knowledge:check`.
 */
export function validateFalsification(f: Falsification): FalsificationViolation[] {
  const violations: FalsificationViolation[] = [];

  if (!FALSIFICATION_ID_PATTERN.test(f.id)) {
    violations.push({
      code: "FAL_ID_MALFORMED",
      message: `id "${f.id}" não casa o padrão FAL-NNNN.`,
    });
  }
  if (normalizeClaim(f.claim).length === 0) {
    violations.push({
      code: "FAL_CLAIM_EMPTY",
      message: "claim é obrigatória (a proposição falsificada).",
    });
  }
  if (f.evidence.trim().length === 0) {
    violations.push({ code: "FAL_EVIDENCE_EMPTY", message: "evidence é obrigatória e não-vazia." });
  }

  // F1 — falsifiesRef, se presente, é KnowledgeRef bem-formado.
  if (f.falsifiesRef !== undefined && !isWellFormedRef(f.falsifiesRef)) {
    violations.push({
      code: "FAL_FALSIFIES_MALFORMED",
      message: `falsifiesRef "${formatRef(f.falsifiesRef)}" malformado.`,
    });
  }

  // F3 — constrains não-vazio e cada GovernedRef bem-formado.
  if (f.constrains.length === 0) {
    violations.push({
      code: "FAL_CONSTRAINS_EMPTY",
      message: "constrains é obrigatório e não-vazio (≥1 superfície governada).",
    });
  }
  for (const g of f.constrains) {
    if (!isWellFormedGovernedRef(g)) {
      violations.push({
        code: "FAL_CONSTRAINS_MALFORMED",
        message: `constrains "${formatGovernedRef(g)}" malformado.`,
      });
    }
  }

  if (f.crystallizedAs !== undefined && !isWellFormedRef(f.crystallizedAs)) {
    violations.push({
      code: "FAL_CRYSTALLIZED_MALFORMED",
      message: `crystallizedAs "${formatRef(f.crystallizedAs)}" malformado.`,
    });
  }

  // F2 — fingerprint sela o conteúdo (tamper-evidence).
  const expected = falsificationFingerprint(f);
  if (f.fingerprint !== expected) {
    violations.push({
      code: "FAL_FINGERPRINT_STALE",
      message: `fingerprint "${f.fingerprint}" != recomputado "${expected}" — claim/refs editados sem re-selar.`,
    });
  }

  return violations;
}
