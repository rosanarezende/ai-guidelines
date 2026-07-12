// from-read-model.ts — projeta o grafo DERIVADO real (nodes/edges do backend)
// no GovernanceGraphViewModel. Roda no servidor. Atributos de filtro
// (owner/team/ciclo/confiança/status/contrato/fonte) são derivados do payload
// de cada nó sem recriar ontologia no frontend.
import type { GraphEdge, GraphNode } from "@demo/contracts";
import type { ConfidenceState, GovernanceGraphViewModel } from "./view-models";

type LooseData = Record<string, unknown>;

function asRecord(value: unknown): LooseData {
  return typeof value === "object" && value !== null ? (value as LooseData) : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nodeConfidence(type: string, data: LooseData): ConfidenceState {
  if (type === "break-glass") return "break-glass";
  if (data["attestation-collapse"]) return "self-declared";
  if (type === "outcome") return data["valid"] === false ? "pending" : "verified";
  if (type === "verdict") return data["override"] === true ? "break-glass" : "verified";
  if (type === "target") {
    return data["attestation-collapse"] ? "self-declared" : "pending";
  }
  if (type === "code-touchpoint" || type === "repo-work-ack") return "verified";
  if (type === "proposal") return data["status"] === "accepted" ? "verified" : "pending";
  return "pending";
}

function nodeOwner(data: LooseData): string {
  return (
    text(data["owner"]) ||
    text(data["definer"]) ||
    text(data["authorized-by"]) ||
    text(data["attested-by"]) ||
    text(data["decided-by"]) ||
    text(data["lead"])
  );
}

function nodeTeam(type: string, data: LooseData): string {
  if (type === "team") return text(data["id"]);
  return text(data["team"]) || text(data["node"]) || text(data["area"]);
}

function nodeCycle(data: LooseData): string {
  const window = asRecord(data["window"]);
  const start = text(window["start"]);
  if (start) return start.slice(0, 4);
  return text(data["period"]);
}

function nodeSource(type: string, data: LooseData): string {
  return text(data["source"]) || text(data["repo"]) || text(data["owner-repo"]) || type;
}

function touchesContract(type: string, data: LooseData): boolean {
  if (type.includes("contract")) return true;
  const changed = data["contracts-changed"];
  const consumed = data["contracts-consumed"];
  return (
    (Array.isArray(changed) && changed.length > 0) ||
    (Array.isArray(consumed) && consumed.length > 0)
  );
}

export function buildGraphViewModel(input: {
  name: string;
  sourceRevision: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeTypes: string[];
}): GovernanceGraphViewModel {
  const nodes = input.nodes.map((node) => {
    const data = asRecord(node.data);
    return {
      id: node.id,
      type: node.type,
      label: node.label ?? node.id,
      owner: nodeOwner(data),
      team: nodeTeam(node.type, data),
      cycle: nodeCycle(data),
      status: text(data["status"]) || text(data["verdict"]) || text(data["severity"]),
      confidence: nodeConfidence(node.type, data),
      touchesContract: touchesContract(node.type, data),
      source: nodeSource(node.type, data),
    };
  });
  return {
    name: input.name,
    sourceRevision: input.sourceRevision,
    derived: true,
    nodes,
    edges: input.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
    })),
    nodeTypes: input.nodeTypes,
  };
}
