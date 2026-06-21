#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PR_BODY_PROFILES, PrProfileName } from "../domain/workflow/PrProfileContract.js";

interface Logger {
  info(message: string): void;
  error(message: string): void;
}

const stdoutLogger: Logger = {
  info: (message) => process.stdout.write(`${message}\n`),
  error: (message) => process.stderr.write(`${message}\n`),
};

export interface PrBodyCreateInput {
  readonly profile: PrProfileName;
  readonly specId?: string;
  readonly currentNodeId?: string;
  readonly nextNodeId?: string;
  readonly nextCheckpoint?: string;
  readonly baseBranch?: string;
  readonly headBranch?: string;
  readonly repoRoot?: string;
}

function valueOrPlaceholder(value: string | undefined, placeholder: string): string {
  return value && value.trim() !== "" ? value : `<${placeholder}>`;
}

function readProfileTemplate(profile: PrProfileName, repoRoot = process.cwd()): string {
  const contract = PR_BODY_PROFILES[profile];
  if (!contract) throw new Error(`Perfil de PR desconhecido: ${profile}`);

  const templatePath = path.resolve(repoRoot, contract.templatePath);
  if (!existsSync(templatePath)) {
    throw new Error(`Template do perfil ${profile} não encontrado: ${contract.templatePath}`);
  }
  return readFileSync(templatePath, "utf8");
}

