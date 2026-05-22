import { SpecLocation } from "../../domain/workflow/SpecLocation.js";
import { WorkflowState } from "../../domain/workflow/WorkflowState.js";

/**
 * Monta briefing curto e determinístico (≤ 25 linhas) a partir de
 * estado + cabeçalhos extraídos dos arquivos da spec.
 *
 * Sem dependência de LLM. Sem heurística pesada de NLP — apenas
 * extração simples baseada em regex de cabeçalhos markdown.
 */

export interface SpecHeaders {
  readonly title: string | null;
  readonly status: string | null;
  readonly openHypotheses: ReadonlyArray<string>;
  readonly blockers: ReadonlyArray<string>;
}

const HYPOTHESIS_REGEX = /^### (H\d+)[ —-]+(.+)$/gm;
const BLOCKER_HINT_REGEX = /^### 8\.\d+ Lacunas?/m;

/**
 * Extrai cabeçalhos relevantes do spec.md e do research.md.
 *
 * Extração é best-effort: arquivos ausentes ou sem cabeçalhos retornam
 * valores vazios — briefing degrada graciosamente.
 */
export function extractSpecHeaders(specMd: string | null, researchMd: string | null): SpecHeaders {
  return {
    title: extractTitle(specMd),
    status: extractStatus(specMd),
    openHypotheses: extractHypotheses(researchMd),
    blockers: extractBlockers(researchMd),
  };
}

function extractTitle(md: string | null): string | null {
  if (!md) return null;
  const match = /^# (.+)$/m.exec(md);
  return match ? match[1].trim() : null;
}

function extractStatus(md: string | null): string | null {
  if (!md) return null;
  const match = /^> Status: (.+)$/m.exec(md);
  return match ? match[1].trim() : null;
}

function extractHypotheses(md: string | null): ReadonlyArray<string> {
  if (!md) return [];
  const out: string[] = [];
  const re = new RegExp(HYPOTHESIS_REGEX.source, HYPOTHESIS_REGEX.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    out.push(`${m[1]} — ${m[2].trim()}`);
  }
  return out;
}

function extractBlockers(md: string | null): ReadonlyArray<string> {
  if (!md) return [];
  if (!BLOCKER_HINT_REGEX.test(md)) return [];
  const lines = md.split("\n");
  const out: string[] = [];
  let inBlockerSection = false;
  for (const line of lines) {
    if (/^### 8\./.test(line)) {
      inBlockerSection = true;
      continue;
    }
    if (/^## /.test(line) || /^### \d+(?!\.)/.test(line)) {
      if (inBlockerSection) break;
    }
    if (inBlockerSection) {
      const bullet = /^- \*\*(.+?)\*\*/.exec(line);
      if (bullet) out.push(bullet[1].replace(/[:—–-]+$/, "").trim());
    }
  }
  return out.slice(0, 5);
}

export interface BriefingInput {
  readonly location: SpecLocation;
  readonly state: WorkflowState;
  readonly defaulted: boolean;
  readonly headers: SpecHeaders;
}

/**
 * Detecta extraction vazia: nenhum cabeçalho foi reconhecido pelos regex
 * do template canônico, mesmo que os arquivos `spec.md`/`research.md`
 * existam. Sinaliza convenção divergente.
 *
 * Cf. [DEC-0023-B02]: emitir warning narrativo em vez de tentar parser
 * mais agressivo.
 */
function isExtractionEmpty(headers: SpecHeaders): boolean {
  return (
    headers.title === null &&
    headers.status === null &&
    headers.openHypotheses.length === 0 &&
    headers.blockers.length === 0
  );
}

export function assembleBriefing(input: BriefingInput): string {
  const lines: string[] = [];
  const title = input.headers.title ?? input.location.slug;
  lines.push(`Spec: ${input.location.slug} — ${title}`);
  if (input.location.source === "specify-legacy") {
    lines.push(`(spec em .specify/ — bridge legacy, considerar migração caso-a-caso)`);
  }
  if (isExtractionEmpty(input.headers)) {
    lines.push(
      `(convenção do template não detectada; veja .specify/templates/ para a forma canônica)`
    );
  }
  lines.push("");
  lines.push(`Stage: ${input.state.stage}    Gate: ${input.state.gate.status}`);
  if (input.defaulted) {
    lines.push(`(state.yml ausente — usando defaults)`);
  }
  if (input.state.focus.length > 0) {
    lines.push(`Foco: ${input.state.focus.join(", ")}`);
  }
  if (input.headers.openHypotheses.length > 0) {
    lines.push("");
    lines.push(`Hipóteses (research):`);
    for (const h of input.headers.openHypotheses.slice(0, 4)) {
      lines.push(`  - ${truncate(h, 100)}`);
    }
  }
  if (input.headers.blockers.length > 0) {
    lines.push("");
    lines.push(`Blockers/lacunas (research §8):`);
    for (const b of input.headers.blockers) {
      lines.push(`  - ${truncate(b, 100)}`);
    }
  }
  if (input.state.next.length > 0) {
    lines.push("");
    lines.push(`Próxima ação:`);
    for (const n of input.state.next) {
      lines.push(`  - ${n}`);
    }
  }
  return lines.join("\n");
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}
