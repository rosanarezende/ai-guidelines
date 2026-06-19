import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { PullRequestData, StackOps } from "../../../app/ports/StackOps.js";
import { GhCli } from "../../../infrastructure/git/GhCli.js";
import { Command, CommandContext, CommandResult } from "../Command.js";
import { boolFlag, parseFlags, stringFlag } from "../parseFlags.js";

export type PeerReviewMode = "worktree" | "checkout";

export interface PeerReviewOptions {
  readonly pr: number;
  readonly mode?: PeerReviewMode;
  readonly briefOnly: boolean;
  readonly confirm: boolean;
}

export interface PeerReviewGitOps {
  currentBranch(): string | null;
  isWorkingTreeClean(): boolean;
  worktreePath(prNumber: number): string;
  pathExists(absPath: string): boolean;
  fetchPullRequest(prNumber: number, refName: string): void;
  addWorktree(absPath: string, refName: string): void;
  checkoutPullRequest(prNumber: number): void;
}

class NodePeerReviewGitOps implements PeerReviewGitOps {
  constructor(private readonly repoRoot: string) {}

  currentBranch(): string | null {
    try {
      const out = this.git(["rev-parse", "--abbrev-ref", "HEAD"]).trim();
      return out === "" || out === "HEAD" ? null : out;
    } catch {
      return null;
    }
  }

  isWorkingTreeClean(): boolean {
    try {
      return this.git(["status", "--porcelain", "--untracked-files=all"]).trim() === "";
    } catch {
      return false;
    }
  }

  worktreePath(prNumber: number): string {
    return path.join(this.repoRoot, ".temp", "peer-review", `pr-${prNumber}`);
  }

  pathExists(absPath: string): boolean {
    return existsSync(absPath);
  }

  fetchPullRequest(prNumber: number, refName: string): void {
    this.git(["fetch", "origin", `pull/${prNumber}/head:${refName}`], 120_000);
  }

  addWorktree(absPath: string, refName: string): void {
    mkdirSync(path.dirname(absPath), { recursive: true });
    this.git(["worktree", "add", absPath, refName], 120_000);
  }

  checkoutPullRequest(prNumber: number): void {
    execFileSync("gh", ["pr", "checkout", String(prNumber)], {
      cwd: this.repoRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
    });
  }

  private git(args: readonly string[], timeout = 15_000): string {
    return execFileSync("git", [...args], {
      cwd: this.repoRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout,
    });
  }
}

export class PeerReviewCommand implements Command<PeerReviewOptions> {
  readonly name = "peer-review";
  readonly description =
    "Prepara revisão de PR de outra pessoa sem misturar com sua spec atual; oferece worktree separado ou checkout guiado.";
  readonly usage = [
    "peer-review 43 --brief-only",
    "peer-review 43 --mode worktree --confirm",
    "peer-review 43 --mode checkout --confirm",
  ];

  constructor(
    private readonly stackFactory: (repoRoot: string) => StackOps = (repoRoot) =>
      new GhCli(repoRoot),
    private readonly gitFactory: (repoRoot: string) => PeerReviewGitOps = (repoRoot) =>
      new NodePeerReviewGitOps(repoRoot)
  ) {}

  parse(argv: readonly string[]): PeerReviewOptions {
    const parsed = parseFlags(argv, { booleans: ["brief-only", "confirm"] });
    const unknown = [...parsed.flags.keys()].filter(
      (flag) => !["mode", "brief-only", "confirm"].includes(flag)
    );
    if (unknown.length > 0) {
      throw new Error(`Flag desconhecida para peer-review: --${unknown[0]}.`);
    }

    const rawPr = parsed.positionals[0];
    if (!rawPr || !/^\d+$/.test(rawPr)) {
      throw new Error(
        "Uso: peer-review <pr> [--brief-only] [--mode worktree|checkout] [--confirm]."
      );
    }
    if (parsed.positionals.length > 1) {
      throw new Error("peer-review aceita apenas um número de PR.");
    }

    const mode = stringFlag(parsed.flags, "mode");
    if (mode !== undefined && mode !== "worktree" && mode !== "checkout") {
      throw new Error("--mode deve ser worktree ou checkout.");
    }

    return {
      pr: Number(rawPr),
      ...(mode !== undefined ? { mode } : {}),
      briefOnly: boolFlag(parsed.flags, "brief-only"),
      confirm: boolFlag(parsed.flags, "confirm"),
    };
  }