function sectionRange(body: string, heading: string): { start: number; end: number } {
  const headingMatch = new RegExp(`^${escapeRegExp(heading)}\\s*$`, "m").exec(body);
  if (!headingMatch || headingMatch.index === undefined) {
    throw new Error(`Template não contém seção esperada: ${heading}`);
  }
  const contentStart = headingMatch.index + headingMatch[0].length;
  const nextHeading = /^##\s+/m.exec(body.slice(contentStart));
  return {
    start: contentStart,
    end: nextHeading ? contentStart + nextHeading.index : body.length,
  };
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceSection(body: string, heading: string, content: string): string {
  const range = sectionRange(body, heading);
  const replacement = `\n\n${content.trimEnd()}\n\n`;
  return `${body.slice(0, range.start)}${replacement}${body.slice(range.end).replace(/^\n+/, "")}`;
}

function hasNextNodeContext(input: PrBodyCreateInput): boolean {
  return Boolean(
    input.specId ||
    input.currentNodeId ||
    input.nextNodeId ||
    input.nextCheckpoint ||
    input.baseBranch ||
    input.headBranch
  );
}

function hydrateExecutionTemplate(template: string, input: PrBodyCreateInput): string {
  if (!hasNextNodeContext(input)) return template;

  const specId = valueOrPlaceholder(input.specId, "spec");
  const currentNodeId = valueOrPlaceholder(input.currentNodeId, "nó anterior");
  const nextNodeId = valueOrPlaceholder(input.nextNodeId, "nó deste PR");
  const nextCheckpoint = valueOrPlaceholder(input.nextCheckpoint, "checkpoint");
  const baseBranch = valueOrPlaceholder(input.baseBranch, "branch base");
  const headBranch = valueOrPlaceholder(input.headBranch, "branch head");

  let body = template;
  body = replaceSection(
    body,
    "## Visão pretendida",
    [
      "```text",
      `Abrir ${nextNodeId} como próximo PR stacked da Spec ${specId}, a partir do nó aprovado ${currentNodeId}, sem merge isolado em main.`,
      "```",
    ].join("\n")
  );
  body = replaceSection(
    body,
    "## Resumo",
    [
      `Este PR abre o próximo nó governado da Spec ${specId}: \`${nextNodeId}\`.`,
      "",
      `Ele nasce depois do Human Gate aprovado de \`${currentNodeId}\` e mantém o trabalho limitado ao checkpoint \`${nextCheckpoint}\`.`,
    ].join("\n")
  );
  body = replaceSection(
    body,
    "## Escopo",
    [
      "<details>",
      "<summary><strong>Detalhes de escopo e limites</strong></summary>",
      "",
      "### Dentro do escopo",
      "",
      `- Materializar o checkpoint \`${nextCheckpoint}\`.`,
      `- Trabalhar somente o nó \`${nextNodeId}\`.`,
      `- Manter a stack em modo unit, com base em \`${baseBranch}\` e head \`${headBranch}\`.`,
      "",
      "### Fora do escopo",
      "",
      "- Merge em `main`.",
      "- Human Gate automático.",
      `- Implementação fora do checkpoint \`${nextCheckpoint}\`.`,
      "",
      "</details>",
    ].join("\n")
  );
  body = replaceSection(
    body,
    "## Cross-refs",
    [
      `- **Spec**: ${specId}`,
      "- **ADRs aplicáveis**:",
      "- **DECs aplicáveis**:",
      `- **Nó anterior**: ${currentNodeId}`,
      `- **Nó ativo**: ${nextNodeId}`,
    ].join("\n")
  );
  return body;
}

export function buildPrBody(input: PrBodyCreateInput): string {
  const profile = PR_BODY_PROFILES[input.profile];
  if (!profile) {
    throw new Error(`Perfil de PR desconhecido: ${input.profile}`);
  }

  const template = readProfileTemplate(input.profile, input.repoRoot);
  const body = input.profile === "execution" ? hydrateExecutionTemplate(template, input) : template;

  const missing = [...profile.draftSections, ...profile.readySections].filter(
    (section) => !body.includes(section)
  );
  if (missing.length > 0) {
    throw new Error(
      `Body ${input.profile} não contém seção(ões) contratadas: ${missing.join(", ")}`
    );
  }
  return body.trimEnd() + "\n";
}

export function buildNextNodePrBody(input: {
  readonly specId: string;
  readonly currentNodeId: string;
  readonly nextNodeId: string;
  readonly nextCheckpoint: string;
  readonly baseBranch: string;
  readonly headBranch: string;
  readonly repoRoot?: string;
}): string {
  return buildPrBody({ profile: "execution", ...input });
}

export interface MainOptions {
  readonly logger?: Logger;
}

function parseProfile(value: string | undefined): PrProfileName {
  const profile = value ?? "execution";
  if (profile in PR_BODY_PROFILES) return profile as PrProfileName;
  throw new Error(`Perfil inválido: ${profile}. Use: ${Object.keys(PR_BODY_PROFILES).join(", ")}.`);
}

export function main(argv: ReadonlyArray<string> = [], options: MainOptions = {}): number {
  const logger = options.logger ?? stdoutLogger;
  let profile: PrProfileName = "execution";
  let output: string | undefined;
  let specId: string | undefined;
  let currentNodeId: string | undefined;
  let nextNodeId: string | undefined;
  let nextCheckpoint: string | undefined;
  let baseBranch: string | undefined;
  let headBranch: string | undefined;

  try {
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === "--profile") profile = parseProfile(argv[++i]);
      else if (arg === "--output") output = argv[++i];
      else if (arg === "--spec") specId = argv[++i];
      else if (arg === "--current-node") currentNodeId = argv[++i];
      else if (arg === "--next-node") nextNodeId = argv[++i];
      else if (arg === "--checkpoint") nextCheckpoint = argv[++i];
      else if (arg === "--base") baseBranch = argv[++i];
      else if (arg === "--head") headBranch = argv[++i];
      else {
        logger.error(`Argumento desconhecido: ${arg}`);
        return 2;
      }
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return 2;
  }

  const body = buildPrBody({
    profile,
    specId,
    currentNodeId,
    nextNodeId,
    nextCheckpoint,
    baseBranch,
    headBranch,
  });

  if (output && output !== "-") {
    const abs = path.resolve(process.cwd(), output);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, body, "utf8");
    logger.info(`pr-body:create — body ${profile} escrito em ${output}`);
    return 0;
  }

  process.stdout.write(body);
  return 0;
}
