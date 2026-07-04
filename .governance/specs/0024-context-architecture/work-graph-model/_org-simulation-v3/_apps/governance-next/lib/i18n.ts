import { translate, type LocaleDictionary, type MessageDescriptor } from "../../../_lib/domain";
import assistantPtBr from "../app/features/adoption/assistant/locales/pt-br.json";
import homePtBr from "../app/features/home/views/HomeView/locales/pt-br.json";
import onboardingPtBr from "../app/features/onboarding/views/OnboardingView/locales/pt-br.json";
import settingsPtBr from "../app/features/settings/views/SettingsView/locales/pt-br.json";
import sharedPtBr from "../app/ui/shared/locales/pt-br.json";
import shellPtBr from "../app/ui/shell/locales/pt-br.json";

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
