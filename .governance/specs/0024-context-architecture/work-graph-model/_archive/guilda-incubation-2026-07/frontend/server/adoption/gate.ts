// gate.ts — resolve o estado inicial do app para as páginas server-side.
//
// Regra de fluxo (checada perto do dado, em server components, como recomenda
// o guia oficial de auth do Next): sem principal → /login · com principal sem
// organização → /organizations · organização sem onboarding → /onboarding.
// A demo acme-* é fixture: só ela lê o snapshot governado da sim.
import {
  isDemoWorkspace,
  principalWorkspaces,
  type AdoptionState,
  type LocalAccount,
  type Workspace,
} from "@demo/domain";
import { readShellState } from "./application/use-cases";
import { readSession } from "./session";

export type AdoptionGate = {
  state: AdoptionState;
  principal: LocalAccount | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isDemo: boolean;
};

export async function resolveAdoptionGate(): Promise<AdoptionGate> {
  const state = await readShellState();
  const session = await readSession();
  const principal = session
    ? state.principals.find((item) => item.id === session.principalId) || null
    : null;
  const workspaces = principal ? principalWorkspaces(state, principal.id) : [];
  const currentWorkspace =
    principal && session?.workspaceId
      ? workspaces.find((workspace) => workspace.id === session.workspaceId) || null
      : null;
  return {
    state,
    principal,
    workspaces,
    currentWorkspace,
    isDemo: currentWorkspace ? isDemoWorkspace(currentWorkspace) : false,
  };
}

export function entryRedirect(gate: AdoptionGate): string | null {
  if (!gate.principal) return "/login";
  if (!gate.currentWorkspace) return "/organizations";
  if (gate.currentWorkspace.onboardingStatus === "not-started") return "/onboarding";
  return null;
}
