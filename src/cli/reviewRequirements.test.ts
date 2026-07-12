/**
 * Catálogo × aplicabilidade × requisito × estado (CO-4, rodada 8).
 *
 * Tese sob teste: CAPACIDADE DISPONÍVEL ≠ OBRIGAÇÃO — o framework oferece os
 * tipos; o repositório decide força/escopo; somente required+não-current
 * bloqueia; freshness nunca cria obrigação.
 */
import {
  buildReviewTypeRegistry,
  deriveEffectiveReviewStatuses,
  deriveReviewState,
  evaluateApplicability,
  legacyRequiredRules,
  legacyDeprecationWarnings,
  matchesGlob,
  resolveRequirement,
  resolveReviewType,
  reviewPlanDecisionIssues,
  reviewPlanToNodeOverrides,
} from "./reviewRequirements.js";
import { ReviewPolicy, parseReviewPolicy } from "../infrastructure/yaml/reviewPolicyReader.js";

const MINIMAL_PROFILES = `
active_profile: solo
profiles:
  solo:
    implementation_pr:
      required_native_approvals: 0
    integration_pr:
      required_native_approvals: 0
    accepted_findings:
      require_resolution: false
      require_verification_event_for_fixed: false
    github:
      minimum_approving_reviews: 1
      require_code_owner_review: false
      dismiss_stale_reviews_on_push: false
      require_last_push_approval: false
`;

function policy(extra: string): ReviewPolicy {
  return parseReviewPolicy(`${MINIMAL_PROFILES}\n${extra}`);
}

const CTX = { prProfile: "execution", labels: [] as string[], changedPaths: [] as string[] };

describe("registry — catálogo de tipos [CO-4 r8]", () => {
  it("1/2 — TA e AR nativos carregados mesmo SEM policy; defaults optional", () => {
    const { registry, errors } = buildReviewTypeRegistry(null);
    expect(errors).toHaveLength(0);
    expect(registry.types.map((t) => t.id)).toEqual(["architectural_review", "technical_audit"]);
    for (const t of registry.types) {
      expect(t.source).toBe("framework");
      expect(t.enabled).toBe(true);
      const req = resolveRequirement(t.id, null, CTX);
      expect(req.level).toBe("optional");
      expect(req.source).toBe("framework-default");
    }
  });

  it("3/4 — tipo customizado válido com aliases entra no catálogo sem mudança no core", () => {
    const p = policy(`
review_types:
  mece_review:
    source: repository
    enabled: true
    title: MECE Review
    aliases: [mece-review, mece_review]
    objective: Avaliar se a decomposicao e MECE e operacionalmente legivel.
    vectors:
      - sobreposicao entre categorias
      - lacunas de cobertura
`);
    const { registry, errors } = buildReviewTypeRegistry(p);
    expect(errors).toHaveLength(0);
    expect(resolveReviewType(registry, "mece-review")?.id).toBe("mece_review");
    expect(resolveReviewType(registry, "MECE_REVIEW")?.id).toBe("mece_review");
    expect(resolveReviewType(registry, "mece_review")?.source).toBe("repository");
  });

  it("5 — alias duplicado entre tipos falha", () => {
    const p = policy(`
review_types:
  security_review:
    objective: x
    vectors: [a]
    aliases: [technical-audit]
`);
    const { errors } = buildReviewTypeRegistry(p);
    expect(errors.some((e) => e.includes('alias "technical-audit" duplicado'))).toBe(true);
  });

  it("6/7 — tipo do repositório sem objetivo ou sem vetores falha", () => {
    const semObjetivo = buildReviewTypeRegistry(
      policy(`
review_types:
  foo_review:
    vectors: [a]
`)
    );
    expect(semObjetivo.errors.some((e) => e.includes("objective"))).toBe(true);

    const semVetores = buildReviewTypeRegistry(
      policy(`
review_types:
  foo_review:
    objective: x
`)
    );
    expect(semVetores.errors.some((e) => e.includes("vetor"))).toBe(true);
  });

  it("8 — tipo disabled permanece resolvível (diagnóstico) mas fora dos statuses efetivos", () => {
    const p = policy(`
review_types:
  technical_audit:
    enabled: false
`);
    const { registry } = buildReviewTypeRegistry(p);
    expect(resolveReviewType(registry, "technical-audit")?.enabled).toBe(false);
    const statuses = deriveEffectiveReviewStatuses({
      registry,
      policy: p,
      ctx: CTX,
      observed: {},
      functionalHead: "abc1234",
    });
    expect(statuses.map((s) => s.typeId)).not.toContain("technical_audit");
  });

  it("9 — tipo desconhecido não resolve (caller lista os disponíveis)", () => {
    const { registry } = buildReviewTypeRegistry(null);
    expect(resolveReviewType(registry, "tipo-inexistente")).toBeNull();
  });

  it("review_lanes legado é absorvido como objetivo/vetores do nativo (com aviso)", () => {
    const p = policy(`
review_lanes:
  technical_audit:
    objective: Objetivo customizado da lane legada.
    vectors: [vetor-legado]
`);
    const { registry, warnings, errors } = buildReviewTypeRegistry(p);
    expect(errors).toHaveLength(0);
    expect(resolveReviewType(registry, "technical_audit")?.objective).toBe(
      "Objetivo customizado da lane legada."
    );
    expect(warnings.some((w) => w.includes("review_lanes é LEGADO"))).toBe(true);
  });
});

