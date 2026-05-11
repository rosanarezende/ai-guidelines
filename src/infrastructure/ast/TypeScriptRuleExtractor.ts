/**
 * Implementação concreta do {@link RuleExtractor} via TypeScript Compiler API.
 *
 * Boundary contract: o package `typescript` só é importável sob este path
 * (`src/infrastructure/ast/`). Aplica ADR 0004 — análise estática AST como
 * SSOT de artefatos derivados de código.
 *
 * Algoritmo:
 *  1. Lê cada arquivo `.test.ts` com `ts.createSourceFile`.
 *  2. Caminha o AST procurando `CallExpression` cujo callee é `Identifier("it"|"test")`
 *     ou `PropertyAccessExpression("it.skip"|"test.skip")`.
 *  3. Extrai a primeira string literal do `arguments[0]` e busca o padrão
 *     `[BR-CLI-*]` no conteúdo.
 *  4. Deriva `coverageState` sintaticamente (skip → pending; senão → covered).
 *  5. Popula `boundedContext`/`domain` por convenção de path:
 *     `src/<layer>/<boundedContext>/<Domain>.test.ts`.
 *
 * False-positive guard estrutural: arquivos fora de `.test.ts` são
 * ignorados; ID em comentário/string de produção não é alcançável porque
 * o walker só inspeciona argumentos de `it`/`test`. Cobertura adicional
 * de false positives entra em 3.B.c.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import ts from "typescript";
import type { RuleExtractor } from "../../app/ports/RuleExtractor.js";
import { GovernanceError } from "../../domain/shared/errors.js";
import type { CoverageState, LivingDocsEntry } from "../../domain/living-docs/LivingDocsEntry.js";

const RULE_ID_PATTERN = /\[(BR-CLI-[A-Z0-9-]+)\]/;
const TEST_CALL_NAMES = new Set(["it", "test"]);
const DESCRIBE_CALL_NAME = "describe";

/** Resultado intermediário do walker antes de virar `LivingDocsEntry`. */
interface ExtractedCall {
  readonly ruleId: string;
  readonly title: string;
  readonly coverageState: CoverageState;
  readonly lineStart: number;
  readonly lineEnd: number;
  readonly tags: readonly string[];
}

export class TypeScriptRuleExtractor implements RuleExtractor {
  constructor(private readonly repoRoot: string) {}

  extract(files: readonly string[]): readonly LivingDocsEntry[] {
    const entries: LivingDocsEntry[] = [];
    for (const file of files) {
      if (!file.endsWith(".test.ts")) continue;
      if (!fs.existsSync(file)) {
        throw new GovernanceError(
          "LIVING_DOCS_EXTRACTOR_FILE_NOT_FOUND",
          `Living Docs extractor: arquivo não encontrado: ${file}`
        );
      }
      const content = fs.readFileSync(file, "utf-8");
      const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

      const relPath = path.relative(this.repoRoot, file).split(path.sep).join("/");
      const { boundedContext, domain } = this.deriveLocation(relPath);

      const calls = this.collectTestCalls(sourceFile);
      for (const call of calls) {
        entries.push({
          ruleId: call.ruleId,
          title: call.title,
          boundedContext,
          domain,
          source: { file: relPath, lineStart: call.lineStart, lineEnd: call.lineEnd },
          tags: call.tags,
          coverageState: call.coverageState,
        });
      }
    }
    return entries;
  }

  /**
   * Convenção:
   * `src/<layer>/<boundedContext>/<File>.test.ts`
   *   → boundedContext = `<boundedContext>`, domain = `<File>` (sem `.test.ts`).
   * Fallbacks: se o path não casar com `src/<layer>/<bc>/...`, usa o último
   * segmento como `boundedContext` e o nome do arquivo como `domain`.
   */
  private deriveLocation(relPath: string): { boundedContext: string; domain: string } {
    const segments = relPath.split("/");
    const fileName = segments[segments.length - 1];
    const domain = fileName.replace(/\.test\.ts$/, "");

    // src / <layer> / <boundedContext> / ... / <file>
    if (segments[0] === "src" && segments.length >= 4) {
      return { boundedContext: segments[2], domain };
    }
    // Fallback: penúltimo segmento como boundedContext, ou "unknown"
    const fallbackBc = segments.length >= 2 ? segments[segments.length - 2] : "unknown";
    return { boundedContext: fallbackBc, domain };
  }

