/**
 * Geração PURA dos provider entrypoints nativos (CLAUDE.md, .claudeignore,
 * GEMINI.md, …) a partir do catálogo de providers + regras de adapter compiladas.
 *
 * Migrado de `cli/features/core/provider-entrypoints.mjs` (Spec 0024 · CO-3.5).
 * É o coração do que `update`/`providers` escreve. Tudo aqui é string-building
 * determinístico: o único IO do legado (ler conteúdo atual p/ estado do bloco
 * gerenciado e escrever) fica no use case {@link ../../app/use-cases/ProvisionWorkspace}.
 *
 * `node:path` é usado só para compor caminhos (puro). As regras compiladas por
 * adapter (`adapterRulesByName`) entram como **input** — são produzidas pela
 * infraestrutura (compilador de regras) antes do plano, no padrão snapshot-in.
 */
import path from "node:path";
import { getAdaptersForProvider, getSupportedProviders, Provider } from "./ProviderCatalog.js";
import { ManagedBlockState } from "./ManagedBlock.js";

export const CURSOR_FRONTMATTER = [
  "---",
  "description: ai-guidelines hard redirect",
  "alwaysApply: true",
  "---",
].join("\n");

const PROVIDER_LABELS: Record<Provider, string> = {
  claude: "Claude Code",
  cursor: "Cursor",
  copilot: "GitHub Copilot",
  windsurf: "Windsurf",
  gemini: "Gemini",
  aider: "Aider",
  openai: "OpenAI / Codex",
};

export function buildCommonContextIgnores(sddDir: string): string {
  return [
    "node_modules",
    ".git",
    ".yarn",
    "dist",
    "build",
    "coverage",
    ".next",
    ".turbo",
    ".cache",
    `${sddDir}/templates`,
  ].join("\n");
}

export function buildHardRedirect(providerLabel: string, sddDir: string): string {
  return [
    "# SYSTEM DIRECTIVE: HARD REDIRECT",
    `You are operating inside the ${providerLabel} integration for this workspace.`,
    "Do not rely on your default behavioral assumptions.",
    "Start from the canonical AGENTS.md file at the repository root, then use the handoff command when you need situated state.",
    "Full rules belong in the governed catalog (`.core/rules/**`), not in this native provider file.",
    `Consumer-local ai-guidelines assets live under \`${sddDir}/\`.`,
  ].join("\n\n");
}

export function buildMarkdownInner(
  providerLabel: string,
  sddDir: string,
  adapterContents: readonly string[]
): string {
  const sections = [buildHardRedirect(providerLabel, sddDir), ...adapterContents.filter(Boolean)];
  return sections.join("\n\n---\n\n");
}

export interface ProviderEntrypoint {
  readonly relPath: string;
  readonly content: string;
}

type AdapterRules = Readonly<Record<string, string>>;

/**
 * Entrypoints nativos de um provider: pares `[relPath, content]` já renderizados.
 * `markdown` recebe o hard redirect + regras de adapter; arquivos ignore-style
 * recebem a lista comum de context ignores.
 */
export function getProviderEntrypoints(
  provider: string,
  sddDir: string,
  adapterRulesByName: AdapterRules = {}
): ProviderEntrypoint[] {
  const label = PROVIDER_LABELS[provider as Provider];
  if (!label) {
    return [];
  }

  const adapters = getAdaptersForProvider(provider);
  const adapterContents = adapters
    .map((adapter) => adapterRulesByName[adapter])
    .filter((content): content is string => typeof content === "string" && content.length > 0);

  const markdownInner = buildMarkdownInner(label, sddDir, adapterContents);
  const commonContextIgnores = buildCommonContextIgnores(sddDir);

  const recipes: Partial<Record<Provider, ProviderEntrypoint[]>> = {
    claude: [
      { relPath: "CLAUDE.md", content: markdownInner },
      { relPath: ".claudeignore", content: commonContextIgnores },
    ],
    cursor: [
      { relPath: path.join(".cursor", "rules", "ai-guidelines.mdc"), content: markdownInner },
    ],
    copilot: [{ relPath: path.join(".github", "copilot-instructions.md"), content: markdownInner }],
    windsurf: [{ relPath: ".windsurfrules", content: markdownInner }],
    gemini: [
      { relPath: "GEMINI.md", content: markdownInner },
      { relPath: ".aiexclude", content: commonContextIgnores },
    ],
    aider: [
      { relPath: "CONVENTIONS.md", content: markdownInner },
      { relPath: ".aiderignore", content: commonContextIgnores },
    ],
    openai: [
      { relPath: path.join(".openai", "instructions.md"), content: markdownInner },
      { relPath: ".gptignore", content: commonContextIgnores },
    ],
  };

  return recipes[provider as Provider] ?? [];
}

/**
 * Todos os relPaths gerenciados de TODOS os providers suportados — base do prune
 * (remover entrypoints de providers desmarcados). Conteúdo é irrelevante aqui.
 */
export function getAllManagedRelativePaths(sddDir: string): string[] {
  return getSupportedProviders().flatMap((provider) =>
    getProviderEntrypoints(provider, sddDir).map((entry) => entry.relPath)
  );
}

/**
 * Linha de log determinística para um estado de aplicação do bloco gerenciado.
 * Espelha `describeAction` do legado (paridade do log de ações). `unchanged`
 * (sem efeito) retorna `null`.
 */
export function describeManagedAction(
  state: ManagedBlockState,
  relPath: string,
  dryRun: boolean
): string | null {
  const prefix = dryRun ? "[dry-run] " : "";
  switch (state) {
    case "created":
      return `${prefix}write ${relPath}`;
    case "block-updated":
      return `${prefix}update managed block in ${relPath}`;
    case "legacy-prepended":
      return `${prefix}prepend managed block to existing ${relPath} (legacy content preserved)`;
    case "legacy-overwritten":
      return `${prefix}overwrite ${relPath} (--force, legacy content discarded)`;
    default:
      return null;
  }
}
