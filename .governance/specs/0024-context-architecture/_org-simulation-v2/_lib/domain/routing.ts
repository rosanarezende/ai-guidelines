// routing.ts — o GRAFO VERTICAL (advisory): cruza o NEED (subject do explore-point / contrato) × o CONHECIMENTO
// publicado (capabilities/provides) pra SUGERIR o repo — "onde investigar" e "quem entrega". NUNCA alimenta o gate
// (Q4: advisory-only). O matcher é PLUGÁVEL (Q2): default LÉXICO aqui; LLM/embeddings = adapter (v2).
// Modelo: research/2026-06-29-vertical-routing-deliberation.md + research/2026-06-29-capability-matching-and-llm-research.md
import type { Capability, Intent, Manifest } from "./model.ts";

// ───────────────────────── a porta Matcher (pluggable) ─────────────────────────
export interface MatchCandidate {
  repo: string;
  capabilities: Capability[];
}
export interface Match {
  repo: string;
  score: number;
  why: string;
}
/** ranqueia repos por afinidade do `need` × capabilities. ASYNC (LLM-ready, igual a porta Repository é "Neo4j-ready"). */
export interface Matcher {
  rank(need: string, candidates: MatchCandidate[]): Promise<Match[]>;
}

// ───────────────────────── o default: LÉXICO (determinístico, zero infra, explicável) ─────────────────────────
const STOP = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "a",
  "o",
  "e",
  "em",
  "por",
  "pra",
  "para",
  "com",
  "na",
  "no",
  "que",
  "um",
  "uma",
  "após",
  "apos",
  "ou",
  "cada",
  "tem",
  "the",
  "of",
  "to",
  "is",
  "and",
  "or",
]);
const tokenize = (s: string): string[] => [
  ...new Set(
    s
      .toLowerCase()
      .split(/[^a-zà-ÿ0-9]+/i)
      .filter((t) => t.length > 2 && !STOP.has(t))
  ),
];

// casa por igualdade OU prefixo (≥4 chars) — pega plural/conjugação PT (formulário↔formulários) sem stemmer pesado.
const tokenMatch = (a: string, b: string): boolean =>
  a === b || (a.length >= 4 && b.startsWith(a)) || (b.length >= 4 && a.startsWith(b));

export class LexicalMatcher implements Matcher {
  async rank(need: string, candidates: MatchCandidate[]): Promise<Match[]> {
    const needTokens = tokenize(need);
    return candidates
      .map((c) => {
        const capTokens = c.capabilities.flatMap((cap) => tokenize(cap.text));
        const capTags = new Set(
          c.capabilities.flatMap((cap) => (cap.tags ?? []).map((t) => t.toLowerCase()))
        );
        const hits = new Set<string>();
        let score = 0;
        for (const nt of needTokens) {
          if (capTokens.some((ct) => tokenMatch(nt, ct))) {
            score += 1;
            hits.add(nt);
          }
          if (capTags.has(nt)) {
            score += 2; // tag EXATA vale mais (controlada, sem ambiguidade)
            hits.add(`#${nt}`);
          }
        }
        return {
          repo: c.repo,
          score,
          why: hits.size ? `casou: ${[...hits].join(", ")}` : "sem termos em comum",
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}

// ───────────────────────── a derivação do ROTEAMENTO (por intent) ─────────────────────────
export interface RoutingSuggestion {
  need: string;
  kind: "explore-point" | "contract";
  ranked: Match[]; // ordenado; ranked[0] = a sugestão (advisory)
}
/** pra cada explore-point (→ capabilities, "quem SABE") e cada contrato (→ provides exato, "quem ENTREGA") sugere o repo. */
export async function deriveRouting(
  intent: Intent,
  manifests: Manifest[],
  matcher: Matcher
): Promise<RoutingSuggestion[]> {
  const candidates: MatchCandidate[] = manifests.map((m) => ({
    repo: m.repo,
    capabilities: m.capabilities ?? [],
  }));
  const providerOf = new Map<string, string>();
  for (const m of manifests) for (const p of m.provides) providerOf.set(p.name, m.repo);

  const out: RoutingSuggestion[] = [];
  for (const ep of intent.explores)
    out.push({
      need: ep.title,
      kind: "explore-point",
      ranked: await matcher.rank(`${ep.title} ${ep.details ?? ""}`.trim(), candidates),
    });
  for (const c of intent.contracts) {
    const provider = providerOf.get(c.name);
    out.push({
      need: `contrato: ${c.name}`,
      kind: "contract",
      ranked: provider
        ? [{ repo: provider, score: 99, why: `provê o contrato "${c.name}"` }]
        : await matcher.rank(c.name, candidates), // ninguém provê → cai no matcher (quem mais se aproxima)
    });
  }
  return out;
}

// ───────────────────────── o GRAFO de conhecimento repo×tag (bipartite) ─────────────────────────
export interface TagGraph {
  tags: { tag: string; repos: string[] }[]; // cada tag → os repos que a declaram (= "quem sabe de X?")
  byRepo: { repo: string; tags: string[] }[];
}
export function deriveTagGraph(manifests: Manifest[]): TagGraph {
  const tagToRepos = new Map<string, Set<string>>();
  const byRepo = manifests.map((m) => {
    const repoTags = new Set<string>();
    for (const cap of m.capabilities ?? [])
      for (const tag of cap.tags ?? []) {
        repoTags.add(tag);
        let set = tagToRepos.get(tag);
        if (!set) {
          set = new Set();
          tagToRepos.set(tag, set);
        }
        set.add(m.repo);
      }
    return { repo: m.repo, tags: [...repoTags].sort() };
  });
  const tags = [...tagToRepos.entries()]
    .map(([tag, repos]) => ({ tag, repos: [...repos].sort() }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
  return { tags, byRepo };
}
