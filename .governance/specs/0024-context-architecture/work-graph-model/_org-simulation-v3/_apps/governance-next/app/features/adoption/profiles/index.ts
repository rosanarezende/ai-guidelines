import profilesPtBr from "./locales/pt-br.json";

export type ProfileId = "full" | "compact" | "trio" | "solo";

export type ProfileOption = {
  id: ProfileId;
  label: string;
  shortLabel: string;
  mapsTo: "full" | "compact" | "solo";
  bestWhen: string;
  tradeoff: string;
  description: string;
  appWill: string[];
  appWillNot: string[];
  visibleRisks: string[];
  ceremony: string[];
  enforcement: {
    verb: string;
    text: string;
    severity: "error" | "warning" | "info";
  };
};

export const PROFILE_OPTIONS = profilesPtBr.options as ProfileOption[];

export function profileOption(id: string): ProfileOption {
  return PROFILE_OPTIONS.find((option) => option.id === id) || PROFILE_OPTIONS[0];
}

export function profileChipLabel(profile: string): string {
  const option = PROFILE_OPTIONS.find((item) => item.id === profile);
  if (!option) return profilesPtBr.chip.unknown.replace("{profile}", profile);
  return option.id === "full" ? profilesPtBr.chip.full : option.label;
}
