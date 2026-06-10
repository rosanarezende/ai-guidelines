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
  /**
   * Estado operacional canônico de Draft/Ready: o flag `draft` da API do GitHub.
   * **Fonte ÚNICA de verdade** — o MESMO sinal que `MergeStack` consome via
   * `PullRequestData.isDraft`. O Template v3 não duplica lifecycle no corpo
   * visível (ADR 0024); o flag nativo é o único sinal de enforcement.
   */
  readonly isDraft: boolean;
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

// ── Governança visual (matriz aprovada) ──────────────────────────────────────
// O artefato GATEADO é o **prompt final autorado** (paste-ready) — produzível
// pelo agente SEM depender de gerador externo. A IMAGEM é sua renderização
// mecânica: opcional no Ready, obrigação de publicação em R4 (degradável). Assim
// o gate nunca bloqueia o Ready por indisponibilidade de um serviço externo
// (extrínseco/ortogonal à prontidão do PR), ao contrário de R1/R7/R8 (evidência
// intrínseca). #1 Problema + #3 Valor em ENTREGA (Ready, execution); #1 + #4
// Convergência no Integration PR. #2 nunca falha. Draft é isento.
const VISUAL_PROBLEMA = "## Visão pretendida";
const VISUAL_VALOR = "## Valor entregue";
const VISUAL_CONVERGENCIA = "## Convergência da stack";

/** Referência de imagem markdown `![alt](url)` ou HTML `<img ... src=...>`. */
const IMAGE_REF = /!\[[^\]]*\]\([^)]+\)|<img\b[^>]*\bsrc=/i;
/** Linha que é só placeholder do template (`<…>`): não conta como conteúdo autoral. */
const PLACEHOLDER_LINE = /^<[^<>]*>$/;

