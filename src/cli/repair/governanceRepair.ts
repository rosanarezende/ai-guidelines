/**
 * Orquestração da camada de reparo (CO-10.8.1).
 *
 * Liga o diagnóstico (GovernanceDoctor) ao plano de reparo: seleciona quais
 * issues têm reparo seguro e determinístico, e renderiza o preview humano.
 *
 * Hoje cobre um único padrão — Drift #1 (branch stale). Os demais drifts
 * permanecem em diagnóstico/explicação até ganharem reparo próprio; os que
 * tocam topologia/Ready/Human Gate ficam, por contrato, fora do reparo
 * automático (decisão humana).
 */
import { GovernanceDoctorIssue, GovernanceDoctorReport } from "../governanceDoctor.js";
import { FLOW_COPY } from "../copy/flowCopy.js";
import { affectedFiles, RepairAuthority, RepairPlan } from "./RepairPlan.js";

const COPY = FLOW_COPY.governanceRepair;

/** Issue id do GovernanceDoctor para branch stale: `active-consistency:<spec>:branch`. */
const BRANCH_STALE_ISSUE = /^active-consistency:.*:branch$/;

/** Issues de branch stale — o único padrão com reparo seguro implementado. */
export function selectBranchStaleIssues(
  report: GovernanceDoctorReport
): readonly GovernanceDoctorIssue[] {
  return report.issues.filter((issue) => BRANCH_STALE_ISSUE.test(issue.id));
}

function authorityLabel(authority: RepairAuthority): string {
  return COPY.authority[authority];
}

/** Render humano do plano (pt-BR locale), incluindo o preview de arquivos afetados. */
export function renderRepairPlan(plan: RepairPlan): string[] {
  const lines: string[] = [];
  lines.push(`# ${COPY.heading}`, "");
  lines.push(plan.title, "");
  lines.push(`${COPY.labels.whatHappened}: ${plan.whatHappened}`);
  lines.push(`${COPY.labels.whyItMatters}: ${plan.whyItMatters}`);
  lines.push(`${COPY.labels.authority}: ${authorityLabel(plan.authority)}`);
  lines.push("", `${COPY.labels.plan}:`);
  plan.actions.forEach((action, index) => {
    lines.push(`${index + 1}. ${action.summary}`);
  });

  const files = affectedFiles(plan);
  lines.push("", `${COPY.labels.affected}:`);
  if (files.length === 0) {
    lines.push(`- ${COPY.labels.none}`);
  } else {
    for (const file of files) lines.push(`- ${file}`);
  }
  return lines;
}
