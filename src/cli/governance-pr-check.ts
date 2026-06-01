/**
 * Governance PR Check — CI mínimo de integridade estrutural.
 *
 * Origem: Spec 0023 § ADR 0020 + `[DEC-0023-D03]`. **Escopo restrito,
 * deliberadamente** — não é workflow engine. Valida apenas:
 *
 *   1. PR-execution declara dependência via marcador "Depends on #N (governance)" no body;
 *   2. Governance PR #N existe (gh api);
 *   3. Governance PR #N está aberto OU mergeado (não closed sem merge);
 *   4. Governance PR #N inclui `tasks.md` no diff.
 *
 * Fast-track (`[DEC-0023-D05]` + `[DEC-0023-E05]`): se o PR sob check
 * possui label `fast-track` E rationale declarado no body (regex
 * `[fast-track: ...]` ou seção `## Fast-track Rationale`), a validação
 * estrutural é bypassada e a responsabilidade transfere para o reviewer
 * humano. Sem rationale, o check **falha** — fast-track sem accountability
 * registrada é considerado bypass disfarçado (cf. ADR 0021).
 *
 * NÃO faz: drift semântico, mapping arquivos↔tasks, inferência de
 * cobertura, análise de intent. Expansão de escopo exige decisão própria.
 */
import { execFileSync } from "node:child_process";

export interface GovernancePrCheckInput {
  /** Número do PR de execução sendo verificado. */
  readonly prNumber: number;
  /** Body completo do PR de execução. */
  readonly prBody: string;
  /** Labels do PR de execução. */
  readonly prLabels: ReadonlyArray<string>;
  /** Repo no formato "owner/name". */
  readonly repo: string;
  /** Branch base do PR (ex.: feat/spec-0024-execution). */
  readonly prBranch: string;
}

export type GovernancePrCheckResult =
  | { readonly kind: "ok"; readonly governancePrNumber: number; readonly note?: string }
  | { readonly kind: "fast-track"; readonly note: string }
  | { readonly kind: "exempt"; readonly note: string }
  | { readonly kind: "fail"; readonly reasons: ReadonlyArray<string> };

const DEPENDS_ON_REGEX = /Depends on #(\d+)\s*\(governance\)/i;
const FAST_TRACK_LABEL = "fast-track";
const FAST_TRACK_RATIONALE_REGEX = /\[fast-track:\s*[^\]]+\]|##\s*Fast-track\s+Rationale\b/i;
const FILES_PER_PAGE = 100;
const FILES_MAX_PAGES = 30;

export interface GitHubApiCaller {
  /**
   * Retorna o JSON-parseado de `gh api {endpoint}`. Implementações reais
   * shellam `gh`. Tests injetam fake.
   */
  call(endpoint: string): unknown;
}

