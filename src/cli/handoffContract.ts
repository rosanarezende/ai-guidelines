/**
 * Parsing/normalização PUROS das fontes do contrato global carregado pelo
 * handoff (CO-4 / camada de identidade+contrato — sem I/O; o coletor em
 * `handoff.ts` lê os arquivos e delega aqui).
 *
 * Fronteira com enforcement (cravada no checkpoint):
 *   co-projection  → prova QUAL contrato foi carregado, reinjeta as obrigações
 *                    essenciais (ids+títulos) e torna mudança/staleness
 *                    detectável (fingerprint semântico → selo → recibo);
 *   co-enforcement → transforma regras/decisões em bindings e checks
 *                    executáveis adicionais (CO-3; fora deste nó).
 *
 * Fingerprints SEMÂNTICOS: campos voláteis (`generated_at`) e ordem
 * irrelevante (ordem dos arrays de regras/tags) ficam FORA do hash — mesma
 * semântica ⇒ mesmo fingerprint; mudança real em regra/bootstrap/contrato ⇒
 * fingerprint diferente ⇒ selo muda ⇒ recibo anterior vira stale-sources.
 */
import { ApplicableRuleFact, fingerprintSource } from "../app/handoff/handoffFacts.js";

const AI_GUIDELINES_OPEN = "<AI_GUIDELINES>";
const AI_GUIDELINES_CLOSE = "</AI_GUIDELINES>";

/**
 * Extrai o bloco compilado `<AI_GUIDELINES>` (bootstrap obrigatório de agente).
 * `null` = bloco ausente/malformado — bootstrap NÃO carregado (estado que
 * impede recibo fresh; ver loadHandoff).
 */
export function extractAiGuidelinesBlock(agentsText: string): string | null {
  const open = agentsText.indexOf(AI_GUIDELINES_OPEN);
  const close = agentsText.indexOf(AI_GUIDELINES_CLOSE);
  if (open === -1 || close === -1 || close <= open) return null;
  const block = agentsText.slice(open + AI_GUIDELINES_OPEN.length, close).trim();
  return block.length > 0 ? block : null;
}

export interface RulesContract {
  /** Fingerprint SEMÂNTICO do catálogo (exclui generated_at; ordem canônica). */
  readonly fingerprint: string;
  /** Regras globais sempre-injetadas (scope universal + tag always_injected). */
  readonly mandatoryRules: ReadonlyArray<ApplicableRuleFact>;
  readonly totalRules: number;
}

interface RawRule {
  readonly id: string;
  readonly scope: string;
  readonly title: string;
  readonly tags: ReadonlyArray<string>;
  readonly file: string;
  readonly semantic: unknown;
}

/**
 * Parseia `rules.json` (contrato machine-readable do catálogo). Lança em
 * forma inválida — o coletor traduz para fonte degraded, nunca inventa regra.
 */
export function parseRulesContract(jsonText: string, sourcePath: string): RulesContract {
  const raw = JSON.parse(jsonText) as Record<string, unknown>;
  if (!Array.isArray(raw.rules)) {
    throw new Error(`${sourcePath}: campo "rules" ausente — catálogo machine-readable inválido.`);
  }

  const rules: RawRule[] = raw.rules.map((entry) => {
    const r = entry as Record<string, unknown>;
    if (typeof r.id !== "string" || r.id === "") {
      throw new Error(`${sourcePath}: regra sem "id" — catálogo inválido.`);
    }
    const tags = Array.isArray(r.tags) ? (r.tags as string[]) : [];
    return {
      id: r.id,
      scope: typeof r.scope === "string" ? r.scope : "",
      title: typeof r.title === "string" ? r.title : r.id,
      tags,
      file: typeof r.file === "string" ? r.file : sourcePath,
      // Campos SEMÂNTICOS da regra para o fingerprint (corpo incluído: mudança
      // real de instrução muda o hash). Tags ordenadas (ordem irrelevante).
      semantic: {
        id: r.id,
        scope: r.scope ?? null,
        category: r.category ?? null,
        title: r.title ?? null,
        instruction_en: r.instruction_en ?? null,
        documentation_pt: r.documentation_pt ?? null,
        tags: [...tags].sort(),
        applicable_languages: Array.isArray(r.applicable_languages)
          ? [...(r.applicable_languages as string[])].sort()
          : null,
      },
    };
  });

  // Canônico: ordenado por id; generated_at e quaisquer índices derivados
  // (by_scope/by_feature são projeções de rules[]) ficam FORA do hash.
  const canonical = {
    schema_version: raw.schema_version ?? null,
    rules: [...rules].sort((a, b) => a.id.localeCompare(b.id)).map((r) => r.semantic),
  };

  const mandatoryRules: ApplicableRuleFact[] = rules
    .filter((r) => r.scope === "universal" && r.tags.includes("always_injected"))
    .map((r) => ({ id: r.id, title: r.title, scope: "global" as const, source: r.file }));

  return {
    fingerprint: fingerprintSource(JSON.stringify(canonical)),
    mandatoryRules,
    totalRules: rules.length,
  };
}

export interface PackageIdentity {
  readonly repositoryId: string;
  readonly repositoryKind: string;
  readonly summary: string;
  /** Fingerprint da identidade (nome+descrição; versão de release fica fora). */
  readonly fingerprint: string;
}

/** Identidade derivada do package.json — genérica (vale para consumidores). */
export function parsePackageIdentity(jsonText: string): PackageIdentity {
  const raw = JSON.parse(jsonText) as Record<string, unknown>;
  const name = typeof raw.name === "string" && raw.name !== "" ? raw.name : "(sem nome)";
  const description = typeof raw.description === "string" ? raw.description : "";
  // O repo do framework é o único cujo pacote É o framework; qualquer outro
  // nome ⇒ repositório consumidor (mesma heurística do runtime bootstrap:
  // maintainer usa script local, consumidor usa o bin publicado).
  const kind = name === "ai-guidelines" ? "framework (mantenedor)" : "consumidor do framework";
  return {
    repositoryId: name,
    repositoryKind: kind,
    summary: description,
    fingerprint: fingerprintSource(JSON.stringify([name, description])),
  };
}