  private collectTestCalls(sourceFile: ts.SourceFile): ExtractedCall[] {
    const calls: ExtractedCall[] = [];

    const visit = (node: ts.Node, describeStack: readonly string[]): void => {
      if (ts.isCallExpression(node)) {
        // describe('Nome', () => { ... }) → empilha 'Nome' para os descendentes
        const describeName = this.extractDescribeLabel(node);
        if (describeName !== null) {
          const nextStack = [...describeStack, describeName];
          ts.forEachChild(node, (child) => visit(child, nextStack));
          return;
        }

        const meta = this.classifyTestCall(node);
        if (meta !== null) {
          const titleArg = node.arguments[0];
          if (titleArg !== undefined && ts.isStringLiteralLike(titleArg)) {
            const fullText = titleArg.text;
            const match = RULE_ID_PATTERN.exec(fullText);
            if (match !== null) {
              const { lineStart, lineEnd } = this.lineRangeOf(sourceFile, node);
              calls.push({
                ruleId: match[1],
                title: fullText.replace(RULE_ID_PATTERN, "").trim(),
                coverageState: meta.coverageState,
                lineStart,
                lineEnd,
                tags: [...describeStack],
              });
            }
          }
        }
      }
      ts.forEachChild(node, (child) => visit(child, describeStack));
    };

    visit(sourceFile, []);
    return calls;
  }

  /**
   * Se o node é um `describe('Nome', ...)`, retorna 'Nome'. Senão `null`.
   * Aceita `describe(...)` e `describe.skip(...)` / `describe.only(...)`
   * — todos têm o nome no primeiro argumento.
   */
  private extractDescribeLabel(node: ts.CallExpression): string | null {
    const expr = node.expression;
    let isDescribe = false;
    if (ts.isIdentifier(expr) && expr.text === DESCRIBE_CALL_NAME) {
      isDescribe = true;
    } else if (
      ts.isPropertyAccessExpression(expr) &&
      ts.isIdentifier(expr.expression) &&
      expr.expression.text === DESCRIBE_CALL_NAME
    ) {
      isDescribe = true;
    }
    if (!isDescribe) return null;

    const labelArg = node.arguments[0];
    if (labelArg !== undefined && ts.isStringLiteralLike(labelArg)) {
      return labelArg.text;
    }
    return null;
  }

  /**
   * Linhas 1-indexed, inclusivas. `lineStart` é a linha do call site
   * inteiro (não da string-argumento); `lineEnd` é a linha do `)` final.
   */
  private lineRangeOf(
    sourceFile: ts.SourceFile,
    node: ts.CallExpression
  ): { lineStart: number; lineEnd: number } {
    const startPos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const endPos = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    return {
      lineStart: startPos.line + 1,
      lineEnd: endPos.line + 1,
    };
  }

  /**
   * Classifica a chamada como `it`/`test` (cobertura `covered`),
   * `it.skip`/`test.skip` (cobertura `pending`), ou retorna `null` se não
   * é call site de teste reconhecido.
   */
  private classifyTestCall(node: ts.CallExpression): { coverageState: CoverageState } | null {
    const expr = node.expression;

    // it(...) ou test(...)
    if (ts.isIdentifier(expr) && TEST_CALL_NAMES.has(expr.text)) {
      return { coverageState: "covered" };
    }

    // it.skip(...) ou test.skip(...)
    if (ts.isPropertyAccessExpression(expr)) {
      const root = expr.expression;
      const member = expr.name.text;
      if (ts.isIdentifier(root) && TEST_CALL_NAMES.has(root.text) && member === "skip") {
        return { coverageState: "pending" };
      }
    }

    return null;
  }
}
