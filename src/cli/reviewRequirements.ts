/**
 * Governança de reviews em QUATRO conceitos independentes (CO-4, rodada 8):
 *
 *   1. CATÁLOGO  — `review_types`: o que cada review É (identidade, aliases,
 *      objetivo, vetores, template). Capacidade disponível ≠ obrigação.
 *   2. APLICABILIDADE — onde o tipo faz sentido (pr_profile, labels,
 *      changed_paths). Tipo não aplicável explica por quê; dado ausente vira
 *      `unknown` (nunca `false` silencioso).
 *   3. REQUISITO — disabled | optional | recommended | required, resolvido por
 *      defaults → regras do repo (prioridade; conflito de mesma prioridade =
 *      ERRO, nunca escolha arbitrária) → override situado do nó (tightening/
 *      relaxation governados pela policy, com actor+reason).
 *   4. ESTADO — missing | current | stale | in-progress (freshness do artefato
 *      contra a cabeça FUNCIONAL). Freshness NÃO cria obrigação.
 *
 * SOMENTE `requirement = required` + `state != current` (ou decisão ≠ approved)
 * bloqueia Ready/gate/fechamento. Módulo PURO: nenhuma leitura de fs/git aqui.
 */
import {
  ReviewPolicy,
  ReviewTypePolicy,
  ReviewApplicabilityPolicy,
  ReviewApplicabilitySelector,
  ReviewRequirementRule,
  ReviewRequirementLevel,
  REQUIREMENT_LEVELS,
} from "../infrastructure/yaml/reviewPolicyReader.js";

// ── Catálogo ─────────────────────────────────────────────────────────────────

export interface ReviewTypeDef {
  readonly id: string;
  readonly source: "framework" | "repository";
  readonly enabled: boolean;
  readonly title: string;
  readonly aliases: readonly string[];
  readonly objective: string;
  readonly vectors: readonly string[];
  /** Template específico do tipo; null ⇒ fallback no template genérico de review. */
  readonly template: string | null;
}

/**
 * Defaults DISTRIBUÍDOS do framework: TA e AR existem em qualquer consumidor
 * (mesmo sem review-policy.yml), `enabled` e `optional`. O framework OFERECE
 * os tipos; nenhum review semântico é obrigatório por padrão — quem decide
 * força/escopo é a policy do repositório.
 */
export const FRAMEWORK_REVIEW_TYPES: readonly ReviewTypeDef[] = [
  {
    id: "technical_audit",
    source: "framework",
    enabled: true,
    title: "Technical Audit",
    aliases: ["technical-audit", "technical_audit", "auditoria-tecnica"],
    objective:
      "Auditoria tecnica independente da implementacao do checkpoint: o codigo " +
      "faz o que afirma, sem regressao, com evidencia executavel.",
    vectors: [
      "correctness do comportamento implementado vs declarado",
      "testes (cobertura dos caminhos novos; regressoes; determinismo)",
      "seguranca (segredos, injecao, paths, dados sensiveis em artefatos)",
      "cross-platform (Windows/Linux/macOS; sem shell-isms)",
      "packaging/distribuicao (npm pack; dist/; bins)",
      "falhas e fallbacks (degradacao explicita; nada silencioso)",
      "integridade de estado (SSOT vs projecoes; selos/fingerprints)",
      "performance apenas onde houver risco real (sem micro-otimizacao)",
    ],
    template: null,
  },
  {
    id: "architectural_review",
    source: "framework",
    enabled: true,
    title: "Architectural Review",
    aliases: ["architectural-review", "architectural_review", "revisao-arquitetural"],
    objective:
      "Revisao arquitetural independente: a entrega sustenta a tese do nó e nao " +
      "hipoteca os nós seguintes.",
    vectors: [
      "aderencia a tese do checkpoint e ao plan.md/ADRs aplicaveis",
      "fronteiras (dominio puro vs I/O; gateways; acoplamento)",
      "SSOT vs projecoes (nenhuma segunda fonte de verdade)",
      "abstracoes (nem faltando nem especulativas; nomes honestos)",
      "temporalidade (evento vs estado continuo; staleness detectavel)",
      "lifecycle/governanca (selos, gates, append-only respeitados)",
      "escopo (nada fora do checkpoint; nada do proximo nó antecipado)",
      "integracao com os nós seguintes da topologia",
      "riscos e decisoes nao registradas (debito narrativo)",
    ],
    template: null,
  },
];

const TYPE_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

