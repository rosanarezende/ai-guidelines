/**
 * Domain puro do TemplateEngine — Partial.
 *
 * Validação de Markdown funcional para partials de composição atômica.
 * Domain puro — sem parser externo de Markdown, sem IO, sem filesystem.
 *
 * Invariantes do contrato (audit pré-3.D §"Contrato de Partial"):
 *  1. Markdown sintaticamente válido (não-vazio, sem estruturas abertas).
 *  2. Não-fragmento (começa com heading # ou bloco autocontido).
 *  3. Self-contained (referências internas ou externas, não cross-partial).
 *  4. Determinístico (sem placeholders {{var}}, <%= %>, ${}).
 *  5. Sem timestamps embutidos (generatedAt, createdAt, updatedAt).
 *
 * Aplica ADR 0004 (.core/governance/adrs/0004-ast-only-extraction.md):
 * determinismo como contrato — partial = conteúdo estável byte-a-byte.
 */
import { GovernanceError } from "../shared/errors.js";

/**
 * Conteúdo Markdown bruto de um partial. Tipo semântico para distinguir
 * de strings genéricas no domain.
 */
export type PartialContent = string;

/**
 * Resultado tipado da validação — conteúdo validado.
 */
export interface ValidPartial {
  readonly content: PartialContent;
  readonly ref: string;
}

// ---------------------------------------------------------------------------
// Patterns de detecção (compilados uma vez)
// ---------------------------------------------------------------------------

/** Placeholders de template engine: {{var}}, <%= expr %>, ${interp} */
const PLACEHOLDER_PATTERNS = [
  /\{\{[^}]+\}\}/, // Handlebars/Mustache
  /<%=?\s*[^%]+%>/, // ERB/EJS
  /\$\{[^}]+\}/, // Template literal
] as const;

/** Timestamps embutidos — campo: valor (não dentro de texto descritivo) */
const TIMESTAMP_FIELD_PATTERN = /^(?:generated|created|updated)At\s*:/m;

/** Bloco de código fenced (``` ou ~~~) */
const FENCED_CODE_BLOCK = /^(`{3,}|~{3,})/;

// ---------------------------------------------------------------------------
// Assertion
// ---------------------------------------------------------------------------

/**
 * Valida conteúdo Markdown de um partial.
 *
 * Erros estáveis:
 *  - RECIPE_PARTIAL_INVALID_MARKDOWN: conteúdo vazio, só whitespace,
 *    ou estrutura Markdown aberta (bloco de código sem fechamento).
 *  - RECIPE_PARTIAL_HAS_PLACEHOLDER: contém {{var}}, <%= %>, ou ${}.
 *  - RECIPE_PARTIAL_HAS_TIMESTAMP: contém campo generatedAt/createdAt/
 *    updatedAt como campo (não menção textual).
 */
export function assertValidPartialMarkdown(
  content: string,
  ref: string
): asserts content is PartialContent {
  // --- Invariante 1: não-vazio ---
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    throw new GovernanceError(
      "RECIPE_PARTIAL_INVALID_MARKDOWN",
      `Partial '${ref}': conteúdo vazio ou apenas whitespace.`
    );
  }

  // --- Invariante 1b: estruturas fechadas (code blocks) ---
  assertNoOpenCodeBlocks(content, ref);

  // --- Invariante 4: sem placeholders (fora de code blocks) ---
  assertNoPlaceholders(content, ref);

  // --- Invariante 5: sem timestamps embutidos ---
  assertNoTimestampFields(content, ref);
}

/**
 * Verifica que blocos de código fenced estão todos fechados.
 */
function assertNoOpenCodeBlocks(content: string, ref: string): void {
  const lines = content.split("\n");
  let inCodeBlock = false;
  let opener = "";

  for (const line of lines) {
    const trimmedLine = line.trim();
    const match = trimmedLine.match(FENCED_CODE_BLOCK);

    if (match) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        opener = match[1];
      } else if (trimmedLine.startsWith(opener[0]) && trimmedLine.length >= opener.length) {
        // Fechamento: mesma quantidade ou mais de backticks/tildes
        const closerMatch = trimmedLine.match(FENCED_CODE_BLOCK);
        if (
          closerMatch &&
          closerMatch[1][0] === opener[0] &&
          closerMatch[1].length >= opener.length
        ) {
          inCodeBlock = false;
          opener = "";
        }
      }
    }
  }

  if (inCodeBlock) {
    throw new GovernanceError(
      "RECIPE_PARTIAL_INVALID_MARKDOWN",
      `Partial '${ref}': bloco de código fenced não-fechado (aberto com '${opener}').`
    );
  }
}

/**
 * Verifica ausência de placeholders de template fora de code blocks.
 * Placeholders dentro de code blocks são código legítimo.
 */
function assertNoPlaceholders(content: string, ref: string): void {
  const lines = content.split("\n");
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    const match = trimmedLine.match(FENCED_CODE_BLOCK);

    if (match) {
      if (!inCodeBlock) {
        inCodeBlock = true;
      } else {
        inCodeBlock = false;
      }
      continue;
    }

    if (inCodeBlock) continue;

    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(line)) {
        throw new GovernanceError(
          "RECIPE_PARTIAL_HAS_PLACEHOLDER",
          `Partial '${ref}': contém placeholder não-resolvido (padrão '{{', '<%=', ou '\${}'). Partial deve ser Markdown determinístico — sem variáveis de template.`
        );
      }
    }
  }
}

/**
 * Verifica ausência de campos de timestamp embutidos.
 * Menções textuais (ex.: "O campo `createdAt` é imutável") são aceitas —
 * só rejeita o padrão `createdAt:` no início de linha (campo YAML/frontmatter).
 */
function assertNoTimestampFields(content: string, ref: string): void {
  // Extrai linhas fora de code blocks
  const lines = content.split("\n");
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    const match = trimmedLine.match(FENCED_CODE_BLOCK);

    if (match) {
      if (!inCodeBlock) {
        inCodeBlock = true;
      } else {
        inCodeBlock = false;
      }
      continue;
    }

    if (inCodeBlock) continue;

    // Rejeita campo timestamp fora de inline code (backtick)
    // Se a linha contém `createdAt` entre backticks, é menção textual
    const lineWithoutInlineCode = line.replace(/`[^`]+`/g, "");
    if (TIMESTAMP_FIELD_PATTERN.test(lineWithoutInlineCode)) {
      throw new GovernanceError(
        "RECIPE_PARTIAL_HAS_TIMESTAMP",
        `Partial '${ref}': contém campo de timestamp embutido (generatedAt/createdAt/updatedAt). Partial determinístico não deve conter timestamps (ADR 0004).`
      );
    }
  }
}
