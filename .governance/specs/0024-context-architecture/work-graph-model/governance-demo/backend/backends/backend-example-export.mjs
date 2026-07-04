// backend-example-export.mjs — exports determinísticos de exemplos de banco derivado.
import { createHash } from "node:crypto";

function hash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12);
}

function json(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function jsonl(values) {
  return values.map((value) => JSON.stringify(value)).join("\n") + "\n";
}

function sql(value) {
  return "'" + String(value).replaceAll("'", "''") + "'";
}

function cypher(value) {
  return "'" + String(value).replace(/\\/g, "\\\\").replaceAll("'", "\\'") + "'";
}

function relType(type) {
  const clean = String(type)
    .replace(/[^A-Za-z0-9_]/g, "_")
    .toUpperCase();
  return /^[A-Z_]/.test(clean) ? clean : "EDGE_" + clean;
}

function sortedById(items) {
  return [...items].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

function backendModel(graph) {
  const nodes = sortedById(graph.nodes).map((node) => ({
    id: node.id,
    type: node.type,
    label: node.label,
    data: node.data ?? {},
    dataHash: hash(node.data ?? {}),
  }));
  const edges = sortedById(graph.edges).map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
  }));
  const issues = sortedById(graph.issues || []).map((issue) => ({
    id: `${issue.level}:${issue.rule}:${issue.node}`,
    ...issue,
  }));
  const body = { nodes, edges, issues };
  return {
    metadata: {
      schema: "acme.backend-example/v1",
      authority: "derived-read-model",
      source: "acme/governance + acme/repos/.governance + governance-demo runtime",
      contentHash: hash(body),
      counts: {
        nodes: nodes.length,
        edges: edges.length,
        issues: issues.length,
      },
      note: "Example backend exports are derived. YAML/event-log remains authoritative.",
    },
    nodes,
    edges,
    issues,
  };
}

function fileArtifacts(model) {
  const rebuildEvent = {
    schema: "acme.event-log/v1",
    id: `evt-read-model-${model.metadata.contentHash}`,
    command: {
      id: `cmd-read-model-${model.metadata.contentHash}`,
      type: "read-model.rebuild",
      envelope: {
        actor: "tool:export-backend-examples",
        authority: "sponsor-acme",
        "base-revision": model.metadata.contentHash,
        "idempotency-key": `read-model-${model.metadata.contentHash}`,
        "issued-at": "deterministic-example",
        nonce: `nonce-read-model-${model.metadata.contentHash}`,
      },
    },
    receipt: {
      contentHash: model.metadata.contentHash,
      nodes: model.metadata.counts.nodes,
      edges: model.metadata.counts.edges,
      issues: model.metadata.counts.issues,
    },
  };
  return {
    "file/README.md":
      "# File backend example\n\n" +
      "Este exemplo mostra o backend file-first como plano autoritativo + read-model derivado.\n\n" +
      "- `read-model.json`: snapshot derivado do grafo, apto para UI local e testes.\n" +
      "- `event-log.example.jsonl`: exemplo de evento semântico append-only para rebuild do read-model.\n\n" +
      "O YAML em `acme/governance/` e `acme/repos/<repo>/.governance/` continua sendo o SSOT.\n",
    "file/read-model.json": json(model),
    "file/event-log.example.jsonl": jsonl([rebuildEvent]),
  };
}

