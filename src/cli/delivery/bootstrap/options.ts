import * as path from "node:path";
import { boolFlag, parseFlags, stringFlag } from "../../registry/parseFlags.js";
import { ProvisioningOperation } from "../../../domain/provisioning/ProvisioningPlan.js";
import { FEATURE_OPTIONS } from "../../../domain/provisioning/FeatureCatalog.js";
import {
  CollaborationProfile,
  isCollaborationProfile,
} from "../../../domain/provisioning/ReviewPolicyBaseline.js";

export type BootstrapDeliveryCommandName = ProvisioningOperation | "check-budget";

export interface BootstrapOptionDefinition {
  readonly name: string;
  readonly value: "boolean" | "string" | "list";
  readonly operations?: readonly ProvisioningOperation[];
  readonly description: string;
}

export interface ProvisioningCommandOptions {
  readonly operation: ProvisioningOperation;
  readonly target: string;
  readonly name?: string;
  readonly packageManager?: string;
  readonly providers?: readonly string[];
  readonly features?: readonly string[];
  readonly lang?: string;
  readonly sddDir?: string;
  readonly force: boolean;
  readonly forcePrettier: boolean;
  readonly dryRun: boolean;
  readonly install: boolean;
  readonly prune: boolean;
  readonly collaborationProfile?: CollaborationProfile;
  readonly yes: boolean;
  readonly skippedFeatures: readonly string[];
}

export const PROVISIONING_OPTION_DEFINITIONS: readonly BootstrapOptionDefinition[] = [
  { name: "target", value: "string", description: "Diretorio alvo do consumidor." },
  { name: "name", value: "string", description: "Nome do projeto no config gerado." },
  {
    name: "package-manager",
    value: "string",
    description: "Package manager explicito: npm, pnpm ou yarn@x.",
  },
  {
    name: "providers",
    value: "list",
    description: "Providers do baseline, separados por virgula.",
  },
  { name: "features", value: "list", description: "Features opt-in separadas por virgula." },
  { name: "lang", value: "string", description: "Idioma do baseline." },
  { name: "sdd-dir", value: "string", description: "Diretorio runtime do consumidor." },
  { name: "force", value: "boolean", description: "Permite sobrescritas suportadas." },
  {
    name: "force-prettier",
    value: "boolean",
    description: "Aplica Prettier mesmo com formatter rival.",
  },
  { name: "dry-run", value: "boolean", description: "Planeja sem escrever no filesystem." },
  { name: "install", value: "boolean", description: "Executa install quando houver deps novas." },
  { name: "prune", value: "boolean", description: "Remove artefatos gerenciados obsoletos." },
  {
    name: "collaboration-profile",
    value: "string",
    description: "Perfil de colaboração: solo, contributor ou team.",
  },
  { name: "yes", value: "boolean", description: "Aceita defaults seguros do fluxo." },
  { name: "y", value: "boolean", description: "Alias curto de --yes." },
  { name: "skip-bdd", value: "boolean", description: "Remove feature bdd da selecao." },
  { name: "skip-ci", value: "boolean", description: "Remove feature ci da selecao." },
  { name: "skip-husky", value: "boolean", description: "Remove feature husky da selecao." },
  { name: "skip-prettier", value: "boolean", description: "Remove feature prettier da selecao." },
  {
    name: "skip-quality-gates",
    value: "boolean",
    description: "Remove feature quality-gates da selecao.",
  },
  { name: "skip-tdd", value: "boolean", description: "Remove feature tdd da selecao." },
];

const SKIP_FLAG_TO_FEATURE: Readonly<Record<string, string>> = {
  "skip-bdd": "bdd",
  "skip-ci": "ci",
  "skip-husky": "husky",
  "skip-prettier": "prettier",
  "skip-quality-gates": "quality-gates",
  "skip-tdd": "tdd",
};

const KNOWN_OPTIONS = new Set(PROVISIONING_OPTION_DEFINITIONS.map((option) => option.name));
const BOOLEAN_OPTIONS = PROVISIONING_OPTION_DEFINITIONS.filter(
  (option) => option.value === "boolean"
).map((option) => option.name);

