/**
 * CLI entrypoint para o gate `ruleset:check` — enforcement da política de
 * merge versionada (ruleset-as-code) contra os workflows reais.
 *
 * Origem: Spec 0024 Checkpoint 2.2. Defeito de classe descoberto na execução:
 * o ruleset `Main Governance` exigia o context `guardrails`, sem produtor desde
 * a consolidação `content-guardrails → repo-validation` (`12a3a28`). Drift
 * SSOT→projeção silencioso, mascarado por admin-bypass. Cf. `[DEC-0024-F04]`.
 *
 * Dois invariantes, EXPLICITAMENTE ranqueados:
 *
 *   PRIMÁRIO  — producibilidade: todo required context do ruleset versionado
 *               tem um produtor ESTÁVEL (não-matriz) em `.github/workflows`.
 *               É o invariante cuja violação CAUSOU o bug. Determinístico,
 *               sem rede — roda em `npm run validate`.
 *
 *   SECUNDÁRIO — paridade: o ruleset vivo no GitHub == o versionado. Pega
 *               edição out-of-band na UI. Detect-only (nunca aplica). Precisa
 *               de snapshot do vivo (`gh api`) — roda em CI (`ruleset-drift`).
 *
 * Exit codes:
 *   0 — invariante satisfeito
 *   1 — invariante violado (producibilidade órfã | drift de paridade)
 *   2 — uso inválido
 *   3 — paridade INDETERMINADA (snapshot vivo ausente/ilegível — provável
 *       limitação de permissão/token; não bloqueia, registra)
 */
import * as fs from "node:fs";
import * as path from "node:path";
import {
  activeReviewPolicyProfile,
  parseReviewPolicy,
  GithubReviewPolicy,
} from "../infrastructure/yaml/reviewPolicyReader.js";
import {
  parseWorkflowChecks,
  WorkflowChecks,
  MatrixProducer,
  StableProducer,
} from "../infrastructure/yaml/workflowChecksReader.js";

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

export const RULESET_PATH = ".github/rulesets/main-governance.json";
export const WORKFLOWS_DIR = ".github/workflows";
export const REVIEW_POLICY_PATH = ".governance/review-policy.yml";

// ---------------------------------------------------------------------------
// Modelo declarativo do ruleset
// ---------------------------------------------------------------------------

export interface RequiredCheck {
  readonly context: string;
  readonly integration_id?: number;
}

export interface RulesetModel {
  /** Objeto declarativo completo (para paridade). */
  readonly raw: Record<string, unknown>;
  readonly requiredContexts: readonly RequiredCheck[];
  readonly pullRequest?: PullRequestRulesetSettings;
}

export interface PullRequestRulesetSettings {
  readonly requiredApprovingReviewCount: number;
  readonly requireCodeOwnerReview: boolean;
  readonly dismissStaleReviewsOnPush: boolean;
  readonly requireLastPushApproval: boolean;
}

export class RulesetParseError extends Error {
  constructor(message: string) {
    super(`Invalid ruleset JSON: ${message}`);
    this.name = "RulesetParseError";
  }
}

export function parseRuleset(jsonContent: string): RulesetModel {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonContent);
  } catch (e) {
    throw new RulesetParseError((e as Error).message);
  }
  if (!raw || typeof raw !== "object") {
    throw new RulesetParseError("conteúdo não é um objeto JSON.");
  }
  const obj = raw as Record<string, unknown>;
  const rules = Array.isArray(obj.rules) ? obj.rules : [];
  const requiredContexts: RequiredCheck[] = [];
  let pullRequest: PullRequestRulesetSettings | undefined;
  for (const rule of rules) {
    if (!rule || typeof rule !== "object") continue;
    const r = rule as Record<string, unknown>;
    if (r.type === "pull_request") {
      const params = r.parameters;
      if (params && typeof params === "object") {
        const p = params as Record<string, unknown>;
        pullRequest = {
          requiredApprovingReviewCount:
            typeof p.required_approving_review_count === "number"
              ? p.required_approving_review_count
              : 0,
          requireCodeOwnerReview: p.require_code_owner_review === true,
          dismissStaleReviewsOnPush: p.dismiss_stale_reviews_on_push === true,
          requireLastPushApproval: p.require_last_push_approval === true,
        };
      }
    }
    if (r.type !== "required_status_checks") continue;
    const params = r.parameters;
    if (!params || typeof params !== "object") continue;
    const list = (params as Record<string, unknown>).required_status_checks;
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const ctx = (item as Record<string, unknown>).context;
      if (typeof ctx !== "string") continue;
      const integrationId = (item as Record<string, unknown>).integration_id;
      requiredContexts.push({
        context: ctx,
        ...(typeof integrationId === "number" ? { integration_id: integrationId } : {}),
      });
    }
  }
  return { raw: obj, requiredContexts, ...(pullRequest ? { pullRequest } : {}) };
}

