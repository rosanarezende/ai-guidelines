// MongoRepository — 4º adapter da MESMA porta `Repository`, num banco de DOCUMENTOS (MongoDB / NoSQL).
// Cada entidade = um documento; o Mongo guarda arrays/objetos NATIVAMENTE → `resolves` não vira JSON (≠ SQLite).
// Escopo por campo `repo` (uma coleção por tipo, todos os repos juntos). Prova: a porta cobre o paradigma DOCUMENTO.
import type { Db } from "mongodb";
import type { Repository } from "../../ports.ts";
import type { Work, Exploration, Question, Research, Decision } from "../../domain/model.ts";
import { normalizeWorkKind } from "../../domain/model.ts";

/** tira os campos de infra do documento (`_id`, `repo`, `workId`) → devolve a entidade pura do domínio. */
function strip<T>(doc: Record<string, unknown>): T {
  const { _id, repo, workId, ...rest } = doc;
  return rest as T;
}

/** BORDA de leitura de work: normaliza o kind (string legada → canônico) + funde dims; `null` se não for work (fail-closed). */
function normWork(w: Work): Work | null {
  const norm = normalizeWorkKind(w.kind as string);
  if (!norm) return null;
  const dims = { ...norm.dimensions, ...(w.dimensions ?? {}) };
  return { ...w, kind: norm.kind, dimensions: Object.keys(dims).length ? dims : undefined };
}

export class MongoRepository implements Repository {
  readonly repo: string;
  #db: Db;

  constructor(repo: string, db: Db) {
    this.repo = repo;
    this.#db = db;
  }

  #col(name: string) {
    return this.#db.collection<Record<string, unknown>>(name);
  }

  // ── trabalho ──
  async listWorks(): Promise<Work[]> {
    const ds = await this.#col("works").find({ repo: this.repo }).sort({ id: 1 }).toArray();
    return ds.map((d) => normWork(strip<Work>(d))).filter((w): w is Work => w !== null);
  }
  async getWork(id: string): Promise<Work | null> {
    const d = await this.#col("works").findOne({ repo: this.repo, id });
    return d ? normWork(strip<Work>(d)) : null;
  }
  async saveWork(w: Work): Promise<void> {
    await this.#col("works").replaceOne(
      { repo: this.repo, id: w.id },
      { repo: this.repo, ...w },
      { upsert: true }
    );
  }

  // ── ferramenta exploration ──
  async listExplorations(): Promise<Exploration[]> {
    const ds = await this.#col("explorations").find({ repo: this.repo }).sort({ id: 1 }).toArray();
    return ds.map((d) => strip<Exploration>(d));
  }
  async saveExploration(e: Exploration): Promise<void> {
    await this.#col("explorations").replaceOne(
      { repo: this.repo, id: e.id },
      { repo: this.repo, ...e },
      { upsert: true }
    );
  }

  // ── deliberação de um work (q/r/d) ──
  async listQuestions(workId: string): Promise<Question[]> {
    const ds = await this.#col("questions")
      .find({ repo: this.repo, workId })
      .sort({ id: 1 })
      .toArray();
    return ds.map((d) => strip<Question>(d));
  }
  async saveQuestion(workId: string, q: Question): Promise<void> {
    await this.#col("questions").replaceOne(
      { repo: this.repo, workId, id: q.id },
      { repo: this.repo, workId, ...q },
      { upsert: true }
    );
  }
  async listResearches(workId: string): Promise<Research[]> {
    const ds = await this.#col("researches")
      .find({ repo: this.repo, workId })
      .sort({ id: 1 })
      .toArray();
    return ds.map((d) => strip<Research>(d));
  }
  async addResearch(workId: string, r: Research): Promise<void> {
    await this.#col("researches").replaceOne(
      { repo: this.repo, workId, id: r.id },
      { repo: this.repo, workId, ...r },
      { upsert: true }
    );
  }
  async listDecisions(workId: string): Promise<Decision[]> {
    const ds = await this.#col("decisions")
      .find({ repo: this.repo, workId })
      .sort({ decidedAt: 1, id: 1 })
      .toArray();
    return ds.map((d) => strip<Decision>(d));
  }
  async addDecision(workId: string, d: Decision): Promise<void> {
    await this.#col("decisions").replaceOne(
      { repo: this.repo, workId, id: d.id },
      { repo: this.repo, workId, ...d },
      { upsert: true }
    );
  }
}
