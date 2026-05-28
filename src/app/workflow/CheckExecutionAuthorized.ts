import { SpecLocation } from "../../domain/workflow/SpecLocation.js";
import {
  WorkflowState,
  GateStatus,
  isExecutionAuthorized,
} from "../../domain/workflow/WorkflowState.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";

export interface CheckExecutionAuthorizedResult {
  readonly authorized: boolean;
  readonly missingTasksFile: boolean;
  readonly gateNotClosed: boolean;
  readonly actualGateStatus: GateStatus;
  readonly checkedTasksPath: string;
}

/**
 * Caso de uso que avalia a autorização de execução de uma especificação (L2 - local).
 *
 * Ele resolve o caminho físico esperado do arquivo `tasks.md` baseado na origem
 * da especificação (`SpecLocation`), verifica sua existência física no sistema de arquivos,
 * e delega o cálculo lógico de autorização para a função pura de domínio `isExecutionAuthorized`.
 */
export class CheckExecutionAuthorized {
  constructor(private readonly fs: WorkflowFileSystem) {}

  run(location: SpecLocation, state: WorkflowState): CheckExecutionAuthorizedResult {
    const prefix = location.source === "governance" ? ".governance/specs" : ".specify/specs";
    const checkedTasksPath = `${prefix}/${location.slug}/tasks.md`;
    const tasksFileExists = this.fs.fileExists(checkedTasksPath);

    const authorized = isExecutionAuthorized(state, tasksFileExists);
    const missingTasksFile = !tasksFileExists;
    const gateNotClosed = state.gate.status !== "closed";

    return {
      authorized,
      missingTasksFile,
      gateNotClosed,
      actualGateStatus: state.gate.status,
      checkedTasksPath,
    };
  }
}
