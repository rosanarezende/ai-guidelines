// read-model-regression.test.ts — regressão do read-model derivado da demo acme
// SEM browser e SEM servidor. Exercita as MESMAS funções que /api/results,
// /api/work, /api/map e /api/graph* servem: loadGovernanceSnapshot() e as
// queries de grafo. Determinístico (lê os arquivos governados fixos da acme).
// Os builders de view-model do frontend (presentation) seguem cobertos por e2e.
import test from "node:test";
import assert from "node:assert/strict";
import {
  loadGovernanceSnapshot,
  queryContractImpact,
  queryGraphConflicts,
  queryGraphOverview,
  queryGraphPath,
  queryIntentDependencies,
} from "../src/index.ts";

test("snapshot da demo tem revisão, contagens e grafo coerentes", async () => {
  const snapshot = await loadGovernanceSnapshot();
  assert.ok(snapshot.revision, "revision presente");
  assert.ok(snapshot.company, "company presente");
  assert.ok(snapshot.counts.objectives > 0, "tem objetivos");
  assert.ok(snapshot.counts.targets > 0, "tem targets");
  assert.ok(snapshot.counts.graphNodes > 0, "grafo tem nós");
  assert.equal(snapshot.counts.graphNodes, snapshot.graph.nodes.length);
  assert.equal(snapshot.counts.graphEdges, snapshot.graph.edges.length);
});

test("rollup: actual só soma outcome válido; inválido não infla o dashboard", async () => {
  const snapshot = await loadGovernanceSnapshot();
  assert.ok(snapshot.targets.length > 0, "dashboard tem targets");
  for (const target of snapshot.targets) {
    const validCount = target.outcomes.filter((outcome) => outcome.valid).length;
    const invalidCount = target.outcomes.length - validCount;
    assert.equal(target.actualCount, validCount, `${target.id}: actualCount conta só válidos`);
    assert.equal(target.invalidCount, invalidCount, `${target.id}: invalidCount coerente`);
    if (target.actualCount === 0) {
      assert.equal(
        target.actual,
        "sem actual valido",
        `${target.id}: sem outcome válido não mostra número`
      );
    }
  }
});

test("outcome com erro de validação aparece como não-válido no snapshot", async () => {
  const snapshot = await loadGovernanceSnapshot();
  for (const outcome of snapshot.outcomes) {
    const hasError = snapshot.issues.some(
      (issue) => issue.level === "error" && issue.node === outcome.id
    );
    assert.equal(outcome.valid, !hasError, `${outcome.id}: valid reflete ausência de erro`);
  }
});

test("graph overview é derivado, com sourceRevision e tipos centrais", async () => {
  const overview = await queryGraphOverview();
  assert.equal(overview.derived, true);
  assert.ok(overview.sourceRevision, "sourceRevision presente");
  assert.ok(overview.nodes.length > 0, "tem nós");
  const types = new Set(overview.nodeTypes);
  for (const expected of ["objective", "target", "intent", "contract", "outcome"]) {
    assert.ok(types.has(expected), `tipo ${expected} presente no grafo`);
  }
  // toda aresta referencia nós existentes na projeção
  const ids = new Set(overview.nodes.map((node) => node.id));
  for (const edge of overview.edges) {
    assert.ok(ids.has(edge.source) && ids.has(edge.target), `aresta ${edge.id} conecta nós reais`);
  }
});

test("queryGraphPath acha caminho entre extremos de uma aresta real", async () => {
  const overview = await queryGraphOverview();
  const edge = overview.edges[0];
  assert.ok(edge, "grafo tem ao menos uma aresta");
  const path = await queryGraphPath(edge.source, edge.target);
  assert.ok(path, "caminho existe entre extremos conectados");
  assert.ok(path.nodes.length >= 2, "caminho tem origem e destino");
});

test("contract-impact resolve consumers/intents/targets para um contrato real", async () => {
  const overview = await queryGraphOverview({ type: "contract" });
  const contractNode = overview.nodes.find((node) => node.type === "contract");
  assert.ok(contractNode, "grafo tem contrato");
  const impact = await queryContractImpact(contractNode.id);
  assert.ok(impact, "impacto de contrato resolve");
  assert.equal(impact.contract.id, contractNode.id);
  for (const field of [
    impact.consumers,
    impact.affectedIntents,
    impact.affectedTargets,
    impact.outcomesCiting,
  ]) {
    assert.ok(Array.isArray(field), "campos de impacto são listas");
  }
});

test("intent-deps resolve superfície (works/repos/contratos) de uma intent real", async () => {
  const overview = await queryGraphOverview({ type: "intent" });
  const intentNode = overview.nodes.find((node) => node.type === "intent");
  assert.ok(intentNode, "grafo tem intent");
  const deps = await queryIntentDependencies(intentNode.id);
  assert.ok(deps, "dependências de intent resolvem");
  assert.equal(deps.intent.id, intentNode.id);
  assert.ok(Array.isArray(deps.works) && Array.isArray(deps.repos));
  assert.ok(Array.isArray(deps.dependsOn) && Array.isArray(deps.transitiveDependsOn));
});

test("queryGraphConflicts é derivado e retorna lista tipada", async () => {
  const result = await queryGraphConflicts();
  assert.equal(result.derived, true);
  assert.ok(Array.isArray(result.conflicts));
  for (const conflict of result.conflicts) {
    assert.ok(
      ["contract-contention", "attestation-collapse", "validation-error"].includes(conflict.kind),
      `conflito tipado: ${conflict.kind}`
    );
  }
});
