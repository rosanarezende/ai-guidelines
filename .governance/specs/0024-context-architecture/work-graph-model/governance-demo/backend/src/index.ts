// index.ts — superfície pública do backend (SDK tipado).
// O frontend e os tools consomem DAQUI (alias @demo/backend); importar módulo
// interno por caminho solto é violação de fronteira (guardado no check do app).
export * from "@demo/domain/server";
export * from "./adapters/fs/paths.ts";

export { FileGovernanceRepository } from "./adapters/file/FileGovernanceRepository.ts";
export { FileReadModelSource } from "./adapters/file/FileReadModelSource.ts";
export { InMemoryGraphSource } from "./adapters/graph-memory/InMemoryGraphSource.ts";
export {
  loadManifest,
  loadPublishedContexts,
  deriveRepoContext,
  deriveAllRepoContexts,
  publishRepoContexts,
  inspectRepoCode,
  validateRepoContexts,
  type PublishedRepoContext,
} from "./adapters/repo-first/repo-contexts.ts";
export {
  loadPublishedRepoWorks,
  publishRepoWorks,
  validateRepoWorks,
} from "./adapters/repo-first/repo-works.ts";
export {
  loadPublishedRepoContracts,
  publishRepoContracts,
  validateRepoContracts,
} from "./adapters/repo-first/repo-contracts.ts";

export { openFileGovernanceRuntime, type GovernanceRuntime } from "./application/runtime.ts";
export {
  loadGovernanceSnapshot,
  loadIntegrationCatalog,
  dryRunCommand,
  executeCommand,
} from "./application/queries/governance-snapshot.ts";
export {
  defaultGraphSource,
  queryGraphOverview,
  queryGraphNode,
  queryGraphAdjacency,
  queryGraphPath,
  queryContractImpact,
  queryIntentDependencies,
  queryGraphConflicts,
  type GraphQueryMeta,
} from "./application/queries/graph.ts";
export {
  buildBackendExampleArtifacts,
  type BackendExampleArtifacts,
} from "./application/backend-examples/build.ts";
export {
  loadBackendExampleModel,
  runBackendExampleSmoke,
  splitCypherStatements,
} from "./application/backend-examples/smoke.ts";
export {
  resolveEgress,
  isLoopbackUrl,
  type EgressDecision,
} from "./application/integrations/egress-policy.ts";
export { redactSensitiveText, type RedactionResult } from "./application/integrations/redaction.ts";
export {
  listMechanizedIntegrations,
  integrationStatusReport,
  testIntegration,
  collectRepoEvidence,
  assistantProvider,
  type MechanizedIntegration,
} from "./application/integrations/service.ts";

export {
  OllamaAssistantProvider,
  isAllowedLocalEndpoint,
  OLLAMA_DEFAULT_ENDPOINT,
  OLLAMA_TAGS_PATH,
} from "./adapters/integrations/assistant/ollama.ts";
export { GitLocalAdapter, discoverLocalRepos } from "./adapters/integrations/git/local.ts";
export { CiLocalAdapter } from "./adapters/integrations/ci/local.ts";
export {
  CodeQualityAdapter,
  CODE_QUALITY_REPORT_SCHEMA,
  CODE_QUALITY_REPORT_FILE,
} from "./adapters/integrations/code-quality/local-report.ts";
export {
  ObservabilityAdapter,
  OBSERVABILITY_REPORT_SCHEMA,
  OBSERVABILITY_SOURCE_REPO,
  OBSERVABILITY_REPORT_FILE,
} from "./adapters/integrations/observability/local-report.ts";
export {
  readVerifiedReport,
  reportBodyHash,
  type VerifiedReport,
} from "./adapters/integrations/shared/verified-report.ts";

export type {
  GovernanceRepository,
  EventLog,
  GovernanceEvent,
  WriteReceipt,
} from "./ports/GovernanceRepository.ts";
export type { GraphReadModelSource, GraphSnapshot } from "./ports/GraphReadModelSource.ts";
export type {
  IntegrationAdapter,
  EvidenceProvider,
  IntegrationResult,
  IntegrationStatusKind,
  EvidenceRecord,
} from "./ports/IntegrationAdapter.ts";
export type {
  AssistantProvider,
  AssistantHealth,
  AssistantAdvice,
} from "./ports/AssistantProvider.ts";

export * as apiSchema from "./api/schema.ts";
export {
  buildApiContractDocument,
  governedCommandSchema,
  assistantAdvisoryRequestSchema,
} from "./api/contracts.ts";
export {
  handleCommandDryRun,
  handleCommandExecute,
  handleGraphOverview,
  handleGraphNode,
  handleGraphAdjacency,
  handleGraphPath,
  handleContractImpact,
  handleIntentDependencies,
  handleGraphConflicts,
  handleIntegrationsList,
  handleIntegrationTest,
  handleAssistantAdvisory,
  handleApiContract,
  type ApiResponse,
} from "./api/handlers.ts";