export interface ReviewTypeRegistry {
  /** Tipos na ordem canônica (framework primeiro, depois repository). */
  readonly types: readonly ReviewTypeDef[];
  /** alias|id (lowercase) → id canônico. Inclui tipos disabled (diagnóstico). */
  readonly byAlias: Readonly<Record<string, string>>;
}

export interface RegistryBuildResult {
  readonly registry: ReviewTypeRegistry;
  readonly errors: readonly string[];
  /** Avisos não-fatais (ex.: depreciação de review_lanes/required_review_roles). */
  readonly warnings: readonly string[];
}

function mergeTypeDef(base: ReviewTypeDef, override: ReviewTypePolicy): ReviewTypeDef {
  return {
    ...base,
    enabled: override.enabled ?? base.enabled,
    title: override.title ?? base.title,
    aliases: override.aliases ?? base.aliases,
    objective: override.objective ?? base.objective,
    vectors: override.vectors ?? base.vectors,
    template: override.template !== undefined ? override.template : base.template,
  };
}

/**
 * Constrói o registry: defaults do framework + `review_types` da policy
 * (override de nativos OU tipos do repositório, SEM mudança no core).
 * `review_lanes` (legado) é absorvido como objetivo/vetores dos nativos.
 */
export function buildReviewTypeRegistry(policy: ReviewPolicy | null): RegistryBuildResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const byId = new Map<string, ReviewTypeDef>();
  for (const def of FRAMEWORK_REVIEW_TYPES) byId.set(def.id, def);

  // Legado: review_lanes → objetivo/vetores dos tipos nativos correspondentes.
  if (policy?.lanes) {
    for (const [id, lane] of Object.entries(policy.lanes)) {
      const base = byId.get(id);
      if (base) {
        byId.set(id, { ...base, objective: lane.objective, vectors: lane.vectors });
      } else {
        warnings.push(
          `review_lanes.${id} não corresponde a um tipo nativo — declare-o em review_types (review_lanes é legado e cobre apenas objetivo/vetores).`
        );
      }
    }
    if (!policy.reviewTypes) {
      warnings.push(
        "review_lanes é LEGADO — migre objetivo/vetores para review_types (catálogo governado; suporta tipos do repositório)."
      );
    }
  }

  if (policy?.reviewTypes) {
    for (const [id, def] of Object.entries(policy.reviewTypes)) {
      if (!TYPE_ID_PATTERN.test(id)) {
        errors.push(
          `review_types.${id}: id deve ser slug canônico ([a-z][a-z0-9_]*; ex.: security_review).`
        );
        continue;
      }
      const base = byId.get(id);
      if (base) {
        if (def.source === "repository") {
          errors.push(
            `review_types.${id}: tipo nativo do framework não pode declarar source: repository (use o id para customizar o nativo ou escolha outro id).`
          );
          continue;
        }
        byId.set(id, mergeTypeDef(base, def));
        continue;
      }
      if (!def.objective) {
        errors.push(`review_types.${id}: "objective" é obrigatório para tipo do repositório.`);
        continue;
      }
      if (!def.vectors || def.vectors.length === 0) {
        errors.push(
          `review_types.${id}: ao menos um vetor é obrigatório (vectors: lista não-vazia).`
        );
        continue;
      }
      byId.set(id, {
        id,
        source: "repository",
        enabled: def.enabled ?? true,
        title: def.title ?? id,
        aliases: def.aliases ?? [id, id.replace(/_/g, "-")],
        objective: def.objective,
        vectors: def.vectors,
        template: def.template ?? null,
      });
    }
  }

  // Aliases únicos (cross-type): id e aliases compartilham o namespace.
  const byAlias: Record<string, string> = {};
  const claim = (alias: string, owner: string): void => {
    const key = alias.toLowerCase();
    const existing = byAlias[key];
    if (existing !== undefined && existing !== owner) {
      errors.push(
        `alias "${alias}" duplicado entre os tipos "${existing}" e "${owner}" — aliases devem ser únicos no catálogo.`
      );
      return;
    }
    byAlias[key] = owner;
  };
  for (const def of byId.values()) {
    claim(def.id, def.id);
    for (const alias of def.aliases) claim(alias, def.id);
  }

  const types = [...byId.values()].sort((a, b) =>
    a.source === b.source ? a.id.localeCompare(b.id) : a.source === "framework" ? -1 : 1
  );
  return { registry: { types, byAlias }, errors, warnings };
}

