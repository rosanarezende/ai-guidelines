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
  handoffCheckCommand: string | null = null,
  reviewBriefCommand = "npx ai-guidelines review <type>",
  workBriefCommand = "npx ai-guidelines work",
  decideCommand = "npx ai-guidelines decide"
): string {
  return [
    "## Runtime Bootstrap",
    "",
    "This file is the AI-channel bootstrap, not the governance kernel.",
    "",
    "- Repository state beats transcript, memory, and agent output.",
    `- For a fresh AI session, run \`${handoffCommand}\` — it reconciles the sources, records the loaded seal locally, and emits the reading order to follow.`,
    ...(handoffCheckCommand
      ? [`- To confirm the resumption is still fresh, run \`${handoffCheckCommand}\`.`]
      : []),
    `- For implementation/correction requested by the human ("fix the current findings", "implement the current task"), load the governed work briefing with \`${workBriefCommand}\` — it infers the work mode and projects scope, authority, validations, stop criteria and the final-report contract from \`work-policy.yml\` + the situated snapshot. The explicit request may authorize commit/push ONLY within the inferred object/checkpoint/branch via \`--authorization explicit-work-request\`; it never extends to another finding/checkpoint, the next sub-checkpoint, a review, a disposition, Ready, the gate, merge, force-push or \`--no-verify\`. The briefing projects the contract; it does not execute work.`,
    `- When the human explicitly asks for a governed review (Technical Audit, Architectural Review, or any repository-declared type — see \`review types\`) or a revalidation, run \`${reviewBriefCommand}\` with \`--authorization explicit-review-request\` BEFORE reviewing — the explicit request itself authorizes the full LIMITED cycle of that governed artifact (create, seal, validate, exclusive commit, normal push via review:publish); anything beyond the review artifact requires new human authorization. Review types are a catalog, not an obligation: only \`required\` types block Ready/gate; a stale optional review never forces a revalidation by itself.`,
    `- For decisions reserved to the human (closing revalidated findings, the Human Gate), run \`${decideCommand}\` — it prepares a human briefing (what/why/what-was-wrong/what-was-done/how-verified/residual-risks/consequences/not-authorized) BEFORE asking for any choice, shows the exact change preview, and requires explicit confirmation before recording the governed effect. Authority is not assumable by flag; nothing is written without confirmation, and recording a Human Gate does not execute any transition, merge or PR.`,
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
    readonly reviewBriefCommand?: string;
    readonly workBriefCommand?: string;
    readonly decideCommand?: string;
  } = {}
): string {
  return mergeAgentsContent(
    existingContent,
    buildAgentsRuntimeStub(
      options.sddDir,
      options.handoffCommand,
      options.handoffCheckCommand,
      options.reviewBriefCommand,
      options.workBriefCommand,
      options.decideCommand
    )
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
