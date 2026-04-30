// Backward-compatible wrapper.
// TODO(spec-0017): remover após migração completa e remoção de aliases #core/*.

export { assertSafeInitTarget, extractCoreBlock, mergeAgentsContent } from "#governance/agents-merge";
export {
  buildFeatureTag,
  compileMonolithicAgentsContent,
  normalizePointerForMonolith,
  wrapFeatureModule,
} from "#governance/monolith/compiler";
export {
  mergeGitattributesContent,
  mergeHookContent,
  mergePrettierIgnoreContent,
} from "#fs/merge-utils";
