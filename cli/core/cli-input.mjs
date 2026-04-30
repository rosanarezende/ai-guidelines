// Backward-compatible wrapper.
// TODO(spec-0017): remover quando cli/core/ for deprecado.

export {
  EDITORIAL_FEATURES,
  INFRASTRUCTURE_FEATURES,
  OPT_IN_RULE_FILES,
  isSupportedMode,
  parseArgs,
  printHelp,
  resolveExecutionInput,
  sanitizeWizardRawOptions,
} from "#cli/args";
