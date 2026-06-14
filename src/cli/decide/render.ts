/**
 * Renderers PUROS das decisões humanas (telas do `guidelines decide`).
 * Consomem o modelo serializável (`HumanDecisionBrief`/`DecisionPlan`) e
 * devolvem texto pt-BR; nenhuma I/O, nenhum LLM (ADR 0018).
 *
 * Disciplina humana-primeiro: o briefing começa pela explicação ("o que está
 * sendo decidido"); IDs/SHAs/fingerprints só aparecem no bloco de detalhes
 * técnicos, exibido somente com --technical.
 */
import { DecisionAvailability, DecisionPlan, HumanDecisionBrief } from "./model.js";

export interface DecisionListItem {
  readonly index: number;
  readonly id: string;
  readonly title: string;
  readonly availability: DecisionAvailability;
}

function statusLabel(status: DecisionAvailability["status"]): string {
  if (status === "available") return "Disponível";
  if (status === "blocked") return "Indisponível";
  return "Não se aplica";
}

/** Tela 1 — decisões humanas pendentes. */
export function renderDecisionList(items: readonly DecisionListItem[]): string {
  const lines: string[] = [];
  lines.push("Decisões humanas pendentes");
  lines.push("");
  if (items.length === 0) {
    lines.push("Nenhuma decisão reservada ao humano no estado atual.");
    return lines.join("\n");
  }
  for (const item of items) {
    lines.push(`${item.index}. ${item.title}`);
    const status = statusLabel(item.availability.status);
    const reason =
      item.availability.status !== "available" && item.availability.reasons.length > 0
        ? ` — ${item.availability.reasons.join(" ")}`
        : "";
    lines.push(`   ${status}${reason}`);
    lines.push("");
  }
  lines.push("q. Sair");
  return lines.join("\n");
}

/** Tela 2 — briefing humano de uma decisão (detalhes técnicos opcionais). */
export function renderBrief(brief: HumanDecisionBrief, opts: { technical: boolean }): string {
  const lines: string[] = [];
  lines.push(brief.title);
  lines.push("");
  lines.push(brief.summary);
  lines.push("");

  if (brief.status !== "available" && brief.blockedReasons.length > 0) {
    lines.push(
      brief.status === "blocked"
        ? "Esta decisão ainda não pode ser exercida porque:"
        : "Esta decisão não se aplica agora porque:"
    );
    for (const r of brief.blockedReasons) lines.push(`- ${r}`);
    lines.push("");
  }

  for (const section of brief.sections) {
    if (section.body.length === 0) continue;
    lines.push(section.heading);
    for (const b of section.body) lines.push(`  ${b}`);
    lines.push("");
  }

  if (opts.technical) {
    lines.push("Detalhes técnicos");
    if (brief.technicalDetails.length === 0) {
      lines.push("  (nenhum)");
    } else {
      for (const d of brief.technicalDetails) lines.push(`  ${d.label}: ${d.value}`);
    }
    lines.push("");
    lines.push("Fontes");
    for (const s of brief.sources) lines.push(`  ${s.label}: ${s.ref}`);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

/** Tela 3 — escolhas apresentáveis (numeradas; indisponíveis marcadas). */
export function renderChoices(brief: HumanDecisionBrief): string {
  const lines: string[] = [];
  brief.choices.forEach((c, i) => {
    lines.push(`${i + 1}. ${c.label}${c.available ? "" : " (indisponível agora)"}`);
  });
  lines.push("q. Cancelar");
  return lines.join("\n");
}

/** Tela 4 — prévia exata das alterações. */
export function renderPlanPreview(plan: DecisionPlan): string {
  const lines: string[] = [];
  if (!plan.mutating) {
    lines.push("Nenhuma alteração será feita.");
    for (const n of plan.note) lines.push(`- ${n}`);
    return lines.join("\n");
  }
  lines.push("Alterações propostas");
  lines.push("");
  for (const c of plan.changes)
    lines.push(`${c.path}`.length ? `  ${c.description}` : c.description);
  lines.push("");
  const files = [...new Set(plan.changes.map((c) => c.path))];
  lines.push(files.length === 1 ? "Arquivo afetado:" : "Arquivos afetados:");
  for (const f of files) lines.push(`  ${f}`);
  lines.push("");
  lines.push("Não será alterado:");
  for (const p of plan.preserved) lines.push(`  - ${p}`);
  if (plan.commitMessage) {
    lines.push("");
    lines.push(`Commit (exclusivo): ${plan.commitMessage}`);
  }
  return lines.join("\n");
}