describe("requirements — defaults, regras, prioridade e conflito [CO-4 r8]", () => {
  const RULES = `
review_requirements:
  defaults:
    technical_audit: optional
    architectural_review: optional
  rules:
    - id: recommend-architecture-for-governance
      priority: 100
      when:
        pr_profile: governance
      set:
        architectural_review: recommended
    - id: require-architecture-for-governance-high
      priority: 200
      when:
        pr_profile: governance
      set:
        architectural_review: required
`;

  it("17 — maior prioridade vence", () => {
    const p = policy(RULES);
    const r = resolveRequirement("architectural_review", p, { ...CTX, prProfile: "governance" });
    expect(r.level).toBe("required");
    expect(r.source).toBe("rule:require-architecture-for-governance-high · repository-policy");
    expect(r.matchedRuleIds).toContain("recommend-architecture-for-governance");
  });

  it("18 — conflito de MESMA prioridade com valores incompatíveis FALHA (sem escolha arbitrária)", () => {
    const p = policy(`
review_requirements:
  rules:
    - id: rule-a
      priority: 100
      when:
        pr_profile: execution
      set:
        technical_audit: required
    - id: rule-b
      priority: 100
      when:
        pr_profile: execution
      set:
        technical_audit: disabled
`);
    const r = resolveRequirement("technical_audit", p, CTX);
    expect(r.errors.some((e) => e.includes("MESMA prioridade"))).toBe(true);
  });

  it("regra com label não observável NÃO escala (nota de degradação, nunca conclusão inventada)", () => {
    const p = policy(`
review_requirements:
  rules:
    - id: require-on-label
      priority: 200
      when:
        labels:
          any: [security-sensitive]
      set:
        technical_audit: required
`);
    const r = resolveRequirement("technical_audit", p, {
      prProfile: "execution",
      labels: null,
      changedPaths: null,
    });
    expect(r.level).toBe("optional");
    expect(r.notes.some((n) => n.includes("require-on-label") && n.includes("degradado"))).toBe(
      true
    );
  });

  it("19 — override situado do nó APERTA requirement (tightening default permitido)", () => {
    const p = policy("");
    const r = resolveRequirement("architectural_review", p, CTX, {
      requirement: "required",
      reason: "Integração altera autenticação.",
      actor: "@rosanarezende",
    });
    expect(r.level).toBe("required");
    expect(r.source).toContain("node-override");
    expect(r.source).toContain("@rosanarezende");
  });

  it("20 — relaxamento permitido COM actor+reason quando a policy autoriza", () => {
    const p = policy(`
review_requirements:
  defaults:
    technical_audit: required
review_requirement_overrides:
  allow_tightening: true
  allow_relaxation: true
  relaxation_requires: [actor, reason]
`);
    const ok = resolveRequirement("technical_audit", p, CTX, {
      requirement: "optional",
      reason: "Mudança mecânica sem impacto.",
      actor: "@rosanarezende",
    });
    expect(ok.errors).toHaveLength(0);
    expect(ok.level).toBe("optional");

    const semReason = resolveRequirement("technical_audit", p, CTX, {
      requirement: "optional",
      actor: "@rosanarezende",
    });
    expect(semReason.errors.some((e) => e.includes("reason"))).toBe(true);
  });

  it("21 — relaxamento PROIBIDO falha (sem waiver implícito)", () => {
    const p = policy(`
review_requirements:
  defaults:
    technical_audit: required
review_requirement_overrides:
  allow_relaxation: false
`);
    const r = resolveRequirement("technical_audit", p, CTX, {
      requirement: "optional",
      reason: "x",
      actor: "@x",
    });
    expect(r.errors.some((e) => e.includes("relaxation NÃO permitida"))).toBe(true);
    expect(r.level).toBe("required");
  });
});