export function checkGithubReviewPolicy(
  required: GithubReviewPolicy,
  actual: PullRequestRulesetSettings | undefined
): string[] {
  const violations: string[] = [];
  if (!actual) {
    if (
      required.minimumApprovingReviews > 0 ||
      required.requireCodeOwnerReview ||
      required.dismissStaleReviewsOnPush ||
      required.requireLastPushApproval
    ) {
      violations.push(
        "ruleset não declara regra pull_request, mas review-policy exige proteção GitHub."
      );
    }
    return violations;
  }
  if (actual.requiredApprovingReviewCount < required.minimumApprovingReviews) {
    violations.push(
      `required_approving_review_count=${actual.requiredApprovingReviewCount} menor que review-policy.minimum_approving_reviews=${required.minimumApprovingReviews}.`
    );
  }
  if (required.requireCodeOwnerReview && !actual.requireCodeOwnerReview) {
    violations.push("require_code_owner_review=false, mas review-policy exige code owner review.");
  }
  if (required.dismissStaleReviewsOnPush && !actual.dismissStaleReviewsOnPush) {
    violations.push(
      "dismiss_stale_reviews_on_push=false, mas review-policy exige stale reviews descartadas."
    );
  }
  if (required.requireLastPushApproval && !actual.requireLastPushApproval) {
    violations.push(
      "require_last_push_approval=false, mas review-policy exige aprovação do último push."
    );
  }
  return violations;
}

function readGithubReviewPolicy(repoRoot: string): GithubReviewPolicy | null {
  const policyPath = path.join(repoRoot, REVIEW_POLICY_PATH);
  if (!fs.existsSync(policyPath)) return null;
  return activeReviewPolicyProfile(parseReviewPolicy(fs.readFileSync(policyPath, "utf-8"))).github;
}

// ---------------------------------------------------------------------------
// Invariante PRIMÁRIO — producibilidade
// ---------------------------------------------------------------------------

export interface ProducibilityViolation {
  readonly context: string;
  readonly reason: "no-producer" | "matrix-only" | "missing-trigger";
  readonly hint: string;
}

export interface ProducibilityResult {
  readonly ok: boolean;
  readonly required: readonly string[];
  readonly stableProducers: readonly string[];
  readonly violations: readonly ProducibilityViolation[];
}