function sqliteArtifacts(model) {
  const schema =
    "-- SQLite read-model example. Derived only; not an authoritative SSOT.\n" +
    "PRAGMA foreign_keys = ON;\n\n" +
    "CREATE TABLE IF NOT EXISTS projection_metadata (\n" +
    "  content_hash TEXT PRIMARY KEY,\n" +
    "  schema TEXT NOT NULL,\n" +
    "  node_count INTEGER NOT NULL,\n" +
    "  edge_count INTEGER NOT NULL,\n" +
    "  issue_count INTEGER NOT NULL\n" +
    ");\n\n" +
    "CREATE TABLE IF NOT EXISTS nodes (\n" +
    "  id TEXT PRIMARY KEY,\n" +
    "  type TEXT NOT NULL,\n" +
    "  label TEXT NOT NULL,\n" +
    "  data_json TEXT NOT NULL,\n" +
    "  data_hash TEXT NOT NULL\n" +
    ");\n\n" +
    "CREATE TABLE IF NOT EXISTS edges (\n" +
    "  id TEXT PRIMARY KEY,\n" +
    "  source TEXT NOT NULL,\n" +
    "  target TEXT NOT NULL,\n" +
    "  type TEXT NOT NULL,\n" +
    "  FOREIGN KEY(source) REFERENCES nodes(id),\n" +
    "  FOREIGN KEY(target) REFERENCES nodes(id)\n" +
    ");\n\n" +
    "CREATE TABLE IF NOT EXISTS issues (\n" +
    "  id TEXT PRIMARY KEY,\n" +
    "  level TEXT NOT NULL,\n" +
    "  rule TEXT NOT NULL,\n" +
    "  node TEXT NOT NULL,\n" +
    "  msg TEXT NOT NULL\n" +
    ");\n";

  const inserts = [
    "-- SQLite seed example generated from the v3 runtime read-model.\n",
    "BEGIN TRANSACTION;",
    `INSERT INTO projection_metadata(content_hash, schema, node_count, edge_count, issue_count) VALUES (${sql(model.metadata.contentHash)}, ${sql(model.metadata.schema)}, ${model.metadata.counts.nodes}, ${model.metadata.counts.edges}, ${model.metadata.counts.issues});`,
    ...model.nodes.map(
      (node) =>
        `INSERT INTO nodes(id, type, label, data_json, data_hash) VALUES (${sql(node.id)}, ${sql(node.type)}, ${sql(node.label)}, ${sql(JSON.stringify(node.data))}, ${sql(node.dataHash)});`
    ),
    ...model.edges.map(
      (edge) =>
        `INSERT INTO edges(id, source, target, type) VALUES (${sql(edge.id)}, ${sql(edge.source)}, ${sql(edge.target)}, ${sql(edge.type)});`
    ),
    ...model.issues.map(
      (issue) =>
        `INSERT INTO issues(id, level, rule, node, msg) VALUES (${sql(issue.id)}, ${sql(issue.level)}, ${sql(issue.rule)}, ${sql(issue.node)}, ${sql(issue.msg)});`
    ),
    "COMMIT;",
    "",
  ].join("\n");

  return {
    "sqlite/README.md":
      "# SQLite backend example\n\n" +
      "Exemplo de read-model relacional derivado. Útil para app local, filas e queries transacionais pequenas.\n\n" +
      "- `schema.sql`: tabelas mínimas para nós, arestas, issues e metadados.\n" +
      "- `seed.sql`: carga determinística do snapshot atual.\n\n" +
      "Comandos de escrita ainda devem reler YAML/event-log antes de agir; SQLite não vira SSOT.\n",
    "sqlite/schema.sql": schema,
    "sqlite/seed.sql": inserts,
  };
}

function neo4jArtifacts(model) {
  const schema =
    "// Neo4j read-model example. Derived only; not an authoritative SSOT.\n" +
    "CREATE CONSTRAINT governance_node_id IF NOT EXISTS FOR (n:GovernanceNode) REQUIRE n.id IS UNIQUE;\n" +
    "CREATE INDEX governance_node_type IF NOT EXISTS FOR (n:GovernanceNode) ON (n.type);\n" +
    "CREATE INDEX governance_node_data_hash IF NOT EXISTS FOR (n:GovernanceNode) ON (n.dataHash);\n";

  const graph = [
    "// Neo4j graph seed generated from the v3 runtime read-model.",
    `MERGE (m:ProjectionMetadata {contentHash: ${cypher(model.metadata.contentHash)}})`,
    `SET m.schema = ${cypher(model.metadata.schema)}, m.nodeCount = ${model.metadata.counts.nodes}, m.edgeCount = ${model.metadata.counts.edges}, m.issueCount = ${model.metadata.counts.issues};`,
    "",
    ...model.nodes.map(
      (node) =>
        `MERGE (n:GovernanceNode:${relType(node.type)} {id: ${cypher(node.id)}})\nSET n.type = ${cypher(node.type)}, n.label = ${cypher(node.label)}, n.data = ${cypher(JSON.stringify(node.data))}, n.dataHash = ${cypher(node.dataHash)};`
    ),
    "",
    ...model.edges.map(
      (edge) =>
        `MATCH (source:GovernanceNode {id: ${cypher(edge.source)}}), (target:GovernanceNode {id: ${cypher(edge.target)}})\nMERGE (source)-[r:${relType(edge.type)} {id: ${cypher(edge.id)}}]->(target)\nSET r.type = ${cypher(edge.type)};`
    ),
    "",
  ].join("\n");

  const queries =
    "// Neo4j example queries for governance navigation.\n\n" +
    "// 1. Contract impact: which intents, repos and consumers surround a contract?\n" +
    "MATCH path = (i:GovernanceNode)-[:CHANGES|CONSUMES|COORDINATES*1..3]-(c:CONTRACT {id: $contractId})\nRETURN path;\n\n" +
    "// 2. Repo accountability: central work pieces acknowledged by a repo.\n" +
    "MATCH (repo:REPO {id: $repoId})<-[:IN_REPO]-(work:WORK)<-[:PIECE]-(intent:INTENT)\nOPTIONAL MATCH (repo)-[:PUBLISHES_WORK]->(ack:REPO_WORK_ACK)-[:ACKNOWLEDGES_WORK]->(work)\nRETURN intent.id, work.id, ack.id, ack.data;\n\n" +
    "// 3. Dashboard path: objective to outcome through target and intent.\n" +
    "MATCH path = (objective:OBJECTIVE)-[:HAS_TARGET]->(target:TARGET)<-[:CONTRIBUTES_TO]-(outcome:OUTCOME)<-[:EMITS]-(intent:INTENT)\nRETURN path;\n";

  return {
    "neo4j/README.md":
      "# Neo4j backend example\n\n" +
      "Exemplo completo de grafo derivado para análise de impacto cross-repo.\n\n" +
      "- `schema.cypher`: constraints/indexes mínimos.\n" +
      "- `graph.cypher`: carga determinística de todos os nós e arestas do read-model atual.\n" +
      "- `queries.cypher`: consultas típicas de coordenação, contrato e dashboard.\n\n" +
      "Neo4j é read-model por padrão: comandos precisam reler YAML/event-log antes de escrever.\n",
    "neo4j/schema.cypher": schema,
    "neo4j/graph.cypher": graph,
    "neo4j/queries.cypher": queries,
  };
}

