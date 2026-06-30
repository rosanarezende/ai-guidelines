// GeminiApiMatcher.ts — Matcher tier 3a: API HOSTED do Gemini (Google AI Studio). A key é INJETADA (nunca hardcoded).
// ⚠️ tier 3a = consome cota da API (o free tier do AI Studio tem limite de req/min). Modelo plugável (flash/pro). Ver MATCHER.md.
import type { Match, MatchCandidate, Matcher } from "../../domain/routing.ts";

export class GeminiApiMatcher implements Matcher {
  #model: string;
  #key: string;

  constructor(model: string, key: string) {
    this.#model = model;
    this.#key = key;
  }

  async rank(need: string, candidates: MatchCandidate[]): Promise<Match[]> {
    if (!this.#key) throw new Error("GEMINI_API_KEY ausente");
    const repos = candidates
      .map((c) => `- ${c.repo}: ${c.capabilities.map((x) => x.text).join("; ")}`)
      .join("\n");
    const prompt =
      `NEED: ${need}\n\nREPOS (nome: capabilities):\n${repos}\n\n` +
      `Qual repo melhor atende o NEED? Responda JSON {"ranked":["<nome EXATO da lista>", ...]} do melhor pro pior, TODOS os repos.`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.#model}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": this.#key }, // key no header (não na URL/log)
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 140)}`);
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const valid = new Set(candidates.map((c) => c.repo));
    let names: string[] = [];
    try {
      const parsed = JSON.parse(text) as { ranked?: string[] };
      names = (parsed.ranked ?? []).filter((n) => valid.has(n));
    } catch {
      names = [];
    }
    const ranked: Match[] = names.map((repo, i) => ({ repo, score: 100 - i, why: "Gemini API" }));
    for (const c of candidates)
      if (!ranked.some((r) => r.repo === c.repo))
        ranked.push({ repo: c.repo, score: 0, why: "(não citado)" });
    return ranked;
  }
}
