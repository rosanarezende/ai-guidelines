// org.mjs — fachada de compatibilidade dos CLIs. O domínio/adapter real mora em ../src.
import { FileGovernanceRepository } from "../src/adapters/file/FileGovernanceRepository.ts";
export { SIM_ROOT, GOVERNANCE_ROOT, REPOS_ROOT } from "../src/shared/paths.ts";
export { deriveIntent, validateOrg } from "../src/domain/org-domain.ts";

const repository = new FileGovernanceRepository();

export function loadOrg() {
  return repository.loadOrg();
}

export function validateRuntimeState() {
  return repository.listRuntimeIssues();
}