export function checkProducibility(
  required: readonly RequiredCheck[],
  workflows: readonly WorkflowChecks[],
  externalProducers: readonly string[] = []
): ProducibilityResult {
  const stableMap = new Map<string, StableProducer>();
  const matrixProducers: MatrixProducer[] = [];
  for (const wf of workflows) {
    for (const s of wf.stable) stableMap.set(s.context, s);
    for (const m of wf.matrix) matrixProducers.push(m);
  }

  const violations: ProducibilityViolation[] = [];
  const externalSet = new Set(externalProducers);

  for (const rc of required) {
    if (externalSet.has(rc.context)) continue;

    const stableHit = stableMap.get(rc.context);
    if (stableHit) {
      const hasTrigger = stableHit.triggers.some(
        (t) => t === "pull_request" || t === "pull_request_target" || t === "push"
      );
      if (!hasTrigger) {
        violations.push({
          context: rc.context,
          reason: "missing-trigger",
          hint:
            `produtor encontrado (job "${stableHit.job}" em ${stableHit.workflow}), mas ele não ` +
            `declara eventos de CI/CD base compatíveis na raiz (pull_request, push). Gatilhos ` +
            `atuais: ${stableHit.triggers.join(", ") || "(nenhum)"}. Filtros internos são ignorados.`,
        });
      }
      continue;
    }

    const matrixHit = matrixProducers.find(
      (m) => m.staticPrefix.length > 0 && rc.context.startsWith(m.staticPrefix)
    );
    if (matrixHit) {
      violations.push({
        context: rc.context,
        reason: "matrix-only",
        hint:
          `parece um context expandido por matriz (job "${matrixHit.job}" em ` +
          `${matrixHit.workflow}). Required contexts devem ser ESTÁVEIS — ` +
          `exija um job agregador (ex.: \`needs: [<matriz>]\`), não a expansão.`,
      });
    } else {
      const available = [...stableMap.keys(), ...externalSet].sort().join(", ") || "(nenhum)";
      violations.push({
        context: rc.context,
        reason: "no-producer",
        hint: `nenhum workflow produz este context. Produtores estáveis/externos: ${available}.`,
      });
    }
  }

  return {
    ok: violations.length === 0,
    required: required.map((r) => r.context),
    stableProducers: [...stableMap.keys()].sort(),
    violations,
  };
}

// ---------------------------------------------------------------------------
// Invariante SECUNDÁRIO — paridade (detect-only)
// ---------------------------------------------------------------------------

const PARITY_KEYS = [
  "name",
  "target",
  "enforcement",
  "conditions",
  "bypass_actors",
  "rules",
] as const;

/** Estável (chaves ordenadas) — para comparar objetos independente da ordem. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

/** Projeta só o subconjunto declarativo (descarta id/node_id/created_at/_links…). */
function normalizeForParity(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of PARITY_KEYS) {
    if (key in raw) out[key] = raw[key];
  }
  return out;
}

export interface ParityResult {
  readonly ok: boolean;
  readonly differences: readonly string[];
}

export function checkParity(
  versioned: Record<string, unknown>,
  live: Record<string, unknown>
): ParityResult {
  const nv = normalizeForParity(versioned);
  const nl = normalizeForParity(live);
  if (stableStringify(nv) === stableStringify(nl)) {
    return { ok: true, differences: [] };
  }
  const differences: string[] = [];
  for (const key of PARITY_KEYS) {
    if (stableStringify(nv[key]) !== stableStringify(nl[key])) {
      differences.push(
        `chave "${key}" diverge:\n      versionado: ${stableStringify(nv[key])}\n      vivo:       ${stableStringify(nl[key])}`
      );
    }
  }
  return { ok: false, differences };
}

// ---------------------------------------------------------------------------
// Composition root
// ---------------------------------------------------------------------------

export type RulesetCheckMode = "producibility" | "parity";

export interface MainOptions {
  readonly mode: RulesetCheckMode;
  readonly logger?: Logger;
  /** Caminho do snapshot do ruleset vivo (modo paridade). */
  readonly livePath?: string;
  /** Lista de provedores externos autorizados. */
  readonly externalProducers?: readonly string[];
}

function readWorkflows(repoRoot: string): WorkflowChecks[] {
  const dir = path.join(repoRoot, WORKFLOWS_DIR);
  if (!fs.existsSync(dir)) return [];
  const out: WorkflowChecks[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".yml") && !entry.name.endsWith(".yaml")) continue;
    const content = fs.readFileSync(path.join(dir, entry.name), "utf-8");
    out.push(parseWorkflowChecks(content, entry.name));
  }
  return out;
}

