import { Command, CommandContext, CommandResult } from "../Command.js";
import { parseFlags, stringFlag } from "../parseFlags.js";
import { WorkflowFileSystem } from "../../../app/ports/WorkflowFileSystem.js";
import { ClipboardWriter } from "../../../app/ports/ClipboardWriter.js";
import { NodeWorkflowFileSystem } from "../../../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { NodeClipboard, clipboardInstallHint } from "../../../infrastructure/io/NodeClipboard.js";
import { parseContextTarget } from "../../visual-prompts/parseContextTarget.js";
import { collectLocalContext } from "../../visual-prompts/collectLocalContext.js";
import { renderVisualPrompt } from "../../visual-prompts/renderVisualPrompt.js";
import {
  VISUAL_PROMPT_OPTIONS,
  VisualPromptOption,
  VisualPromptValue,
} from "../../visual-prompts/visualPromptCatalog.js";

/**
 * Options do `visual-prompt`: o tipo escolhido + o contexto livre (vazio quando o
 * tipo não exige). É TUDO que `parse`/`prompt` produzem — `run` deriva o resto
 * (template, instruções, local context) a partir disto. Sem estado intermediário.
 */
export interface VisualPromptOptions {
  readonly type: VisualPromptValue;
  readonly context: string;
}

/** Dependências injetáveis (defaults reais); fakes nos testes evitam fs/git. */
export interface VisualPromptDeps {
  readonly makeFs: (repoRoot: string) => WorkflowFileSystem;
  readonly clipboard: ClipboardWriter;
  readonly collect: typeof collectLocalContext;
  readonly render: typeof renderVisualPrompt;
}

const DEFAULT_DEPS: VisualPromptDeps = {
  makeFs: (repoRoot) => new NodeWorkflowFileSystem(repoRoot),
  clipboard: new NodeClipboard(),
  collect: collectLocalContext,
  render: renderVisualPrompt,
};

function lookup(type: string): VisualPromptOption | undefined {
  return VISUAL_PROMPT_OPTIONS.find((o) => o.value === type);
}

function validTypesList(): string {
  return VISUAL_PROMPT_OPTIONS.map((o) => o.value).join(", ");
}

/**
 * Comando `visual-prompt` — gera o prompt para um gerador de imagem externo
 * (etapa 3 do #35: convergência da op avançada "visual-prompt" para Command).
 *
 * INTERATIVO no contrato `prompt()→run()`: `parse` (CLI) e `prompt` (wizard)
 * produzem o MESMO `VisualPromptOptions` (`{type, context}`); `run` é a execução
 * compartilhada (coleta local + render + clipboard + instruções). É o caso
 * "limpo" do desenho — `prompt` é só um produtor; nenhuma lógica vive no wizard;
 * nenhum estado intermediário entre `prompt` e `run`.
 */
export class VisualPromptCommand implements Command<VisualPromptOptions> {
  readonly name = "visual-prompt";

  constructor(readonly deps: VisualPromptDeps = DEFAULT_DEPS) {}

  /** Produtor CLI: `--type=<v>` (obrigatório) + `--context=<...>` (sse o tipo exige). */
  parse(argv: readonly string[]): VisualPromptOptions {
    const { flags } = parseFlags(argv);
    const type = stringFlag(flags, "type");
    if (type === undefined) {
      throw new Error(`Informe --type=<tipo>. Tipos disponíveis: ${validTypesList()}.`);
    }
    const template = lookup(type);
    if (!template) {
      throw new Error(
        `Tipo de prompt visual desconhecido: "${type}". Disponíveis: ${validTypesList()}.`
      );
    }
    if (!template.needsContext) return { type: template.value, context: "" };

    const context = stringFlag(flags, "context");
    if (context === undefined || context.trim() === "") {
      throw new Error(
        `O tipo "${type}" exige um contexto: --context=<alvo> (ex.: "PR #25", "spec 0024").`
      );
    }
    if (parseContextTarget(context).kind === "unknown") {
      throw new Error(
        `Contexto não reconhecido: "${context}". Exemplos válidos: "PR #25", "pr 25", "spec 0024", "0024".`
      );
    }
    return { type: template.value, context };
  }

  /** Produtor humano: seleção do tipo + (se exigir) input+validação do contexto. */
  async prompt(context: CommandContext): Promise<VisualPromptOptions> {
    const prompts = context.prompts;
    if (!prompts) {
      throw new Error(
        "visual-prompt.prompt() requer context.prompts (a superfície humana injeta)."
      );
    }
    const type = await prompts.select<VisualPromptValue>({
      message:
        "Que tipo de prompt visual? (todos seguem fluxo em 2 etapas — você cola o prompt numa IA conversacional com acesso ao repo, ela devolve um prompt de imagem pronto)",
      choices: VISUAL_PROMPT_OPTIONS.map((o) => ({ name: o.label, value: o.value })),
    });
    const template = lookup(type);
    if (!template) {
      throw new Error(`Tipo de prompt visual desconhecido: "${type}".`);
    }
    if (!template.needsContext) return { type: template.value, context: "" };

    const ctx = (await prompts.input({ message: "Contexto (ex.: PR #25, spec 0024)" })).trim();
    if (ctx === "") {
      throw new Error("Contexto vazio — necessário para este tipo de prompt visual.");
    }
    if (parseContextTarget(ctx).kind === "unknown") {
      throw new Error(
        `Contexto não reconhecido: "${ctx}". Exemplos válidos: "PR #25", "pr 25", "spec 0024", "0024".`
      );
    }
    return { type: template.value, context: ctx };
  }

  /** Execução compartilhada: render + clipboard + instruções (sem prompts). */
  async run(options: VisualPromptOptions, context: CommandContext): Promise<CommandResult> {
    const { logger } = context;
    const template = lookup(options.type);
    if (!template) {
      logger.error(`Tipo de prompt visual desconhecido: "${options.type}".`);
      return { exitCode: 1 };
    }

    const fs = this.deps.makeFs(context.repoRoot);

    let localContext = "";
    if (options.context) {
      const target = parseContextTarget(options.context);
      localContext = this.deps.collect(target, { repoRoot: context.repoRoot, fs });
    }

    const rendered = this.deps.render(fs, template.slug, {
      context: options.context,
      localContext,
    });
    if (rendered === null) {
      logger.error(`Template "${template.slug}" não encontrado em .governance/visual-prompts/.`);
      return { exitCode: 1 };
    }

    const copied = await this.deps.clipboard.copy(rendered);

    logger.info("");
    if (template.instructions.length > 0) {
      logger.info(`COMO USAR (destino: ${template.targetLabel}):`);
      for (const line of template.instructions) logger.info(`  ${line}`);
      logger.info("");
    }

    if (copied) {
      logger.info(`✓ Prompt copiado para o clipboard (${rendered.length} caracteres).`);
      logger.info("");
    } else {
      logger.info(
        "(clipboard indisponível — copie manualmente o texto abaixo entre os delimitadores)"
      );
      const hint = clipboardInstallHint();
      if (hint) logger.info(hint);
      logger.info(`──── PROMPT (destino: ${template.targetLabel}) ────`);
      logger.info(rendered.trimEnd());
      logger.info("──── FIM ────");
      logger.info("");
    }
    return { exitCode: 0 };
  }
}