/** Conteúdo de uma seção: do header até o próximo header de mesmo/maior nível (ou fim). */
function sectionContent(body: string, header: string): string | null {
  const title = header.replace(/^#+\s*/, "");
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`^\\s{0,3}#{2,6}\\s+${escaped}\\s*$`, "m").exec(body);
  if (!m) return null;
  const rest = body.slice(m.index + m[0].length);
  const next = /^\s{0,3}#{2,6}\s+\S/m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

/** Conteúdos internos dos blocos de código cercados (3+ backticks) da seção. */
function fencedBlockContents(content: string): string[] {
  const blocks: string[] = [];
  const re = /^[ \t]*`{3,}[^\n]*\n([\s\S]*?)^[ \t]*`{3,}[ \t]*$/gm;
  for (let m = re.exec(content); m !== null; m = re.exec(content)) blocks.push(m[1]);
  return blocks;
}

/** O texto tem ao menos uma linha autoral (não vazia e não placeholder `<…>`). */
function hasAuthoredLine(text: string): boolean {
  return text.split("\n").some((line) => {
    const t = line.trim();
    return t !== "" && !PLACEHOLDER_LINE.test(t);
  });
}

/**
 * A seção existe E contém o artefato visual PREENCHIDO: o **prompt final**
 * (bloco de código cercado com conteúdo autoral — o placeholder `<…>` do
 * Template v3 NÃO satisfaz) OU a **imagem** já renderizada (que o satisfaz,
 * sendo ≥ prompt). Comentários HTML do template podem permanecer (são
 * intencionais — não interferem na detecção).
 */
function sectionHasFilledVisual(body: string, header: string): boolean {
  const content = sectionContent(body, header);
  if (content === null) return false;
  if (IMAGE_REF.test(content)) return true;
  return fencedBlockContents(content).some(hasAuthoredLine);
}

/**
 * A seção existe E tem conteúdo real além do esqueleto do template: ignora
 * comentários HTML, tags `details`/`summary`, linhas de fence e placeholders
 * `<…>`. Usada para exigir "validação real" (Test plan) em Ready.
 */
function sectionHasRealContent(body: string, header: string): boolean {
  const content = sectionContent(body, header);
  if (content === null) return false;
  const visible = content.replace(/<!--[\s\S]*?-->/g, "");
  return visible.split("\n").some((line) => {
    const t = line.trim();
    return (
      t !== "" &&
      !/^`{3,}/.test(t) &&
      !PLACEHOLDER_LINE.test(t) &&
      !/^<\/?(details|summary)\b/i.test(t)
    );
  });
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
    // A posição na stack NÃO é mais exigida como linha visível no body
    // (Template v3): ela vive no título (prefixo enforçado acima), em
    // state.yml § topology e em base/head do PR.
  }

  // ── Contrato temporal do PR body (Template v3) ──────────────────────────────
  // Metadados governados (lifecycle, tipo de PR, posição na stack, autorização
  // de merge) saíram do corpo visível: vivem no título, em state.yml, em
  // base/head e nos comentários HTML do template — não são seções exigidas.
  // Comentários HTML são intencionais e podem permanecer após o preenchimento.
  // Draft exige INTENÇÃO declarada; Ready exige ENTREGA (Ready ⊇ Draft).
  // Ready ≠ merge autorizado (ADR 0024); o Human Gate ocorre ao final do
  // PR/checkpoint.
  const draftSections = [
    "## Visão pretendida",
    "## Resumo",
    "## Escopo",
    "### Dentro do escopo",
    "### Fora do escopo",
  ];
  const readySections = [
    "## Valor entregue",
    "## Test plan",
    "## Validação, evidências e checklist",
    "### Evidências e gates",
    "### Checklist operacional",
    "## Disclosure de IA",
  ];
  const requiredSections = input.isDraft ? draftSections : [...draftSections, ...readySections];

  for (const section of requiredSections) {
    if (!hasSectionHeader(input.prBody, section)) {
      reasons.push(
        `Template incompleto: seção obrigatória "${section}" não encontrada (precisa ser um header markdown em linha própria).`
      );
    }
  }

  // ── Governança visual: prompt final obrigatório por estado temporal (Template v3) ──
  // Gateia o PROMPT FINAL autorado (bloco ```…``` com conteúdo autoral) — ou a
  // imagem, que o satisfaz. O placeholder `<…>` do template NÃO satisfaz.
  // Contrato temporal: "Visão pretendida" é preenchida ao abrir o Draft PR
  // (intenção declarada); "Valor entregue" só em Ready (antes da revisão final /
  // Human Gate) — em Draft pode permanecer como placeholder do template.
  // Ready/Draft vem do flag canônico do GitHub (`isDraft`) — fonte única de
  // verdade, idêntica à do `MergeStack`. fast-track já saiu antes (bypass).
  // A imagem renderizada é obrigação posterior de publicação (R4), nunca
  // pré-requisito do Ready.
  const VISUAL_HINT = "preencha o prompt final autorado (bloco ```…```) ou a imagem renderizada";
  if (node.role === "execution") {
    if (!sectionHasFilledVisual(input.prBody, VISUAL_PROBLEMA)) {
      reasons.push(
        `Governança visual: a seção "${VISUAL_PROBLEMA}" está vazia ou só com placeholder — ${VISUAL_HINT}. A visão pretendida é preenchida ao abrir o Draft PR.`
      );
    }
    if (!input.isDraft && !sectionHasFilledVisual(input.prBody, VISUAL_VALOR)) {
      reasons.push(
        `Governança visual: a seção "${VISUAL_VALOR}" está vazia ou só com placeholder — ${VISUAL_HINT}. Em Ready, o valor entregue deve estar preenchido (em Draft pode ficar como placeholder).`
      );
    }
  } else if (node.role === "integration" && !input.isDraft) {
    if (!sectionHasFilledVisual(input.prBody, VISUAL_PROBLEMA)) {
      reasons.push(
        `Governança visual: a seção "${VISUAL_PROBLEMA}" (backdrop) está vazia no Integration PR — ${VISUAL_HINT}.`
      );
    }
    if (!sectionHasFilledVisual(input.prBody, VISUAL_CONVERGENCIA)) {
      reasons.push(
        `Governança visual: a seção "${VISUAL_CONVERGENCIA}" está vazia — ${VISUAL_HINT}. O Integration PR exige a narrativa visual da convergência (#4).`
      );
    }
  }

  // Contrato Ready: o Test plan precisa de validação real, não só o esqueleto
  // do template (fences/placeholders/comentários não contam como conteúdo).
  if (!input.isDraft && !sectionHasRealContent(input.prBody, "## Test plan")) {
    reasons.push(
      `Contrato Ready: a seção "## Test plan" precisa conter validação real (comandos/observações), não apenas o esqueleto do template.`
    );
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
    // `draft` é campo nativo da API REST de pulls — a fonte canônica de Draft/Ready.
    draft?: boolean;
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
      // `draft` ausente → trata como Ready (fail-safe: gate enforça em vez de pular).
      isDraft: Boolean(pr.draft),
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
