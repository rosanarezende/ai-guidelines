/**
 * `pr-body:update` — atualização PRESERVATIVA de PR body (FU-1, Spec 0024).
 *
 * Origem: PIT-0010 ("memória de agente não é contrato") — atualizações de body
 * que regeneram o corpo inteiro a partir de arquivo local apagam conteúdo
 * humano preservado (caso real: imagem de `## Visão pretendida` do PR #39).
 * Este comando torna a regra executável:
 *
 *   Visão pretendida = baseline inicial.
 *   Valor entregue  = evidência final.
 *
 * Fluxo: lê o body REMOTO → funde apenas seções autorizadas da proposta →
 * aplica via `gh pr edit --body-file` (fallback `gh api PATCH`) → relê o
 * remoto e confirma equivalência. Seguro por padrão: falha se o baseline
 * seria reescrito, se imagem/link do baseline sumiria ou se uma seção do
 * Template v3 desapareceria.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/** Baseline de intenção do Draft — nunca substituída por atualização automática. */
export const PRESERVED_SECTIONS: ReadonlyArray<string> = ["## Visão pretendida"];

/** Evidência final — só atualizada com instrução explícita (`--update-valor-entregue`). */
export const FINAL_SECTION = "## Valor entregue";

/** Seções atualizáveis durante a implementação. */
export const MUTABLE_SECTIONS: ReadonlyArray<string> = [
  "## Resumo",
  "## Escopo",
  "## Test plan",
  "## Validação, evidências e checklist",
  "## Cross-refs",
  "## Disclosure de IA",
];

const COMPLEMENT_GUIDANCE =
  "para mudar a visão pretendida, mantenha o baseline intacto e ACRESCENTE um bloco `<details><summary><strong>Prompt complementar — atualização de visão pretendida</strong></summary>…</details>` ao final da seção — nunca reescreva/apague o original.";

interface BodySection {
  readonly header: string;
  readonly content: string;
}

interface SplitBody {
  readonly preamble: string;
  readonly sections: ReadonlyArray<BodySection>;
}

