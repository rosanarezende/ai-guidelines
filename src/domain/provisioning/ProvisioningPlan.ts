/**
 * Plano PURO de provisionamento: a sequência declarativa de efeitos que
 * init/adopt/update produzem, computada ANTES de qualquer IO.
 *
 * Migração Spec 0024 · CO-3.5. Espelha a separação já adotada em
 * `domain/workspace/MigrationPlan` (plano puro) + `app/use-cases/AdoptWorkspace`
 * (aplicação via port). O use case {@link ../../app/use-cases/ProvisionWorkspace}
 * consome estes efeitos e os aplica no filesystem do consumidor.
 *
 * **Escopo deste arquivo (CO-3.5 · Passo 1b):** o grupo de efeitos `pointers`
 * (config.json + provider entrypoints + prune) — o núcleo compartilhado por
 * init/adopt/update/providers e a totalidade do ex-comando `providers`
 * (absorvido em `update --providers`). Os grupos restantes de applyPointers
 * (merge do bloco `<AI_GUIDELINES>` em AGENTS.md e o mirror de templates,
 * ambos dependentes do runtime compilado em `dist/`) e os efeitos exclusivos de
 * init/adopt (gitattributes, features opt-in, install) entram no Passo 2 com
 * seus adapters de infraestrutura.
 */
import path from "node:path";
import { ManagedBlockSyntax, inferSyntaxFromPath } from "./ManagedBlock.js";
import { getAllManagedRelativePaths, getProviderEntrypoints } from "./ProviderEntrypoints.js";

export type ProvisioningOperation = "init" | "adopt" | "update";

export type ProvisioningEffect =
  | { readonly kind: "write-config"; readonly relPath: string; readonly content: string }
  | {
      readonly kind: "agents-runtime-bootstrap";
      readonly relPath: "AGENTS.md";
      readonly runtimeStub: string;
    }
  | { readonly kind: "sync-templates"; readonly message: "sync templates -> target" }
  | {
      readonly kind: "mirror-template";
      readonly relPath: string;
      readonly sourceRelPath: string;
      readonly content: string;
      readonly origin: TemplateMirrorOrigin;
    }
  | { readonly kind: "prune-template"; readonly relPath: string }
  | {
      readonly kind: "managed-entrypoint";
      readonly relPath: string;
      readonly inner: string;
      readonly syntax: ManagedBlockSyntax;
      readonly force: boolean;
      /** `.mdc` (Cursor) exige frontmatter YAML no topo na primeira criação. */
      readonly cursorFrontmatter: boolean;
    }
  | { readonly kind: "prune-managed"; readonly relPath: string }
  | { readonly kind: "merge-gitattributes"; readonly relPath: string; readonly baseline: string }
  | {
      readonly kind: "assert-init-safe";
      readonly conflicts: readonly string[];
      readonly force: boolean;
    }
  | { readonly kind: "guidance"; readonly message: string };

export interface PointersConfig {
  readonly sdd_dir: string;
  readonly providers: readonly string[];
  readonly features: readonly string[];
  readonly lang: string;
}

export interface PlanPointersOptions {
  readonly force: boolean;
  readonly prune: boolean;
}

export type TemplateMirrorOrigin = "mirror" | "engine";

export interface TemplateMirrorFile {
  /** Caminho relativo dentro de `.specify/templates`. */
  readonly relativePath: string;
  /** Conteúdo final já materializado (mirror ou engine) pela infraestrutura. */
  readonly content: string;
  readonly origin: TemplateMirrorOrigin;
}

export interface TemplateMirrorSnapshot {
  readonly sourceExists: boolean;
  readonly sourceFiles: readonly TemplateMirrorFile[];
  /** Caminhos relativos dentro de `<sdd_dir>/templates`, usados somente para prune. */
  readonly targetRelativePaths: readonly string[];
}

export interface PlanTemplateMirrorOptions {
  readonly prune: boolean;
}

/** Caminho relativo do `config.json` dentro do consumidor. */
export function configRelPath(sddDir: string): string {
  return path.posix.join(sddDir, "config.json");
}

/** Serialização canônica do `config.json` (espelha `stringifyJson` do legado). */
export function serializeConfig(config: PointersConfig): string {
  return `${JSON.stringify(
    {
      sdd_dir: config.sdd_dir,
      providers: config.providers,
      features: config.features,
      lang: config.lang,
    },
    null,
    2
  )}\n`;
}

