import type { FormatterContextSnapshot } from "./FormatterContext.js";
import { mergeGitattributesContent } from "./MergePolicies.js";
import type { MonorepoContextSnapshot } from "./MonorepoContext.js";

/**
 * Guidance textual derivada PURAMENTE do modo + flags + snapshots da invocação.
 *
 * Migrado de `buildOverwriteGuidance`, `buildFormatterRivalGuidance`,
 * `buildMonorepoGuidance` e EOL warning (`cli/app/engine.mjs` + `cli/app/guidance.mjs` ·
 * Spec 0024 · CO-3.5). As linhas viram efeitos `guidance` no plano; o adapter só
 * as repassa ao log.
 */
export type GuidanceMode = "init" | "adopt" | "update" | "providers";

export interface GitattributesGuidanceSnapshot {
  readonly content: string | null;
  readonly baseline: string;
}

export interface FinalGuidanceSnapshot {
  readonly formatterContext: FormatterContextSnapshot;
  readonly monorepoContext: MonorepoContextSnapshot;
  readonly gitattributes: GitattributesGuidanceSnapshot;
  readonly platform: NodeJS.Platform | string;
  readonly hasGitRepo: boolean;
}

export interface FinalGuidanceOptions {
  readonly operation: Exclude<GuidanceMode, "providers">;
  readonly force: boolean;
  readonly providersRequested: boolean;
}

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

export function buildFormatterRivalGuidance(formatterContext: FormatterContextSnapshot): string[] {
  if (!formatterContext.rival) {
    return [];
  }

  return [
    `atenção: formatador rival detectado (${formatterContext.rival.label})`,
    "sugestão: considere usar apenas um formatador para evitar conflitos de estilo",
  ];
}

export function buildPrettierAlreadyPresentGuidance(
  operation: Exclude<GuidanceMode, "providers">,
  formatterContext: FormatterContextSnapshot
): string[] {
  if (operation !== "adopt" || !formatterContext.rival || !formatterContext.hasPrettier) {
    return [];
  }

  return [
    `formatter rival detectado (${formatterContext.rival.label}); baseline prettier preservado porque já existe no repositório`,
  ];
}

export function buildMonorepoGuidance(monorepoContext: MonorepoContextSnapshot): string[] {
  if (!monorepoContext.detected) {
    return [];
  }

  return [
    `atenção: estrutura de monorepo detectada (${monorepoContext.flavor})`,
    "sugestão: aplique a governança em cada pacote individual se necessário",
  ];
}

export function buildProvidersAbsorbedGuidance(
  operation: Exclude<GuidanceMode, "providers">,
  providersRequested: boolean
): string[] {
  if (operation !== "update" || !providersRequested) {
    return [];
  }

  return [
    "modo update --providers: provider entrypoints são atualizados pelo update; o comando providers legado foi absorvido pelo modelo novo",
  ];
}

export function willUpdateGitattributes(snapshot: GitattributesGuidanceSnapshot): boolean {
  const current = snapshot.content ?? "";
  return mergeGitattributesContent(current, snapshot.baseline) !== current;
}

export function shouldWarnAboutEolMismatch(
  operation: Exclude<GuidanceMode, "providers">,
  snapshot: FinalGuidanceSnapshot
): boolean {
  return (
    operation === "adopt" &&
    snapshot.platform === "win32" &&
    snapshot.hasGitRepo &&
    willUpdateGitattributes(snapshot.gitattributes)
  );
}

export function buildEolMismatchGuidance(): string[] {
  return [
    "atenção EOL: .gitattributes foi atualizado em ambiente Windows; pode surgir stat-dirty sem diff visível",
    "sugestão EOL: se isso ocorrer, rode git add --renormalize . e depois git status",
  ];
}

export function buildFinalProvisioningGuidance(
  snapshot: FinalGuidanceSnapshot,
  options: FinalGuidanceOptions
): string[] {
  const lines = [
    ...buildOverwriteGuidance(options.operation, options.force),
    ...buildProvidersAbsorbedGuidance(options.operation, options.providersRequested),
    ...buildMonorepoGuidance(snapshot.monorepoContext),
    ...buildFormatterRivalGuidance(snapshot.formatterContext),
    ...buildPrettierAlreadyPresentGuidance(options.operation, snapshot.formatterContext),
  ];

  if (shouldWarnAboutEolMismatch(options.operation, snapshot)) {
    lines.push(...buildEolMismatchGuidance());
  }

  return lines;
}
