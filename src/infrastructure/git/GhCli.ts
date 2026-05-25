import { execFileSync } from "node:child_process";
import {
  CreatePullRequestInput,
  MergePullRequestInput,
  PullRequestData,
  PullRequestState,
  ReviewComment,
  StackOps,
} from "../../app/ports/StackOps.js";

/**
 * Adapter `StackOps` que delega para `gh` CLI via `execFileSync` com args array.
 *
 * **Sempre args array, nunca string interpolada via shell** — fecha CWE-78
 * (mesmo padrão cravado em `src/cli/visual-prompts/collectLocalContext.ts`
 * pós-Copilot review #1). Dados externos (titles, branches, labels) entram
 * como elementos do argv, não como tokens de shell.
 *
 * **Depende de `gh` autenticado** no ambiente (consumer repos governance-first
 * já dependem de `gh` para `governance-pr-check` workflow). Falha narrativa
 * via stderr se não autenticado.
 *
 * Cravado em `[DEC-0023-L01]`. Cf. ADR 0024 seção "Operational CLI commands".
 */

const GH_TIMEOUT_MS = 30_000;
const GH_LIST_LIMIT = "100";

const PR_JSON_FIELDS = [
  "number",
  "title",
  "body",
  "state",
  "isDraft",
  "headRefName",
  "baseRefName",
  "labels",
  "url",
].join(",");

export class GhCli implements StackOps {
  constructor(private readonly cwd: string) {}

  createPullRequest(input: CreatePullRequestInput): PullRequestData {
    const args = [
      "pr",
      "create",
      "--title",
      input.title,
      // Body via stdin (`--body-file -`) em vez de `--body <string>`: bodies
      // grandes (ex.: Integration PR) podem estourar o limite de argv do SO.
      "--body-file",
      "-",
      "--base",
      input.base,
      "--head",
      input.head,
    ];
    if (input.draft) args.push("--draft");
    if (input.labels && input.labels.length > 0) {
      for (const label of input.labels) args.push("--label", label);
    }

    const url = this.exec(args, { input: input.body }).trim();
    const numberMatch = /\/pull\/(\d+)\/?$/.exec(url);
    if (!numberMatch) {
      throw new Error(`Não foi possível extrair número do PR a partir do output: "${url}"`);
    }
    const prNumber = Number(numberMatch[1]);

    const created = this.getPullRequest(prNumber);
    if (!created) {
      throw new Error(`PR #${prNumber} criado mas leitura imediata falhou.`);
    }
    return created;
  }

  getPullRequest(number: number): PullRequestData | null {
    try {
      const json = this.exec(["pr", "view", String(number), "--json", PR_JSON_FIELDS]);
      return parsePullRequestData(JSON.parse(json));
    } catch {
      return null;
    }
  }

  editPullRequestBase(number: number, newBase: string): void {
    this.exec(["pr", "edit", String(number), "--base", newBase]);
  }

  mergePullRequest(input: MergePullRequestInput): void {
    const strategyFlag = `--${input.strategy}`;
    const args = ["pr", "merge", String(input.number), strategyFlag];
    if (input.deleteBranch !== false) args.push("--delete-branch");
    this.exec(args);
  }

  listOpenPullRequests(): ReadonlyArray<PullRequestData> {
    const json = this.exec([
      "pr",
      "list",
      "--state",
      "open",
      "--json",
      PR_JSON_FIELDS,
      "--limit",
      GH_LIST_LIMIT,
    ]);
    const raw = JSON.parse(json);
    if (!Array.isArray(raw)) {
      throw new Error(`gh pr list devolveu formato inesperado: ${typeof raw}`);
    }
    return raw.map(parsePullRequestData);
  }

  listReviewComments(prNumber: number): ReadonlyArray<ReviewComment> {
    // `gh api ... --paginate` substitui {owner}/{repo} pelo repo corrente e
    // concatena as páginas num único array JSON. Read-only.
    const json = this.exec([
      "api",
      `repos/{owner}/{repo}/pulls/${prNumber}/comments`,
      "--paginate",
    ]).trim();
    const raw = JSON.parse(json === "" ? "[]" : json);
    if (!Array.isArray(raw)) {
      throw new Error(
        `gh api pulls/${prNumber}/comments devolveu formato inesperado: ${typeof raw}`
      );
    }
    return raw.map(parseReviewComment);
  }

  private exec(args: ReadonlyArray<string>, opts: { input?: string } = {}): string {
    return execFileSync("gh", [...args], {
      cwd: this.cwd,
      encoding: "utf-8",
      timeout: GH_TIMEOUT_MS,
      // Quando há `input` (ex.: body via `--body-file -`), stdin precisa ser
      // pipe para o execFileSync escrever; caso contrário ignoramos stdin.
      stdio: opts.input !== undefined ? ["pipe", "pipe", "pipe"] : ["ignore", "pipe", "pipe"],
      ...(opts.input !== undefined ? { input: opts.input } : {}),
    });
  }
}

/**
 * Normaliza um review comment do `gh api .../pulls/N/comments` para o shape
 * canônico de `ReviewComment` (read-only; usado pela triagem do comando `review`).
 */
function parseReviewComment(raw: unknown): ReviewComment {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`review comment inválido: esperava objeto, recebeu ${typeof raw}`);
  }
  const r = raw as Record<string, unknown>;
  const user =
    typeof r.user === "object" && r.user !== null ? (r.user as Record<string, unknown>) : {};
  const line =
    typeof r.line === "number"
      ? r.line
      : typeof r.original_line === "number"
        ? r.original_line
        : null;
  return {
    id: Number(r.id),
    author: String(user.login ?? "unknown"),
    path: String(r.path ?? ""),
    line,
    body: String(r.body ?? ""),
    inReplyToId: typeof r.in_reply_to_id === "number" ? r.in_reply_to_id : null,
    url: String(r.html_url ?? ""),
    createdAt: String(r.created_at ?? ""),
  };
}

/**
 * Normaliza payload JSON do `gh pr view`/`pr list` para o shape canônico
 * de `PullRequestData`. `gh` devolve `labels: [{name, ...}]`; normalizamos
 * para `string[]` (só os nomes — único campo relevante para detecção de
 * stack governance-first via convenção de title + label).
 */
function parsePullRequestData(raw: unknown): PullRequestData {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`PR data inválido: esperava objeto, recebeu ${typeof raw}`);
  }
  const r = raw as Record<string, unknown>;
  return {
    number: Number(r.number),
    title: String(r.title ?? ""),
    body: String(r.body ?? ""),
    state: normalizeState(r.state),
    isDraft: Boolean(r.isDraft),
    headRefName: String(r.headRefName ?? ""),
    baseRefName: String(r.baseRefName ?? ""),
    labels: Array.isArray(r.labels)
      ? r.labels
          .map((l) =>
            typeof l === "object" && l !== null && "name" in l
              ? String((l as { name: unknown }).name)
              : ""
          )
          .filter((name) => name !== "")
      : [],
    url: String(r.url ?? ""),
  };
}

function normalizeState(value: unknown): PullRequestState {
  const s = String(value ?? "").toUpperCase();
  if (s === "OPEN" || s === "CLOSED" || s === "MERGED") return s;
  throw new Error(`PR state inválido: "${value}"`);
}
