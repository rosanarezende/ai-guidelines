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

import { PrBodyProfile, PR_BODY_PROFILES } from "../domain/workflow/PrProfileContract.js";

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
 * template não satisfaz) OU a **imagem** já renderizada (que o satisfaz,
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
 * `<…>`. Usada para exigir conteúdo real (Test plan, Accountability etc.).
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

const VISUAL_HINT = "preencha o prompt final autorado (bloco ```…```) ou a imagem renderizada";

/**
 * Contrato-base comum aplicado com o perfil selecionado: seções por fase
 * temporal + slots visuais + conteúdo real. As mensagens nomeiam o perfil e a
 * seção ausente. Comentários HTML nunca invalidam (a detecção é por header em
 * linha própria); nenhum perfil exige `<details open>`.
 */
export function validateProfileBody(
  profile: PrBodyProfile,
  body: string,
  isDraft: boolean
): string[] {
  const reasons: string[] = [];
  const required = isDraft
    ? profile.draftSections
    : [...profile.draftSections, ...profile.readySections];

  for (const section of required) {
    if (!hasSectionHeader(body, section)) {
      reasons.push(
        `Template incompleto (perfil ${profile.name}): seção obrigatória "${section}" não encontrada (precisa ser um header markdown em linha própria).`
      );
    }
  }

  for (const visual of profile.visuals) {
    if (visual.phase === "ready" && isDraft) continue;
    if (!sectionHasFilledVisual(body, visual.section)) {
      reasons.push(
        `Governança visual (perfil ${profile.name}): a seção "${visual.section}" está vazia ou só com placeholder — ${VISUAL_HINT}. ${visual.hint}`
      );
    }
  }

  for (const rc of profile.realContent) {
    if (rc.phase === "ready" && isDraft) continue;
    if (!sectionHasRealContent(body, rc.section)) {
      reasons.push(
        `Contrato ${rc.phase === "ready" ? "Ready" : "do perfil"} (${profile.name}): a seção "${rc.section}" precisa conter conteúdo real — ${rc.hint}`
      );
    }
  }

  return reasons;
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

/**
 * 🚑 Fast-track: bypassa o linkage estrutural com a topologia (pode não ser PR
 * de spec), mas NÃO bypassa accountability (ADR 0021 + DEC-0023-E05) — o perfil
 * fast-track é curto e rigoroso: incidente, correção, risco, evidência mínima,
 * rollback, accountability com conteúdo real e rastreabilidade (Cross-refs).
 */
function checkFastTrack(input: GovernancePrCheckInput): GovernancePrCheckResult | null {
  if (!input.prLabels.includes(FAST_TRACK_LABEL)) return null;

  const reasons = validateProfileBody(PR_BODY_PROFILES["fast-track"], input.prBody, input.isDraft);
  if (reasons.length > 0) {
    return {
      kind: "fail",
      reasons: [
        `PR #${input.prNumber} possui label "${FAST_TRACK_LABEL}" — fast-track é bypass do linkage estrutural com accountability transferida, não bypass disfarçado (cf. ADR 0021 + DEC-0023-E05). O body deve seguir o perfil fast-track:`,
        ...reasons,
      ],
    };
  }
  return {
    kind: "fast-track",
    note: `PR #${input.prNumber} possui label "${FAST_TRACK_LABEL}" + perfil fast-track completo (incidente/correção/risco/evidência/rollback/accountability) — linkage estrutural bypassado com accountability transferida ao reviewer humano (cf. ADR 0020 + ADR 0021 + DEC-0023-D05/E05).`,
  };
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

  // Título por tipo (mecanismo existente de derivação do tipo: role do nó).
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
    // A posição na stack NÃO é exigida como linha visível no body: ela vive no
    // título (prefixo enforçado acima), em state.yml § topology e em base/head.
  }

  // ── Perfil de body por tipo (PRBodyContract) ────────────────────────────────
  // Draft exige INTENÇÃO declarada; Ready exige ENTREGA/DECISÃO (Ready ⊇ Draft).
  // Ready ≠ merge autorizado (ADR 0024); o Human Gate ocorre ao final do
  // PR/checkpoint. Metadados governados (lifecycle, tipo, posição na stack,
  // autorização de merge) não são seções visíveis. Ready/Draft vem do flag
  // canônico do GitHub (`isDraft`) — fonte única, idêntica à do `MergeStack`.
  const profile =
    node.role === "governance"
      ? PR_BODY_PROFILES.governance
      : node.role === "integration"
        ? PR_BODY_PROFILES.integration
        : PR_BODY_PROFILES.execution;

  reasons.push(...validateProfileBody(profile, input.prBody, input.isDraft));

  if (reasons.length > 0) {
    return { kind: "fail", reasons };
  }

  return {
    kind: "ok",
    note: `PR validado contra SSOT da topologia (Spec ${specId}, perfil ${profile.name}). Prefixo de título e coerência ok.`,
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
