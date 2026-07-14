/**
 * Derivações PURAS da família continuation (Spec 0024 · PR #46, fatia 2).
 *
 * Contrato do pacote de continuação (DEC-0024-G27): tipos do manifest,
 * validação estrutural, renderers de manifest/body/briefing/commands e o
 * comando `gh pr create` derivado — tudo sem I/O. Leitura de fs, git shell,
 * gateway gh e orquestração dos comandos permanecem em
 * `src/cli/prContinuation.ts`.
 */
import path from "node:path";
import YAML from "yaml";

export interface SourcePrRef {
  readonly spec: string;
  readonly pr: number;
  readonly body: string;
}

export interface ContinuationManifest {
  readonly schema_version: 1;
  readonly kind: "pr-continuation-package";
  readonly prepared_at: string;
  readonly source: SourcePrRef;
  readonly continuation: {
    readonly slug: string;
    readonly title: string;
    readonly target: string;
    readonly base: string;
    readonly head: string;
    readonly body_file: string;
  };
  readonly guardrails: {
    readonly creates_pr_without_confirm: false;
    readonly marks_ready: false;
    readonly records_human_gate: false;
    readonly merges: false;
    readonly advances_topology: false;
  };
}

export function formatPath(repoRoot: string, file: string): string {
  const relative = path.relative(repoRoot, file);
  return relative.startsWith("..") ? file : relative.replace(/\\/g, "/");
}

export function normalizeSlug(slug: string): string {
  const normalized = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!normalized) throw new Error("Informe --slug com ao menos uma letra ou numero.");
  return normalized;
}

export function assertIsoDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Data invalida: ${value}. Use YYYY-MM-DD.`);
  }
  return value;
}

export function defaultHeadBranch(specId: string, slug: string): string {
  return `feat/spec-${specId}-${slug}`;
}

export function validateManifest(value: unknown, manifestPath: string): ContinuationManifest {
  const manifest = value as Partial<ContinuationManifest>;
  if (manifest.schema_version !== 1) {
    throw new Error(`${manifestPath}: schema_version deve ser 1.`);
  }
  if (manifest.kind !== "pr-continuation-package") {
    throw new Error(`${manifestPath}: kind invalido.`);
  }
  if (!manifest.source?.spec || !manifest.source.pr || !manifest.source.body) {
    throw new Error(`${manifestPath}: source incompleto.`);
  }
  if (
    !manifest.continuation?.slug ||
    !manifest.continuation.title ||
    !manifest.continuation.target ||
    !manifest.continuation.base ||
    !manifest.continuation.head ||
    !manifest.continuation.body_file
  ) {
    throw new Error(`${manifestPath}: continuation incompleta.`);
  }
  if (
    manifest.guardrails?.creates_pr_without_confirm !== false ||
    manifest.guardrails.marks_ready !== false ||
    manifest.guardrails.records_human_gate !== false ||
    manifest.guardrails.merges !== false ||
    manifest.guardrails.advances_topology !== false
  ) {
    throw new Error(`${manifestPath}: guardrails devem permanecer false.`);
  }
  return manifest as ContinuationManifest;
}

export function renderManifest(manifest: ContinuationManifest): string {
  return YAML.stringify(manifest);
}

export function renderBody(manifest: ContinuationManifest): string {
  return `# ${manifest.continuation.title}

> Draft gerado por \`continuation:prepare\`. Revise antes de publicar.

## Origem

- Spec: ${manifest.source.spec}
- PR de origem: #${manifest.source.pr}
- Body versionado de origem: \`${manifest.source.body}\`

## Intencao

Continua o trabalho governado a partir de \`${manifest.continuation.target}\`.

## Cross-ref

Continuacao governada de #${manifest.source.pr}.

## Guardrails

- Nao declara Ready.
- Nao executa Human Gate.
- Nao faz merge.
- Nao avanca topologia.
- Criacao de PR remoto exige confirmacao humana explicita.

## Test plan inicial

- \`npm run validate:changed\`
- Checks especificos do checkpoint antes de Ready.
`;
}

export function renderBriefing(manifest: ContinuationManifest): string {
  return `# Briefing de continuacao — ${manifest.continuation.title}

## Fatos

- Origem: PR #${manifest.source.pr}
- Target sugerido: \`${manifest.continuation.target}\`
- Base sugerida: \`${manifest.continuation.base}\`
- Head sugerida: \`${manifest.continuation.head}\`
- Preparado em: ${manifest.prepared_at}

## Escopo

Este pacote prepara uma continuacao governada. Ele nao cria PR remoto por si so,
nao muda estado de Ready, nao registra Human Gate, nao faz merge e nao altera a
topologia.

## Proximo passo humano

1. Revisar \`body.md\` e este briefing.
2. Rodar \`continuation:create-pr -- --package <dir>\` para ver o comando.
3. Reexecutar com \`--confirm\` somente quando a criacao do Draft PR estiver autorizada.
`;
}

export function shellQuote(value: string): string {
  if (/^[a-zA-Z0-9_./:@-]+$/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

export function createPrCommand(
  manifest: ContinuationManifest,
  packageDir: string,
  repo?: string
): string {
  const bodyFile = path.join(packageDir, manifest.continuation.body_file);
  const args = [
    "gh",
    "pr",
    "create",
    "--draft",
    "--title",
    manifest.continuation.title,
    "--body-file",
    bodyFile,
    "--base",
    manifest.continuation.base,
    "--head",
    manifest.continuation.head,
  ];
  if (repo) args.push("--repo", repo);
  return args.map(shellQuote).join(" ");
}

export function renderCommands(
  manifest: ContinuationManifest,
  packageDir: string,
  repoRoot: string
): string {
  return `# Comandos sugeridos

## Ver comando sem criar PR

\`\`\`bash
npm run continuation:create-pr -- --package ${shellQuote(formatPath(repoRoot, packageDir))}
\`\`\`

## Criar Draft PR com autorizacao humana explicita

\`\`\`bash
npm run continuation:create-pr -- --package ${shellQuote(
    formatPath(repoRoot, packageDir)
  )} --confirm
\`\`\`

## Comando gh equivalente

\`\`\`bash
${createPrCommand(manifest, packageDir)}
\`\`\`
`;
}
