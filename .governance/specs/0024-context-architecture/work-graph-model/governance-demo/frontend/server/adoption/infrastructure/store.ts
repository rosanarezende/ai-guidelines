// store.ts — porta de persistência do shell, escolhida pela data source.
//
//   file  → .local-state file-first (lock + escrita atômica + event-log)
//   http  → mock-api (Hono+lowdb) com o MESMO contrato de comando/reducer
//   demo  → file-first com mutações de configuração bloqueadas (read-mostly)
// O reducer puro (applyShellCommand, domínio) garante semântica idêntica.
import {
  applyShellCommand,
  type AdoptionState,
  type LocalShellCommand,
  type LocalShellCommandType,
} from "@demo/backend/domain";
import { mockApiBaseUrl, resolveDataSource } from "../data-source";
import { applyLocalShellCommand, loadAdoptionState } from "./file-state-store";

export type DispatchResult = { ok: true; state: AdoptionState } | { ok: false; error: string };

export interface ShellStore {
  load(): Promise<AdoptionState>;
  dispatch(command: LocalShellCommand): Promise<DispatchResult>;
}

const fileStore: ShellStore = {
  async load() {
    return loadAdoptionState();
  },
  async dispatch(command) {
    return applyLocalShellCommand(command, (state) => {
      const result = applyShellCommand(state, command);
      return result.ok ? result.state : { error: result.error };
    });
  },
};

function httpStore(baseUrl: string): ShellStore {
  return {
    async load() {
      const response = await fetch(`${baseUrl}/api/shell/state`, { cache: "no-store" });
      if (!response.ok) throw new Error(`mock-api indisponível (${response.status})`);
      return (await response.json()) as AdoptionState;
    },
    async dispatch(command) {
      const response = await fetch(`${baseUrl}/api/shell/commands`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const body = (await response.json().catch(() => null)) as DispatchResult | null;
      if (!body) return { ok: false, error: `mock-api-invalid-response:${response.status}` };
      return body;
    },
  };
}

// Em demo-acme o shell aceita apenas navegação (entrar, anexar demo, selecionar,
// status de onboarding); configuração real fica bloqueada com erro explícito.
const DEMO_ALLOWED_COMMANDS: LocalShellCommandType[] = [
  "local.principal.create",
  "local.workspace.attach-demo",
  "local.workspace.select",
  "local.onboarding.set-status",
];

function demoStore(inner: ShellStore): ShellStore {
  return {
    load: () => inner.load(),
    async dispatch(command) {
      if (!DEMO_ALLOWED_COMMANDS.includes(command.type)) {
        return { ok: false, error: "demo-read-only" };
      }
      return inner.dispatch(command);
    },
  };
}

export function shellStore(): ShellStore {
  const source = resolveDataSource();
  if (source === "mock-api") return httpStore(mockApiBaseUrl());
  if (source === "demo-acme") return demoStore(fileStore);
  return fileStore;
}
