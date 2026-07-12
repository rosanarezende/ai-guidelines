// Neo4jRepository — o SEGUNDO adapter da MESMA porta `Repository`, agora num banco de GRAFOS (Neo4j).
// Prova a pluggability: domínio, derivações e view NÃO mudam — só o backend. Escopo por `repo` (prop nos nós).
// Modelo (1ª versão, pragmática): cada entidade = um NÓ rotulado; arestas da Lente 3 = refinamento futuro.
//   campos lista-de-string → propriedade lista nativa do Neo4j; `resolves` (lista de objetos) → JSON na prop.
import neo4j from "neo4j-driver";
import type { Driver } from "neo4j-driver";
import type { Repository } from "../../ports.ts";
import type {
  Work,
  Dimensions,
  Weight,
  WorkStatus,
  Exploration,
  Question,
  Research,
  Decision,
} from "../../domain/model.ts";
import { normalizeWorkKind } from "../../domain/model.ts";

/** cria um driver Neo4j (bolt). A conexão é gerida por quem instancia (abre 1, fecha no fim). */
export function neo4jDriver(uri: string, user: string, password: string): Driver {
  return neo4j.driver(uri, neo4j.auth.basic(user, password));
}

type Props = Record<string, unknown>;
const clean = (o: Props): Props =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null));

// ── mappers domínio ↔ propriedades de nó ──
const toWork = (p: Props): Work | null => {
  const norm = normalizeWorkKind(p.kind as string); // props guardam string; não-work/desconhecido → null (fail-closed)
  if (!norm) return null;
  const stored = p.dimensions ? (JSON.parse(p.dimensions as string) as Dimensions) : {};
  const dims = { ...norm.dimensions, ...stored };
  return {
    id: p.id as string,
    kind: norm.kind,
    title: p.title as string,
    status: p.status as WorkStatus,
    assignee: p.assignee as string | undefined,
    weight: p.weight as Weight | undefined,
    dimensions: Object.keys(dims).length ? dims : undefined,
    intent: p.intent as string | undefined,
    blockedBy: p.blockedBy as string[] | undefined,
    dependsOn: p.dependsOn as string[] | undefined,
    coordinatesWith: p.coordinatesWith as string[] | undefined,
    derivesFrom: p.derivesFrom as string[] | undefined,
    closedBy: p.closedBy as string | undefined,
    createdAt: (p.createdAt as string) ?? "",
    updatedAt: p.updatedAt as string | undefined,
    closedAt: p.closedAt as string | undefined,
  };
};

const toExploration = (p: Props): Exploration => ({
  id: p.id as string,
  explores: p.explores as string | undefined,
  answers: p.answers as string,
  status: p.status as WorkStatus,
  assignee: p.assignee as string | undefined,
  fate: p.fate as Exploration["fate"],
  derivesFrom: p.derivesFrom as string[] | undefined,
  closedBy: p.closedBy as string | undefined,
  verdict: p.verdict as string | undefined,
  createdAt: (p.createdAt as string) ?? "",
  updatedAt: p.updatedAt as string | undefined,
  closedAt: p.closedAt as string | undefined,
});

const toQuestion = (p: Props): Question => ({
  id: p.id as string,
  mode: p.mode as Question["mode"],
  raisedBy: p.raisedBy as string | undefined,
  body: (p.body as string) ?? "",
});

const toResearch = (p: Props): Research => ({
  id: p.id as string,
  investigates: (p.investigates as string[]) ?? [],
  method: p.method as Research["method"],
  body: (p.body as string) ?? "",
});

const toDecision = (p: Props): Decision => ({
  id: p.id as string,
  resolves: JSON.parse((p.resolves as string) ?? "[]") as Decision["resolves"],
  supportedBy: (p.supportedBy as string[]) ?? [],
  supersedes: p.supersedes as string[] | undefined,
  resultsIn: p.resultsIn as string[] | undefined,
  status: p.status as Decision["status"],
  body: p.body as string | undefined,
  decidedAt: (p.decidedAt as string) ?? "",
});

