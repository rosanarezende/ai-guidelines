import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import {
  ConsistencyFailure,
  runActiveSpecsConsistencyCheck,
} from "./activeSpecsConsistencyCheck.js";
import { Divergence, ReconcileCheckReport, runReconcileCheck } from "./reconcileCheck.js";
import { discoverOperationalStateYmlFiles } from "./stateYmlCheck.js";
import {
  LoadActiveSpecsIndex,
  loadActiveSpecsIndex,
} from "./registry/commands/loadActiveSpecsIndex.js";
import { ListActiveSpecsResult, ResolvedActiveSpec } from "../app/workflow/ListActiveSpecs.js";
import { FLOW_COPY, formatCopy } from "./copy/flowCopy.js";

const ACTIVE_INDEX_REL = ".governance/runtime/specs/active.yml";
const HISTORY_INDEX_REL = ".governance/runtime/specs/history.yml";
const COPY = FLOW_COPY.governanceDoctor;

export type GovernanceDoctorStatus = "ok" | "attention" | "not-governed";
export type GovernanceDoctorSeverity = "info" | "warning";
export type GovernanceDoctorRepairAuthority = "auto" | "confirm" | "human-decision" | "blocked";

export interface GovernanceDoctorIssue {
  readonly id: string;
  readonly severity: GovernanceDoctorSeverity;
  readonly title: string;
  readonly whatHappened: string;
  readonly whyItMatters: string;
  readonly safeRepair: string;
  readonly repairAuthority: GovernanceDoctorRepairAuthority;
  readonly technicalDetails: readonly string[];
}

export interface GovernanceDoctorReport {
  readonly status: GovernanceDoctorStatus;
  readonly summary: string;
  readonly checked: readonly string[];
  readonly issues: readonly GovernanceDoctorIssue[];
}

export interface GovernanceDoctorDeps {
  readonly loadIndex?: LoadActiveSpecsIndex;
  readonly fileExists?: (filePath: string) => boolean;
  readonly readFile?: (filePath: string) => string;
  readonly discoverStateFiles?: (repoRoot: string) => string[];
  readonly currentBranch?: (repoRoot: string) => string | null;
}

