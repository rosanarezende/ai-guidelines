// FileRepository — adapter da porta `Repository` sobre o `.governance/` VERSIONADO (fs). Backend local/MVP.
// Os métodos são async (cumprem o contrato Neo4j-ready) mas a infra de arquivo é síncrona por dentro.
// Mapeia ARQUIVO (kebab-case) ↔ DOMÍNIO (camelCase); o domínio não conhece este shape.
import type { Repository } from "../../ports.ts";
import type {
  Work,
  WorkKind,
  Exploration,
  Question,
  Research,
  Decision,
} from "../../domain/model.ts";
import { exists, readYaml, writeYaml, readMarkdown, writeMarkdown, listMarkdown } from "./io.ts";

const WORK_KINDS: WorkKind[] = ["delivery", "experiment", "incident", "fix", "patch"];

// ───────────────────────── shapes do ARQUIVO ─────────────────────────

interface RegistryFile {
  entries?: WorkEntry[];
}
interface WorkEntry {
  id: string;
  kind?: WorkKind;
  title?: string;
  status: Work["status"];
  assignee?: string | null;
  weight?: Work["weight"];
  intent?: string | null;
  "blocked-by"?: string[];
  "depends-on"?: string[];
  "coordinates-with"?: string[];
  "derives-from"?: string[];
  "closed-by"?: string;
  "created-at"?: string;
  "updated-at"?: string;
  "closed-at"?: string;
  workspace?: string;
}
interface ExplorationFile {
  entries?: ExplorationEntry[];
}
interface ExplorationEntry {
  id: string;
  answers: string;
  status: Work["status"];
  assignee?: string | null;
  fate?: Exploration["fate"];
  "derives-from"?: string[];
  "closed-by"?: string;
  "created-at"?: string;
  "updated-at"?: string;
  "closed-at"?: string;
}
interface QuestionFront {
  id: string;
  mode: Question["mode"];
  "raised-by"?: string;
}
interface ResearchFront {
  id: string;
  investigates?: string[];
  method?: Research["method"];
}
interface DeliberationFile {
  decisions?: DecisionEntry[];
}
interface DecisionEntry {
  id: string;
  resolves: { question: string; into: string }[];
  "supported-by"?: string[];
  supersedes?: string[];
  "results-in"?: string[];
  status: Decision["status"];
  body?: string;
  "decided-at"?: string;
}

// ───────────────────────── mappers (arquivo ↔ domínio) ─────────────────────────

const toWork = (kind: WorkKind, e: WorkEntry): Work => ({
  id: e.id,
  kind,
  title: e.title ?? e.id,
  status: e.status,
  assignee: e.assignee,
  weight: e.weight,
  intent: e.intent,
  blockedBy: e["blocked-by"],
  dependsOn: e["depends-on"],
  coordinatesWith: e["coordinates-with"],
  derivesFrom: e["derives-from"],
  closedBy: e["closed-by"],
  createdAt: e["created-at"] ?? "",
  updatedAt: e["updated-at"],
  closedAt: e["closed-at"],
});

const fromWork = (w: Work): WorkEntry => ({
  id: w.id,
  title: w.title,
  status: w.status,
  assignee: w.assignee,
  weight: w.weight,
  intent: w.intent,
  "blocked-by": w.blockedBy,
  "depends-on": w.dependsOn,
  "coordinates-with": w.coordinatesWith,
  "derives-from": w.derivesFrom,
  "closed-by": w.closedBy,
  "created-at": w.createdAt,
  "updated-at": w.updatedAt,
  "closed-at": w.closedAt,
});

const toExploration = (e: ExplorationEntry, verdict?: string): Exploration => ({
  id: e.id,
  answers: e.answers,
  status: e.status,
  assignee: e.assignee,
  fate: e.fate,
  derivesFrom: e["derives-from"],
  closedBy: e["closed-by"],
  verdict,
  createdAt: e["created-at"] ?? "",
  updatedAt: e["updated-at"],
  closedAt: e["closed-at"],
});

const toDecision = (d: DecisionEntry): Decision => ({
  id: d.id,
  resolves: d.resolves,
  supportedBy: d["supported-by"] ?? [],
  supersedes: d.supersedes,
  resultsIn: d["results-in"],
  status: d.status,
  body: d.body,
  decidedAt: d["decided-at"] ?? "",
});

const fromDecision = (d: Decision): DecisionEntry => ({
  id: d.id,
  resolves: d.resolves,
  "supported-by": d.supportedBy,
  supersedes: d.supersedes,
  "results-in": d.resultsIn,
  status: d.status,
  body: d.body,
  "decided-at": d.decidedAt,
});

// ───────────────────────── o adapter ─────────────────────────

export class FileRepository implements Repository {
  readonly repo: string;

  constructor(repo: string) {
    this.repo = repo;
  }

  private registry(kind: WorkKind): string {
    return `${this.repo}/.governance/registry/${kind}.yml`;
  }
  private workDir(kind: WorkKind, id: string): string {
    return `${this.repo}/.governance/works/${kind}/${id}`;
  }
  private readRegistry(kind: WorkKind): WorkEntry[] {
    const rel = this.registry(kind);
    return exists(rel) ? (readYaml<RegistryFile>(rel).entries ?? []) : [];
  }

