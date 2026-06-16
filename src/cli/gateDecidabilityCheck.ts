import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const SPEC_ROOTS = [".governance/specs", ".specify/specs"];

interface DecBlock {
  readonly id: string;
  readonly title: string;
  readonly body: string;
}

interface Violation {
  readonly code: string;
  readonly label: string;
}

interface DecResult {
  readonly id: string;
  readonly ok: boolean;
  readonly violations: readonly Violation[];
}

export function splitDecBlocks(content: string): readonly DecBlock[] {
  const blocks: DecBlock[] = [];
  let current: DecBlock | null = null;
  for (const line of content.split("\n")) {
    const match = line.match(/^###\s+\[(DEC-[A-Z0-9-]+)\]\s*(.*)$/);
    if (match) {
      if (current) blocks.push(current);
      current = { id: match[1] ?? "", title: (match[2] ?? "").trim(), body: `${line}\n` };
    } else if (current) {
      if (/^##\s+/.test(line) && !/^###/.test(line)) {
        blocks.push(current);
        current = null;
      } else {
        current = {
          id: current.id,
          title: current.title,
          body: current.body + line + "\n",
        };
      }
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

function statusText(body: string): string {
  return body
    .split("\n")
    .filter((line) => /\*\*Status\b/i.test(line) && !/agregad/i.test(line))
    .join("\n");
}

export function isExempt(body: string): boolean {
  const status = statusText(body);
  if (!status) return false;
  if (/\[x\]\s*\*{0,2}\s*Pendente/i.test(status)) return false;
  if (/\[x\]\s*\*{0,2}\s*(Resolv|Deferred)/i.test(status)) return true;
  if (/Status:?\*{0,2}\s*:?\s*\*{0,2}\s*(Resolv|Deferred)/i.test(status)) return true;
  return false;
}

function extractAto(body: string): string {
  const out: string[] = [];
  let capturing = false;
  for (const line of body.split("\n")) {
    if (/\*\*Ato\b/i.test(line)) {
      capturing = true;
      out.push(line);
      continue;
    }
    if (capturing) {
      if (/^\s*-\s*\*\*/.test(line)) break;
      out.push(line);
    }
  }
  return out.join("\n");
}

export function evaluateDec(id: string, body: string): DecResult {
  const violations: Violation[] = [];
  const has = (regex: RegExp): boolean => regex.test(body);
  const ato = extractAto(body);
  const push = (code: string, label: string): void => {
    violations.push({ code, label });
  };

  if (/\bOpen\b/.test(statusText(body)) || /\[x\]\s*\*{0,2}\s*Open\b/i.test(body)) {
    push("C7", "usa status Open (proibido — DEC nasce Pendente)");
  }
  if (!has(/est[áa]\s+sendo\s+aceito/i)) push("C2", 'falta "o que está sendo aceito"');
  if (!has(/N[ÃA]O\s+est[áa]\s+sendo\s+aceito/i)) {
    push("C3", 'falta "o que NÃO está sendo aceito"');
  }
  if (!has(/concorrentes\b|alternativas\s+falham|por\s+que\s+(as\s+)?alternativas/i)) {
    push("C4", "falta concorrentes considerados / por que as alternativas falham");
  }
  const hasAssertion =
    has(
      /o\s+finding\b|única\s+(afirma|pergunta)|a\s+afirmação|o\s+que\s+foi\s+aceito|o\s+modelo\s+substituto/i
    ) || /^\s*>/m.test(body);
  if (!hasAssertion) push("C1", "sem afirmação única identificável (heurístico)");

  const bundlesExec =
    /\baceitar\b[^\n]*\+[^\n]*(migra|implementa|autoriz|deploy|rollout)/i.test(ato) ||
    /\bautorizar?\s+a\s+(migra|implementa)/i.test(ato);
  if (bundlesExec) {
    push("C6", 'mais de um ato de gate (ex.: "aceitar … + autorizar a migração")');
    push("C5", "mistura arquitetura e implementação no ato (aceitação + migração/implementação)");
  }

  return { id, ok: violations.length === 0, violations };
}

export function checkContent(content: string): readonly DecResult[] {
  return splitDecBlocks(content)
    .filter((block) => !/DEC-NNNN/.test(block.id))
    .filter((block) => !isExempt(block.body))
    .map((block) => evaluateDec(block.id, block.body))
    .filter((result) => !result.ok);
}

function findBriefs(repoRoot: string): readonly string[] {
  const found: string[] = [];
  for (const root of SPEC_ROOTS) {
    const base = path.resolve(repoRoot, root);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base)) {
      const brief = path.join(base, entry, "decision-brief.md");
      if (existsSync(brief) && statSync(brief).isFile()) found.push(brief);
    }
  }
  return found;
}

export function main(repoRoot: string): number {
  const briefs = findBriefs(repoRoot);
  const report: string[] = [];
  let failed = 0;

  for (const brief of briefs) {
    const results = checkContent(readFileSync(brief, "utf-8"));
    if (results.length === 0) continue;

    failed += results.length;
    report.push(`\n❌ ${path.relative(repoRoot, brief).replace(/\\/g, "/")}`);
    for (const result of results) {
      report.push(`   ${result.id}:`);
      for (const violation of result.violations) {
        report.push(`     • [${violation.code}] ${violation.label}`);
      }
    }
  }

  if (failed) {
    process.stderr.write(
      `❌ GG-0001 — Gate Decidability Check: ${failed} DEC(s) não-decidível(is).\n` +
        report.join("\n") +
        `\n\nUm DEC não-resolvido só vai ao gate quando é decidível.\n` +
        `Regra: .core/rules/base/governance/gate-decidability.md\n`
    );
    return 1;
  }

  process.stdout.write(
    `✅ GG-0001: ${briefs.length} decision-brief(s) — DECs não-resolvidos são decidíveis.\n`
  );
  return 0;
}
