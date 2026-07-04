// FileReadModelSource.ts — lê o read-model exportado (examples/read-models/file).
// Fail-closed: se o contentHash do arquivo não bate com o corpo, a projeção é
// considerada adulterada/stale e a leitura falha em vez de fingir frescor.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { GraphReadModel } from "../../domain/index.ts";
import { READ_MODEL_EXAMPLES_ROOT } from "../../shared/paths.ts";
import type { GraphReadModelSource, GraphSnapshot } from "../../ports/GraphReadModelSource.ts";

type ExportedReadModel = GraphReadModel & {
  metadata?: {
    schema?: string;
    generatedAt?: string;
    contentHash?: string;
    counts?: { nodes?: number; edges?: number };
  };
  issues: NonNullable<GraphReadModel["issues"]>;
};

function bodyHash(model: ExportedReadModel): string {
  return createHash("sha256")
    .update(JSON.stringify({ nodes: model.nodes, edges: model.edges, issues: model.issues }))
    .digest("hex")
    .slice(0, 12);
}

export class FileReadModelSource implements GraphReadModelSource {
  private readonly file: string;

  constructor(file = path.join(READ_MODEL_EXAMPLES_ROOT, "file", "read-model.json")) {
    this.file = file;
  }

  async load(): Promise<GraphSnapshot> {
    const model = JSON.parse(readFileSync(this.file, "utf8")) as ExportedReadModel;
    const expected = model.metadata?.contentHash;
    const actual = bodyHash(model);
    if (!expected || expected !== actual) {
      throw new Error(
        `read-model exportado com contentHash inválido (esperado ${expected}, corpo ${actual}) — fail-closed`
      );
    }
    return {
      graph: model,
      sourceRevision: expected,
      projectedAt: model.metadata?.generatedAt || "unknown",
    };
  }
}