export function parseProvisioningCommandOptions(
  operation: ProvisioningOperation,
  argv: readonly string[]
): ProvisioningCommandOptions {
  assertKnownFlagNames(operation, argv);
  const { positionals, flags } = parseFlags(argv, { booleans: BOOLEAN_OPTIONS });
  if (positionals.length > 0) {
    throw new Error(`Argumento inesperado: ${positionals[0]}`);
  }

  for (const key of flags.keys()) {
    if (!KNOWN_OPTIONS.has(key)) {
      throw new Error(`Opcao desconhecida para ${operation}: --${key}`);
    }
  }

  const skippedFeatures = collectSkippedFeatures(flags);
  const explicitFeatures = listFlag(flags, "features");
  const defaultFeatures = operation === "update" ? undefined : FEATURE_OPTIONS;
  const requestedFeatures = explicitFeatures ?? defaultFeatures;
  const features = requestedFeatures
    ? removeSkippedFeatures(requestedFeatures, skippedFeatures)
    : undefined;

  return {
    operation,
    target: stringFlag(flags, "target") ?? ".",
    name: stringFlag(flags, "name"),
    packageManager: stringFlag(flags, "package-manager"),
    providers: listFlag(flags, "providers"),
    features,
    lang: stringFlag(flags, "lang"),
    sddDir: stringFlag(flags, "sdd-dir"),
    force: booleanOption(flags, "force"),
    forcePrettier: booleanOption(flags, "force-prettier"),
    dryRun: booleanOption(flags, "dry-run"),
    install: booleanOption(flags, "install"),
    prune: booleanOption(flags, "prune"),
    collaborationProfile: collaborationProfileOption(flags),
    yes: booleanOption(flags, "yes") || booleanOption(flags, "y"),
    skippedFeatures,
  };
}

function assertKnownFlagNames(operation: ProvisioningOperation, argv: readonly string[]): void {
  for (const token of argv) {
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2).split("=", 1)[0];
    if (!KNOWN_OPTIONS.has(key)) {
      throw new Error(`Opcao desconhecida para ${operation}: --${key}`);
    }
  }
}

export function resolveTargetDir(repoRoot: string, target: string): string {
  return path.resolve(repoRoot, target);
}

export function resolveProjectName(targetDir: string, explicitName?: string): string {
  const trimmed = explicitName?.trim();
  if (trimmed) {
    return trimmed;
  }
  return path.basename(targetDir) || "workspace";
}

export function renderOptionUsage(
  options: readonly BootstrapOptionDefinition[]
): readonly string[] {
  return options.map((option) => {
    const suffix = option.value === "boolean" ? "" : ` <${option.value}>`;
    return `--${option.name}${suffix}: ${option.description}`;
  });
}

function listFlag(
  flags: ReadonlyMap<string, string | true>,
  key: string
): readonly string[] | undefined {
  const value = stringFlag(flags, key);
  if (value === undefined) {
    if (flags.get(key) === true) {
      throw new Error(`Valor ausente para --${key}.`);
    }
    return undefined;
  }
  const values = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return values.length > 0 ? [...new Set(values)] : undefined;
}

function booleanOption(flags: ReadonlyMap<string, string | true>, key: string): boolean {
  const raw = flags.get(key);
  if (raw === undefined) {
    return false;
  }
  if (raw === true || boolFlag(flags, key)) {
    return true;
  }
  const normalized = raw.trim().toLowerCase();
  if (["true", "1", "yes", "y", "sim", "s"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n", "nao"].includes(normalized)) {
    return false;
  }
  throw new Error(`Valor booleano invalido para --${key}: ${raw}`);
}

function collectSkippedFeatures(flags: ReadonlyMap<string, string | true>): readonly string[] {
  return Object.entries(SKIP_FLAG_TO_FEATURE)
    .filter(([flag]) => booleanOption(flags, flag))
    .map(([, feature]) => feature);
}

function collaborationProfileOption(
  flags: ReadonlyMap<string, string | true>
): CollaborationProfile | undefined {
  const value = stringFlag(flags, "collaboration-profile");
  if (value === undefined) {
    if (flags.get("collaboration-profile") === true) {
      throw new Error("Valor ausente para --collaboration-profile.");
    }
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (!isCollaborationProfile(normalized)) {
    throw new Error(
      `Perfil de colaboração inválido para --collaboration-profile: ${value}. Use solo, contributor ou team.`
    );
  }
  return normalized;
}

function removeSkippedFeatures(
  features: readonly string[],
  skippedFeatures: readonly string[]
): readonly string[] {
  const skipped = new Set(skippedFeatures);
  return features.filter((feature) => !skipped.has(feature));
}
