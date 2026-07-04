// smoke.ts — valida que os exemplos de backend são utilizáveis como read-model.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

type BackendExampleNode = {
  id: string;
  type: string;
  label: string;
  data?: unknown;
  dataHash: string;
};

type BackendExampleEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
};

type BackendExampleIssue = {
  id: string;
  level: string;
  rule: string;
  node: string;
  msg: string;
};

type BackendExampleModel = {
  metadata: {
    schema?: string;
    contentHash: string;
    counts?: {
      nodes?: number;
      edges?: number;
      issues?: number;
    };
  };
  nodes: BackendExampleNode[];
  edges: BackendExampleEdge[];
  issues: BackendExampleIssue[];
};

type BackendExampleFailure = {
  code: string;
  msg: string;
};

type BackendExampleSmokeReport = {
  ok: boolean;
  failures: BackendExampleFailure[];
  counts: {
    nodes: number;
    edges: number;
    issues: number;
    eventLogEvents: number;
    neo4jSchemaStatements: number;
    neo4jGraphStatements: number;
    neo4jQueryStatements: number;
  };
  contentHash: string;
};

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12);
}

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, "utf8"));
}

function readText(file: string): string {
  return readFileSync(file, "utf8");
}

function parseJsonl(file: string): Array<Record<string, any>> {
  return readText(file)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function fail(failures: BackendExampleFailure[], code: string, msg: string): void {
  failures.push({ code, msg });
}

function setDiff(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((value) => !b.has(value)).sort();
}

function ensureSameSet(
  failures: BackendExampleFailure[],
  code: string,
  label: string,
  expected: Set<string>,
  actual: Set<string>
): void {
  const missing = setDiff(expected, actual);
  const extra = setDiff(actual, expected);
  if (missing.length || extra.length) {
    fail(
      failures,
      code,
      `${label} mismatch: missing=[${missing.slice(0, 5).join(", ")}] extra=[${extra
        .slice(0, 5)
        .join(", ")}]`
    );
  }
}

function unescapeCypher(value: string): string {
  return value.replace(/\\\\/g, "\\").replace(/\\'/g, "'");
}

function extractMatches(text: string, regex: RegExp): string[] {
  const matches = [];
  for (const match of text.matchAll(regex)) matches.push(unescapeCypher(match[1]));
  return matches;
}

export function splitCypherStatements(text: string): string[] {
  const statements = [];
  let current = "";
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//")) continue;
    current += (current ? "\n" : "") + rawLine;
    if (line.endsWith(";")) {
      statements.push(current.replace(/;\s*$/, "").trim());
      current = "";
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

export function loadBackendExampleModel(outRoot: string): BackendExampleModel {
  return readJson(path.join(outRoot, "file", "read-model.json")) as BackendExampleModel;
}

export function runBackendExampleSmoke(outRoot: string): BackendExampleSmokeReport {
  const failures: BackendExampleFailure[] = [];
  const model = loadBackendExampleModel(outRoot);
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  if (model.metadata?.schema !== "acme.backend-example/v1") {
    fail(failures, "metadata-schema", "read-model schema inesperado");
  }

  const bodyHash = hash({ nodes: model.nodes, edges: model.edges, issues: model.issues });
  if (model.metadata?.contentHash !== bodyHash) {
    fail(failures, "content-hash", "metadata.contentHash não bate com o corpo do read-model");
  }

  if (model.metadata?.counts?.nodes !== model.nodes.length) {
    fail(failures, "node-count", "metadata.counts.nodes não bate com nodes.length");
  }
  if (model.metadata?.counts?.edges !== model.edges.length) {
    fail(failures, "edge-count", "metadata.counts.edges não bate com edges.length");
  }
  if (model.metadata?.counts?.issues !== model.issues.length) {
    fail(failures, "issue-count", "metadata.counts.issues não bate com issues.length");
  }

  for (const node of model.nodes) {
    if (nodeIds.has(node.id)) fail(failures, "duplicate-node", `nó duplicado: ${node.id}`);
    nodeIds.add(node.id);
    const expectedDataHash = hash(node.data ?? {});
    if (node.dataHash !== expectedDataHash) {
      fail(failures, "node-data-hash", `dataHash inválido para nó ${node.id}`);
    }
  }

  for (const edge of model.edges) {
    if (edgeIds.has(edge.id)) fail(failures, "duplicate-edge", `aresta duplicada: ${edge.id}`);
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.source)) {
      fail(failures, "edge-source", `aresta ${edge.id} aponta source inexistente ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      fail(failures, "edge-target", `aresta ${edge.id} aponta target inexistente ${edge.target}`);
    }
  }

  const eventLog = parseJsonl(path.join(outRoot, "file", "event-log.example.jsonl"));
  const rebuildEvent = eventLog.find((event) => event.command?.type === "read-model.rebuild");
  if (!rebuildEvent) {
    fail(failures, "event-log", "event-log não contém read-model.rebuild");
  } else {
    if (rebuildEvent.receipt?.contentHash !== model.metadata.contentHash) {
      fail(failures, "event-log-hash", "event-log receipt não referencia o contentHash atual");
    }
    if (rebuildEvent.command?.envelope?.["base-revision"] !== model.metadata.contentHash) {
      fail(
        failures,
        "event-log-base-revision",
        "event-log base-revision não referencia o snapshot"
      );
    }
  }

  const schemaCypher = readText(path.join(outRoot, "neo4j", "schema.cypher"));
  const graphCypher = readText(path.join(outRoot, "neo4j", "graph.cypher"));
  const queriesCypher = readText(path.join(outRoot, "neo4j", "queries.cypher"));
  const neo4jNodeIds = new Set<string>(
    extractMatches(graphCypher, /MERGE \(n:GovernanceNode:[^{]+ \{id: '((?:\\'|\\\\|[^'])*)'\}\)/g)
  );
  const neo4jEdgeIds = new Set<string>(
    extractMatches(
      graphCypher,
      /MERGE \(source\)-\[r:[^\s]+ \{id: '((?:\\'|\\\\|[^'])*)'\}\]->\(target\)/g
    )
  );
  ensureSameSet(failures, "neo4j-nodes", "Neo4j nodes", nodeIds, neo4jNodeIds);
  ensureSameSet(failures, "neo4j-edges", "Neo4j edges", edgeIds, neo4jEdgeIds);

  if (!schemaCypher.includes("CREATE CONSTRAINT governance_node_id")) {
    fail(failures, "neo4j-constraint", "schema.cypher não cria constraint de id único");
  }
  if (!schemaCypher.includes("CREATE INDEX governance_node_type")) {
    fail(failures, "neo4j-index", "schema.cypher não cria índice de tipo");
  }
  for (const token of ["$contractId", "$repoId", "CONTRIBUTES_TO"]) {
    if (!queriesCypher.includes(token)) {
      fail(failures, "neo4j-query-contract", `queries.cypher não cobre ${token}`);
    }
  }

  const actionContract = readText(path.join(outRoot, "ACTION-CONTRACT.md"));
  for (const token of [
    "READ_MODEL_IS_DERIVED_ONLY",
    "MUST_REREAD_AUTHORITATIVE_SOURCE",
    "FAIL_CLOSED_ON_STALE_SOURCE",
    "NO_ACTION_FROM_DERIVED_GRAPH",
  ]) {
    if (!actionContract.includes(token)) {
      fail(failures, "action-contract", `ACTION-CONTRACT.md não declara ${token}`);
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    counts: {
      nodes: model.nodes.length,
      edges: model.edges.length,
      issues: model.issues.length,
      eventLogEvents: eventLog.length,
      neo4jSchemaStatements: splitCypherStatements(schemaCypher).length,
      neo4jGraphStatements: splitCypherStatements(graphCypher).length,
      neo4jQueryStatements: splitCypherStatements(queriesCypher).length,
    },
    contentHash: model.metadata.contentHash,
  };
}
