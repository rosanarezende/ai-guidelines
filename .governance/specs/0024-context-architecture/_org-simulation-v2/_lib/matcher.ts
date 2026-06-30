// matcher.ts — SELECTOR do matcher do roteamento, no NÍVEL DO HOST (≠ backend.ts, que é por-repo).
// Lê acme-governance/.governance/matcher.yml. Ausente / kind:lexical → LexicalMatcher (zero infra, o default solo).
// kind:ollama-embed → OllamaEmbedMatcher (LLM LOCAL, soberania de dados). É o espectro solo→enterprise. Ver MATCHER.md.
import { exists, readYaml } from "./adapters/file/io.ts";
import { LexicalMatcher } from "./domain/routing.ts";
import type { Matcher } from "./domain/routing.ts";
import { OllamaEmbedMatcher } from "./adapters/llm/OllamaMatcher.ts";

interface MatcherConfig {
  kind?: "lexical" | "ollama-embed";
  endpoint?: string;
  model?: string;
}

/** o matcher do host + um rótulo p/ log. Default = léxico (solo, zero infra, determinístico). */
export function loadMatcher(): { matcher: Matcher; label: string } {
  const rel = "acme-governance/matcher.yml"; // raiz do host (≠ sidecar .governance/ dos work-repos; o host É a governança)
  const cfg: MatcherConfig = exists(rel) ? readYaml<MatcherConfig>(rel) : {};
  const endpoint = cfg.endpoint ?? "http://localhost:11434";
  if (cfg.kind === "ollama-embed") {
    const model = cfg.model ?? "nomic-embed-text";
    return {
      matcher: new OllamaEmbedMatcher(endpoint, model),
      label: `ollama-embed (${model}) @ ${endpoint}`,
    };
  }
  return { matcher: new LexicalMatcher(), label: "lexical (zero infra)" };
}