export function diagnoseGovernanceDrift(
  repoRoot: string,
  deps: GovernanceDoctorDeps = {}
): GovernanceDoctorReport {
  const fileExists = deps.fileExists ?? ((filePath) => fs.existsSync(filePath));
  const readFile = deps.readFile ?? ((filePath) => fs.readFileSync(filePath, "utf-8"));
  const loadIndex = deps.loadIndex ?? loadActiveSpecsIndex;
  const discoverStateFiles = deps.discoverStateFiles ?? discoverOperationalStateYmlFiles;
  const currentBranch = deps.currentBranch ?? factualCurrentBranch;
  const checked = [
    COPY.checks.publicIndex,
    COPY.checks.activeConsistency,
    COPY.checks.topologyNext,
  ];
  const issues: GovernanceDoctorIssue[] = [];
  const stateFiles = discoverStateFiles(repoRoot);

  let indexResult: ListActiveSpecsResult | null = null;
  let indexParseFailed = false;
  try {
    indexResult = loadIndex(repoRoot);
  } catch (error: unknown) {
    indexParseFailed = true;
    issues.push({
      id: "active-index-invalid",
      severity: "warning",
      title: COPY.issues.activeIndexInvalid.title,
      whatHappened: errorMessage(error),
      whyItMatters: COPY.issues.activeIndexInvalid.whyItMatters,
      safeRepair: COPY.issues.activeIndexInvalid.safeRepair,
      repairAuthority: "blocked",
      technicalDetails: [ACTIVE_INDEX_REL],
    });
  }

  if (!indexParseFailed && indexResult !== null) {
    if (!indexResult.indexAvailable && stateFiles.length > 0) {
      issues.push({
        id: "active-index-missing",
        severity: "warning",
        title: COPY.issues.activeIndexMissing.title,
        whatHappened: `${ACTIVE_INDEX_REL} não foi encontrado.`,
        whyItMatters: COPY.issues.activeIndexMissing.whyItMatters,
        safeRepair: COPY.issues.activeIndexMissing.safeRepair,
        repairAuthority: "confirm",
        technicalDetails: [`state.yml encontrados: ${stateFiles.length}`],
      });
    }
    for (const resolved of indexResult.entries.filter((entry) => !entry.specPathExists)) {
      issues.push(issueFromMissingSpecPath(resolved));
    }
  }

  const activeIndexPath = path.join(repoRoot, ACTIVE_INDEX_REL);
  if (!indexParseFailed && fileExists(activeIndexPath)) {
    const historyPath = path.join(repoRoot, HISTORY_INDEX_REL);
    try {
      const consistency = runActiveSpecsConsistencyCheck({
        indexText: readFile(activeIndexPath),
        historyText: fileExists(historyPath) ? readFile(historyPath) : undefined,
        currentBranch: currentBranch(repoRoot),
        readStateYml: (relPath) => {
          const abs = path.join(repoRoot, relPath);
          return fileExists(abs) ? readFile(abs) : null;
        },
      });
      if (consistency.kind === "fail") {
        for (const failure of consistency.failures) {
          issues.push(issueFromConsistencyFailure(failure));
        }
      }
    } catch (error: unknown) {
      issues.push({
        id: "active-consistency-error",
        severity: "warning",
        title: COPY.issues.activeConsistencyError.title,
        whatHappened: errorMessage(error),
        whyItMatters: COPY.issues.activeConsistencyError.whyItMatters,
        safeRepair: COPY.issues.activeConsistencyError.safeRepair,
        repairAuthority: "blocked",
        technicalDetails: [ACTIVE_INDEX_REL],
      });
    }
  }

  const reconcileReport = runReconcileCheck({
    files: stateFiles,
    readFile,
  });
  issues.push(...issuesFromReconcileReport(repoRoot, reconcileReport));

  if (issues.length > 0) {
    return {
      status: "attention",
      summary: formatCopy(COPY.status.attention, { count: String(issues.length) }),
      checked,
      issues,
    };
  }

  if (indexResult?.indexAvailable === false && stateFiles.length === 0) {
    return {
      status: "not-governed",
      summary: COPY.status.notGoverned,
      checked,
      issues: [],
    };
  }

  return {
    status: "ok",
    summary: COPY.status.ok,
    checked,
    issues: [],
  };
}

export function renderGovernanceDoctorReport(report: GovernanceDoctorReport): string[] {
  const lines = [`# ${COPY.heading}`, "", `${COPY.labels.status}: ${report.summary}`, ""];
  lines.push(`${COPY.labels.checks}:`);
  for (const item of report.checked) lines.push(`- ${item}`);

  if (report.issues.length === 0) return lines;

  lines.push("", `${COPY.labels.issues}:`);
  report.issues.forEach((issue, index) => {
    lines.push("", `${index + 1}. ${issue.title}`);
    lines.push(`   ${COPY.labels.whatHappened}: ${issue.whatHappened}`);
    lines.push(`   ${COPY.labels.whyItMatters}: ${issue.whyItMatters}`);
    lines.push(`   ${COPY.labels.repairAuthority}: ${COPY.repairAuthority[issue.repairAuthority]}`);
    lines.push(`   ${COPY.labels.safeRepair}: ${issue.safeRepair}`);
    if (issue.technicalDetails.length > 0) {
      lines.push(`   ${COPY.labels.technicalDetails}:`);
      for (const detail of issue.technicalDetails) lines.push(`   - ${detail}`);
    }
  });
  return lines;
}

function issueFromMissingSpecPath(resolved: ResolvedActiveSpec): GovernanceDoctorIssue {
  return {
    id: `missing-spec-path:${resolved.entry.id}`,
    severity: "warning",
    title: COPY.issues.missingSpecPath.title,
    whatHappened: `A spec ${resolved.entry.id} (${resolved.entry.slug}) declara spec_path "${resolved.entry.specPath}", mas essa pasta não existe no workspace atual.`,
    whyItMatters: COPY.issues.missingSpecPath.whyItMatters,
    safeRepair: COPY.issues.missingSpecPath.safeRepair,
    repairAuthority: "human-decision",
    technicalDetails: [`branch declarada: ${resolved.entry.branch}`],
  };
}

