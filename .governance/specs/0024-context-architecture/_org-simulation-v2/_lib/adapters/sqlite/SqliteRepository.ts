// SqliteRepository — 3º adapter da MESMA porta `Repository`, num banco RELACIONAL EMBARCADO (`node:sqlite`,
// zero infra/sem Docker). Cada repo = um arquivo `.governance/governance.db`; uma tabela por entidade;
// campos lista → JSON em coluna TEXT. Prova que a porta cobre o paradigma RELACIONAL (tabelas), não só grafo.
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Repository } from "../../ports.ts";
import type {
  Work,
  WorkKind,
  Weight,
  WorkStatus,
  Exploration,
  Question,
  Research,
  Decision,
} from "../../domain/model.ts";

const SIM_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS works (id TEXT PRIMARY KEY, kind TEXT, title TEXT, status TEXT, assignee TEXT, weight TEXT, intent TEXT, blockedBy TEXT, dependsOn TEXT, coordinatesWith TEXT, derivesFrom TEXT, closedBy TEXT, createdAt TEXT, updatedAt TEXT, closedAt TEXT);
CREATE TABLE IF NOT EXISTS explorations (id TEXT PRIMARY KEY, answers TEXT, status TEXT, assignee TEXT, fate TEXT, derivesFrom TEXT, closedBy TEXT, verdict TEXT, createdAt TEXT, updatedAt TEXT, closedAt TEXT);
CREATE TABLE IF NOT EXISTS questions (workId TEXT, id TEXT, mode TEXT, raisedBy TEXT, body TEXT, PRIMARY KEY (workId, id));
CREATE TABLE IF NOT EXISTS researches (workId TEXT, id TEXT, investigates TEXT, method TEXT, body TEXT, PRIMARY KEY (workId, id));
CREATE TABLE IF NOT EXISTS decisions (workId TEXT, id TEXT, resolves TEXT, supportedBy TEXT, supersedes TEXT, resultsIn TEXT, status TEXT, body TEXT, decidedAt TEXT, PRIMARY KEY (workId, id));
`;

type Row = Record<string, unknown>;
const j = (a: unknown): string | null => (a === undefined || a === null ? null : JSON.stringify(a));
const arr = (s: unknown): string[] | undefined =>
  typeof s === "string" ? (JSON.parse(s) as string[]) : undefined;
const str = (v: unknown): string | undefined =>
  v === null || v === undefined ? undefined : String(v);

const toWork = (r: Row): Work => ({
  id: r.id as string,
  kind: r.kind as WorkKind,
  title: r.title as string,
  status: r.status as WorkStatus,
  assignee: str(r.assignee),
  weight: str(r.weight) as Weight | undefined,
  intent: str(r.intent),
  blockedBy: arr(r.blockedBy),
  dependsOn: arr(r.dependsOn),
  coordinatesWith: arr(r.coordinatesWith),
  derivesFrom: arr(r.derivesFrom),
  closedBy: str(r.closedBy),
  createdAt: (r.createdAt as string) ?? "",
  updatedAt: str(r.updatedAt),
  closedAt: str(r.closedAt),
});
const toExploration = (r: Row): Exploration => ({
  id: r.id as string,
  answers: r.answers as string,
  status: r.status as WorkStatus,
  assignee: str(r.assignee),
  fate: str(r.fate) as Exploration["fate"],
  derivesFrom: arr(r.derivesFrom),
  closedBy: str(r.closedBy),
  verdict: str(r.verdict),
  createdAt: (r.createdAt as string) ?? "",
  updatedAt: str(r.updatedAt),
  closedAt: str(r.closedAt),
});
const toQuestion = (r: Row): Question => ({
  id: r.id as string,
  mode: r.mode as Question["mode"],
  raisedBy: str(r.raisedBy),
  body: (r.body as string) ?? "",
});
const toResearch = (r: Row): Research => ({
  id: r.id as string,
  investigates: arr(r.investigates) ?? [],
  method: str(r.method) as Research["method"],
  body: (r.body as string) ?? "",
});
const toDecision = (r: Row): Decision => ({
  id: r.id as string,
  resolves: JSON.parse((r.resolves as string) ?? "[]") as Decision["resolves"],
  supportedBy: arr(r.supportedBy) ?? [],
  supersedes: arr(r.supersedes),
  resultsIn: arr(r.resultsIn),
  status: r.status as Decision["status"],
  body: str(r.body),
  decidedAt: (r.decidedAt as string) ?? "",
});

export class SqliteRepository implements Repository {
  readonly repo: string;
  #db: DatabaseSync;

  constructor(repo: string) {
    this.repo = repo;
    this.#db = new DatabaseSync(path.join(SIM_ROOT, repo, ".governance", "governance.db"));
    this.#db.exec(SCHEMA);
  }

  close(): void {
    this.#db.close();
  }

  async listWorks(): Promise<Work[]> {
    return (this.#db.prepare("SELECT * FROM works ORDER BY id").all() as Row[]).map(toWork);
  }
  async getWork(id: string): Promise<Work | null> {
    const r = this.#db.prepare("SELECT * FROM works WHERE id = ?").get(id) as Row | undefined;
    return r ? toWork(r) : null;
  }
  async saveWork(w: Work): Promise<void> {
    this.#db
      .prepare(
        "INSERT OR REPLACE INTO works (id,kind,title,status,assignee,weight,intent,blockedBy,dependsOn,coordinatesWith,derivesFrom,closedBy,createdAt,updatedAt,closedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
      )
      .run(
        w.id,
        w.kind,
        w.title,
        w.status,
        w.assignee ?? null,
        w.weight ?? null,
        w.intent ?? null,
        j(w.blockedBy),
        j(w.dependsOn),
        j(w.coordinatesWith),
        j(w.derivesFrom),
        w.closedBy ?? null,
        w.createdAt,
        w.updatedAt ?? null,
        w.closedAt ?? null
      );
  }
  async listExplorations(): Promise<Exploration[]> {
    return (this.#db.prepare("SELECT * FROM explorations ORDER BY id").all() as Row[]).map(
      toExploration
    );
  }
  async saveExploration(e: Exploration): Promise<void> {
    this.#db
      .prepare(
        "INSERT OR REPLACE INTO explorations (id,answers,status,assignee,fate,derivesFrom,closedBy,verdict,createdAt,updatedAt,closedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
      )
      .run(
        e.id,
        e.answers,
        e.status,
        e.assignee ?? null,
        e.fate ?? null,
        j(e.derivesFrom),
        e.closedBy ?? null,
        e.verdict ?? null,
        e.createdAt,
        e.updatedAt ?? null,
        e.closedAt ?? null
      );
  }
  async listQuestions(workId: string): Promise<Question[]> {
    return (
      this.#db.prepare("SELECT * FROM questions WHERE workId = ? ORDER BY id").all(workId) as Row[]
    ).map(toQuestion);
  }
  async saveQuestion(workId: string, q: Question): Promise<void> {
    this.#db
      .prepare("INSERT OR REPLACE INTO questions (workId,id,mode,raisedBy,body) VALUES (?,?,?,?,?)")
      .run(workId, q.id, q.mode, q.raisedBy ?? null, q.body);
  }
  async listResearches(workId: string): Promise<Research[]> {
    return (
      this.#db.prepare("SELECT * FROM researches WHERE workId = ? ORDER BY id").all(workId) as Row[]
    ).map(toResearch);
  }
  async addResearch(workId: string, r: Research): Promise<void> {
    this.#db
      .prepare(
        "INSERT OR REPLACE INTO researches (workId,id,investigates,method,body) VALUES (?,?,?,?,?)"
      )
      .run(workId, r.id, j(r.investigates), r.method ?? null, r.body);
  }
  async listDecisions(workId: string): Promise<Decision[]> {
    return (
      this.#db
        .prepare("SELECT * FROM decisions WHERE workId = ? ORDER BY decidedAt, id")
        .all(workId) as Row[]
    ).map(toDecision);
  }
  async addDecision(workId: string, d: Decision): Promise<void> {
    this.#db
      .prepare(
        "INSERT OR REPLACE INTO decisions (workId,id,resolves,supportedBy,supersedes,resultsIn,status,body,decidedAt) VALUES (?,?,?,?,?,?,?,?,?)"
      )
      .run(
        workId,
        d.id,
        JSON.stringify(d.resolves),
        j(d.supportedBy),
        j(d.supersedes),
        j(d.resultsIn),
        d.status,
        d.body ?? null,
        d.decidedAt
      );
  }
}