describe("review_plan — recomendação do sistema + decisão humana [CO-4 r9]", () => {
  it("projeta owner_decision required como override situado que bloqueia se faltar review atual aprovado", () => {
    const p = policy("");
    const { registry } = buildReviewTypeRegistry(p);
    const overrides = reviewPlanToNodeOverrides({
      technical_audit: {
        system_recommendation: "recommended",
        owner_decision: "required",
        actor: "owner",
        reason: "PR altera contrato de Ready.",
      },
    });
    const statuses = deriveEffectiveReviewStatuses({
      registry,
      policy: p,
      ctx: CTX,
      nodeOverrides: overrides,
      observed: {},
      functionalHead: "abc1234",
    });
    const ta = statuses.find((s) => s.typeId === "technical_audit")!;
    expect(ta.requirement).toBe("required");
    expect(ta.requirementSource).toContain("node-override");
    expect(ta.blocking).toBe(true);
  });

  it("projeta owner_decision waived como optional com actor/reason, sem bloquear", () => {
    const overrides = reviewPlanToNodeOverrides({
      security_review: {
        system_recommendation: "optional",
        owner_decision: "waived",
        actor: "owner",
        reason: "Sem alteração de runtime sensível.",
      },
    });
    expect(overrides.security_review).toEqual({
      requirement: "optional",
      actor: "owner",
      reason: "Sem alteração de runtime sensível.",
    });
    expect(reviewPlanDecisionIssues({})).toHaveLength(0);
  });

  it("owner_decision pending não cria override e aparece como pendência de Ready", () => {
    const plan = {
      architectural_review: {
        system_recommendation: "recommended" as const,
        owner_decision: "pending" as const,
      },
    };
    expect(reviewPlanToNodeOverrides(plan)).toEqual({});
    expect(reviewPlanDecisionIssues(plan)[0].message).toContain("decisão humana pendente");
  });

  it("dispensa de revalidação libera somente review required stale+approved e mantém nota rastreável", () => {
    const p = policy("");
    const { registry } = buildReviewTypeRegistry(p);
    const plan = {
      technical_audit: {
        system_recommendation: "recommended" as const,
        owner_decision: "required" as const,
        actor: "owner",
        reason: "PR exigiu auditoria técnica.",
        revalidation: {
          owner_decision: "waived" as const,
          actor: "owner",
          reason: "Delta posterior só fecha cleanup low/advisory já coberto por testes.",
        },
      },
    };
    const statuses = deriveEffectiveReviewStatuses({
      registry,
      policy: p,
      ctx: CTX,
      nodeOverrides: reviewPlanToNodeOverrides(plan),
      reviewPlan: plan,
      observed: { technical_audit: { latestSubjectRef: "abc1111", decision: "approved" } },
      functionalHead: "def2222",
    });
    const ta = statuses.find((s) => s.typeId === "technical_audit")!;
    expect(ta.requirement).toBe("required");
    expect(ta.state).toBe("stale");
    expect(ta.revalidationWaived).toBe(true);
    expect(ta.blocking).toBe(false);
    expect(ta.notes.join(" ")).toContain("revalidation waived by owner");
  });

  it("dispensa de revalidação não libera review required stale com decisão não aprovada", () => {
    const p = policy("");
    const { registry } = buildReviewTypeRegistry(p);
    const plan = {
      technical_audit: {
        system_recommendation: "recommended" as const,
        owner_decision: "required" as const,
        actor: "owner",
        reason: "PR exigiu auditoria técnica.",
        revalidation: {
          owner_decision: "waived" as const,
          actor: "owner",
          reason: "Tentativa inválida: review ainda não aprovada.",
        },
      },
    };
    const statuses = deriveEffectiveReviewStatuses({
      registry,
      policy: p,
      ctx: CTX,
      nodeOverrides: reviewPlanToNodeOverrides(plan),
      reviewPlan: plan,
      observed: {
        technical_audit: { latestSubjectRef: "abc1111", decision: "changes_requested" },
      },
      functionalHead: "def2222",
    });
    const ta = statuses.find((s) => s.typeId === "technical_audit")!;
    expect(ta.revalidationWaived).toBe(false);
    expect(ta.blocking).toBe(true);
  });

  it("revalidação pending aparece como pendência de Ready", () => {
    const issues = reviewPlanDecisionIssues({
      technical_audit: {
        system_recommendation: "recommended",
        owner_decision: "required",
        actor: "owner",
        reason: "Review obrigatória neste nó.",
        revalidation: {
          owner_decision: "pending",
        },
      },
    });
    expect(issues[0].message).toContain("decisão humana de revalidação pendente");
  });
});

