#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  PR_BODY_PROFILES,
  PrBodyProfile,
  PrProfileName,
} from "../domain/workflow/PrProfileContract.js";

interface Logger {
  info(message: string): void;
  error(message: string): void;
}

const stdoutLogger: Logger = {
  info: (message) => process.stdout.write(`${message}\n`),
  error: (message) => process.stderr.write(`${message}\n`),
};

const TOKEN_PATTERN = /\{\{([A-Z0-9_]+)\}\}/g;

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

export function extractPrBodyTemplateTokens(template: string): string[] {
  return Array.from(new Set([...template.matchAll(TOKEN_PATTERN)].map((match) => match[1]))).sort();
}

function renderTemplateTokens(
  template: string,
  values: Readonly<Record<string, string>>,
  profile: PrBodyProfile
): string {
  assertTemplateTokenContract(profile, template);

  return template.replace(TOKEN_PATTERN, (_token, name: string) => {
    const value = values[name];
    if (value === undefined) {
      throw new Error(`Template ${profile.name} exige token sem valor: ${name}`);
    }
    return value;
  });
}

function assertTemplateTokenContract(profile: PrBodyProfile, template: string): void {
  const declared = profile.templateTokens.map((token) => token.name).sort();
  const actual = extractPrBodyTemplateTokens(template);

  if (JSON.stringify(actual) !== JSON.stringify(declared)) {
    throw new Error(
      [
        `Template ${profile.name} diverge dos tokens contratados.`,
        `declarados: ${declared.join(", ") || "(nenhum)"}`,
        `no template: ${actual.join(", ") || "(nenhum)"}`,
      ].join(" ")
    );
  }
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

const INTENDED_VISION_PROMPT_PATH = ".governance/visual-prompts/pr-intended-vision.prompt.md";

function buildExecutionVisionBrief(input: {
  readonly specId: string;
  readonly currentNodeId: string;
  readonly nextNodeId: string;
  readonly nextCheckpoint: string;
  readonly baseBranch: string;
  readonly headBranch: string;
}): string {
  return [
    `Use o prompt versionado ${INTENDED_VISION_PROMPT_PATH} para gerar a visão pretendida deste PR.`,
    "",
    "Substituições para o prompt versionado:",
    `{{context}} = PR governado ${input.nextNodeId} da Spec ${input.specId}`,
    "",
    "{{localContext}} =",
    `  spec: ${input.specId}`,
    `  currentNodeId: ${input.currentNodeId}`,
    `  nextNodeId: ${input.nextNodeId}`,
    `  nextCheckpoint: ${input.nextCheckpoint}`,
    `  baseBranch: ${input.baseBranch}`,
    `  headBranch: ${input.headBranch}`,
    "  sourceOfTruth:",
    "    - state.yml",
    "    - tasks.md",
    "    - decision-brief.md",
    "    - ADRs e DECs aplicáveis",
    "  evidence:",
    "    - research/dogfood/reviews/testes relevantes",
    "  projections:",
    "    - mapas, site, imagens e prompts visuais",
    "  humanDecisions:",
    "    - Ready",
    "    - Human Gate",
    "    - merge",
    "    - mudança estrutural de escopo",
    "  hardLimits:",
    "    - Não executar Human Gate automaticamente.",
    "    - Não avançar para outro checkpoint sem decisão humana.",
    "    - Não usar imagem ou mapa como fonte da verdade.",
    "",
    "Não substitua este briefing por um prompt visual ad hoc. Se a visão mudar por decisão humana, adicione um prompt complementar preservando este baseline.",
  ].join("\n");
}

function executionTemplateValues(input: PrBodyCreateInput): Readonly<Record<string, string>> {
  const specId = valueOrPlaceholder(input.specId, "spec");
  const currentNodeId = valueOrPlaceholder(input.currentNodeId, "nó anterior");
  const nextNodeId = valueOrPlaceholder(input.nextNodeId, "nó deste PR");
  const nextCheckpoint = valueOrPlaceholder(input.nextCheckpoint, "checkpoint");
  const baseBranch = valueOrPlaceholder(input.baseBranch, "branch base");
  const headBranch = valueOrPlaceholder(input.headBranch, "branch head");

  const defaultValues = {
    AI_GUIDELINES_EXECUTION_VISION_TEXT:
      "<descreva a visão pretendida em linguagem humana, antes da implementação>",
    AI_GUIDELINES_EXECUTION_SUMMARY:
      "<resuma em 2-4 frases o que este PR tenta mudar, por que importa e qual fluxo humano/agente melhora>",
    AI_GUIDELINES_EXECUTION_SCOPE_IN: "- <item concreto dentro do escopo>",
    AI_GUIDELINES_EXECUTION_SCOPE_OUT: "- <item explicitamente fora do escopo>",
    AI_GUIDELINES_CROSSREF_SPEC: "<spec>",
    AI_GUIDELINES_CROSSREF_ADRS: "<ADRs aplicáveis>",
    AI_GUIDELINES_CROSSREF_DECS: "<DECs aplicáveis>",
    AI_GUIDELINES_CROSSREF_RELATED: "<issues/PRs relacionados>",
  };

  if (!hasNextNodeContext(input)) return defaultValues;

  const visionPrompt = buildExecutionVisionBrief({
    specId,
    currentNodeId,
    nextNodeId,
    nextCheckpoint,
    baseBranch,
    headBranch,
  });

  return {
    ...defaultValues,
    AI_GUIDELINES_EXECUTION_VISION_TEXT: visionPrompt,
    AI_GUIDELINES_EXECUTION_SUMMARY: [
      `Este PR abre o próximo PR governado da Spec ${specId}: \`${nextNodeId}\`.`,
      "",
      `Ele nasce depois do Human Gate aprovado de \`${currentNodeId}\` e mantém o trabalho limitado a \`${nextCheckpoint}\`.`,
    ].join("\n"),
    AI_GUIDELINES_EXECUTION_SCOPE_IN: [
      `- Materializar o checkpoint \`${nextCheckpoint}\`.`,
      `- Trabalhar somente o nó \`${nextNodeId}\`.`,
      `- Manter a stack em modo unit, com base em \`${baseBranch}\` e head \`${headBranch}\`.`,
    ].join("\n"),
    AI_GUIDELINES_EXECUTION_SCOPE_OUT: [
      "- Merge em `main`.",
      "- Human Gate automático.",
      `- Implementação fora do checkpoint \`${nextCheckpoint}\`.`,
    ].join("\n"),
    AI_GUIDELINES_CROSSREF_SPEC: specId,
    AI_GUIDELINES_CROSSREF_RELATED: [
      `Nó anterior: \`${currentNodeId}\``,
      `nó ativo: \`${nextNodeId}\``,
    ].join("; "),
  };
}

function tokenValuesForProfile(
  profile: PrProfileName,
  input: PrBodyCreateInput
): Readonly<Record<string, string>> {
  if (profile === "execution") return executionTemplateValues(input);
  return {};
}

export function buildPrBody(input: PrBodyCreateInput): string {
  const profile = PR_BODY_PROFILES[input.profile];
  if (!profile) {
    throw new Error(`Perfil de PR desconhecido: ${input.profile}`);
  }

  const template = readProfileTemplate(input.profile, input.repoRoot);
  const body = renderTemplateTokens(template, tokenValuesForProfile(input.profile, input), profile);

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
