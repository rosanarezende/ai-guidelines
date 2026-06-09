import { Insight } from "../../domain/insight/Insight.js";
import { insightArtifact } from "../../domain/insight/insightKnowledge.js";
import {
  knowledgeArtifactsFromBackfill,
  KnowledgeBackfillEntry,
} from "../../domain/knowledge/KnowledgeBackfill.js";
import { Falsification } from "../../domain/knowledge/Falsification.js";
import { KnowledgeArtifact } from "../../domain/knowledge/KnowledgeArtifact.js";
import { ruleArtifact } from "../../domain/knowledge/typedArtifacts.js";
import { Rule } from "../../domain/rules/Rule.js";
import { KnowledgeGraph } from "./KnowledgeGraph.js";

/**
 * Coleta os {@link KnowledgeArtifact} das fontes operacionais.
 *
 * HOJE: só `Insight` (estágio 0). Os próximos PRs (Doctrine/Decision/Rule…)
 * somam suas fontes AQUI — é o único ponto de wiring que cresce; o
 * {@link KnowledgeGraph} permanece intocado.
 */
export function collectKnowledgeArtifacts(
  insights: ReadonlyArray<Insight>
): ReadonlyArray<KnowledgeArtifact> {
  return insights.map(insightArtifact);
}

export function knowledgeGraphFromInsights(insights: ReadonlyArray<Insight>): KnowledgeGraph {
  return KnowledgeGraph.from(collectKnowledgeArtifacts(insights));
}

/**
 * Projeta o RulesCatalog como Knowledge sem ler `AGENTS.md`.
 *
 * `AGENTS.md` é runtime compilado; a fonte governada é `.core/rules/_meta/rules.json`
 * + arquivos `.core/rules/**`. Regras universais, opt-in e de adapter viram nós
 * `stage: "rule"`; escopo/provider permanecem no domínio Rules.
 */
export function collectRuleKnowledgeArtifacts(
  rules: ReadonlyArray<Rule>
): ReadonlyArray<KnowledgeArtifact> {
  return rules.map((rule) => ruleArtifact(rule.id));
}

export function knowledgeGraphFromRulesCatalog(
  rules: ReadonlyArray<Rule>,
  falsifications: ReadonlyArray<Falsification> = []
): KnowledgeGraph {
  return KnowledgeGraph.from(collectRuleKnowledgeArtifacts(rules), falsifications);
}

export function knowledgeGraphFromBackfill(
  entries: ReadonlyArray<KnowledgeBackfillEntry>,
  falsifications: ReadonlyArray<Falsification>
): KnowledgeGraph {
  return KnowledgeGraph.from(knowledgeArtifactsFromBackfill(entries), falsifications);
}