/** Resolve alias/id → tipo do catálogo; null = desconhecido (diagnóstico no caller). */
export function resolveReviewType(registry: ReviewTypeRegistry, raw: string): ReviewTypeDef | null {
  const id = registry.byAlias[raw.toLowerCase()];
  if (!id) return null;
  return registry.types.find((t) => t.id === id) ?? null;
}

/** Lista legível dos tipos disponíveis (diagnóstico de tipo desconhecido). */
export function availableTypesLine(registry: ReviewTypeRegistry): string {
  return registry.types.map((t) => `${t.id}${t.enabled ? "" : " (disabled)"}`).join(" | ");
}

// ── Aplicabilidade ───────────────────────────────────────────────────────────

/** Perfis de PR do corpo/topologia (governance-pr-check). */
export type PrProfileId = "execution" | "governance" | "integration" | "fast-track";

export interface ApplicabilityContext {
  /** Perfil do PR (role do nó na topologia; fast-track via label). null = não observável. */
  readonly prProfile: string | null;
  /** Labels do PR; null = fonte remota não observada (⇒ unknown, nunca false). */
  readonly labels: readonly string[] | null;
  /** Paths alterados (base..head); null = não derivável localmente (⇒ unknown). */
  readonly changedPaths: readonly string[] | null;
}

export type ApplicabilityValue = "yes" | "no" | "unknown";

export interface ApplicabilityResult {
  readonly value: ApplicabilityValue;
  /** Por que aplicável/não aplicável/indeterminado — citável no briefing. */
  readonly reasons: readonly string[];
}

/**
 * Glob determinístico mínimo para changed_paths: `**` cruza diretórios, `*`
 * não cruza `/`. Sem dependência externa; avaliação local e reprodutível.
 */
export function matchesGlob(pattern: string, filePath: string): boolean {
  const globstar = "\u0000";
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, globstar)
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .split(globstar)
    .join(".*");
  return new RegExp(`^${escaped}$`).test(filePath.replace(/\\/g, "/"));
}

type SelectorOutcome = { matched: ApplicabilityValue; reason: string };

function evaluateSelector(
  selector: ReviewApplicabilitySelector,
  ctx: ApplicabilityContext
): SelectorOutcome[] {
  const outcomes: SelectorOutcome[] = [];
  if (selector.prProfile !== undefined) {
    if (ctx.prProfile === null) {
      outcomes.push({ matched: "unknown", reason: "pr_profile não observável neste contexto" });
    } else if (ctx.prProfile === selector.prProfile) {
      outcomes.push({ matched: "yes", reason: `pr_profile = ${ctx.prProfile}` });
    } else {
      outcomes.push({
        matched: "no",
        reason: `pr_profile ${ctx.prProfile} ≠ ${selector.prProfile}`,
      });
    }
  }
  if (selector.labelsAny !== undefined) {
    if (ctx.labels === null) {
      outcomes.push({
        matched: "unknown",
        reason: "labels do PR não observadas (fonte remota indisponível) — avaliação degradada",
      });
    } else {
      const hit = selector.labelsAny.find((l) => ctx.labels!.includes(l));
      outcomes.push(
        hit
          ? { matched: "yes", reason: `label "${hit}" presente` }
          : { matched: "no", reason: `nenhuma das labels [${selector.labelsAny.join(", ")}]` }
      );
    }
  }
  if (selector.changedPathsAny !== undefined) {
    if (ctx.changedPaths === null) {
      outcomes.push({
        matched: "unknown",
        reason: "changed paths não deriváveis (base não observável) — avaliação degradada",
      });
    } else {
      const hit = selector.changedPathsAny.find((pattern) =>
        ctx.changedPaths!.some((p) => matchesGlob(pattern, p))
      );
      outcomes.push(
        hit
          ? { matched: "yes", reason: `changed path casa "${hit}"` }
          : { matched: "no", reason: `nenhum path casa [${selector.changedPathsAny.join(", ")}]` }
      );
    }
  }
  return outcomes;
}

/** Selector inteiro = AND das condições presentes (yes só se todas yes). */
function selectorValue(
  selector: ReviewApplicabilitySelector,
  ctx: ApplicabilityContext
): SelectorOutcome {
  const outcomes = evaluateSelector(selector, ctx);
  if (outcomes.length === 0) return { matched: "yes", reason: "selector vazio (sempre aplica)" };
  if (outcomes.some((o) => o.matched === "no")) {
    return outcomes.find((o) => o.matched === "no")!;
  }
  if (outcomes.some((o) => o.matched === "unknown")) {
    return outcomes.find((o) => o.matched === "unknown")!;
  }
  return { matched: "yes", reason: outcomes.map((o) => o.reason).join(" + ") };
}

