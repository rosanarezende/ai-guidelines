import {
  diagnoseGovernanceDrift,
  GovernanceDoctorDeps,
  GovernanceDoctorIssue,
  GovernanceDoctorReport,
} from "./governanceDoctor.js";
import { FLOW_COPY, formatCopy } from "./copy/flowCopy.js";

const COPY = FLOW_COPY.governancePreflight;

export type GovernancePreflightMode = "entry" | "work" | "sensitive" | "hook";
export type GovernancePreflightStatus = "ok" | "attention" | "blocked" | "not-governed";

export interface GovernancePreflightResult {
  readonly mode: GovernancePreflightMode;
  readonly status: GovernancePreflightStatus;
  readonly report: GovernanceDoctorReport;
  readonly repairable: readonly GovernanceDoctorIssue[];
  readonly nonAutomatic: readonly GovernanceDoctorIssue[];
  readonly shouldBlock: boolean;
  readonly shouldRender: boolean;
}

export function runGovernancePreflight(
  repoRoot: string,
  mode: GovernancePreflightMode,
  deps: GovernanceDoctorDeps = {}
): GovernancePreflightResult {
  return deriveGovernancePreflight(diagnoseGovernanceDrift(repoRoot, deps), mode);
}

export function deriveGovernancePreflight(
  report: GovernanceDoctorReport,
  mode: GovernancePreflightMode
): GovernancePreflightResult {
  const repairable = report.issues.filter((issue) => issue.repairAuthority === "confirm");
  const nonAutomatic = report.issues.filter((issue) => issue.repairAuthority !== "confirm");
  const isAttention = report.status === "attention";
  const shouldBlock = isAttention && (mode === "sensitive" || mode === "hook");
  const status: GovernancePreflightStatus =
    report.status === "not-governed" ? "not-governed" : shouldBlock ? "blocked" : report.status;

  return {
    mode,
    status,
    report,
    repairable,
    nonAutomatic,
    shouldBlock,
    shouldRender: isAttention,
  };
}

export function renderGovernancePreflight(result: GovernancePreflightResult): string[] {
  if (!result.shouldRender) return [];

  const lines = [
    `# ${COPY.heading}`,
    formatCopy(COPY.status.attention, { count: String(result.report.issues.length) }),
  ];

  if (result.repairable.length > 0) {
    lines.push("", `${COPY.labels.repairable}:`);
    for (const issue of result.repairable) lines.push(`- ${issue.title}: ${issue.safeRepair}`);
  }

  if (result.nonAutomatic.length > 0) {
    lines.push("", `${COPY.labels.nonAutomatic}:`);
    for (const issue of result.nonAutomatic) lines.push(`- ${issue.title}: ${issue.safeRepair}`);
  }

  lines.push("", `${COPY.labels.nextSteps}:`, `- ${COPY.commands.diagnose}`);
  if (result.repairable.length > 0) {
    lines.push(`- ${COPY.commands.repairPreview}`, `- ${COPY.commands.repairApply}`);
  }
  if (result.shouldBlock) lines.push("", COPY.status.blocked);

  return lines;
}