describe("perfis de colaboração ≠ reviews semânticos [CO-4 r8]", () => {
  it("22/23/24 — solo/contributor/team SEM required_review_roles não obrigam nenhum tipo", () => {
    for (const profile of ["solo", "contributor", "team"]) {
      const p = parseReviewPolicy(`
active_profile: ${profile}
profiles:
  ${profile}:
    implementation_pr:
      required_native_approvals: 2
    integration_pr:
      required_native_approvals: 2
    accepted_findings:
      require_resolution: true
      require_verification_event_for_fixed: true
    github:
      minimum_approving_reviews: 2
      require_code_owner_review: true
      dismiss_stale_reviews_on_push: true
      require_last_push_approval: true
`);
      for (const ctx of [CTX, { ...CTX, prProfile: "integration" }]) {
        expect(resolveRequirement("technical_audit", p, ctx).level).toBe("optional");
        expect(resolveRequirement("architectural_review", p, ctx).level).toBe("optional");
      }
      // 25 — approvals nativos continuam intactos no perfil.
      expect(p.profiles[profile].implementationPr.requiredNativeApprovals).toBe(2);
    }
  });

  it("26 — legacy required_review_roles preserva comportamento (regras sintéticas) com warning", () => {
    const p = parseReviewPolicy(`
active_profile: team
profiles:
  team:
    implementation_pr:
      required_review_roles: [technical_audit]
      required_native_approvals: 1
    integration_pr:
      required_review_roles: [technical_audit, architectural_review]
      required_native_approvals: 2
    accepted_findings:
      require_resolution: true
      require_verification_event_for_fixed: true
    github:
      minimum_approving_reviews: 2
      require_code_owner_review: true
      dismiss_stale_reviews_on_push: true
      require_last_push_approval: true
`);
    expect(legacyRequiredRules(p).length).toBeGreaterThan(0);
    expect(legacyDeprecationWarnings(p)[0]).toContain("DEPRECIADO");
    expect(resolveRequirement("technical_audit", p, CTX).level).toBe("required");
    expect(
      resolveRequirement("architectural_review", p, { ...CTX, prProfile: "integration" }).level
    ).toBe("required");
    expect(resolveRequirement("architectural_review", p, CTX).level).toBe("optional");
  });
});

