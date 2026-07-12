// routing-bench.ts — compara os matchers (léxico · embed · generativo) no dogfood do login_1: REPRODUZ as escolhas
// humanas? + latência. Preenche a escada de viabilidade do MATCHER.md. Requer Ollama no ar + os modelos puxados.
import { FileHostRepository } from "./adapters/file/FileHostRepository.ts";
import { deriveRouting, LexicalMatcher } from "./domain/routing.ts";
import type { Matcher, RoutingSuggestion } from "./domain/routing.ts";
import { OllamaEmbedMatcher, OllamaGenerateMatcher } from "./adapters/llm/OllamaMatcher.ts";

const host = new FileHostRepository();
const manifests = await host.listManifests();
const intent = await host.getIntent("login_1");
if (!intent) throw new Error("intent login_1 não encontrada");

const ENDPOINT = "http://localhost:11434";
const subjectOf = (id: string): string => intent.explores.find((e) => e.id === id)?.title ?? "";
const want: [string, string][] = [
  [subjectOf("e1"), "acme-design-system"],
  [subjectOf("e2"), "acme-mfe-support"],
  ["form-component", "acme-design-system"],
  ["failure-event", "acme-mfe-identity"],
];
const top = (sugs: RoutingSuggestion[], need: string): string | undefined =>
  sugs.find((s) => s.need === need || s.need === `contrato: ${need}`)?.ranked[0]?.repo;

const matchers: { label: string; matcher: Matcher }[] = [
  { label: "lexical (tier 0, zero infra)", matcher: new LexicalMatcher() },
  {
    label: "embed nomic-embed-text (t1)",
    matcher: new OllamaEmbedMatcher(ENDPOINT, "nomic-embed-text"),
  },
  {
    label: "gen qwen3:1.7b (t2 simples)",
    matcher: new OllamaGenerateMatcher(ENDPOINT, "qwen3:1.7b"),
  },
  { label: "gen qwen3:4b (t2 médio)", matcher: new OllamaGenerateMatcher(ENDPOINT, "qwen3:4b") },
  { label: "gen gemma3:12b (t2 alto)", matcher: new OllamaGenerateMatcher(ENDPOINT, "gemma3:12b") },
];

console.log("matcher".padEnd(30) + "e1 e2 frm fail   acertos  latência");
for (const { label, matcher } of matchers) {
  try {
    const t0 = Date.now();
    const sugs = await deriveRouting(intent, manifests, matcher);
    const ms = Date.now() - t0;
    const marks = want.map(([need, exp]) => (top(sugs, need) === exp ? "✅" : "❌"));
    const hits = marks.filter((m) => m === "✅").length;
    console.log(label.padEnd(30) + marks.join(" ") + `    ${hits}/4    ${(ms / 1000).toFixed(1)}s`);
  } catch (e) {
    console.log(label.padEnd(30) + `— indisponível: ${(e as Error).message.split("\n")[0]}`);
  }
}
