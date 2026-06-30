import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type OrgGraph, type Intent } from "../api.ts";
import { LayeredGraph, type GNode, type GEdge } from "../graph/LayeredGraph.tsx";

// Grafo da org pela ótica das INICIATIVAS: intents (coluna 1) → repos que elas tocam (coluna 2),
// pela sugestão de ROTEAMENTO (advisory, léxico). Entre os repos, as arestas coordinates-with (derivadas).
export function IntentGraph() {
  const [graph, setGraph] = useState<OrgGraph | null>(null);
  const [intents, setIntents] = useState<Intent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    Promise.all([api.graph(), api.intents()])
      .then(([g, i]) => {
        setGraph(g);
        setIntents(i);
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)));
  }, []);

  if (error) return <p className="error">Erro: {error}</p>;
  if (!graph || !intents) return <p className="muted">carregando…</p>;

  const nodes: GNode[] = [];
  for (const i of intents)
    nodes.push({ id: `intent:${i.id}`, label: i.title, sub: i.id, layer: 0, kind: "intent" });
  for (const n of graph.knowledge.nodes)
    nodes.push({ id: `repo:${n.repo}`, label: n.repo, sub: n.role, layer: 1, kind: "repo" });

  // intent → repo: top-1 por need (score > 0), deduplicado.
  const edges: GEdge[] = [];
  const seen = new Set<string>();
  for (const r of graph.routing)
    for (const s of r.suggestions) {
      const top = s.ranked[0];
      if (!top || top.score <= 0) continue;
      const key = `${r.intent}->${top.repo}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: `intent:${r.intent}`, to: `repo:${top.repo}` });
    }
  // repo ↔ repo: coordinates-with (derivado dos manifestos).
  for (const e of graph.knowledge.edges)
    edges.push({ from: `repo:${e.from}`, to: `repo:${e.to}`, label: e.contract });

  return (
    <section className="block">
      <h2>
        Grafo de intents <small>iniciativas → repos que tocam · roteamento advisory</small>
      </h2>
      <p className="legend">
        <span className="dot intent" /> intent
        <span className="dot repo" /> repo — passe o mouse num nó pra destacar as ligações.
      </p>
      <div className="graph-wrap">
        <LayeredGraph
          nodes={nodes}
          edges={edges}
          onSelect={(nid) => {
            if (nid.startsWith("intent:")) nav(`/intent/${nid.slice(7)}`);
          }}
        />
      </div>
    </section>
  );
}
