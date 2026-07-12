// repo-contexts.ts — shim de compatibilidade; fonte ativa em backend/src/adapters/repo-first.
export {
  loadManifest,
  loadPublishedContexts,
  deriveRepoContext,
  deriveAllRepoContexts,
  publishRepoContexts,
  inspectRepoCode,
  validateRepoContexts,
} from "../../backend/src/adapters/repo-first/repo-contexts.ts";