export class Neo4jRepository implements Repository {
  readonly repo: string;
  #driver: Driver;

  constructor(repo: string, driver: Driver) {
    this.repo = repo;
    this.#driver = driver;
  }

  async #read<T>(cypher: string, params: Props, map: (p: Props) => T): Promise<T[]> {
    const session = this.#driver.session();
    try {
      const res = await session.run(cypher, { repo: this.repo, ...params });
      return res.records.map((r) => map((r.get("n") as { properties: Props }).properties));
    } finally {
      await session.close();
    }
  }

  async #write(cypher: string, params: Props): Promise<void> {
    const session = this.#driver.session();
    try {
      await session.run(cypher, { repo: this.repo, ...params });
    } finally {
      await session.close();
    }
  }

  // ── trabalho ──
  async listWorks(): Promise<Work[]> {
    const rows = await this.#read(
      "MATCH (n:Work {repo: $repo}) RETURN n ORDER BY n.id",
      {},
      toWork
    );
    return rows.filter((w): w is Work => w !== null);
  }
  async getWork(id: string): Promise<Work | null> {
    const r = await this.#read("MATCH (n:Work {repo: $repo, id: $id}) RETURN n", { id }, toWork);
    return r[0] ?? null;
  }
  saveWork(w: Work): Promise<void> {
    // Neo4j não aceita map aninhado como propriedade de nó → serializa dimensions em JSON (reidratado no toWork).
    return this.#write("MERGE (n:Work {repo: $repo, id: $id}) SET n = $props", {
      id: w.id,
      props: clean({
        repo: this.repo,
        ...w,
        dimensions: w.dimensions ? JSON.stringify(w.dimensions) : undefined,
      }),
    });
  }

  // ── ferramenta exploration ──
  listExplorations(): Promise<Exploration[]> {
    return this.#read(
      "MATCH (n:Exploration {repo: $repo}) RETURN n ORDER BY n.id",
      {},
      toExploration
    );
  }
  saveExploration(e: Exploration): Promise<void> {
    return this.#write("MERGE (n:Exploration {repo: $repo, id: $id}) SET n = $props", {
      id: e.id,
      props: clean({ repo: this.repo, ...e }),
    });
  }

  // ── deliberação de um work (q/r/d) ──
  listQuestions(workId: string): Promise<Question[]> {
    return this.#read(
      "MATCH (n:Question {repo: $repo, workId: $workId}) RETURN n ORDER BY n.id",
      { workId },
      toQuestion
    );
  }
  saveQuestion(workId: string, q: Question): Promise<void> {
    return this.#write(
      "MERGE (n:Question {repo: $repo, workId: $workId, id: $id}) SET n = $props",
      {
        workId,
        id: q.id,
        props: clean({ repo: this.repo, workId, ...q }),
      }
    );
  }
  listResearches(workId: string): Promise<Research[]> {
    return this.#read(
      "MATCH (n:Research {repo: $repo, workId: $workId}) RETURN n ORDER BY n.id",
      { workId },
      toResearch
    );
  }
  addResearch(workId: string, r: Research): Promise<void> {
    return this.#write(
      "MERGE (n:Research {repo: $repo, workId: $workId, id: $id}) SET n = $props",
      {
        workId,
        id: r.id,
        props: clean({ repo: this.repo, workId, ...r }),
      }
    );
  }
  listDecisions(workId: string): Promise<Decision[]> {
    return this.#read(
      "MATCH (n:Decision {repo: $repo, workId: $workId}) RETURN n ORDER BY n.decidedAt, n.id",
      { workId },
      toDecision
    );
  }
  addDecision(workId: string, d: Decision): Promise<void> {
    const props = clean({
      repo: this.repo,
      workId,
      ...d,
      resolves: JSON.stringify(d.resolves), // lista de objetos → JSON (Neo4j não guarda mapas em prop)
    });
    return this.#write(
      "MERGE (n:Decision {repo: $repo, workId: $workId, id: $id}) SET n = $props",
      { workId, id: d.id, props }
    );
  }
}
