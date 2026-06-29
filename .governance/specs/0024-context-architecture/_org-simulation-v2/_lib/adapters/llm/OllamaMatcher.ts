// OllamaMatcher.ts — adapter de Matcher por EMBEDDINGS num modelo LOCAL (Ollama, API em localhost). Tier 1 do espectro.
// Vetoriza o `need` e cada capability (POST /api/embeddings) → cosine → ranqueia. Soberania de dados: nada sai da máquina.
// É a MESMA porta `Matcher` do léxico — trocar é 1 linha (loadMatcher via matcher.yml). Ver MATCHER.md.
import type { Match, MatchCandidate, Matcher } from "../../domain/routing.ts";

const cosine = (a: number[], b: number[]): number => {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! ** 2;
    nb += b[i]! ** 2;
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
};

export class OllamaEmbedMatcher implements Matcher {
  #endpoint: string;
  #model: string;
  #cache = new Map<string, number[]>(); // o mesmo texto não re-embeda (need/capabilities repetem entre intents)

  constructor(endpoint: string, model: string) {
    this.#endpoint = endpoint.replace(/\/$/, "");
    this.#model = model;
  }

  async #embed(text: string): Promise<number[]> {
    const hit = this.#cache.get(text);
    if (hit) return hit;
    const res = await fetch(`${this.#endpoint}/api/embeddings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: this.#model, prompt: text }),
    });
    if (!res.ok)
      throw new Error(
        `Ollama ${res.status} em ${this.#endpoint} — o Ollama está no ar e o modelo "${this.#model}" foi puxado? (ollama pull ${this.#model})`
      );
    const json = (await res.json()) as { embedding: number[] };
    this.#cache.set(text, json.embedding);
    return json.embedding;
  }

  async rank(need: string, candidates: MatchCandidate[]): Promise<Match[]> {
    const nv = await this.#embed(need);
    const out: Match[] = [];
    for (const c of candidates) {
      let best = 0;
      let bestText = "";
      for (const cap of c.capabilities) {
        const sim = cosine(nv, await this.#embed(cap.text));
        if (sim > best) {
          best = sim;
          bestText = cap.text;
        }
      }
      out.push({
        repo: c.repo,
        score: Math.round(best * 100), // cosine 0..1 → 0..100 (comparável visualmente ao léxico)
        why: bestText ? `~ "${bestText.slice(0, 40)}…" (cos ${best.toFixed(2)})` : "sem capability",
      });
    }
    return out.sort((a, b) => b.score - a.score);
  }
}