/**
 * Aplicabilidade do tipo no contexto: sem entry na policy ⇒ aplicável em
 * qualquer PR. Com entry: OR dos selectors (`any`); dado necessário ausente
 * propaga `unknown` — degradação declarada, nunca conclusão inventada.
 */
export function evaluateApplicability(
  typeId: string,
  applicability: Readonly<Record<string, ReviewApplicabilityPolicy>> | undefined,
  ctx: ApplicabilityContext
): ApplicabilityResult {
  const entry = applicability?.[typeId];
  if (!entry) return { value: "yes", reasons: ["sem restrição de aplicabilidade declarada"] };
  const results = entry.any.map((s) => selectorValue(s, ctx));
  const yes = results.find((r) => r.matched === "yes");
  if (yes) return { value: "yes", reasons: [yes.reason] };
  if (results.some((r) => r.matched === "unknown")) {
    return {
      value: "unknown",
      reasons: results.filter((r) => r.matched === "unknown").map((r) => r.reason),
    };
  }
  return { value: "no", reasons: results.map((r) => r.reason) };
}

// ── Requisito ────────────────────────────────────────────────────────────────

const LEVEL_RANK: Readonly<Record<ReviewRequirementLevel, number>> = {
  disabled: 0,
  optional: 1,
  recommended: 2,
  required: 3,
};

export interface NodeReviewOverride {
  readonly requirement: ReviewRequirementLevel;
  readonly reason?: string;
  readonly actor?: string;
}

export interface ResolvedRequirement {
  readonly typeId: string;
  readonly level: ReviewRequirementLevel;
  /** Origem da decisão: framework-default | repo-default | rule:<id> | node-override. */
  readonly source: string;
  readonly matchedRuleIds: readonly string[];
  /** Fatos usados/degradações (regras puladas por dado ausente etc.). */
  readonly notes: readonly string[];
  /** Conflitos/violações de configuração — NUNCA resolvidos arbitrariamente. */
  readonly errors: readonly string[];
}

/** Uma condição `when` é o MESMO shape de selector (AND das condições presentes). */
function ruleMatches(
  rule: ReviewRequirementRule,
  ctx: ApplicabilityContext
): { matched: ApplicabilityValue; reason: string } {
  return selectorValue(rule.when, ctx);
}

/**
 * Tradução LEGADA: `profiles.<ativo>.<kind>.required_review_roles` vira regras
 * `required` sintéticas (comportamento preservado; aviso de depreciação no
 * registry/policy). implementation_pr cobre execution+governance; integration_pr
 * cobre integration — o MESMO mapeamento do consumo antigo.
 */
export function legacyRequiredRules(policy: ReviewPolicy): ReviewRequirementRule[] {
  const profile = policy.profiles[policy.activeProfile];
  if (!profile) return [];
  const rules: ReviewRequirementRule[] = [];
  for (const prProfile of ["execution", "governance"]) {
    for (const role of profile.implementationPr.requiredReviewRoles) {
      rules.push({
        id: `legacy:required_review_roles:implementation_pr:${role}`,
        priority: 100,
        when: { prProfile },
        set: { [role]: "required" },
      });
    }
  }
  for (const role of profile.integrationPr.requiredReviewRoles) {
    rules.push({
      id: `legacy:required_review_roles:integration_pr:${role}`,
      priority: 100,
      when: { prProfile: "integration" },
      set: { [role]: "required" },
    });
  }
  return rules;
}

export function legacyDeprecationWarnings(policy: ReviewPolicy): string[] {
  const profile = policy.profiles[policy.activeProfile];
  if (!profile) return [];
  const legacy = [
    ...profile.implementationPr.requiredReviewRoles,
    ...profile.integrationPr.requiredReviewRoles,
  ];
  if (legacy.length === 0) return [];
  return [
    `required_review_roles é DEPRECIADO (perfil "${policy.activeProfile}"): perfis de colaboração não impõem reviews semânticos. ` +
      `Comportamento preservado via regras required sintéticas — migre para review_requirements.rules (tipos: ${[...new Set(legacy)].join(", ")}).`,
  ];
}

/**
 * Resolve o requirement EFETIVO de um tipo:
 *   optional (framework) → defaults da policy → regras (maior prioridade vence;
 *   conflito de MESMA prioridade com valores distintos = erro de policy) →
 *   override situado do nó (tightening/relaxation governados).
 */