function mongoArtifacts(model) {
  const collections = {
    schema: "acme.mongo-backend-example/v1",
    database: "acme_governance_read_model",
    collections: [
      { name: "nodes", key: "id", indexes: ["type", "dataHash"] },
      { name: "edges", key: "id", indexes: ["source", "target", "type"] },
      { name: "issues", key: "id", indexes: ["level", "rule", "node"] },
      { name: "projection_metadata", key: "contentHash", indexes: [] },
    ],
  };
  const documents = [
    {
      collection: "projection_metadata",
      document: model.metadata,
    },
    ...model.nodes.map((node) => ({ collection: "nodes", document: node })),
    ...model.edges.map((edge) => ({ collection: "edges", document: edge })),
    ...model.issues.map((issue) => ({ collection: "issues", document: issue })),
  ];
  return {
    "mongo/README.md":
      "# Mongo backend example\n\n" +
      "Exemplo documental derivado para snapshots heterogêneos de nós/arestas/issues.\n\n" +
      "- `collections.json`: contrato mínimo de coleções e índices.\n" +
      "- `documents.jsonl`: carga determinística, uma operação lógica por linha.\n\n" +
      "Mongo não é fonte de ação; migrations precisam ser versionadas e fail-closed antes de uso operacional.\n",
    "mongo/collections.json": json(collections),
    "mongo/documents.jsonl": jsonl(documents),
  };
}

export function buildBackendExampleArtifacts(graph) {
  const model = backendModel(graph);
  return {
    "README.md":
      "# Backend examples\n\n" +
      "Exemplos derivados da runtime v3 para os quatro formatos estudados na v2.\n\n" +
      "| formato | papel | status neste exemplo |\n" +
      "| --- | --- | --- |\n" +
      "| file | SSOT file-first + read-model pequeno | completo e prioritário |\n" +
      "| neo4j | grafo de impacto cross-repo | completo e prioritário |\n" +
      "| sqlite | read-model relacional local | exemplo completo derivado |\n" +
      "| mongo | snapshot documental/event-like | exemplo completo derivado |\n\n" +
      `Snapshot: ${model.metadata.contentHash} · ${model.metadata.counts.nodes} nós · ${model.metadata.counts.edges} arestas · ${model.metadata.counts.issues} issues.\n\n` +
      "Regra: estes arquivos são projeções. Ação governada deve reler o YAML/event-log autoritativo.\n\n" +
      "Veja `ACTION-CONTRACT.md` para o contrato operacional que impede o read-model de virar SSOT.\n",
    "ACTION-CONTRACT.md":
      "# Backend action contract\n\n" +
      "Este contrato é parte do dogfood: um read-model pode acelerar consulta, mas não pode virar fonte de ação.\n\n" +
      "- `READ_MODEL_IS_DERIVED_ONLY`: `file/read-model.json`, `neo4j/*.cypher`, `sqlite/*.sql` e `mongo/*.jsonl` são projeções derivadas.\n" +
      "- `MUST_REREAD_AUTHORITATIVE_SOURCE`: qualquer comando governado deve reler YAML/event-log autoritativo antes de escrever, promover, aprovar ou publicar outcome.\n" +
      "- `FAIL_CLOSED_ON_STALE_SOURCE`: se o hash/base-revision da fonte não bate, o comando deve falhar fechado.\n" +
      "- `NO_ACTION_FROM_DERIVED_GRAPH`: Neo4j/SQLite/Mongo podem responder dashboard, impacto e investigação; não autorizam mutação por conta própria.\n\n" +
      "A sim v3 ainda não tem adapters transacionais SQLite/Neo4j/Mongo. Estes arquivos são exemplos operacionais de projeção, não mudança de SSOT.\n",
    ...fileArtifacts(model),
    ...neo4jArtifacts(model),
    ...sqliteArtifacts(model),
    ...mongoArtifacts(model),
  };
}