function normalizeEol(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

/** Headers nível 2 (`## `) fora de fences delimitam seções; `###` fica dentro da seção pai. */
export function splitBody(body: string): SplitBody {
  const lines = normalizeEol(body).split("\n");
  const sections: BodySection[] = [];
  const preambleLines: string[] = [];
  let current: { header: string; lines: string[] } | null = null;
  let inFence = false;

  for (const line of lines) {
    if (/^\s*`{3,}/.test(line)) inFence = !inFence;
    if (!inFence && /^##\s+\S/.test(line)) {
      if (current) sections.push({ header: current.header, content: current.lines.join("\n") });
      current = { header: line.trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      preambleLines.push(line);
    }
  }
  if (current) sections.push({ header: current.header, content: current.lines.join("\n") });
  return { preamble: preambleLines.join("\n"), sections };
}

function joinBody(preamble: string, sections: ReadonlyArray<BodySection>): string {
  const parts: string[] = [];
  if (preamble !== "") parts.push(preamble);
  for (const section of sections) parts.push(section.header, section.content);
  return parts.join("\n");
}

/** Todos os headers `##`/`###` (fora de fences) — invariante: nenhum pode desaparecer. */
function allHeaders(body: string): string[] {
  const headers: string[] = [];
  let inFence = false;
  for (const line of normalizeEol(body).split("\n")) {
    if (/^\s*`{3,}/.test(line)) inFence = !inFence;
    if (!inFence && /^#{2,3}\s+\S/.test(line)) headers.push(line.trim());
  }
  return headers;
}

/** URLs de imagem/link (`![..](url)`, `[..](url)`, `<img src="url">`) de um trecho. */
function visualRefs(content: string): string[] {
  const refs: string[] = [];
  for (const m of content.matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)) refs.push(m[1]);
  for (const m of content.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)) refs.push(m[1]);
  return refs;
}

export interface MergeOptions {
  /** Instrução explícita para preencher/atualizar `## Valor entregue`. */
  readonly updateValorEntregue?: boolean;
}

export interface MergeResult {
  readonly merged: string;
  readonly updatedSections: ReadonlyArray<string>;
  readonly errors: ReadonlyArray<string>;
}

/**
 * Funde a proposta sobre o body remoto, seção a seção:
 * - preservadas: sempre o REMOTO (acréscimo que mantém o baseline como prefixo é aceito);
 * - `## Valor entregue`: remoto, salvo `updateValorEntregue`;
 * - mutáveis: proposta quando presente e diferente;
 * - demais seções remotas: preservadas (proposta divergente é erro);
 * - seções propostas inexistentes no remoto: apenas mutáveis, anexadas ao final.
 */
export function mergePrBody(
  remoteBody: string,
  proposedBody: string,
  options: MergeOptions = {}
): MergeResult {
  const errors: string[] = [];
  const remote = splitBody(remoteBody);
  const proposed = splitBody(proposedBody);

  for (const header of PRESERVED_SECTIONS) {
    if (!remote.sections.some((s) => s.header === header)) {
      errors.push(
        `body remoto não contém a seção preservada "${header}" — restaure o baseline (Template v3) antes de atualizar.`
      );
    }
  }
  if (errors.length > 0) return { merged: remoteBody, updatedSections: [], errors };

  const proposedByHeader = new Map(proposed.sections.map((s) => [s.header, s] as const));
  const updated: string[] = [];
  const outSections: BodySection[] = [];

  for (const section of remote.sections) {
    const prop = proposedByHeader.get(section.header);
    proposedByHeader.delete(section.header);
    if (prop === undefined || prop.content.trim() === section.content.trim()) {
      outSections.push(section);
      continue;
    }

    // Daqui em diante a proposta existe E difere do remoto.
    if (PRESERVED_SECTIONS.includes(section.header)) {
      if (prop.content.trim().startsWith(section.content.trim())) {
        outSections.push(prop);
        updated.push(`${section.header} (acréscimo preservando baseline)`);
      } else {
        errors.push(
          `a proposta reescreveria a seção preservada "${section.header}" (baseline do Draft) — ${COMPLEMENT_GUIDANCE}`
        );
        outSections.push(section);
      }
    } else if (section.header === FINAL_SECTION) {
      if (options.updateValorEntregue) {
        outSections.push(prop);
        updated.push(section.header);
      } else {
        errors.push(
          `"${FINAL_SECTION}" é preenchida só ao final (antes da revisão final / Human Gate) — use --update-valor-entregue para instrução explícita.`
        );
        outSections.push(section);
      }
    } else if (MUTABLE_SECTIONS.includes(section.header)) {
      outSections.push(prop);
      updated.push(section.header);
    } else {
      errors.push(
        `seção "${section.header}" está fora da lista de seções atualizáveis — preservada; remova-a da proposta ou atualize o contrato no template.`
      );
      outSections.push(section);
    }
  }

  for (const [header, section] of proposedByHeader) {
    if (MUTABLE_SECTIONS.includes(header)) {
      outSections.push(section);
      updated.push(`${header} (nova)`);
    } else {
      errors.push(
        `seção proposta "${header}" não existe no body remoto e não é atualizável — alinhe a proposta ao Template v3.`
      );
    }
  }

  const preamble =
    proposed.preamble.trim() !== "" && proposed.preamble.trim() !== remote.preamble.trim()
      ? proposed.preamble
      : remote.preamble;
  const merged = joinBody(preamble, outSections);

  // Invariantes pós-merge (defesa em profundidade — a construção já preserva):
  for (const header of PRESERVED_SECTIONS) {
    const remoteSection = remote.sections.find((s) => s.header === header);
    const mergedSection = splitBody(merged).sections.find((s) => s.header === header);
    for (const ref of visualRefs(remoteSection?.content ?? "")) {
      if (!visualRefs(mergedSection?.content ?? "").includes(ref)) {
        errors.push(`imagem/link "${ref}" desapareceria de "${header}" — atualização bloqueada.`);
      }
    }
  }
  const mergedHeaders = new Set(allHeaders(merged));
  for (const header of allHeaders(remoteBody)) {
    if (!mergedHeaders.has(header)) {
      errors.push(
        `a seção "${header}" desapareceria do body — atualização bloqueada (Template v3).`
      );
    }
  }

  if (errors.length > 0) return { merged: remoteBody, updatedSections: [], errors };
  return { merged, updatedSections: updated, errors: [] };
}

// ── Aplicação (porta + adapter gh) ───────────────────────────────────────────

export interface PrBodyGateway {
  fetchBody(): string;
  /** Caminho normal (`gh pr edit --body-file`); pode lançar (ex.: GraphQL/Projects-classic). */
  editBody(body: string): void;
  /** Fallback REST (`gh api -X PATCH … -F body=@file`). */
  patchBody(body: string): void;
}

export interface Logger {
  info(message: string): void;
  error(message: string): void;
}

const stdoutLogger: Logger = {
  info: (m) => process.stdout.write(`${m}\n`),
  error: (m) => process.stderr.write(`${m}\n`),
};

function comparable(body: string): string {
  return normalizeEol(body).trimEnd();
}

export interface RunPrBodyUpdateOptions {
  readonly proposedBody: string;
  readonly gateway: PrBodyGateway;
  readonly logger?: Logger;
  readonly updateValorEntregue?: boolean;
  readonly dryRun?: boolean;
}

export function runPrBodyUpdate(options: RunPrBodyUpdateOptions): number {
  const logger = options.logger ?? stdoutLogger;
  const remote = options.gateway.fetchBody();
  const result = mergePrBody(remote, options.proposedBody, {
    updateValorEntregue: options.updateValorEntregue,
  });

  if (result.errors.length > 0) {
    logger.error("❌ pr-body:update — atualização bloqueada:");
    for (const error of result.errors) logger.error(`   - ${error}`);
    return 1;
  }

  if (comparable(result.merged) === comparable(remote)) {
    logger.info("✅ pr-body:update — nenhuma seção autorizada mudou; body remoto já está em dia.");
    return 0;
  }

  logger.info(`Seções a atualizar: ${result.updatedSections.join(", ")}`);
  if (options.dryRun) {
    logger.info("✅ pr-body:update — dry-run: nada aplicado.");
    return 0;
  }

  let usedFallback = false;
  try {
    options.gateway.editBody(result.merged);
  } catch (err) {
    usedFallback = true;
    const message = err instanceof Error ? err.message : String(err);
    logger.info(`gh pr edit falhou (${message.trim()}); usando fallback gh api PATCH.`);
    options.gateway.patchBody(result.merged);
  }

  const reread = options.gateway.fetchBody();
  if (comparable(reread) !== comparable(result.merged)) {
    logger.error(
      "❌ pr-body:update — body remoto difere do aplicado após releitura; verifique manualmente."
    );
    return 1;
  }

  logger.info(
    `✅ pr-body:update — aplicado e confirmado${usedFallback ? " (via fallback gh api PATCH)" : ""}; seções atualizadas: ${result.updatedSections.join(", ")}.`
  );
  return 0;
}

/** Adapter `gh` real — args array sempre (CWE-78; mesmo padrão de GhCli/CliGitHubApiCaller). */
export class GhPrBodyGateway implements PrBodyGateway {
  constructor(
    private readonly repo: string,
    private readonly prNumber: number
  ) {}

  fetchBody(): string {
    const stdout = execFileSync("gh", ["api", `repos/${this.repo}/pulls/${this.prNumber}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const body = (JSON.parse(stdout) as { body: string | null }).body;
    return body ?? "";
  }

  editBody(body: string): void {
    execFileSync(
      "gh",
      [
        "pr",
        "edit",
        String(this.prNumber),
        "--repo",
        this.repo,
        "--body-file",
        this.tempFile(body),
      ],
      { stdio: ["ignore", "ignore", "pipe"] }
    );
  }

  patchBody(body: string): void {
    execFileSync(
      "gh",
      [
        "api",
        "-X",
        "PATCH",
        `repos/${this.repo}/pulls/${this.prNumber}`,
        "-F",
        `body=@${this.tempFile(body)}`,
      ],
      { stdio: ["ignore", "ignore", "pipe"] }
    );
  }

  private tempFile(body: string): string {
    const file = path.join(mkdtempSync(path.join(tmpdir(), "pr-body-update-")), "body.md");
    writeFileSync(file, body, "utf-8");
    return file;
  }
}

// ── Entrada CLI (`cli/pr-body-update.mjs`) ───────────────────────────────────

export interface MainOptions {
  readonly logger?: Logger;
  readonly gateway?: PrBodyGateway;
}

function detectRepo(): string {
  return execFileSync("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function main(argv: ReadonlyArray<string> = [], options: MainOptions = {}): number {
  const logger = options.logger ?? stdoutLogger;
  let pr: number | undefined;
  let bodyFile: string | undefined;
  let repo: string | undefined;
  let updateValorEntregue = false;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--pr") pr = Number(argv[++i]);
    else if (arg === "--body-file") bodyFile = argv[++i];
    else if (arg === "--repo") repo = argv[++i];
    else if (arg === "--update-valor-entregue") updateValorEntregue = true;
    else if (arg === "--dry-run") dryRun = true;
    else {
      logger.error(`Argumento desconhecido: ${arg}`);
      return 2;
    }
  }

  if (!pr || !Number.isInteger(pr) || !bodyFile) {
    logger.error(
      "Uso: npm run pr-body:update -- --pr <n> --body-file <arquivo.md> [--repo owner/repo] [--update-valor-entregue] [--dry-run]"
    );
    return 2;
  }

  const proposedBody = readFileSync(bodyFile, "utf-8");
  const gateway = options.gateway ?? new GhPrBodyGateway(repo ?? detectRepo(), pr);
  return runPrBodyUpdate({ proposedBody, gateway, logger, updateValorEntregue, dryRun });
}
