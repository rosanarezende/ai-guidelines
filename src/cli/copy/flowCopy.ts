import commands from "./locales/pt-BR/commands.json";
import common from "./locales/pt-BR/common.json";
import cockpit from "./locales/pt-BR/cockpit.json";
import features from "./locales/pt-BR/features.json";
import governanceDoctor from "./locales/pt-BR/governanceDoctor.json";
import governancePreflight from "./locales/pt-BR/governancePreflight.json";
import governanceRepair from "./locales/pt-BR/governanceRepair.json";
import providers from "./locales/pt-BR/providers.json";
import provisioning from "./locales/pt-BR/provisioning.json";
import wizard from "./locales/pt-BR/wizard.json";

export interface FlowChoiceCopy {
  readonly label: string;
  readonly hint: string;
}

export interface FlowProviderCopy extends FlowChoiceCopy {
  readonly htmlHint: string;
}

export interface FlowFeatureCopy extends FlowChoiceCopy {
  readonly htmlLabel: string;
}

type ProvisioningOperationCopy = {
  readonly init: string;
  readonly adopt: string;
  readonly update: string;
};

type ProvisioningOperationIntroCopy = {
  readonly init: readonly string[];
  readonly adopt: readonly string[];
  readonly update: readonly string[];
};

interface FlowCopyCatalog {
  readonly locale: string;
  readonly common: typeof common;
  readonly wizard: typeof wizard;
  readonly cockpit: typeof cockpit;
  readonly governanceDoctor: typeof governanceDoctor;
  readonly governancePreflight: typeof governancePreflight;
  readonly governanceRepair: typeof governanceRepair;
  readonly commands: typeof commands;
  readonly providers: Readonly<Record<string, FlowProviderCopy>>;
  readonly features: Readonly<Record<string, FlowFeatureCopy>>;
  readonly provisioning: typeof provisioning & {
    readonly operationLabels: ProvisioningOperationCopy;
    readonly operationActionLabels: ProvisioningOperationCopy;
    readonly operationTitles: ProvisioningOperationCopy;
    readonly taskLogTitles: ProvisioningOperationCopy;
    readonly mainHints: ProvisioningOperationCopy;
    readonly flow: typeof provisioning.flow & {
      readonly intro: ProvisioningOperationIntroCopy;
      readonly contextTask: ProvisioningOperationCopy;
    };
    readonly providerQuestion: string;
    readonly featureInstallQuestion: string;
    readonly featureUpdateQuestion: string;
  };
}

export const FLOW_COPY = {
  locale: common.locale,
  common,
  wizard,
  cockpit,
  governanceDoctor,
  governancePreflight,
  governanceRepair,
  commands,
  providers,
  features,
  provisioning,
} as FlowCopyCatalog;

export function providerCopy(provider: string): FlowProviderCopy {
  return FLOW_COPY.providers[provider] ?? fallbackProviderCopy(provider);
}

export function featureCopy(feature: string): FlowFeatureCopy {
  return FLOW_COPY.features[feature] ?? fallbackFeatureCopy(feature);
}

function fallbackProviderCopy(value: string): FlowProviderCopy {
  return { label: value, hint: "", htmlHint: value };
}

function fallbackFeatureCopy(value: string): FlowFeatureCopy {
  return { label: value, hint: "", htmlLabel: value };
}

export function copyLines(lines: readonly string[]): string {
  return lines.join("\n");
}

export function formatCopy(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (match, key: string) => values[key] ?? match);
}
