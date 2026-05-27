/**
 * Forcing function anti-skip-silencioso (cf. [DEC-0023-O02]).
 *
 * Detecta testes pulados (`it.skip`/`test.skip`/`describe.skip` e as formas
 * `xit`/`xtest`/`xdescribe`) cujo título carrega um ID de decisão arquitetural
 * (`[DEC-NNNN-XYZ]` ou `[ADR-NNNN]`). Esses skips são a classe de risco que
 * originou o `[DEC-0023-O01]`: invisíveis ao living-docs (o extractor só captura
 * `[BR-CLI-*]`), eles enterram um comportamento decidido num TODO silencioso que
 * nenhum gate enxerga.
 *
 * Boundary AST (ADR 0013): o package `typescript` só é importável sob
 * `src/infrastructure/ast/`. Por usar AST (não regex sobre texto), tags de
 * decisão dentro de **template strings** (fixtures dos próprios testes do
 * RuleExtractor) NÃO geram falso-positivo — o conteúdo do template literal é um
 * único token, não percorrido como `CallExpression`.
 *
 * ADR 0018: determinístico, sem LLM. Apenas leitura + análise estática.
 */
import * as fs from "node:fs";
import ts from "typescript";

const DECISION_TAG = /\[(DEC-[0-9]{4}-[A-Z0-9]+|ADR-[0-9]{4})\]/;
const TEST_ROOTS = new Set(["it", "test", "describe"]);
const X_PREFIX_SKIPS = new Set(["xit", "xtest", "xdescribe"]);

export interface DecisionTaggedSkip {
  readonly file: string;
  readonly line: number;
  readonly tag: string;
  readonly title: string;
}

/**
 * Varre os arquivos `.test.ts` informados e retorna os skips cujo título
 * carrega um ID de decisão. Lista vazia = invariante satisfeita.
 */
export function findDecisionTaggedSkips(files: readonly string[]): DecisionTaggedSkip[] {
  const found: DecisionTaggedSkip[] = [];
  for (const file of files) {
    if (!file.endsWith(".test.ts")) continue;
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf-8");
    const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && isSkipCall(node.expression)) {
        const titleArg = node.arguments[0];
        if (titleArg !== undefined && ts.isStringLiteralLike(titleArg)) {
          const match = DECISION_TAG.exec(titleArg.text);
          if (match) {
            const line =
              sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
            found.push({ file, line, tag: match[1], title: titleArg.text });
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }
  return found;
}

/** Formata os achados como mensagem de erro acionável para o gate. */
export function formatDecisionTaggedSkips(skips: readonly DecisionTaggedSkip[]): string {
  const lines = skips.map((s) => `  - ${s.file}:${s.line} — [${s.tag}] "${s.title}"`);
  return [
    `Encontrados ${skips.length} it.skip carregando ID de decisão (invisíveis ao living-docs):`,
    ...lines,
    "",
    "Um skip com ID de decisão enterra comportamento decidido num TODO silencioso.",
    "Resolva uma das opções (cf. [DEC-0023-O02]):",
    "  (a) implemente o comportamento e torne o teste verde;",
    "  (b) se já é coberto vivo em outro lugar, remova o skip e aponte o teste vivo;",
    "  (c) se o design foi superado, retire o skip com nota explicando.",
  ].join("\n");
}

function isSkipCall(expr: ts.Expression): boolean {
  // it.skip / test.skip / describe.skip
  if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.expression)) {
    return TEST_ROOTS.has(expr.expression.text) && expr.name.text === "skip";
  }
  // xit / xtest / xdescribe
  if (ts.isIdentifier(expr)) {
    return X_PREFIX_SKIPS.has(expr.text);
  }
  return false;
}
