import { translate, type LocaleDictionary, type MessageDescriptor } from "@demo/backend/domain";
import assistantPtBr from "../app/_domain/adoption/assistant/_locales/pt-br.json";
import homePtBr from "../app/(home)/_view/HomeView/_locales/pt-br.json";
import onboardingPtBr from "../app/onboarding/_view/OnboardingView/_locales/pt-br.json";
import settingsPtBr from "../app/settings/_view/SettingsView/_locales/pt-br.json";
import sharedPtBr from "../app/_ui/shared/_locales/pt-br.json";
import shellPtBr from "../app/_ui/shell/_locales/pt-br.json";

export type AppLocale = "pt-br";

export const DEFAULT_LOCALE: AppLocale = "pt-br";

type LocaleModule = {
  locale: string;
  messages: Record<string, string>;
};

function mergeLocale(locale: AppLocale, modules: LocaleModule[]): LocaleDictionary {
  return {
    locale,
    messages: Object.assign({}, ...modules.map((module) => module.messages)),
  };
}

const dictionaries: Record<AppLocale, LocaleDictionary> = {
  "pt-br": mergeLocale("pt-br", [
    shellPtBr,
    sharedPtBr,
    assistantPtBr,
    homePtBr,
    onboardingPtBr,
    settingsPtBr,
  ]),
};

export function dictionary(locale: AppLocale = DEFAULT_LOCALE): LocaleDictionary {
  return dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
}

export function t(descriptor: MessageDescriptor | string, fallback = ""): string {
  return translate(dictionary(), descriptor, fallback);
}