function issueFromConsistencyFailure(failure: ConsistencyFailure): GovernanceDoctorIssue {
  return {
    id: `active-consistency:${failure.id}:${classifyConsistencyFailure(failure.message)}`,
    severity: "warning",
    title: titleForConsistencyFailure(failure.message),
    whatHappened: failure.message,
    whyItMatters: COPY.consistency.whyItMatters,
    safeRepair: COPY.consistency.safeRepair,
    repairAuthority: repairAuthorityForConsistencyFailure(failure.message),
    technicalDetails: [`spec: ${failure.id}`],
  };
}

function issuesFromReconcileReport(
  repoRoot: string,
  report: ReconcileCheckReport
): GovernanceDoctorIssue[] {
  const issues: GovernanceDoctorIssue[] = [];
  for (const spec of report.specs) {
    const relPath = path.relative(repoRoot, spec.file).split(path.sep).join("/");
    if (spec.result.kind === "parse-error") {
      issues.push({
        id: `state-parse:${relPath}`,
        severity: "warning",
        title: COPY.issues.stateParse.title,
        whatHappened: spec.result.message,
        whyItMatters: COPY.issues.stateParse.whyItMatters,
        safeRepair: COPY.issues.stateParse.safeRepair,
        repairAuthority: "blocked",
        technicalDetails: [relPath],
      });
      continue;
    }
    if (spec.result.kind !== "diverge") continue;
    for (const divergence of spec.result.divergences) {
      issues.push(issueFromDivergence(relPath, divergence));
    }
  }
  return issues;
}

function issueFromDivergence(relPath: string, divergence: Divergence): GovernanceDoctorIssue {
  return {
    id: `topology:${relPath}:${divergence.code}`,
    severity: "warning",
    title: titleForDivergence(divergence.code),
    whatHappened: divergence.message,
    whyItMatters: COPY.divergence.whyItMatters,
    safeRepair: COPY.divergence.safeRepair,
    repairAuthority: "human-decision",
    technicalDetails: [relPath],
  };
}

function titleForConsistencyFailure(message: string): string {
  if (message.includes("branch stale")) return COPY.consistency.titles.branch;
  if (message.includes("stage stale")) return COPY.consistency.titles.stage;
  if (message.includes("não encontrado")) return COPY.consistency.titles.missingState;
  if (message.includes("identidade stale")) return COPY.consistency.titles.identity;
  if (message.includes("source_state_path stale")) {
    return COPY.consistency.titles.sourceState;
  }
  if (message.includes("completed não pertence")) {
    return COPY.consistency.titles.completed;
  }
  return COPY.consistency.titles.unknown;
}

function classifyConsistencyFailure(message: string): string {
  if (message.includes("branch stale")) return "branch";
  if (message.includes("stage stale")) return "stage";
  if (message.includes("não encontrado")) return "missing-state";
  if (message.includes("identidade stale")) return "identity";
  if (message.includes("source_state_path stale")) return "source-state";
  if (message.includes("completed não pertence")) return "completed";
  return "unknown";
}

function repairAuthorityForConsistencyFailure(message: string): GovernanceDoctorRepairAuthority {
  if (message.includes("branch stale")) return "confirm";
  if (message.includes("stage stale")) return "human-decision";
  if (message.includes("não encontrado")) return "human-decision";
  if (message.includes("identidade stale")) return "human-decision";
  if (message.includes("source_state_path stale")) return "human-decision";
  if (message.includes("completed não pertence")) return "human-decision";
  return "human-decision";
}

function titleForDivergence(code: Divergence["code"]): string {
  return COPY.divergence.titles[code];
}

function factualCurrentBranch(repoRoot: string): string | null {
  try {
    const output = execFileSync("git", ["branch", "--show-current"], {
      cwd: repoRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return output === "" ? null : output;
  } catch {
    return null;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
