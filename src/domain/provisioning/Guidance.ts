/**
 * Guidance textual derivada PURAMENTE do modo + flags da invocação.
 *
 * Migrado de `buildOverwriteGuidance` (`cli/app/engine.mjs` · Spec 0024 · CO-3.5).
 * As linhas viram efeitos `guidance` no plano (ver {@link ./ProvisioningPlan}) —
 * o adapter só as repassa ao log; não há decisão no adapter. Guidance dependente
 * de detecção (monorepo, formatter rival, EOL) entra nos passes seguintes.
 */
export type GuidanceMode = "init" | "adopt" | "update" | "providers";

export function buildOverwriteGuidance(mode: GuidanceMode, force: boolean): string[] {
  if (mode === "update") {
    return [
      force
        ? "modo --force ativo: o conteúdo legado preservado abaixo de blocos managed em arquivos preexistentes pode ser descartado"
        : "modo update headless: bloco managed dos provider entrypoints é atualizado no lugar; conteúdo do consumidor fora do bloco fica intocado",
    ];
  }

  if (mode === "providers") {
    return [
      force
        ? "modo --force ativo: os provider entrypoints nativos dos providers selecionados podem ser sobrescritos"
        : "modo conservador: arquivos nativos de provider existentes so sao sobrescritos com --force",
    ];
  }

  if (force) {
    if (mode === "init") {
      return [
        "modo --force ativo: o init pode sobrescrever arquivos de baseline suportados quando já existirem",
      ];
    }

    return [
      "modo --force ativo: o adopt pode atualizar AGENTS.md, hooks Husky e ai-guidelines-ci.yml gerados pelo framework",
    ];
  }

  if (mode === "adopt") {
    return [
      "modo conservador: sem --force, o adopt adiciona ou mescla baseline sem sobrescrever arquivos existentes",
    ];
  }

  return [
    "modo conservador: sem --force, o init aborta quando encontrar conflitos de arquivos já existentes",
  ];
}
