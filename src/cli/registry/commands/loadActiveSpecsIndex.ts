import { ListActiveSpecs, ListActiveSpecsResult } from "../../../app/workflow/ListActiveSpecs.js";
import { NodeWorkflowFileSystem } from "../../../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { parseActiveSpecs } from "../../../infrastructure/yaml/activeSpecsSerializer.js";

/**
 * Carregador injetável do índice operacional público — fonte compartilhada pelos
 * dois comandos read-only migrados na etapa 2 do #35 (`specs`, `drift`). Recebe
 * `repoRoot` (cada comando resolve a própria infra a partir dele, cf. contrato
 * `Command`); tests injetam um fake que devolve um `ListActiveSpecsResult` cravado.
 */
export type LoadActiveSpecsIndex = (repoRoot: string) => ListActiveSpecsResult;

/** Default real: lê `.governance/runtime/active-specs.yml` via use case + parser reais. */
export const loadActiveSpecsIndex: LoadActiveSpecsIndex = (repoRoot) =>
  new ListActiveSpecs(new NodeWorkflowFileSystem(repoRoot), parseActiveSpecs).run();
