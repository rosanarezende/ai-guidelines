import { GovernanceError } from "../shared/errors.js";
import { isKnowledgeStage, KnowledgeStage } from "./KnowledgeStage.js";

/**
 * Value Object: referência **tipada e navegável** a um artefato de conhecimento.
 * É a **aresta do grafo** Knowledge — toda relação cross-estágio (graduação,
 * cristalização, fundamentação, supersessão) é expressa como um `KnowledgeRef`,
 * para que a navegação futura seja uniforme entre Insight/Decision/Rule/Doctrine.
 */
export interface KnowledgeRef {
  readonly stage: KnowledgeStage;
  readonly id: string;
}

/**
 * Padrão canônico do id por estágio — **prefixo lenient**. Valida FORMA, não
 * existência (integridade referencial cross-artefato é decisão arquitetural
 * futura). Captura typo de ref (ex.: `--ref garbage`), não ref-para-artefato-ausente.
 */
const ID_PATTERN: Record<KnowledgeStage, RegExp> = {
  insight: /^PIT-\d{4,}$/,
  decision: /^DEC-[A-Z0-9-]+$/,
  // RulesCatalog projeta regras universais, opt-in e de adapter como o mesmo
  // estágio Knowledge `rule`; escopo/provider continuam metadados do domínio Rules.
  rule: /^(ADP|CORE|GR|OPT)-[A-Z0-9-]+$/,
  guardrail: /^GG-\d{4,}$/,
  doctrine: /^ADR-\d{4,}$/,
};

export function isWellFormedRef(ref: KnowledgeRef): boolean {
  return isKnowledgeStage(ref.stage) && ID_PATTERN[ref.stage].test(ref.id);
}

/** Constrói um ref VALIDADO (lança em forma inválida). Para refs intencionais. */
export function knowledgeRef(stage: KnowledgeStage, id: string): KnowledgeRef {
  const ref: KnowledgeRef = { stage, id: id.trim() };
  if (!isWellFormedRef(ref)) {
    throw new GovernanceError(
      "KNOWLEDGE_REF_MALFORMED",
      `Ref de conhecimento malformado: "${stage}:${id}" — id não casa o padrão do estágio '${stage}'.`
    );
  }
  return ref;
}

/** `KnowledgeRef` → `"doctrine:ADR-0023"`. */
export function formatRef(ref: KnowledgeRef): string {
  return `${ref.stage}:${ref.id}`;
}

/** `"doctrine:ADR-0023"` → `KnowledgeRef` (validado). */
export function parseRef(value: string): KnowledgeRef {
  const sep = value.indexOf(":");
  if (sep <= 0) {
    throw new GovernanceError(
      "KNOWLEDGE_REF_MALFORMED",
      `Ref de conhecimento malformado: "${value}" — esperado "<stage>:<id>".`
    );
  }
  const stage = value.slice(0, sep);
  if (!isKnowledgeStage(stage)) {
    throw new GovernanceError(
      "KNOWLEDGE_REF_MALFORMED",
      `Estágio desconhecido em "${value}" (válidos: insight|decision|rule|guardrail|doctrine).`
    );
  }
  return knowledgeRef(stage, value.slice(sep + 1));
}