export function main(repoRoot: string, options: MainOptions): number {
  const logger = options.logger ?? defaultLogger;
  const rulesetFile = path.join(repoRoot, RULESET_PATH);

  if (!fs.existsSync(rulesetFile)) {
    logger.error(
      `❌ Ruleset versionado ausente: ${RULESET_PATH}\n` +
        `   ruleset-as-code é a fonte da verdade da política de merge (Checkpoint 2.2).`
    );
    return 1;
  }

  let versioned: RulesetModel;
  try {
    versioned = parseRuleset(fs.readFileSync(rulesetFile, "utf-8"));
  } catch (e) {
    logger.error(`❌ ${(e as Error).message}`);
    return 1;
  }

  if (options.mode === "producibility") {
    let reviewPolicyViolations: string[] = [];
    try {
      const githubPolicy = readGithubReviewPolicy(repoRoot);
      if (githubPolicy) {
        reviewPolicyViolations = checkGithubReviewPolicy(githubPolicy, versioned.pullRequest);
      }
    } catch (e) {
      logger.error(`❌ ${(e as Error).message}`);
      return 1;
    }
    const result = checkProducibility(
      versioned.requiredContexts,
      readWorkflows(repoRoot),
      options.externalProducers
    );
    if (result.ok && reviewPolicyViolations.length === 0) {
      logger.info(
        `✅ ruleset:check (PRIMÁRIO/producibilidade) — ${result.required.length} required ` +
          `context(s) com produtor estável: ${result.required.join(", ") || "(nenhum)"}.`
      );
      return 0;
    }
    if (reviewPolicyViolations.length > 0) {
      logger.error(
        `❌ ruleset:check (review-policy) FALHOU — ruleset versionado menos estrito que ${REVIEW_POLICY_PATH}:`
      );
      for (const v of reviewPolicyViolations) logger.error(`  - ${v}`);
    }
    if (result.ok) return 1;
    logger.error(
      `❌ ruleset:check (PRIMÁRIO/producibilidade) FALHOU — ` +
        `required context(s) sem produtor estável em ${WORKFLOWS_DIR}:`
    );
    for (const v of result.violations) {
      logger.error(`  - "${v.context}" [${v.reason}] → ${v.hint}`);
    }
    logger.error(
      `\nClasse do defeito: required-context órfão (drift SSOT→projeção). ` +
        `Reconcilie ${RULESET_PATH} com os workflows. Cf. [DEC-0024-F04].`
    );
    return 1;
  }

  // modo paridade
  if (!options.livePath) {
    logger.error(
      `❌ modo --parity exige --live <snapshot.json> ` +
        `(snapshot do ruleset vivo via \`gh api\`).`
    );
    return 2;
  }
  if (!fs.existsSync(options.livePath)) {
    logger.error(
      `⚠ ruleset:check (SECUNDÁRIO/paridade) INDETERMINADO — ` +
        `snapshot do ruleset vivo ausente em ${options.livePath}.`
    );
    logger.error(
      `   Provável limitação de permissão/token ao ler o ruleset vivo. ` +
        `Não bloqueia (limitação registrada); o invariante PRIMÁRIO segue garantido.`
    );
    return 3;
  }
  let live: RulesetModel;
  try {
    live = parseRuleset(fs.readFileSync(options.livePath, "utf-8"));
  } catch (e) {
    logger.error(
      `⚠ ruleset:check (paridade) INDETERMINADO — snapshot vivo ilegível: ${(e as Error).message}`
    );
    return 3;
  }
  const result = checkParity(versioned.raw, live.raw);
  if (result.ok) {
    logger.info(`✅ ruleset:check (SECUNDÁRIO/paridade) — ruleset vivo == versionado.`);
    return 0;
  }
  logger.error(
    `❌ ruleset:check (SECUNDÁRIO/paridade) FALHOU — drift entre ruleset vivo e versionado:`
  );
  for (const d of result.differences) logger.error(`  - ${d}`);
  logger.error(
    `\nCorreção: reconcilie o ruleset vivo com ${RULESET_PATH} ` +
      `(detect-only — a aplicação é ação humana autorizada, nunca automática).`
  );
  return 1;
}
