/**
 * Derivações PURAS da família readiness (Spec 0024 · PR #46, fatia 2).
 *
 * Regras de aplicação sem I/O: normalização de check-runs do GitHub e política
 * factual de quando smoke real é obrigatório para Ready/Human Gate. A coleta
 * (gh/git/fs) permanece em `src/cli/prReadyCheck.ts`; a avaliação agregada
 * (`evaluateReadyPreconditions`) permanece na CLI enquanto `derivePrReadyFlow`
 * viver em `src/cli/flow` (mover junto seria criar dependência app→cli).
 */

export interface ReadyCheckRun {
  readonly name: string;
  readonly status: string;
  readonly conclusion: string | null;
  readonly started_at?: string | null;
  readonly completed_at?: string | null;
}

function runTime(run: ReadyCheckRun): number {
  const raw = run.started_at ?? run.completed_at ?? null;
  if (!raw) return 0;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function bucketOf(run: ReadyCheckRun): string {
  if (run.status !== "completed") return "pending";
  if (run.conclusion === "success") return "pass";
  if (run.conclusion === "skipped" || run.conclusion === "neutral") return "skipping";
  return "fail";
}

/**
 * GitHub REST `check-runs` can return repeated runs for the same check name on
 * the same commit. `gh pr checks` presents the current run per name; Ready/Gate
 * decisions use that same shape instead of counting stale historical retries.
 */
export function normalizeCheckRuns(
  runs: readonly ReadyCheckRun[]
): Array<{ name: string; bucket: string }> {
  const latestByName = new Map<string, ReadyCheckRun>();
  for (const run of runs) {
    const previous = latestByName.get(run.name);
    if (!previous || runTime(run) > runTime(previous)) latestByName.set(run.name, run);
  }
  return [...latestByName.values()].map((run) => ({
    name: run.name,
    bucket: bucketOf(run),
  }));
}

export interface ReadyCheckSmokePolicy {
  readonly suspended: boolean;
  readonly required: boolean;
  readonly reason: string;
  readonly changedPaths: readonly string[] | null;
  readonly triggerPaths: readonly string[];
}

export interface SmokeNodeFact {
  readonly id: string;
  readonly role: string | null;
  readonly terminal: boolean;
}

export function normalizeChangedPath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.\//, "");
}

function smokeTriggerReason(p: string): string | null {
  const normalized = normalizeChangedPath(p);
  if (normalized === "package.json" || normalized === "package-lock.json") {
    return "metadata de pacote";
  }
  if (normalized.startsWith("tests/smoke/")) return "suíte smoke";
  if (normalized === "src/cli/main.ts") return "binário publicado";
  if (normalized.startsWith("src/cli/delivery/bootstrap/")) {
    return "runtime init/adopt/update publicado";
  }
  if (
    normalized === "src/app/use-cases/AdoptWorkspace.ts" ||
    normalized === "src/app/use-cases/ProvisionWorkspace.ts" ||
    normalized === "src/app/use-cases/loadConsumerConfig.ts"
  ) {
    return "provisionamento consumidor";
  }
  if (normalized.startsWith("src/domain/provisioning/")) return "modelo de provisionamento";
  if (
    normalized.startsWith("src/infrastructure/filesystem/") ||
    normalized.startsWith("src/infrastructure/process/") ||
    normalized.startsWith("src/infrastructure/templates/")
  ) {
    return "adapter usado por consumidor";
  }
  if (normalized.startsWith(".core/templates/") || normalized.startsWith(".specify/templates/")) {
    return "templates publicados";
  }
  return null;
}

export function smokeRelevantChangedPaths(paths: readonly string[]): string[] {
  return paths.map(normalizeChangedPath).filter((p) => smokeTriggerReason(p) !== null);
}

export function deriveSmokeReadinessPolicy(input: {
  readonly suspended: boolean;
  readonly changedPaths: readonly string[] | null;
  readonly activeNode: SmokeNodeFact | null;
  readonly nextNode: SmokeNodeFact | null;
}): ReadyCheckSmokePolicy {
  if (input.changedPaths === null) {
    return {
      suspended: input.suspended,
      required: true,
      reason: "não foi possível classificar o diff do PR; smoke real é exigido por segurança",
      changedPaths: null,
      triggerPaths: [],
    };
  }
  const triggerPaths = smokeRelevantChangedPaths(input.changedPaths);
  if (
    input.activeNode?.terminal ||
    input.nextNode?.terminal ||
    input.nextNode?.role === "integration"
  ) {
    return {
      suspended: input.suspended,
      required: true,
      reason: "último nó antes da integração final exige validação real do pacote",
      changedPaths: input.changedPaths.map(normalizeChangedPath),
      triggerPaths: [],
    };
  }
  if (triggerPaths.length > 0) {
    return {
      suspended: input.suspended,
      required: false,
      reason: `PR intermediário com mudança de pacote/runtime consumidor (${triggerPaths.slice(0, 3).join(", ")}); smoke real fica adiado para o fechamento final da spec e para o release`,
      changedPaths: input.changedPaths.map(normalizeChangedPath),
      triggerPaths,
    };
  }
  return {
    suspended: input.suspended,
    required: false,
    reason:
      "PR intermediário sem mudança de pacote/consumidor; smoke real fica adiado para o fechamento final da spec",
    changedPaths: input.changedPaths.map(normalizeChangedPath),
    triggerPaths: [],
  };
}