describe("aplicabilidade — onde o tipo faz sentido [CO-4 r8]", () => {
  const APPLICABILITY = policy(`
review_types:
  security_review:
    objective: Avaliar superficies de ataque e exposicao de dados.
    vectors: [secrets, supply chain]
review_applicability:
  security_review:
    any:
      - pr_profile: integration
      - labels:
          any: [security-sensitive]
      - changed_paths:
          any: ["src/auth/**", ".github/workflows/**"]
`).applicability;

  it("28/29 — aplicável em integration; NÃO aplicável em execution (explicando por quê)", () => {
    const yes = evaluateApplicability("security_review", APPLICABILITY, {
      ...CTX,
      prProfile: "integration",
    });
    expect(yes.value).toBe("yes");

    const no = evaluateApplicability("security_review", APPLICABILITY, CTX);
    expect(no.value).toBe("no");
    expect(no.reasons.join(" ")).toContain("execution ≠ integration");
  });

  it("30 — changed path dispara aplicabilidade (glob determinístico)", () => {
    const r = evaluateApplicability("security_review", APPLICABILITY, {
      prProfile: "execution",
      labels: [],
      changedPaths: ["src/auth/session.ts"],
    });
    expect(r.value).toBe("yes");
    expect(matchesGlob(".github/workflows/**", ".github/workflows/ci.yml")).toBe(true);
    expect(matchesGlob("src/auth/**", "src/other/file.ts")).toBe(false);
    expect(matchesGlob("*.md", "docs/x.md")).toBe(false); // * não cruza /
  });

  it("31 — label dispara requirement required via regra", () => {
    const p = policy(`
review_types:
  security_review:
    objective: x
    vectors: [a]
review_requirements:
  rules:
    - id: require-security-on-label
      priority: 200
      when:
        labels:
          any: [security-sensitive]
      set:
        security_review: required
`);
    const r = resolveRequirement("security_review", p, {
      prProfile: "execution",
      labels: ["security-sensitive"],
      changedPaths: [],
    });
    expect(r.level).toBe("required");
  });

  it("32/33 — dados remotos ausentes ⇒ unknown/degraded; nunca false silencioso", () => {
    const r = evaluateApplicability("security_review", APPLICABILITY, {
      prProfile: "execution",
      labels: null,
      changedPaths: null,
    });
    expect(r.value).toBe("unknown");
    expect(r.reasons.join(" ")).toContain("degradada");
  });

  it("tipo sem entry de aplicabilidade é aplicável em qualquer PR", () => {
    const r = evaluateApplicability("technical_audit", APPLICABILITY, CTX);
    expect(r.value).toBe("yes");
  });
});

describe("estado/freshness — informação, nunca obrigação [CO-4 r8]", () => {
  it("missing/current/stale derivados do subject_ref vs cabeça funcional", () => {
    expect(
      deriveReviewState({ latestSubjectRef: null, hasReview: false, functionalHead: "abc1234" })
    ).toBe("missing");
    expect(
      deriveReviewState({
        latestSubjectRef: "base123..abc1234",
        hasReview: true,
        functionalHead: "abc1234",
      })
    ).toBe("current");
    expect(
      deriveReviewState({
        latestSubjectRef: "base123..old9999",
        hasReview: true,
        functionalHead: "abc1234",
      })
    ).toBe("stale");
    // sem proveniência machine-readable ⇒ nunca assumir fresh.
    expect(
      deriveReviewState({ latestSubjectRef: null, hasReview: true, functionalHead: "abc1234" })
    ).toBe("stale");
  });

  it("10-16 — matriz de blocking: SÓ required+não-satisfeito bloqueia", () => {
    const p = policy(`
review_types:
  security_review:
    objective: x
    vectors: [a]
review_requirements:
  defaults:
    technical_audit: optional
    architectural_review: recommended
    security_review: required
`);
    const { registry } = buildReviewTypeRegistry(p);
    const statuses = deriveEffectiveReviewStatuses({
      registry,
      policy: p,
      ctx: CTX,
      observed: {
        technical_audit: { latestSubjectRef: "a..old9999", decision: "approved" }, // stale
        // architectural_review: missing
        // security_review: missing
      },
      functionalHead: "abc1234",
    });
    const byId = Object.fromEntries(statuses.map((s) => [s.typeId, s]));
    expect(byId.technical_audit.state).toBe("stale");
    expect(byId.technical_audit.blocking).toBe(false); // optional+stale → aviso, não obrigação
    expect(byId.architectural_review.state).toBe("missing");
    expect(byId.architectural_review.blocking).toBe(false); // recommended → não bloqueia
    expect(byId.security_review.state).toBe("missing");
    expect(byId.security_review.blocking).toBe(true); // required+missing → bloqueia

    const satisfied = deriveEffectiveReviewStatuses({
      registry,
      policy: p,
      ctx: CTX,
      observed: {
        security_review: { latestSubjectRef: "a..abc1234", decision: "approved" },
      },
      functionalHead: "abc1234",
    });
    expect(satisfied.find((s) => s.typeId === "security_review")!.blocking).toBe(false);
  });

  it("tipo required mas NÃO aplicável no contexto não bloqueia (requirement não opera)", () => {
    const p = policy(`
review_types:
  security_review:
    objective: x
    vectors: [a]
review_applicability:
  security_review:
    pr_profiles: [integration]
review_requirements:
  defaults:
    security_review: required
`);
    const { registry } = buildReviewTypeRegistry(p);
    const statuses = deriveEffectiveReviewStatuses({
      registry,
      policy: p,
      ctx: CTX, // execution
      observed: {},
      functionalHead: "abc1234",
    });
    const sec = statuses.find((s) => s.typeId === "security_review")!;
    expect(sec.applicability).toBe("no");
    expect(sec.blocking).toBe(false);
  });
});