  // ── trabalho ──

  async listWorks(): Promise<Work[]> {
    return WORK_KINDS.flatMap((kind) => this.readRegistry(kind).map((e) => toWork(kind, e)));
  }

  async getWork(id: string): Promise<Work | null> {
    return (await this.listWorks()).find((w) => w.id === id) ?? null;
  }

  async saveWork(work: Work): Promise<void> {
    const rel = this.registry(work.kind);
    const entries = this.readRegistry(work.kind).filter((e) => e.id !== work.id);
    entries.push(fromWork(work));
    writeYaml(rel, { entries });
  }

  // ── ferramenta exploration ──

  async listExplorations(): Promise<Exploration[]> {
    const rel = `${this.repo}/.governance/registry/exploration.yml`;
    const entries = exists(rel) ? (readYaml<ExplorationFile>(rel).entries ?? []) : [];
    return entries.map((e) => toExploration(e, this.readVerdict(e)));
  }

  async saveExploration(exp: Exploration): Promise<void> {
    const rel = `${this.repo}/.governance/registry/exploration.yml`;
    const cur = exists(rel) ? (readYaml<ExplorationFile>(rel).entries ?? []) : [];
    const entries = cur.filter((e) => e.id !== exp.id);
    entries.push({
      id: exp.id,
      answers: exp.answers,
      status: exp.status,
      assignee: exp.assignee,
      fate: exp.fate,
      "derives-from": exp.derivesFrom,
      "closed-by": exp.closedBy,
      "created-at": exp.createdAt,
      "updated-at": exp.updatedAt,
      "closed-at": exp.closedAt,
    });
    writeYaml(rel, { entries });
  }

  /** o verdict é CONTEÚDO co-locado (closed-by → exploration-answer); só quando done. */
  private readVerdict(e: ExplorationEntry): string | undefined {
    if (e.status !== "done" || !e["closed-by"]) return undefined;
    const rel = `${this.repo}/.governance/${e["closed-by"]}`;
    return exists(rel) ? readMarkdown<{ verdict?: string }>(rel).frontmatter.verdict : undefined;
  }

  // ── deliberação de um work (q/r/d) ──

  private async kindOf(workId: string): Promise<WorkKind | null> {
    return (await this.getWork(workId))?.kind ?? null;
  }

  async listQuestions(workId: string): Promise<Question[]> {
    const kind = await this.kindOf(workId);
    if (!kind) return [];
    const dir = `${this.workDir(kind, workId)}/questions`;
    return listMarkdown(dir).map((f) => {
      const { frontmatter, body } = readMarkdown<QuestionFront>(`${dir}/${f}`);
      return {
        id: frontmatter.id,
        mode: frontmatter.mode,
        raisedBy: frontmatter["raised-by"],
        body,
      };
    });
  }

  async saveQuestion(workId: string, q: Question): Promise<void> {
    const kind = await this.kindOf(workId);
    if (!kind) throw new Error(`work não encontrado: ${workId}`);
    const front: QuestionFront & { node: string } = {
      node: "question",
      id: q.id,
      mode: q.mode,
      "raised-by": q.raisedBy,
    };
    writeMarkdown(`${this.workDir(kind, workId)}/questions/${q.id}.md`, front, q.body);
  }

  async listResearches(workId: string): Promise<Research[]> {
    const kind = await this.kindOf(workId);
    if (!kind) return [];
    const dir = `${this.workDir(kind, workId)}/research`;
    return listMarkdown(dir).map((f) => {
      const { frontmatter, body } = readMarkdown<ResearchFront>(`${dir}/${f}`);
      return {
        id: frontmatter.id,
        investigates: frontmatter.investigates ?? [],
        method: frontmatter.method,
        body,
      };
    });
  }

  async addResearch(workId: string, r: Research): Promise<void> {
    const kind = await this.kindOf(workId);
    if (!kind) throw new Error(`work não encontrado: ${workId}`);
    const front: ResearchFront & { node: string } = {
      node: "research",
      id: r.id,
      investigates: r.investigates,
      method: r.method,
    };
    writeMarkdown(`${this.workDir(kind, workId)}/research/${r.id}.md`, front, r.body);
  }

  async listDecisions(workId: string): Promise<Decision[]> {
    const kind = await this.kindOf(workId);
    if (!kind) return [];
    const rel = `${this.workDir(kind, workId)}/deliberation.yml`;
    const decisions = exists(rel) ? (readYaml<DeliberationFile>(rel).decisions ?? []) : [];
    return decisions.map(toDecision);
  }

  async addDecision(workId: string, d: Decision): Promise<void> {
    const kind = await this.kindOf(workId);
    if (!kind) throw new Error(`work não encontrado: ${workId}`);
    const rel = `${this.workDir(kind, workId)}/deliberation.yml`;
    const decisions = exists(rel) ? (readYaml<DeliberationFile>(rel).decisions ?? []) : [];
    decisions.push(fromDecision(d)); // APPEND-ONLY
    writeYaml(rel, { decisions });
  }
}
