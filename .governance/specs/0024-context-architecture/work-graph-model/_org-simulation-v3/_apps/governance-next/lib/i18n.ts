import ptBr from "../locales/pt-br.json";
import { translate, type LocaleDictionary, type MessageDescriptor } from "../../../_lib/domain";

export type AppLocale = "pt-br";

export const DEFAULT_LOCALE: AppLocale = "pt-br";

const dictionaries: Record<AppLocale, LocaleDictionary> = {
  "pt-br": ptBr,
};

export function dictionary(locale: AppLocale = DEFAULT_LOCALE): LocaleDictionary {
  return dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
}

export function t(descriptor: MessageDescriptor | string, fallback = ""): string {
  return translate(dictionary(), descriptor, fallback);
}
