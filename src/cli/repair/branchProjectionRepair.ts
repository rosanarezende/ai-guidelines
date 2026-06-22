/**
 * Reparo do Drift #1 — "branch atual diverge de active.yml" (CO-10.8.1).
 *
 * O índice ativo (`.governance/runtime/specs/active.yml`) é PROJEÇÃO runtime,
 * não topologia. Quando a branch projetada fica stale, a via governada de
 * correção é republicar o estado (`publish-state`) — nunca editar o índice à
 * mão. Este builder reusa `PublishState` por baixo, mas roda contra um
 * `CapturingWorkflowFileSystem` para PRODUZIR o resultado sem escrever, de modo
 * que o comando possa mostrar o preview e só então aplicar.
 *
 * Preserva `status`, `updatedBy`/autoria, `title`, `baseBranch` e
 * `lastSyncCommit` da entry existente: o único fato que estava errado é a
 * branch. Assim o reparo muda só a branch (e o carimbo `updated_at`), mantendo
 * o resto intacto — contrato positivo verificável no teste.
 *
 * Autoridade: `confirm`. Determinístico, mas escreve — exige preview +
 * confirmação. NÃO toca topologia/cursor/next (isso é decisão humana).
 */
import { WorkflowFileSystem } from "../../app/ports/WorkflowFileSystem.js";
import { PublishState, PublishStateInput } from "../../app/workflow/PublishState.js";
import {
  parseActiveSpecs,
  parseSpecsHistory,
  stringifyActiveSpecs,
  stringifySpecsHistory,
} from "../../infrastructure/yaml/activeSpecsSerializer.js";
import { parseWorkflowState } from "../../infrastructure/yaml/workflowStateSerializer.js";
import { parseSpecBranch } from "../../app/workflow/DetectActiveSpec.js";
import { FLOW_COPY, formatCopy } from "../copy/flowCopy.js";
import { CapturingWorkflowFileSystem } from "./CapturingWorkflowFileSystem.js";
import { RepairFileChange, RepairPlan } from "./RepairPlan.js";

const INDEX_PATH = ".governance/runtime/specs/active.yml";
const COPY = FLOW_COPY.governanceRepair;

export type BranchProjectionPlanResult =
  | { readonly kind: "plan"; readonly plan: RepairPlan }
  | { readonly kind: "not-applicable" }
  | { readonly kind: "needs-updated-by" };

export interface BranchProjectionRepairDeps {
  readonly fs: WorkflowFileSystem;
  readonly now?: () => Date;
  /** Quem autoriza o reparo; default = autoria já registrada na entry. */
  readonly updatedBy?: string;
  readonly buildPublishState?: (fs: WorkflowFileSystem, now: () => Date) => PublishState;
}

function defaultBuildPublishState(fs: WorkflowFileSystem, now: () => Date): PublishState {
  return new PublishState(
    fs,
    parseActiveSpecs,
    stringifyActiveSpecs,
    parseWorkflowState,
    parseSpecsHistory,
    stringifySpecsHistory,
    now
  );
}

export function buildBranchProjectionRepairPlan(
  issueId: string,
  deps: BranchProjectionRepairDeps
): BranchProjectionPlanResult {
  const fs = deps.fs;
  const now = deps.now ?? (() => new Date());

  const currentBranch = fs.currentBranch();
  const parsed = parseSpecBranch(currentBranch);
  if (!currentBranch || !parsed) return { kind: "not-applicable" };
  if (!fs.fileExists(INDEX_PATH)) return { kind: "not-applicable" };

  const root = parseActiveSpecs(fs.readTextFile(INDEX_PATH));
  const existing = root.activeSpecs.find((entry) => entry.id === parsed.specId);
  if (!existing) return { kind: "not-applicable" };
  if (existing.branch === currentBranch) return { kind: "not-applicable" };

  const updatedBy = deps.updatedBy ?? existing.updatedBy;
  if (!updatedBy || updatedBy.trim() === "") return { kind: "needs-updated-by" };

  const input: PublishStateInput = {
    status: existing.status,
    updatedBy,
    ...(existing.title !== undefined ? { title: existing.title } : {}),
    ...(existing.baseBranch !== undefined ? { baseBranch: existing.baseBranch } : {}),
    ...(existing.lastSyncCommit !== undefined ? { lastSyncCommit: existing.lastSyncCommit } : {}),
  };

  // Roda o use-case real contra um FS de captura: produz o resultado sem escrever.
  const capturing = new CapturingWorkflowFileSystem(fs);
  const publish = (deps.buildPublishState ?? defaultBuildPublishState)(capturing, now);
  publish.run(input);

  const changes: RepairFileChange[] = [];
  for (const [path, after] of capturing.writes) {
    const before = fs.fileExists(path) ? fs.readTextFile(path) : "";
    changes.push({ path, before, after });
  }

  const plan: RepairPlan = {
    issueId,
    pattern: "branch-stale",
    authority: "confirm",
    title: COPY.branchStale.title,
    whatHappened: formatCopy(COPY.branchStale.whatHappened, {
      currentBranch,
      projectedBranch: existing.branch,
    }),
    whyItMatters: COPY.branchStale.whyItMatters,
    actions: [
      {
        id: "republish-active-projection",
        authority: "confirm",
        summary: COPY.branchStale.action,
        changes,
      },
    ],
  };
  return { kind: "plan", plan };
}
