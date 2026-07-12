// matcher.ts — SELECTOR/FACTORY do matcher do roteamento, no NÍVEL DO HOST (≠ backend.ts, que é por-repo).
// `loadMatcher()` lê acme-governance/matcher.yml (default do host). `buildMatcher(cfg)` constrói por spec — usado
// também em RUNTIME (a tela de triagem deixa a pessoa SIMULAR léxico / LLM local / API). Espectro solo→enterprise (MATCHER.md).
import { exists, readYaml, readText } from "./adapters/file/io.ts";
import { LexicalMatcher } from "./domain/routing.ts";
import type { Matcher } from "./domain/routing.ts";
import { OllamaEmbedMatcher, OllamaGenerateMatcher } from "./adapters/llm/OllamaMatcher.ts";
import { GeminiApiMatcher } from "./adapters/llm/GeminiApiMatcher.ts";

export interface MatcherConfig {
  kind?: "lexical" | "ollama-embed" | "ollama-generate" | "gemini-api";
  endpoint?: string;
  model?: string;
}

/** constrói um matcher a partir de uma spec (kind/model/endpoint). Lança se faltar infra (ex.: key da API). */
export function buildMatcher(cfg: MatcherConfig): { matcher: Matcher; label: string } {
  const endpoint = cfg.endpoint ?? "http://localhost:11434";
  if (cfg.kind === "ollama-embed") {
    const model = cfg.model ?? "nomic-embed-text";
    return { matcher: new OllamaEmbedMatcher(endpoint, model), label: `ollama-embed (${model})` };
  }
  if (cfg.kind === "ollama-generate") {
    const model = cfg.model ?? "qwen3:4b";
    return {
      matcher: new OllamaGenerateMatcher(endpoint, model),
      label: `ollama-generate (${model})`,
    };
  }
  if (cfg.kind === "gemini-api") {
    // a key vem do ambiente OU do arquivo gitignored _bench/.gemini-key (nunca versionada, nunca na UI)
    const key = (
      process.env.GEMINI_API_KEY ??
      (exists("_bench/.gemini-key") ? readText("_bench/.gemini-key") : "")
    ).trim();
    if (!key)
      throw new Error("integração indisponível: sem GEMINI_API_KEY (env ou _bench/.gemini-key)");
    const model = cfg.model ?? "gemini-2.5-flash";
    return { matcher: new GeminiApiMatcher(model, key), label: `gemini-api (${model})` };
  }
  return { matcher: new LexicalMatcher(), label: "lexical (zero infra)" };
}

/** o matcher do host (default de roteamento) + um rótulo p/ log. Default = léxico (solo, zero infra, determinístico). */
export function loadMatcher(): { matcher: Matcher; label: string } {
  const rel = "acme-governance/matcher.yml"; // raiz do host (≠ sidecar .governance/ dos work-repos; o host É a governança)
  const cfg: MatcherConfig = exists(rel) ? readYaml<MatcherConfig>(rel) : {};
  const { matcher, label } = buildMatcher(cfg);
  return {
    matcher,
    label: cfg.endpoint && cfg.kind?.startsWith("ollama") ? `${label} @ ${cfg.endpoint}` : label,
  };
}
