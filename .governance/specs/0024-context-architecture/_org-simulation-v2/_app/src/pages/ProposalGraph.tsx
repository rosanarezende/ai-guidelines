import { useEffect, useState } from "react";
import { api, type Proposal } from "../api.ts";
import { LayeredGraph, type GNode, type GEdge } from "../graph/LayeredGraph.tsx";

const shortRef = (ref: string): string => ref.split("/").pop() ?? ref;

// Grafo do INTAKE: cada proposal (coluna 1) → sua proveniência (raised-by) e/ou a intent que abre (opens), coluna 2.
export function ProposalGraph() {
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .proposals()
      .then(setProposals)
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)));
  }, []);

  if (error) return <p className="error">Erro: {error}</p>;
  if (!proposals) return <p className="muted">carregando…</p>;

  const nodes: GNode[] = [];
  const edges: GEdge[] = [];
  const added = new Set<string>();
  for (const p of proposals) {
    nodes.push({
      id: `prop:${p.id}`,
      label: p.what,
      sub: `${p.id} · ${p.status}`,
      layer: 0,
      kind: "proposal",
    });
    if (p.raisedFrom) {
      const id = `src:${p.raisedFrom}`;
      if (!added.has(id)) {
        nodes.push({
          id,
          label: shortRef(p.raisedFrom),
          sub: "proveniência",
          layer: 1,
          kind: "exploration",
        });
        added.add(id);
      }
      edges.push({ from: `prop:${p.id}`, to: id, label: "raised-by" });
    }
    if (p.opensIntent) {
      const id = `intent:${p.opensIntent}`;
      if (!added.has(id)) {
        nodes.push({ id, label: p.opensIntent, sub: "abre intent", layer: 1, kind: "intent" });
        added.add(id);
      }
      edges.push({ from: `prop:${p.id}`, to: id, label: "opens" });
    }
  }

  return (
    <section className="block">
      <h2>
        Grafo de proposals <small>intake → proveniência (raised-by) e promoção (opens)</small>
      </h2>
      <p className="legend">
        <span className="dot proposal" /> proposal
        <span className="dot exploration" /> origem
        <span className="dot intent" /> intent
      </p>
      <div className="graph-wrap">
        {proposals.length === 0 ? (
          <p className="muted">(nenhuma proposta ainda)</p>
        ) : (
          <LayeredGraph nodes={nodes} edges={edges} />
        )}
      </div>
    </section>
  );
}