describe("security review universal × requirement por perfil [CO-4 r8 — clarificação da owner]", () => {
  /** Policy ATIVA do ai-guidelines (espelho): tipo sem applicability + regra por perfil. */
  const AI_GUIDELINES_LIKE = `
review_types:
  security_review:
    source: repository
    enabled: true
    title: Security Review
    objective: Avaliar superficies de ataque e exposicao de dados.
    vectors: [secrets, supply chain]
review_requirements:
  defaults:
    technical_audit: optional
    architectural_review: optional
    security_review: optional
  rules:
    - id: require-security-for-integration
      priority: 200
      when:
        pr_profile: integration
      set:
        security_review: required
`;
  const ALL_PROFILES = ["execution", "governance", "fast-track", "integration"] as const;

  it("1/2-5/23 — sem applicability configurada: applicable=yes em TODOS os perfis, NUNCA unknown (mesmo sem labels/paths observáveis)", () => {
    const p = policy(AI_GUIDELINES_LIKE);
    for (const profile of ALL_PROFILES) {
      const r = evaluateApplicability("security_review", p.applicability, {
        prProfile: profile,
        labels: null, // fato remoto NÃO observado — irrelevante sem regra configurada
        changedPaths: null,
      });
      expect(r.value).toBe("yes");
    }
  });

  it("6-9 — requirement por perfil: execution/governance/fast-track optional; integration required", () => {
    const p = policy(AI_GUIDELINES_LIKE);
    for (const profile of ["execution", "governance", "fast-track"]) {
      const r = resolveRequirement("security_review", p, { ...CTX, prProfile: profile });
      expect(r.level).toBe("optional");
      expect(r.source).toBe("repo-default");
    }
    const integration = resolveRequirement("security_review", p, {
      ...CTX,
      prProfile: "integration",
    });
    expect(integration.level).toBe("required");
    expect(integration.source).toBe("rule:require-security-for-integration · repository-policy");
  });

  it("10/11 — integration é required SEM labels; labels presentes não mudam a regra nem a origem", () => {
    const p = policy(AI_GUIDELINES_LIKE);
    const semLabels = resolveRequirement("security_review", p, {
      prProfile: "integration",
      labels: [],
      changedPaths: [],
    });
    const comLabels = resolveRequirement("security_review", p, {
      prProfile: "integration",
      labels: ["security-sensitive"],
      changedPaths: [],
    });
    expect(semLabels.level).toBe("required");
    expect(comLabels.level).toBe("required");
    expect(comLabels.source).toBe(semLabels.source);
    // e labels não observáveis tampouco degradam (regra não depende delas):
    const labelsNull = resolveRequirement("security_review", p, {
      prProfile: "integration",
      labels: null,
      changedPaths: null,
    });
    expect(labelsNull.level).toBe("required");
    expect(labelsNull.notes).toHaveLength(0);
  });

  it("12-16/27/28 — matriz de blocking: só integration+required não satisfeito bloqueia; current+approved libera", () => {
    const p = policy(AI_GUIDELINES_LIKE);
    const { registry } = buildReviewTypeRegistry(p);
    const statusesFor = (
      profile: string,
      observed: Record<string, { latestSubjectRef: string | null; decision: string | null }>
    ) =>
      deriveEffectiveReviewStatuses({
        registry,
        policy: p,
        ctx: { prProfile: profile, labels: [], changedPaths: [] },
        observed,
        functionalHead: "abc1234",
      });

    // execution/governance/fast-track: missing E stale não bloqueiam (optional)
    for (const profile of ["execution", "governance", "fast-track"]) {
      const missing = statusesFor(profile, {}).find((s) => s.typeId === "security_review")!;
      expect(missing.applicability).toBe("yes");
      expect(missing.requirement).toBe("optional");
      expect(missing.blocking).toBe(false);
      const stale = statusesFor(profile, {
        security_review: { latestSubjectRef: "a..old9999", decision: "approved" },
      }).find((s) => s.typeId === "security_review")!;
      expect(stale.state).toBe("stale");
      expect(stale.blocking).toBe(false);
    }

    // integration fixture: missing bloqueia; stale bloqueia; current+approved libera
    const missing = statusesFor("integration", {}).find((s) => s.typeId === "security_review")!;
    expect(missing.requirement).toBe("required");
    expect(missing.blocking).toBe(true);
    expect(missing.requirementSource).toContain("rule:require-security-for-integration");
    expect(missing.requirementSource).toContain("repository-policy");

    const stale = statusesFor("integration", {
      security_review: { latestSubjectRef: "a..old9999", decision: "approved" },
    }).find((s) => s.typeId === "security_review")!;
    expect(stale.blocking).toBe(true);

    const current = statusesFor("integration", {
      security_review: { latestSubjectRef: "a..abc1234", decision: "approved" },
    }).find((s) => s.typeId === "security_review")!;
    expect(current.blocking).toBe(false);
  });

  it("24 — override situado pode apertar um PR execution específico para required", () => {
    const p = policy(AI_GUIDELINES_LIKE);
    const r = resolveRequirement(
      "security_review",
      p,
      { ...CTX, prProfile: "execution" },
      {
        requirement: "required",
        actor: "@rosanarezende",
        reason: "Execution altera autenticação e secrets.",
      }
    );
    expect(r.errors).toHaveLength(0);
    expect(r.level).toBe("required");
    expect(r.source).toContain("node-override");
  });

  it("31-33 — consumidores escolhem livremente: sem regra=optional; recommended; required", () => {
    const base = `
review_types:
  security_review:
    objective: x
    vectors: [a]
`;
    // Consumidor A: sem regra → optional em integration (a regra do
    // ai-guidelines é LOCAL e não vaza).
    const a = policy(base);
    expect(
      resolveRequirement("security_review", a, { ...CTX, prProfile: "integration" }).level
    ).toBe("optional");

    // Consumidor B: recommended em integration.
    const b = policy(
      base +
        `
review_requirements:
  rules:
    - id: recommend-security-for-integration
      priority: 100
      when:
        pr_profile: integration
      set:
        security_review: recommended
`
    );
    expect(
      resolveRequirement("security_review", b, { ...CTX, prProfile: "integration" }).level
    ).toBe("recommended");

    // Consumidor C: required em integration.
    const c = policy(
      base +
        `
review_requirements:
  rules:
    - id: require-security-for-integration
      priority: 200
      when:
        pr_profile: integration
      set:
        security_review: required
`
    );
    expect(
      resolveRequirement("security_review", c, { ...CTX, prProfile: "integration" }).level
    ).toBe("required");
  });

  it("34 — o framework NÃO distribui security_review nem a regra local: defaults são só TA/AR optional", () => {
    const { registry } = buildReviewTypeRegistry(null);
    expect(registry.types.map((t) => t.id)).toEqual(["architectural_review", "technical_audit"]);
    expect(
      resolveRequirement("technical_audit", null, { ...CTX, prProfile: "integration" }).level
    ).toBe("optional");
    expect(
      resolveRequirement("architectural_review", null, { ...CTX, prProfile: "integration" }).level
    ).toBe("optional");
  });
});
