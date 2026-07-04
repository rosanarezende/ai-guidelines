// org.ts — fachada de compatibilidade dos CLIs repo-first.
// O domínio/adapter real mora em backend/src; feature nova entra lá, não neste shim.
import { FileGovernanceRepository } from "../../backend/src/adapters/file/FileGovernanceRepository.ts";
export { SIM_ROOT, GOVERNANCE_ROOT, REPOS_ROOT } from "../../backend/src/shared/paths.ts";
export { deriveIntent, validateOrg } from "../../backend/src/domain/org-domain.ts";

const repository = new FileGovernanceRepository();

export function loadOrg() {
  return repository.loadOrg();
}

export function validateRuntimeState() {
  return repository.listRuntimeIssues();
}
