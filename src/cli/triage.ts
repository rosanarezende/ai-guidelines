/**
 * CLI standalone para `yarn guidelines triage [<pr>]` (tier-1 inspeção;
 * alias transitório: `review`).
 *
 * Reúne e estrutura os review comments de um PR para **triagem** — o passo
 * determinístico que antes era feito na mão via `gh api`. Read-only.
 *
 * **Boundary ADR 0018 (sem LLM no runtime):** o comando NÃO analisa, NÃO
 * classifica e NÃO responde. Ele busca + estrutura + produz um contexto
 * copiável; a análise, aplicação de correções e redação das respostas são
 * trabalho do **agente (canal)**, não do runtime. Cravado em `[DEC-0023-N01]`.
 *
 * Flow:
 *   1. resolve o PR (arg explícito, ou detecta pelo PR aberto da branch atual)
 *   2. `TriageReview.run(pr)` agrupa comentários (sem resposta × respondidos)
 *   3. renderiza a lista + um bloco copiável para colar na IA externa
 */

import { StackOps } from "../app/ports/StackOps.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";
import { TriageReview, TriageReviewResult } from "../app/workflow/TriageReview.js";
import { NodeWorkflowFileSystem } from "../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { GhCli } from "../infrastructure/git/GhCli.js";
import { Logger } from "./workflow.js";

export interface TriageCliArgs {
  /** Número do PR a triar. Se ausente, detecta pelo PR aberto da branch atual. */
  readonly pr?: number;
}

export interface TriageRunOptions {
  readonly repoRoot: string;
  readonly logger?: Logger;
  readonly fs?: WorkflowFileSystem;
  /** Injetável para tests. Default: `GhCli` real. */
  readonly stack?: StackOps;
}

const stdoutLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

function firstLine(body: string): string {
  const line = body.split("\n")[0]?.trim() ?? "";
  return line.length > 140 ? `${line.slice(0, 137)}…` : line;
}

/**
 * Render determinístico da triagem: diagnóstico para o terminal + bloco
 * copiável para a IA externa. Pure — testável sem `gh`.
 */
export function renderTriage(result: TriageReviewResult): {
  lines: ReadonlyArray<string>;
  clipboardContext: string;
} {
  const loc = (t: TriageReviewResult["untriaged"][number]) =>
    t.root.line !== null ? `${t.root.path}:${t.root.line}` : t.root.path;

  const ctxLines = [
    `Review triage — PR #${result.prNumber}`,
    "",
    "Comentários sem resposta (a triar):",
  ];
  if (result.untriaged.length === 0) {
    ctxLines.push("  (nenhum)");
  }
  for (const t of result.untriaged) {
    ctxLines.push(`- #${t.root.id} [${t.root.author}] ${loc(t)}`);
    for (const bl of t.root.body.split("\n")) ctxLines.push(`  ${bl}`);
  }
  const clipboardContext = ctxLines.join("\n");

  const lines: string[] = [
    "",
    `Review triage — PR #${result.prNumber}: ${result.total} comentário(s), ${result.untriaged.length} sem resposta.`,
    "",
  ];
  if (result.untriaged.length === 0) {
    lines.push("✓ Nenhum comentário de review sem resposta.");
  } else {
    lines.push("Sem resposta (a triar):");
    for (const t of result.untriaged) {
      lines.push(`  #${t.root.id} [${t.root.author}] ${loc(t)}`);
      lines.push(`    ${firstLine(t.root.body)}`);
      if (t.root.url) lines.push(`    ${t.root.url}`);
    }
  }
  if (result.replied.length > 0) {
    lines.push("");
    lines.push(
      `Respondidos (${result.replied.length}): ${result.replied.map((t) => `#${t.root.id}`).join(", ")}`
    );
  }
  lines.push("");
  lines.push("Próximos passos (agente — NÃO o runtime, per ADR 0018):");
  lines.push(
    "  - analisar cada item; classificar fix / won't-fix (com rationale) / precisa-direção;"
  );
  lines.push(
    "  - pedir direção ao humano nos ambíguos; aplicar correções; responder cada comentário via `gh`."
  );
  lines.push("");
  lines.push("──── Contexto pronto para colar na sua IA externa ────");
  lines.push(clipboardContext);
  lines.push("──── FIM ────");
  lines.push("");

  return { lines, clipboardContext };
}

export async function runTriage(
  options: TriageRunOptions,
  args: TriageCliArgs = {}
): Promise<number> {
  const logger = options.logger ?? stdoutLogger;
  const fs = options.fs ?? new NodeWorkflowFileSystem(options.repoRoot);
  const stack = options.stack ?? new GhCli(options.repoRoot);

  let prNumber = args.pr;
  if (prNumber === undefined) {
    const branch = fs.currentBranch();
    if (!branch) {
      logger.error(
        "Não foi possível detectar a branch atual (HEAD detached?). Passe o número: `review <pr>`."
      );
      return 1;
    }
    let match;
    try {
      match = stack.listOpenPullRequests().find((p) => p.headRefName === branch);
    } catch (err) {
      logger.error(`Falha ao listar PRs: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
    if (!match) {
      logger.error(
        `Nenhum PR aberto com head = "${branch}". Passe o número explicitamente: \`review <pr>\`.`
      );
      return 1;
    }
    prNumber = match.number;
  }

  let result: TriageReviewResult;
  try {
    result = new TriageReview(stack).run(prNumber);
  } catch (err) {
    logger.error(
      `Falha ao buscar review comments do PR #${prNumber}: ${err instanceof Error ? err.message : String(err)}`
    );
    return 1;
  }

  for (const line of renderTriage(result).lines) logger.info(line);
  return 0;
}

export async function main(
  opts: TriageRunOptions & { triageArgs?: TriageCliArgs }
): Promise<number> {
  return runTriage(opts, opts.triageArgs ?? {});
}
