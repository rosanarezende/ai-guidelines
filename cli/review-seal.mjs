#!/usr/bin/env node
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const compiledModule = resolve(repoRoot, "dist/cli/reviewSeal.js");

if (!existsSync(compiledModule)) {
  process.stderr.write(
    `❌ [review:seal] Módulo compilado ausente em ${compiledModule}.\n   Execute \`npm run build\` antes de invocar este comando.\n`
  );
  process.exit(2);
}

const { sealReview } = await import(compiledModule);

try {
  const { values } = parseArgs({
    options: {
      file: { type: "string" },
    },
    strict: true,
  });

  if (!values.file) {
    process.stderr.write(
      `❌ [review:seal] Argumento obrigatório --file ausente.\n   Exemplo: npm run review:seal -- --file .governance/specs/.../reviews/c-foo.yml\n`
    );
    process.exit(2);
  }

  const exitCode = sealReview(resolve(process.cwd(), values.file));
  process.exit(exitCode);
} catch (e) {
  process.stderr.write(`❌ [review:seal] Erro de execução: ${e.message}\n`);
  process.exit(2);
}
