// onboardingStorage.ts — estado local de UX para o onboarding.
// Nao e estado governado: serve apenas para guiar a experiencia neste navegador.

export type OnboardingStatus = "partial" | "finished";

export const ONBOARDING_STORAGE_KEY = "acme-governance:onboarding-status";

export function readOnboardingStatus(): OnboardingStatus | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return value === "partial" || value === "finished" ? value : null;
  } catch {
    return null;
  }
}

export function writeOnboardingStatus(status: OnboardingStatus) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, status);
  } catch {
    // Sem localStorage, o app continua funcional; apenas nao lembra o onboarding.
  }
}

export function markOnboardingPartialIfNeeded() {
  if (readOnboardingStatus() !== "finished") {
    writeOnboardingStatus("partial");
  }
}
