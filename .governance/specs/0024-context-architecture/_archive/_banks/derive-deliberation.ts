// Camada INTERNA do repo (Lente 5): lê o q/r/d nos FOLDERS do work (questions/ · research/ + deliberation.yml)
// e deriva o GATE (answered/pending/resolved) E o STATE (stage/cursor). É PRIVADA — não sobe pro dashboard;
// a camada EXTERNA (derive-repo) é que publica pra governança. Prova: deliberation → banco → gate + state.
import type {
  QuestionNode,
  ResearchNode,
  DeliberationMap,
  QuestionGate,
  DeliberationProjection,
} from "./types.ts";
import { listDir, readFrontmatter, readYaml, fileExists } from "./io.ts";
import { deriveGate } from "./derive-governance.ts";

const mds = (files: string[]): string[] => files.filter((f) => f.endsWith(".md")).sort();

export function deriveDeliberation(workRef: string): DeliberationProjection {
  const [repo, kind, id] = workRef.split("/");
  const base = `${repo}/.governance/works/${kind}/${id}`;

  // conteúdo nos folders; a aresta (`investigates`) mora no frontmatter da research — anota 1 lado
  const questions = mds(listDir(`${base}/questions`)).map((f) =>
    readFrontmatter<QuestionNode>(`${base}/questions/${f}`)
  );
  const researches = mds(listDir(`${base}/research`)).map((f) =>
    readFrontmatter<ResearchNode>(`${base}/research/${f}`)
  );
  // o deliberation.yml = mapa append-only das DECISÕES (vazio enquanto ninguém decidiu)
  const map = fileExists(`${base}/deliberation.yml`)
    ? readYaml<DeliberationMap>(`${base}/deliberation.yml`)
    : {};
  const decisions = map.decisions ?? [];

  const researchesOf = (qid: string): string[] =>
    researches.filter((r) => (r.investigates ?? []).includes(qid)).map((r) => r.id);

  // GATE: o MESMO deriveGate da intent (answered = tem ≥1 research; resolved = decisão aceita em vigor)
  const gate = deriveGate(
    questions.map((q) => {
      const rs = researchesOf(q.id);
      return { id: q.id, answered: rs.length > 0, answeredBy: rs.join("+") || undefined };
    }),
    decisions
  );
  const qgates: QuestionGate[] = gate.map((g) => ({
    ...g,
    mode: questions.find((q) => q.id === g.id)?.mode,
    researches: researchesOf(g.id),
  }));

  // STATE DERIVADO (a prova da Lente 5: o banco deriva stage/cursor do deliberation, não se autora à mão)
  const open = qgates.filter((q) => !q.resolved);
  return {
    work: workRef,
    stage: open.length > 0 ? "deciding" : "executing",
    cursor:
      open.length > 0
        ? `gate pendente em: ${open.map((q) => q.id).join(", ")}`
        : "todas resolvidas → executar",
    questions: qgates,
  };
}