  async prompt(context: CommandContext): Promise<PeerReviewOptions> {
    const prompts = context.prompts;
    if (!prompts) throw new Error("peer-review interativo exige prompt provider.");
    const rawPr = await prompts.input({
      message: "Qual PR você quer revisar? Informe apenas o número.",
    });
    if (!/^\d+$/.test(rawPr.trim())) {
      throw new Error("Informe um número de PR válido.");
    }
    const mode = await prompts.select<PeerReviewMode>({
      message: "Como você quer abrir a branch do PR?",
      choices: [
        {
          name: "Worktree separado",
          value: "worktree",
          hint: "recomendado: preserva sua branch atual",
        },
        {
          name: "Checkout guiado nesta pasta",
          value: "checkout",
          hint: "só funciona com working tree limpa",
        },
      ],
    });
    const confirm = await prompts.confirm({
      message: "Confirmar preparação da revisão agora?",
      default: false,
    });
    return {
      pr: Number(rawPr.trim()),
      mode,
      briefOnly: false,
      confirm,
    };
  }

  async run(options: PeerReviewOptions, context: CommandContext): Promise<CommandResult> {
    const stack = this.stackFactory(context.repoRoot);
    const git = this.gitFactory(context.repoRoot);
    const pr = stack.getPullRequest(options.pr);
    if (!pr) {
      context.logger.error(`PR #${options.pr} não encontrado ou inacessível.`);
      return { exitCode: 1 };
    }

    const branch = git.currentBranch();
    const clean = git.isWorkingTreeClean();
    const mode = options.mode ?? "worktree";
    const worktreePath = git.worktreePath(options.pr);

    context.logger.info(renderPeerReviewBrief({ pr, branch, clean, mode, worktreePath }));

    if (options.briefOnly || options.mode === undefined) {
      context.logger.info(
        "\nNenhuma alteração foi feita. Escolha --mode e --confirm para aplicar."
      );
      return { exitCode: 0 };
    }

    if (!options.confirm) {
      context.logger.info(
        `\nPrévia concluída. Para aplicar: npx ai-guidelines peer-review ${options.pr} --mode ${mode} --confirm`
      );
      return { exitCode: 0 };
    }

    if (mode === "checkout") {
      if (!clean) {
        context.logger.error(
          "Checkout guiado bloqueado: há mudanças locais. Use worktree separado ou limpe a working tree."
        );
        return { exitCode: 1 };
      }
      git.checkoutPullRequest(options.pr);
      context.logger.info(`Checkout guiado concluído para o PR #${options.pr}.`);
      return { exitCode: 0 };
    }

    if (git.pathExists(worktreePath)) {
      context.logger.error(
        `Worktree já existe em ${worktreePath}. Remova ou renomeie antes de criar outra revisão.`
      );
      return { exitCode: 1 };
    }
    const refName = `refs/ai-guidelines/review/pr-${options.pr}`;
    git.fetchPullRequest(options.pr, refName);
    git.addWorktree(worktreePath, refName);
    context.logger.info(`Worktree de revisão criado em ${worktreePath}.`);
    context.logger.info(`Próximo passo: cd ${worktreePath} && npx ai-guidelines`);
    return { exitCode: 0 };
  }
}

function renderPeerReviewBrief(input: {
  readonly pr: PullRequestData;
  readonly branch: string | null;
  readonly clean: boolean;
  readonly mode: PeerReviewMode;
  readonly worktreePath: string;
}): string {
  const { pr, branch, clean, mode, worktreePath } = input;
  return [
    `# Review entre pares — PR #${pr.number}`,
    "",
    `- título: ${pr.title}`,
    `- estado: ${pr.state}${pr.isDraft ? " · Draft" : ""}`,
    `- branch do PR: ${pr.headRefName}`,
    `- base do PR: ${pr.baseRefName}`,
    `- sua branch atual: ${branch ?? "não detectada"}`,
    `- working tree: ${clean ? "limpa" : "com mudanças locais"}`,
    pr.url ? `- link: ${pr.url}` : null,
    "",
    "## Como abrir para revisar",
    mode === "worktree"
      ? `- modo escolhido: worktree separado em ${worktreePath}`
      : "- modo escolhido: checkout guiado nesta pasta",
    "- worktree separado preserva sua branch atual.",
    "- checkout guiado troca a branch neste diretório e exige working tree limpa.",
    "",
    "## Depois de abrir o PR",
    `- triagem de comentários: npx ai-guidelines triage ${pr.number}`,
    "- tipos de revisão: npx ai-guidelines review types",
    "- validação rápida: npx ai-guidelines validate changed",
    "",
    "## Proteções",
    "- este fluxo não executa Ready, Human Gate, merge ou avanço de checkpoint.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}
