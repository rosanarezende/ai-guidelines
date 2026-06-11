import { stripLegacyCoreBlock } from "./LegacyAgentsCoreBlock.js";

const AI_GUIDELINES_OPEN = "<AI_GUIDELINES>";
const AI_GUIDELINES_CLOSE = "</AI_GUIDELINES>";

/**
 * O comando de handoff difere por audiência: consumidores invocam o bin
 * publicado (`npx ai-guidelines …`, default); o repositório do framework usa o
 * script local (`npm run guidelines -- …`), passado por runtimeBootstrap.
 * `handoffCheckCommand` só existe como script npm do framework (não há bin
 * publicado ainda) — consumidores não recebem o bullet (null, default).
 */
export function buildAgentsRuntimeStub(
  sddDir = ".ai-guidelines",
  handoffCommand = "npx ai-guidelines handoff [spec]",
  handoffCheckCommand: string | null = null
): string {
  return [
    "## Runtime Bootstrap",
    "",
    "This file is the AI-channel bootstrap, not the governance kernel.",
    "",
    "- Repository state beats transcript, memory, and agent output.",
    `- For a fresh AI session, run \`${handoffCommand}\` and follow the emitted reading order.`,
    ...(handoffCheckCommand
      ? [
          `- To verify the derived resumption (source freshness + seal + next action), run \`${handoffCheckCommand}\`.`,
        ]
      : []),
    "- The script contract at `.core/governance/script-contracts.yml` is the operational SSOT for scripts, hooks, workflows, and docs.",
    "- Full rules remain governed in `.core/rules/**`, `.core/rules/catalog.md`, `.core/rules/_meta/rules.json`, and the rule ledger.",
    "- Never bypass hooks with `--no-verify`; restore setup if hooks or generated script surfaces are missing.",
    "- Never push without explicit maintainer authorization.",
    "- Human Gate decides advancement; Ready is not merge authorization.",
    "- Runtime commands must not call LLMs; AI is a synthesis/review channel.",
    "",
    "### Centralized Governance",
    "",
    "The root `AGENTS.md` is the channel bootstrap. Project-specific content must remain outside of the `<AI_GUIDELINES>` block.",
    "",
    "### Consumer Bootstrap",
    "",
    `Consumer-local ai-guidelines assets live under \`${sddDir}/\`. Templates mirrored by the CLI live in \`${sddDir}/templates/\`. Specs and roadmap remain under \`.specify/specs/\`.`,
  ].join("\n");
}

export function buildRuntimeBootstrapContent(
  existingContent = "",
  options: {
    readonly sddDir?: string;
    readonly handoffCommand?: string;
    readonly handoffCheckCommand?: string | null;
  } = {}
): string {
  return mergeAgentsContent(
    existingContent,
    buildAgentsRuntimeStub(options.sddDir, options.handoffCommand, options.handoffCheckCommand)
  );
}

export function mergeAgentsContent(existingContent: string, managedContent: string): string {
  const managedBlock = wrapAiGuidelinesBlock(managedContent);
  const ensureHeading = (text: string): string => {
    if (!text || !/^#\s+AGENTS\.md/i.test(text)) {
      return `# AGENTS.md\n\n${text.trimStart()}`;
    }
    return text;
  };

  if (!existingContent) {
    return `${ensureHeading("")}${managedBlock}\n`;
  }

  const contentWithHeading = ensureHeading(existingContent);
  assertValidAiGuidelinesBlock(contentWithHeading);

  const existingBlock = findAiGuidelinesBlock(contentWithHeading);
  if (existingBlock) {
    const { start, end } = existingBlock;
    return `${contentWithHeading.slice(0, start)}${managedBlock}${contentWithHeading.slice(end)}`;
  }

  const legacyContent = stripLegacyCoreBlock(contentWithHeading).trimEnd();
  if (!legacyContent) {
    return `${managedBlock}\n`;
  }

  return `${legacyContent}\n\n${managedBlock}\n`;
}

export function assertValidAiGuidelinesBlock(content: string): void {
  const opens = findTagLines(content, AI_GUIDELINES_OPEN);
  const closes = findTagLines(content, AI_GUIDELINES_CLOSE);
  const hasOpen = opens.length > 0;
  const hasClose = closes.length > 0;

  if (hasOpen !== hasClose) {
    throw new Error("Bloco <AI_GUIDELINES> malformado em AGENTS.md.");
  }

  if (!hasOpen) {
    return;
  }

  if (opens.length > 1 || closes.length > 1) {
    throw new Error("AGENTS.md possui múltiplos blocos <AI_GUIDELINES>.");
  }

  if (opens[0].index > closes[0].index) {
    throw new Error("Bloco <AI_GUIDELINES> malformado em AGENTS.md.");
  }
}

function wrapAiGuidelinesBlock(content: string): string {
  return [AI_GUIDELINES_OPEN, content.trim(), AI_GUIDELINES_CLOSE].join("\n\n");
}

function findAiGuidelinesBlock(
  content: string
): { readonly start: number; readonly end: number } | null {
  const opens = findTagLines(content, AI_GUIDELINES_OPEN);
  const closes = findTagLines(content, AI_GUIDELINES_CLOSE);

  if (opens.length === 0 || closes.length === 0) {
    return null;
  }

  return {
    start: opens[0].index,
    end: closes[0].index + closes[0].text.length,
  };
}

function findTagLines(
  content: string,
  tag: string
): Array<{ readonly index: number; readonly text: string }> {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tagPattern = new RegExp(`^${escapedTag}[ \\t]*$`, "gm");
  const matches: Array<{ readonly index: number; readonly text: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(content)) !== null) {
    matches.push({ index: match.index, text: match[0] });
  }

  return matches;
}
