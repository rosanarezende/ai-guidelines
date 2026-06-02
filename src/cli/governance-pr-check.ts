import { execFileSync } from "node:child_process";
import { parseSpecBranch } from "../app/workflow/DetectActiveSpec.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";
import { NodeWorkflowFileSystem } from "../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";

export interface GovernancePrCheckInput {
  readonly prNumber: number;
  readonly prTitle: string;
  readonly prBody: string;
  readonly prLabels: ReadonlyArray<string>;
  readonly repo: string;
  readonly prBranch: string;
}

export type GovernancePrCheckResult =
  | { readonly kind: "ok"; readonly note: string }
  | { readonly kind: "fast-track"; readonly note: string }
  | { readonly kind: "exempt"; readonly note: string }
  | { readonly kind: "fail"; readonly reasons: ReadonlyArray<string> };

const FAST_TRACK_LABEL = "fast-track";
const FAST_TRACK_RATIONALE_REGEX = /\[fast-track:\s*[^\]]+\]|##\s*Fast-track\s+Rationale\b/i;

/**
 * Robustez (Checkpoint 2.3a / O2): a seção obrigatória precisa ser um HEADER
 * markdown em linha própria — não basta o texto aparecer em qualquer lugar do
 * body (ex.: dentro de citação ou cross-ref a outro PR, que geraria
 * falso-negativo com `includes`). Tolera nível de heading (`##`..`######`),
 * indentação leve e espaços à direita (reduz falso-positivo por formatação).
 * Ancoragem de linha apenas — NÃO é parser de markdown.
 */