export class CliGitHubApiCaller implements GitHubApiCaller {
  call(endpoint: string): unknown {
    const stdout = execFileSync("gh", ["api", endpoint], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return JSON.parse(stdout);
  }
}

interface PrShape {
  readonly state: string;
  readonly merged_at: string | null;
}

interface FileShape {
  readonly filename: string;
}

/**
 * Verifica integridade estrutural do contrato governance-PR ↔ execution-PR.
 *
 * Tasks.md path canônico: `.governance/specs/{slug}/tasks.md`. Aceita
 * variantes em `.specify/specs/{slug}/tasks.md` durante a bridge.
 */
export function runGovernancePrCheck(
  input: GovernancePrCheckInput,
  api: GitHubApiCaller
): GovernancePrCheckResult {
  if (!input.prBranch.endsWith("-execution")) {
    return {
      kind: "exempt",
      note: `PR branch "${input.prBranch}" não termina com "-execution". Isento de dependência estrutural (não é execution PR).`,
    };
  }

  if (input.prLabels.includes(FAST_TRACK_LABEL)) {
    if (!FAST_TRACK_RATIONALE_REGEX.test(input.prBody)) {
      return {
        kind: "fail",
        reasons: [
          `PR #${input.prNumber} possui label "${FAST_TRACK_LABEL}" mas não declara rationale no body. Fast-track é bypass com accountability transferida — não bypass disfarçado (cf. ADR 0021 + DEC-0023-E05). Adicione "[fast-track: <razão curta>]" ou seção "## Fast-track Rationale" no body do PR.`,
        ],
      };
    }
    return {
      kind: "fast-track",
      note: `PR #${input.prNumber} possui label "${FAST_TRACK_LABEL}" + rationale declarado — validação estrutural bypassada com accountability transferida ao reviewer humano (cf. ADR 0020 + ADR 0021 + DEC-0023-D05/E05).`,
    };
  }

  const reasons: string[] = [];
  const match = DEPENDS_ON_REGEX.exec(input.prBody);

  if (!match) {
    reasons.push(
      `PR body não declara dependência. Esperado: marcador "Depends on #N (governance)" no body do PR. Fast-track? Adicione label "${FAST_TRACK_LABEL}".`
    );
    return { kind: "fail", reasons };
  }

  const governancePrNumber = Number.parseInt(match[1], 10);
  if (!Number.isFinite(governancePrNumber) || governancePrNumber <= 0) {
    reasons.push(`Marcador "Depends on #N (governance)" presente mas N inválido: "${match[1]}".`);
    return { kind: "fail", reasons };
  }

  let governancePr: PrShape;
  try {
    governancePr = api.call(`repos/${input.repo}/pulls/${governancePrNumber}`) as PrShape;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    reasons.push(`Governance PR #${governancePrNumber} não encontrado ou inacessível: ${message}.`);
    return { kind: "fail", reasons };
  }

  if (governancePr.state !== "open" && governancePr.merged_at === null) {
    reasons.push(
      `Governance PR #${governancePrNumber} está em estado "${governancePr.state}" sem merge — não pode ancorar uma execução.`
    );
  }

  let files: ReadonlyArray<FileShape>;
  try {
    files = fetchAllPrFiles(api, input.repo, governancePrNumber);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    reasons.push(`Falha ao listar arquivos do governance PR #${governancePrNumber}: ${message}.`);
    return { kind: "fail", reasons };
  }

  const hasTasks = files.some((f) => isCanonicalTasksFile(f.filename));
  if (!hasTasks) {
    reasons.push(
      `Governance PR #${governancePrNumber} não contém tasks.md no diff. Esperado: .governance/specs/{slug}/tasks.md (canônico) ou .specify/specs/{slug}/tasks.md (bridge legacy).`
    );
  }

  if (reasons.length > 0) {
    return { kind: "fail", reasons };
  }

  return {
    kind: "ok",
    governancePrNumber,
    note: `Governance PR #${governancePrNumber} validado (estrutural).`,
  };
}

function isCanonicalTasksFile(path: string): boolean {
  return (
    /^\.governance\/specs\/[^/]+\/tasks\.md$/.test(path) ||
    /^\.specify\/specs\/[^/]+\/tasks\.md$/.test(path)
  );
}

/**
 * Pagina sobre `repos/{repo}/pulls/{n}/files` até esgotar resultados ou
 * atingir FILES_MAX_PAGES (proteção contra loops infinitos). Sem isso,
 * governance PRs com >100 arquivos teriam tasks.md fora da primeira
 * página e o check falharia incorretamente.
 */
function fetchAllPrFiles(
  api: GitHubApiCaller,
  repo: string,
  prNumber: number
): ReadonlyArray<FileShape> {
  const all: FileShape[] = [];
  for (let page = 1; page <= FILES_MAX_PAGES; page += 1) {
    const batch = api.call(
      `repos/${repo}/pulls/${prNumber}/files?per_page=${FILES_PER_PAGE}&page=${page}`
    ) as ReadonlyArray<FileShape>;
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < FILES_PER_PAGE) break;
  }
  return all;
}

export interface RunOptions {
  readonly prNumber: number;
  readonly repo: string;
  readonly logger?: { info: (m: string) => void; error: (m: string) => void };
  readonly api?: GitHubApiCaller;
}

const stdoutLogger = {
  info: (m: string) => process.stdout.write(`${m}\n`),
  error: (m: string) => process.stderr.write(`${m}\n`),
};

/**
 * Main: lê body + labels do PR via gh api, executa check, imprime
 * resultado, retorna exit code (0 = ok ou fast-track; 1 = fail).
 */
export function main(opts: RunOptions): number {
  const logger = opts.logger ?? stdoutLogger;
  const api = opts.api ?? new CliGitHubApiCaller();

  let pr: { body: string | null; labels: ReadonlyArray<{ name: string }>; head: { ref: string } };
  try {
    pr = api.call(`repos/${opts.repo}/pulls/${opts.prNumber}`) as typeof pr;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`❌ Falha ao ler PR #${opts.prNumber}: ${message}`);
    return 1;
  }

  const result = runGovernancePrCheck(
    {
      prNumber: opts.prNumber,
      prBody: pr.body ?? "",
      prLabels: pr.labels.map((l) => l.name),
      repo: opts.repo,
      prBranch: pr.head.ref,
    },
    api
  );

  if (result.kind === "ok") {
    logger.info(`✅ ${result.note}`);
    return 0;
  }
  if (result.kind === "fast-track") {
    logger.info(`⚠️  ${result.note}`);
    return 0;
  }
  if (result.kind === "exempt") {
    logger.info(`✅ ${result.note}`);
    return 0;
  }
  logger.error(`❌ Governance PR check falhou para PR #${opts.prNumber}:`);
  for (const r of result.reasons) logger.error(`   - ${r}`);
  logger.error(
    `\nPara corrigir: adicione "Depends on #N (governance)" no body do PR-execução, ou aplique label "${FAST_TRACK_LABEL}" se for fast-track legítimo (cf. ADR 0020 / DEC-0023-D05).`
  );
  return 1;
}
