import sourcesPtBr from "./locales/pt-br.json";

export type SourceKindId = "git" | "local" | "mono" | "svc" | "ext";

export const SOURCE_KINDS = sourcesPtBr.kinds as Array<{
  id: SourceKindId;
  name: string;
  desc: string;
  disabled?: boolean;
  tag?: string;
}>;

export const NO_SOURCE_DOWNGRADE = sourcesPtBr.noSourceDowngrade;