/**
 * Computa os efeitos `pointers`: escreve `config.json`, gera os provider
 * entrypoints selecionados (bloco gerenciado) e, sob `--prune`, remove os
 * entrypoints de providers desmarcados. PURO e determinístico — `adapterRulesByName`
 * (regras compiladas por adapter) é input vindo da infraestrutura.
 */
export function planPointers(
  config: PointersConfig,
  adapterRulesByName: Readonly<Record<string, string>>,
  options: PlanPointersOptions
): ProvisioningEffect[] {
  const effects: ProvisioningEffect[] = [
    {
      kind: "write-config",
      relPath: configRelPath(config.sdd_dir),
      content: serializeConfig(config),
    },
  ];

  const selected = config.providers.flatMap((provider) =>
    getProviderEntrypoints(provider, config.sdd_dir, adapterRulesByName)
  );

  for (const entry of selected) {
    effects.push({
      kind: "managed-entrypoint",
      relPath: entry.relPath,
      inner: entry.content,
      syntax: inferSyntaxFromPath(entry.relPath),
      force: options.force,
      cursorFrontmatter: entry.relPath.endsWith(".mdc"),
    });
  }

  if (options.prune) {
    const selectedPaths = new Set(selected.map((entry) => entry.relPath));
    for (const relPath of getAllManagedRelativePaths(config.sdd_dir)) {
      if (!selectedPaths.has(relPath)) {
        effects.push({ kind: "prune-managed", relPath });
      }
    }
  }

  return effects;
}

export function planAgentsRuntimeBootstrap(runtimeStub: string): ProvisioningEffect {
  return { kind: "agents-runtime-bootstrap", relPath: "AGENTS.md", runtimeStub };
}

export function templateTargetRelPath(sddDir: string, relativePath: string): string {
  return path.posix.join(sddDir, "templates", relativePath);
}

/**
 * Computa o mirror de templates do consumidor. A infraestrutura fornece o
 * snapshot materializado (`sourceFiles`) e os arquivos atuais do alvo usados
 * para prune; o plano apenas declara os efeitos.
 */
export function planTemplateMirror(
  sddDir: string,
  snapshot: TemplateMirrorSnapshot,
  options: PlanTemplateMirrorOptions
): ProvisioningEffect[] {
  if (!snapshot.sourceExists) {
    return [];
  }

  const effects: ProvisioningEffect[] = [
    { kind: "sync-templates", message: "sync templates -> target" },
  ];
  const sourceRelativeSet = new Set<string>();

  for (const source of snapshot.sourceFiles) {
    sourceRelativeSet.add(source.relativePath);
    effects.push({
      kind: "mirror-template",
      relPath: templateTargetRelPath(sddDir, source.relativePath),
      sourceRelPath: source.relativePath,
      content: source.content,
      origin: source.origin,
    });
  }

  if (options.prune) {
    for (const targetRelativePath of snapshot.targetRelativePaths) {
      if (!sourceRelativeSet.has(targetRelativePath)) {
        effects.push({
          kind: "prune-template",
          relPath: templateTargetRelPath(sddDir, targetRelativePath),
        });
      }
    }
  }

  return effects;
}

/**
 * Efeito de sincronização do `.gitattributes`: `baseline` (conteúdo do template,
 * lido pela infraestrutura) entra como input; a fusão não-destrutiva acontece na
 * aplicação, via {@link ./MergePolicies.mergeGitattributesContent}.
 */
export function planGitattributes(baseline: string): ProvisioningEffect {
  return { kind: "merge-gitattributes", relPath: ".gitattributes", baseline };
}

/**
 * Efeito conflict guard de init: a lista `conflicts` (paths guardados que já
 * existem, detectada pela infraestrutura a partir de {@link ./InitGuard.INIT_GUARDED_PATHS})
 * + `force` entram como input; a asserção roda na aplicação, antes das escritas.
 */
export function planInitGuard(conflicts: readonly string[], force: boolean): ProvisioningEffect {
  return { kind: "assert-init-safe", conflicts, force };
}

/** Converte linhas de guidance em efeitos `guidance` (repassados ao log na aplicação). */
export function guidanceEffects(messages: readonly string[]): ProvisioningEffect[] {
  return messages.map((message) => ({ kind: "guidance", message }));
}