export function resolveRequirement(
  typeId: string,
  policy: ReviewPolicy | null,
  ctx: ApplicabilityContext,
  nodeOverride?: NodeReviewOverride
): ResolvedRequirement {
  const notes: string[] = [];
  const errors: string[] = [];
  let level: ReviewRequirementLevel = "optional";
  let source = "framework-default";

  const declaredDefault = policy?.requirements?.defaults?.[typeId];
  if (declaredDefault !== undefined) {
    level = declaredDefault;
    source = "repo-default";
  }

  const rules = [
    ...(policy?.requirements?.rules ?? []),
    ...(policy ? legacyRequiredRules(policy) : []),
  ].filter((r) => r.set[typeId] !== undefined);

  const matched: ReviewRequirementRule[] = [];
  for (const rule of rules) {
    const outcome = ruleMatches(rule, ctx);
    if (outcome.matched === "yes") {
      matched.push(rule);
    } else if (outcome.matched === "unknown") {
      notes.push(
        `regra "${rule.id}" NÃO avaliada (${outcome.reason}) — resultado pode estar degradado.`
      );
    }
  }

  if (matched.length > 0) {
    const top = Math.max(...matched.map((r) => r.priority));
    const winners = matched.filter((r) => r.priority === top);
    const values = new Set(winners.map((r) => r.set[typeId]!));
    if (values.size > 1) {
      errors.push(
        `conflito de policy para "${typeId}": regras de MESMA prioridade (${top}) com valores incompatíveis — ` +
          winners.map((r) => `${r.id}→${r.set[typeId]}`).join(" vs ") +
          ". Ajuste as prioridades; o framework não escolhe arbitrariamente."
      );
    } else {
      level = winners[0].set[typeId]!;
      source = `rule:${winners[0].id}`;
    }
  }

  if (nodeOverride) {
    const overridePolicy = policy?.overridePolicy;
    const allowTightening = overridePolicy?.allowTightening ?? true;
    const allowRelaxation = overridePolicy?.allowRelaxation ?? false;
    const requires = overridePolicy?.relaxationRequires ?? ["actor", "reason"];
    const tightens = LEVEL_RANK[nodeOverride.requirement] > LEVEL_RANK[level];
    const relaxes = LEVEL_RANK[nodeOverride.requirement] < LEVEL_RANK[level];
    if (tightens && !allowTightening) {
      errors.push(
        `override do nó para "${typeId}" (${level} → ${nodeOverride.requirement}) negado: allow_tightening: false na policy.`
      );
    } else if (relaxes && !allowRelaxation) {
      errors.push(
        `override do nó para "${typeId}" (${level} → ${nodeOverride.requirement}) negado: relaxation NÃO permitida ` +
          `(review_requirement_overrides.allow_relaxation: false) — não existe waiver implícito.`
      );
    } else {
      if (relaxes) {
        const missing = requires.filter(
          (field) =>
            (field === "actor" && !nodeOverride.actor) ||
            (field === "reason" && !nodeOverride.reason)
        );
        if (missing.length > 0) {
          errors.push(
            `override do nó para "${typeId}" relaxa ${level} → ${nodeOverride.requirement} sem ${missing.join("+")} — relaxation exige decisão governada e atribuída.`
          );
        }
      }
      if (errors.length === 0) {
        level = nodeOverride.requirement;
        source = `node-override${nodeOverride.actor ? ` (${nodeOverride.actor})` : ""}`;
        if (nodeOverride.reason) notes.push(`override reason: ${nodeOverride.reason}`);
      }
    }
  }

  return {
    typeId,
    level,
    source,
    matchedRuleIds: matched.map((r) => r.id),
    notes,
    errors,
  };
}

// ── Estado / freshness ───────────────────────────────────────────────────────

export type ReviewArtifactState = "missing" | "current" | "stale" | "in-progress";

/** Cabeça de um subject_ref (`base..head` → head; SHA único → ele mesmo). */
export function refHead(subjectRef: string): string {
  const parts = subjectRef.split("..");
  return parts[parts.length - 1].replace(/^\.+/, "");
}

/** SHAs iguais por prefixo (7..40 chars; reviews podem registrar short SHA). */
export function sameSha(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.startsWith(y) || y.startsWith(x);
}