function hasSectionHeader(body: string, headerLine: string): boolean {
  const title = headerLine.replace(/^#+\s*/, "");
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s{0,3}#{2,6}\\s+${escaped}\\s*$`, "m").test(body);
}

export interface GitHubApiCaller {
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

function checkFastTrack(input: GovernancePrCheckInput): GovernancePrCheckResult | null {
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
  return null;
}

export function runGovernancePrCheck(
  input: GovernancePrCheckInput,
  fs: WorkflowFileSystem
): GovernancePrCheckResult {
  const fastTrack = checkFastTrack(input);
  if (fastTrack) return fastTrack;

  const parsedBranch = parseSpecBranch(input.prBranch);
  if (!parsedBranch) {
    return {
      kind: "exempt",
      note: `PR branch "${input.prBranch}" não parece pertencer a uma Spec (não segue padrão feat/spec-NNNN-*). SSOT topology mapping ignorado.`,
    };
  }

  const { specId, branchScope } = parsedBranch;
  let stateYmlPath = fs.resolveAbsolute(`.governance/specs/${specId}-${branchScope}/state.yml`);
  if (!fs.fileExists(stateYmlPath)) {
    // Try to find any directory matching specId
    const govDirs = fs.directoryExists(".governance/specs")
      ? fs.listDirectory(".governance/specs")
      : [];
    const specDir = govDirs.find((d: string) => d.startsWith(`${specId}-`));
    if (specDir) {
      stateYmlPath = fs.resolveAbsolute(`.governance/specs/${specDir}/state.yml`);
    } else {
      const legDirs = fs.directoryExists(".specify/specs")
        ? fs.listDirectory(".specify/specs")
        : [];
      const legDir = legDirs.find((d: string) => d.startsWith(`${specId}-`));
      if (legDir) {
        stateYmlPath = fs.resolveAbsolute(`.specify/specs/${legDir}/state.yml`);
      } else {
        return {
          kind: "fail",
          reasons: [
            `Diretório da spec ${specId} não encontrado em .governance/specs/ ou .specify/specs/.`,
          ],
        };
      }
    }
  }

  if (!fs.fileExists(stateYmlPath)) {
    return { kind: "fail", reasons: [`Arquivo state.yml não encontrado em ${stateYmlPath}`] };
  }

  const stateYamlText = fs.readTextFile(stateYmlPath);
  let state;
  try {
    state = parseWorkflowState(stateYamlText);
  } catch (err) {
    return { kind: "fail", reasons: [`Erro ao fazer parse do state.yml: ${err}`] };
  }

  const topology = state.topology;
  if (!topology) {
    return {
      kind: "exempt",
      note: `state.yml da spec ${specId} não possui topologia declarada. SSOT verification skipped.`,
    };
  }

  const allNodes = [...topology.prs.concluded, ...topology.prs.active, ...topology.prs.planned];

  const node = allNodes.find((n) => n.id === branchScope || n.github_pr === input.prNumber);
  if (!node) {
    return {
      kind: "fail",
      reasons: [
        `PR ${input.prNumber} (branchScope: ${branchScope}) não encontrado na topologia do state.yml da Spec ${specId}.`,
        `Adicione-o aos veículos de integração na seção "prs".`,
      ],
    };
  }

  const reasons: string[] = [];

  let expectedPrefix = "";
  if (node.role === "governance") {
    expectedPrefix = `[🧾] [Spec ${specId}]`;
    const altPrefix = `[🧾🔒] [Spec ${specId}]`;
    if (!input.prTitle.startsWith(expectedPrefix) && !input.prTitle.startsWith(altPrefix)) {
      reasons.push(
        `Título incorreto. Esperado iniciar com: "${expectedPrefix}" ou "${altPrefix}" (recebido: "${input.prTitle}")`
      );
    }
  } else if (node.role === "integration") {
    expectedPrefix = `[🔗] [Integration] [Spec ${specId}]`;
    if (!input.prTitle.startsWith(expectedPrefix)) {
      reasons.push(
        `Título incorreto. Esperado iniciar com: "${expectedPrefix}" (recebido: "${input.prTitle}")`
      );
    }
  } else if (node.role === "execution") {
    const seqStr = node.sequence !== null ? node.sequence.toString() + "️⃣" : "";
    const termStr = node.terminal ? "" : "➜";
    expectedPrefix = `[🛠️${seqStr}${termStr}] [Spec ${specId}]`;

    if (!input.prTitle.startsWith(expectedPrefix)) {
      reasons.push(
        `Título incorreto. Pela topologia (sequence=${node.sequence}, terminal=${node.terminal}), o prefixo esperado é: "${expectedPrefix}"`
      );
    }

    if (node.sequence !== null) {
      // Robustez (O2): linha tolerante a formatação (espaços, markers `**`, `:`),
      // exigindo o número de sequence exato na MESMA linha de "Stack atual".
      // Word-boundary evita casar `1` dentro de `12`. Sem parser de markdown.
      const stackLineRe = new RegExp(`^.*stack atual.*?\\b${node.sequence}\\b.*$`, "im");
      if (!stackLineRe.test(input.prBody)) {
        reasons.push(
          `Coerência de stack falhou. A topologia define sequence=${node.sequence}, mas nenhuma linha "Stack atual" com a posição ${node.sequence} foi encontrada no body do PR.`
        );
      }
    }
  }

  const mandatorySections = [
    "## Status do ciclo de vida",
    "## PR Type",
    "## Posição na stack",
    "## Merge authorization",
    "## Resumo",
    "## Test plan",
    "## Cross-refs",
    "## Checklist operacional",
    "## Disclosure de IA",
  ];

  for (const section of mandatorySections) {
    if (!hasSectionHeader(input.prBody, section)) {
      reasons.push(
        `Template incompleto: seção obrigatória "${section}" não encontrada (precisa ser um header markdown em linha própria).`
      );
    }
  }

  if (reasons.length > 0) {
    return { kind: "fail", reasons };
  }

  return {
    kind: "ok",
    note: `PR validado contra SSOT da topologia (Spec ${specId}). Prefixo de título e coerência ok.`,
  };
}

export interface RunOptions {
  readonly prNumber: number;
  readonly repo: string;
  readonly logger?: { info: (m: string) => void; error: (m: string) => void };
  readonly api?: GitHubApiCaller;
  readonly fs?: WorkflowFileSystem;
}

const stdoutLogger = {
  info: (m: string) => process.stdout.write(`${m}\n`),
  error: (m: string) => process.stderr.write(`${m}\n`),
};

export function main(opts: RunOptions): number {
  const logger = opts.logger ?? stdoutLogger;
  const api = opts.api ?? new CliGitHubApiCaller();
  const fs = opts.fs ?? new NodeWorkflowFileSystem(process.cwd());

  let pr: {
    title: string;
    body: string | null;
    labels: ReadonlyArray<{ name: string }>;
    head: { ref: string };
  };
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
      prTitle: pr.title,
      prBody: pr.body ?? "",
      prLabels: pr.labels.map((l) => l.name),
      repo: opts.repo,
      prBranch: pr.head.ref,
    },
    fs
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
    `\nA topologia SSOT requer alinhamento estrito. Ajuste o título e body do PR, ou a topologia em state.yml.`
  );
  return 1;
}
