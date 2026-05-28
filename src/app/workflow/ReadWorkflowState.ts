import { SpecLocation } from "../../domain/workflow/SpecLocation.js";
import { WorkflowState, defaultWorkflowState } from "../../domain/workflow/WorkflowState.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";

const STATE_FILE = "state.yml";

export interface ReadWorkflowStateResult {
  readonly state: WorkflowState;
  /** True quando state.yml não existia e usamos o default. */
  readonly defaulted: boolean;
}

/**
 * Parser injetado pelo composition root (cf. boundary lock — app não
 * importa infra direto). Implementação concreta vive em
 * `infrastructure/yaml/workflowStateSerializer.ts`.
 */
export type WorkflowStateParser = (yamlText: string) => WorkflowState;

/**
 * Lê `state.yml` da spec localizada. Default sensato quando ausente
 * (stage=discovery, gate=open). Erros do parser propagam — schema é contrato.
 */
export class ReadWorkflowState {
  constructor(
    private readonly fs: WorkflowFileSystem,
    private readonly parser: WorkflowStateParser
  ) {}

  run(location: SpecLocation): ReadWorkflowStateResult {
    const relPath = `${this.specRelPath(location)}/${STATE_FILE}`;
    if (!this.fs.fileExists(relPath)) {
      return { state: defaultWorkflowState(), defaulted: true };
    }
    const yaml = this.fs.readTextFile(relPath);
    return { state: this.parser(yaml), defaulted: false };
  }

  private specRelPath(location: SpecLocation): string {
    const prefix = location.source === "governance" ? ".governance/specs" : ".specify/specs";
    return `${prefix}/${location.slug}`;
  }
}