export interface ReviewStateInput {
  /** subject_ref mais recente da lane (último evento com subject_ref ou o do review). */
  readonly latestSubjectRef: string | null;
  /** Existe artefato de review da lane no checkpoint? */
  readonly hasReview: boolean;
  /** Cabeça FUNCIONAL auditável atual. */
  readonly functionalHead: string | null;
}

/**
 * Estado do artefato. Um review STALE significa SOMENTE "este artefato não
 * cobre a cabeça funcional atual" — nunca, por si só, uma obrigação.
 */
export function deriveReviewState(input: ReviewStateInput): ReviewArtifactState {
  if (!input.hasReview) return "missing";
  if (
    input.latestSubjectRef &&
    input.functionalHead &&
    sameSha(refHead(input.latestSubjectRef), input.functionalHead)
  ) {
    return "current";
  }
  // Sem proveniência machine-readable ⇒ nunca assumir fresh.
  return "stale";
}

// ── Status efetivo ───────────────────────────────────────────────────────────

export interface EffectiveReviewStatus {
  readonly typeId: string;
  readonly title: string;
  readonly applicability: ApplicabilityValue;
  readonly applicabilityReasons: readonly string[];
  readonly requirement: ReviewRequirementLevel;
  readonly requirementSource: string;
  readonly matchedRuleIds: readonly string[];
  readonly state: ReviewArtifactState;
  /** Decisão do review existente (approved | changes_requested | blocked) ou null. */
  readonly decision: string | null;
  /** true ⟺ requirement=required E (state≠current OU decision≠approved). */
  readonly blocking: boolean;
  readonly notes: readonly string[];
  readonly errors: readonly string[];
}

export interface EffectiveStatusInput {
  readonly registry: ReviewTypeRegistry;
  readonly policy: ReviewPolicy | null;
  readonly ctx: ApplicabilityContext;
  readonly nodeOverrides?: Readonly<Record<string, NodeReviewOverride>>;
  /** Estado observado por tipo (reviews/events da lane no checkpoint). */
  readonly observed: Readonly<
    Record<string, { latestSubjectRef: string | null; decision: string | null }>
  >;
  readonly functionalHead: string | null;
}

/**
 * Deriva o status EFETIVO de todos os tipos habilitados do catálogo no
 * contexto dado. `blocking` é a ÚNICA saída que pode travar Ready/gate.
 */
export function deriveEffectiveReviewStatuses(
  input: EffectiveStatusInput
): readonly EffectiveReviewStatus[] {
  const statuses: EffectiveReviewStatus[] = [];
  for (const type of input.registry.types) {
    if (!type.enabled) continue;
    const applicability = evaluateApplicability(type.id, input.policy?.applicability, input.ctx);
    const requirement = resolveRequirement(
      type.id,
      input.policy,
      input.ctx,
      input.nodeOverrides?.[type.id]
    );
    const observed = input.observed[type.id] ?? { latestSubjectRef: null, decision: null };
    const state = deriveReviewState({
      latestSubjectRef: observed.latestSubjectRef,
      hasReview: observed.decision !== null,
      functionalHead: input.functionalHead,
    });
    // Não aplicável ⇒ requirement não opera (disabled-equivalente no contexto).
    const effectiveLevel = applicability.value === "no" ? "disabled" : requirement.level;
    const blocking =
      effectiveLevel === "required" && !(state === "current" && observed.decision === "approved");
    statuses.push({
      typeId: type.id,
      title: type.title,
      applicability: applicability.value,
      applicabilityReasons: applicability.reasons,
      requirement: effectiveLevel,
      requirementSource:
        applicability.value === "no" ? "não aplicável neste contexto" : requirement.source,
      matchedRuleIds: requirement.matchedRuleIds,
      state,
      decision: observed.decision,
      blocking,
      notes: requirement.notes,
      errors: requirement.errors,
    });
  }
  return statuses;
}

/** Linha compacta de um status (handoff/briefing/pr-ready). */
export function renderStatusLine(s: EffectiveReviewStatus): string {
  if (s.applicability === "no") {
    return `${s.typeId}: não aplicável (${s.applicabilityReasons[0] ?? "restrição de aplicabilidade"})`;
  }
  const freshness = s.state;
  const block = s.blocking ? "BLOQUEIA" : "não bloqueia";
  return `${s.typeId}: ${s.requirement} · ${freshness}${s.decision ? ` (${s.decision})` : ""} · ${block}`;
}

export function isRequirementLevel(value: unknown): value is ReviewRequirementLevel {
  return typeof value === "string" && (REQUIREMENT_LEVELS as readonly string[]).includes(value);
}
