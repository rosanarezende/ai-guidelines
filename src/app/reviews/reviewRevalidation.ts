/**
 * Recomendação determinística para revalidação de reviews stale.
 *
 * A saída é apenas aconselhamento: nunca altera estado nem substitui a decisão
 * da owner. O objetivo é distinguir um delta estreito, já explicado por
 * findings aceitos, de mudanças funcionais que exigem nova revisão.
 */

export type ReviewRevalidationRecommendation = "waive" | "revalidate" | "human-assessment";

export interface ReviewRevalidationFinding {
  readonly role: string;
  readonly severity: string;
  readonly disposition: string;
  readonly location: string;
}

export interface ReviewRevalidationInput {
  readonly role: string;
  readonly changedPaths: readonly string[];
  readonly findings: readonly ReviewRevalidationFinding[];
  readonly workingTreeState: "clean" | "review-only" | "functional-dirty" | "unknown";
  readonly ci: {
    readonly pass: number;
    readonly fail: number;
    readonly pending: number;
  } | null;
}

export interface ClassifiedReviewPath {
  readonly path: string;
  readonly classification:
    | "finding-location"
    | "test"
    | "governed-record"
    | "sensitive"
    | "unknown-functional";
}

export interface ReviewRevalidationAdvice {
  readonly role: string;
  readonly recommendation: ReviewRevalidationRecommendation;
  readonly reasons: readonly string[];
  readonly paths: readonly ClassifiedReviewPath[];
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

function locationPath(location: string): string {
  return normalizePath(location.split("#")[0]);
}

function isTestPath(filePath: string): boolean {
  return (
    /(^|\/)test(s|-utils)?\//.test(filePath) ||
    /\.(test|spec)\.[cm]?[jt]sx?$/.test(filePath) ||
    /(^|\/)__tests__\//.test(filePath)
  );
}

function isGovernedRecord(filePath: string): boolean {
  return (
    /(^|\/)reviews\//.test(filePath) ||
    /(^|\/)pull-requests\/pr-\d+\/body\.md$/.test(filePath) ||
    /(^|\/)assets\/(governance-graph-snapshot\.json|governed-work-map(-data)?\.(html|json))$/.test(
      filePath
    ) ||
    /(^|\/)research\/.+\.(md|ya?ml)$/.test(filePath)
  );
}

function isSensitivePath(filePath: string): boolean {
  return (
    /(^|\/)(package(-lock)?\.json|npm-shrinkwrap\.json)$/.test(filePath) ||
    /(^|\/)(auth|security|secrets?|permissions?|network|deployment|infra(structure)?)(\/|\.|-)/i.test(
      filePath
    ) ||
    /(^|\/)\.github\/workflows\//.test(filePath) ||
    /(^|\/)\.core\/governance\/(review-policy|human-decision-policy)\.ya?ml$/.test(filePath)
  );
}

export function deriveReviewRevalidationAdvice(
  input: ReviewRevalidationInput
): ReviewRevalidationAdvice {
  const acceptedFindingPaths = new Set(
    input.findings
      .filter(
        (finding) =>
          finding.disposition !== "open" &&
          finding.role === input.role &&
          !["critical", "high"].includes(finding.severity.toLowerCase())
      )
      .map((finding) => locationPath(finding.location))
      .filter(Boolean)
  );

  const paths = [...new Set(input.changedPaths.map(normalizePath))].sort().map((filePath) => {
    const classification: ClassifiedReviewPath["classification"] = acceptedFindingPaths.has(
      filePath
    )
      ? "finding-location"
      : isSensitivePath(filePath)
        ? "sensitive"
        : isTestPath(filePath)
          ? "test"
          : isGovernedRecord(filePath)
            ? "governed-record"
            : "unknown-functional";
    return { path: filePath, classification };
  });

  const blockingFinding = input.findings.some(
    (finding) =>
      finding.disposition === "open" &&
      ["critical", "high"].includes(finding.severity.toLowerCase())
  );
  if (blockingFinding) {
    return {
      role: input.role,
      recommendation: "revalidate",
      reasons: ["Há finding critical/high ainda aberto no checkpoint."],
      paths,
    };
  }
  if ((input.ci?.fail ?? 0) > 0) {
    return {
      role: input.role,
      recommendation: "revalidate",
      reasons: ["A CI tem falha; não é seguro dispensar uma revisão obrigatória."],
      paths,
    };
  }
  if (paths.some((item) => item.classification === "sensitive")) {
    return {
      role: input.role,
      recommendation: "revalidate",
      reasons: ["O delta toca dependências, segurança, permissões ou infraestrutura sensível."],
      paths,
    };
  }
  if (input.workingTreeState !== "clean") {
    return {
      role: input.role,
      recommendation: "human-assessment",
      reasons: ["A working tree não está limpa; o delta analisado ainda pode mudar."],
      paths,
    };
  }
  if (!input.ci || input.ci.pending > 0) {
    return {
      role: input.role,
      recommendation: "human-assessment",
      reasons: ["A CI ainda não terminou ou não pôde ser observada."],
      paths,
    };
  }
  if (paths.length === 0) {
    return {
      role: input.role,
      recommendation: "human-assessment",
      reasons: ["Não há delta observável suficiente para recomendar uma dispensa."],
      paths,
    };
  }
  const unknown = paths.filter((item) => item.classification === "unknown-functional");
  if (unknown.length > 0) {
    return {
      role: input.role,
      recommendation: "human-assessment",
      reasons: [
        `${unknown.length} arquivo(s) funcional(is) não estão ligados a finding aceito nem classificados como teste/projeção.`,
      ],
      paths,
    };
  }
  return {
    role: input.role,
    recommendation: "waive",
    reasons: [
      "CI verde, tree limpa e delta restrito a findings aceitos, testes e registros/projeções governadas.",
    ],
    paths,
  };
}
