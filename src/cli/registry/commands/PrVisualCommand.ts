import { Command, CommandContext, CommandResult } from "../Command.js";
import { parseFlags, stringFlag, boolFlag } from "../parseFlags.js";
import { WorkflowFileSystem } from "../../../app/ports/WorkflowFileSystem.js";
import { StackOps } from "../../../app/ports/StackOps.js";
import { NodeWorkflowFileSystem } from "../../../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { GhCli } from "../../../infrastructure/git/GhCli.js";
import { parseContextTarget } from "../../visual-prompts/parseContextTarget.js";
import { collectLocalContext } from "../../visual-prompts/collectLocalContext.js";
import { renderVisualPrompt } from "../../visual-prompts/renderVisualPrompt.js";
import { upsertVisualPromptBlock } from "./visualPromptPrBlock.js";

/** Slug do prompt que o wizard gera para "valor entregue de um PR/spec". */
const VALUE_DELIVERED_SLUG = "value-delivered";

export interface PrVisualOptions {
  readonly pr: number;
  /** Só pré-visualiza o bloco (não grava no PR). */
  readonly dryRun: boolean;
}

/** Dependências injetáveis (defaults reais); fakes nos testes evitam gh/git/fs. */
export interface PrVisualDeps {
  readonly makeFs: (repoRoot: string) => WorkflowFileSystem;
  readonly stack: StackOps;
  readonly collect: typeof collectLocalContext;
  readonly render: typeof renderVisualPrompt;
}

function defaultDeps(repoRoot: string): PrVisualDeps {
  return {
    makeFs: (root) => new NodeWorkflowFileSystem(root),
    stack: new GhCli(repoRoot),
    collect: collectLocalContext,
    render: renderVisualPrompt,
  };
}

/**
 * Comando `pr-visual` — automatiza o passo manual do wizard no momento "PR pronto
 * para review" (Spec 0024). Gera EXATAMENTE o prompt que o wizard geraria para o
 * `value-delivered` daquele PR (mesmo `renderVisualPrompt` + `collectLocalContext`)
 * e embute/atualiza um bloco `<details>` idempotente no body do PR — o humano só
 * copia e cola num gerador de imagem.
 *
 * Comando de AUTOMAÇÃO (o agente que prepara o PR invoca): parse-only, sem
 * `prompt` (não é navegado por humano no wizard) e sem confirm (write idempotente
 * de baixo risco, como `publish-state`). `--dry-run` pré-visualiza sem gravar.
 * Nome provisório (taxonomia aberta); a ESTRUTURA é o cravado.
 */
export class PrVisualCommand implements Command<PrVisualOptions> {
  readonly name = "pr-visual";

  constructor(readonly deps?: PrVisualDeps) {}

  parse(argv: readonly string[]): PrVisualOptions {
    const { flags } = parseFlags(argv, { booleans: ["dry-run"] });
    const raw = stringFlag(flags, "pr");
    if (raw === undefined || raw === "") {
      throw new Error("Informe --pr <N> (número do PR a anotar com o prompt visual).");
    }
    const pr = Number(raw);
    if (!Number.isInteger(pr) || pr <= 0) {
      throw new Error(`PR inválido: "${raw}". Use um inteiro positivo.`);
    }
    return { pr, dryRun: boolFlag(flags, "dry-run") };
  }

  async run(options: PrVisualOptions, context: CommandContext): Promise<CommandResult> {
    const { logger } = context;
    const deps = this.deps ?? defaultDeps(context.repoRoot);

    const pr = deps.stack.getPullRequest(options.pr);
    if (!pr) {
      logger.error(`PR #${options.pr} não encontrado (ou inacessível).`);
      return { exitCode: 1 };
    }

    const fs = deps.makeFs(context.repoRoot);
    const ctxRef = `PR #${options.pr}`;
    const localContext = deps.collect(parseContextTarget(ctxRef), {
      repoRoot: context.repoRoot,
      fs,
    });

    const rendered = deps.render(fs, VALUE_DELIVERED_SLUG, { context: ctxRef, localContext });
    if (rendered === null) {
      logger.error(
        `Template "${VALUE_DELIVERED_SLUG}" não encontrado em .governance/visual-prompts/.`
      );
      return { exitCode: 1 };
    }

    const newBody = upsertVisualPromptBlock(pr.body, rendered);

    if (options.dryRun) {
      logger.info(`(dry-run) Bloco do prompt visual para o PR #${options.pr}:`);
      logger.info(rendered.trimEnd());
      return { exitCode: 0 };
    }

    if (newBody === pr.body) {
      logger.info(`PR #${options.pr}: body já atualizado (sem mudança no bloco visual).`);
      return { exitCode: 0 };
    }

    deps.stack.setPullRequestBody(options.pr, newBody);
    logger.info(`✓ Prompt visual embutido no body do PR #${options.pr} (bloco <details>).`);
    return { exitCode: 0 };
  }
}
