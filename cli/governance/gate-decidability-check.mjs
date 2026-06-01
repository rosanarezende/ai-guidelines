#!/usr/bin/env node
/**
 * GG-0001 — Gate Decidability Check (enforcement do guardrail homônimo).
 *
 * Origem: DOGFOOD-0024 (reforma de [DEC-0024-G00] e [DEC-0024-G02], 2026-05-31).
 * Regra (SSOT): `.core/process/governance-foundation.md` § "Guardrails dogfoodados (GG-*)".
 * GG-0001 é guardrail INTERNO (dogfooding) — não é projetado a consumidores (não vive em rules.json).
 *
 * Converte o aprendizado recorrente "antes de discutir o mérito, verifique se o gate
 * é decidível" em enforcement estrutural (ADR 0021 — awareness não basta). Falha
 * (exit 1) se um DEC NÃO-resolvido, num decision-brief.md instanciado, não for decidível:
 *
 *   C1  sem afirmação única identificável            (heurístico)
 *   C2  falta "o que está sendo aceito"
 *   C3  falta "o que NÃO está sendo aceito"
 *   C4  falta concorrentes considerados / por que as alternativas falham
 *   C5  mistura arquitetura e implementação no ato   (heurístico)
 *   C6  mais de um ato de gate (ex.: "aceitar X + autorizar a migração")
 *   C7  usa status Open (DEC nasce Pendente)
 *
 * DECs Resolved/Deferred são isentos (imutáveis). Placeholders de template (DEC-NNNN-*)
 * são ignorados. Subconjunto MECÂNICO: C1 e C5 são heurísticos (proxy textual); o
 * julgamento pleno permanece humano, projetado como checklist no seam do gate
 * (decision-brief-boilerplate). Benchmark: o G02 pré-reforma falha; o G00/G02 reformados passam.
 *
 * Exit codes: 0 ok · 1 violação · 2 uso inválido.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const SPEC_ROOTS = [".governance/specs", ".specify/specs"];

/** Divide um decision-brief em blocos por `### [DEC-...]`, fechando em `## ` (seção) ou EOF. */
export function splitDecBlocks(content) {
  const blocks = [];
  let cur = null;
  for (const line of content.split("\n")) {
    const m = line.match(/^###\s+\[(DEC-[A-Z0-9-]+)\]\s*(.*)$/);
    if (m) {
      if (cur) blocks.push(cur);
      cur = { id: m[1], title: m[2].trim(), body: line + "\n" };
    } else if (cur) {
      if (/^##\s+/.test(line) && !/^###/.test(line)) {
        blocks.push(cur);
        cur = null;
      } else {
        cur.body += line + "\n";
      }
    }
  }
  if (cur) blocks.push(cur);
  return blocks;
}

/** Linhas `**Status**` do DEC (exclui "Status agregado", que é spec-level). */
function statusText(body) {
  return body
    .split("\n")
    .filter((l) => /\*\*Status\b/i.test(l) && !/agregad/i.test(l))
    .join("\n");
}

/** Resolved/Deferred → isento. Pendente explícito ou ausência de status resolvido → checado. */
export function isExempt(body) {
  const s = statusText(body);
  if (!s) return false;
  if (/\[x\]\s*\*{0,2}\s*Pendente/i.test(s)) return false;
  if (/\[x\]\s*\*{0,2}\s*(Resolv|Deferred)/i.test(s)) return true;
  if (/Status:?\*{0,2}\s*:?\s*\*{0,2}\s*(Resolv|Deferred)/i.test(s)) return true;
  return false;
}

/** Extrai o bloco do "Ato" do gate (até o próximo campo `- **...`). */
function extractAto(body) {
  const out = [];
  let cap = false;
  for (const ln of body.split("\n")) {
    if (/\*\*Ato\b/i.test(ln)) {
      cap = true;
      out.push(ln);
      continue;
    }
    if (cap) {
      if (/^\s*-\s*\*\*/.test(ln)) break;
      out.push(ln);
    }
  }
  return out.join("\n");
}

/** Avalia a decidibilidade de um DEC. Retorna { id, ok, violations: [{code,label}] }. */
export function evaluateDec(id, body) {
  const violations = [];
  const has = (re) => re.test(body);
  const ato = extractAto(body);
  const push = (code, label) => violations.push({ code, label });

  // C7 — status Open
  if (/\bOpen\b/.test(statusText(body)) || /\[x\]\s*\*{0,2}\s*Open\b/i.test(body)) {
    push("C7", "usa status Open (proibido — DEC nasce Pendente)");
  }
  // C2 / C3
  if (!has(/est[áa]\s+sendo\s+aceito/i)) push("C2", 'falta "o que está sendo aceito"');
  if (!has(/N[ÃA]O\s+est[áa]\s+sendo\s+aceito/i)) push("C3", 'falta "o que NÃO está sendo aceito"');
  // C4 — concorrentes considerados / por que as alternativas falham
  if (!has(/concorrentes\b|alternativas\s+falham|por\s+que\s+(as\s+)?alternativas/i)) {
    push("C4", "falta concorrentes considerados / por que as alternativas falham");
  }
  // C1 — afirmação única (heurístico: marcador designado OU blockquote)
  const hasAssertion =
    has(
      /o\s+finding\b|única\s+(afirma|pergunta)|a\s+afirmação|o\s+que\s+foi\s+aceito|o\s+modelo\s+substituto/i
    ) || /^\s*>/m.test(body);
  if (!hasAssertion) push("C1", "sem afirmação única identificável (heurístico)");
  // C5 / C6 — ato combina decisão com autorização de execução (migração/implementação)
  const bundlesExec =
    /\baceitar\b[^\n]*\+[^\n]*(migra|implementa|autoriz|deploy|rollout)/i.test(ato) ||
    /\bautorizar?\s+a\s+(migra|implementa)/i.test(ato);
  if (bundlesExec) {
    push("C6", 'mais de um ato de gate (ex.: "aceitar … + autorizar a migração")');
    push("C5", "mistura arquitetura e implementação no ato (aceitação + migração/implementação)");
  }
  return { id, ok: violations.length === 0, violations };
}

/** Avalia o conteúdo de um brief; retorna apenas os DECs com violação. */
export function checkContent(content) {
  return splitDecBlocks(content)
    .filter((b) => !/DEC-NNNN/.test(b.id))
    .filter((b) => !isExempt(b.body))
    .map((b) => evaluateDec(b.id, b.body))
    .filter((r) => !r.ok);
}

function findBriefs(repoRoot) {
  const found = [];
  for (const root of SPEC_ROOTS) {
    const base = resolve(repoRoot, root);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base)) {
      const brief = join(base, entry, "decision-brief.md");
      if (existsSync(brief) && statSync(brief).isFile()) found.push(brief);
    }
  }
  return found;
}

export function main(repoRoot) {
  const briefs = findBriefs(repoRoot);
  const report = [];
  let failed = 0;
  for (const brief of briefs) {
    const results = checkContent(readFileSync(brief, "utf-8"));
    if (results.length) {
      failed += results.length;
      report.push(`\n❌ ${brief.replace(repoRoot + "/", "")}`);
      for (const r of results) {
        report.push(`   ${r.id}:`);
        for (const v of r.violations) report.push(`     • [${v.code}] ${v.label}`);
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

const isCli = (() => {
  try {
    return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();
if (isCli) {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
  process.exit(main(repoRoot));
}
