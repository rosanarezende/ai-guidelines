// org.mjs — fachada de compatibilidade dos CLIs. O domínio/adapter real mora em ../backend.
import { FileGovernanceRepository } from "../adapters/file/FileGovernanceRepository.mjs";
export { SIM_ROOT, GOVERNANCE_ROOT, REPOS_ROOT } from "../paths.mjs";
export { deriveIntent, validateOrg } from "../domain/org-domain.mjs";

const repository = new FileGovernanceRepository();

export function loadOrg() {
  return repository.loadOrg();
}

export function validateRuntimeState() {
  return repository.listRuntimeIssues();
}
