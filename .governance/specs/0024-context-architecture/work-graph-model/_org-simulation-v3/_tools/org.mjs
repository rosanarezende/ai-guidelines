// org.mjs — fachada de compatibilidade dos CLIs. O domínio/adapter real mora em ../_lib.
import { FileGovernanceRepository } from "../_lib/adapters/file/FileGovernanceRepository.mjs";
export { SIM_ROOT, GOVERNANCE_ROOT, REPOS_ROOT } from "../_lib/paths.mjs";
export { deriveIntent, validateOrg } from "../_lib/domain/org-domain.mjs";

const repository = new FileGovernanceRepository();

export function loadOrg() {
  return repository.loadOrg();
}
