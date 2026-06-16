/**
 * Conflict guard de `init`: paths cuja pré-existência aborta um `init` sem
 * `--force` (o usuário deve usar `adopt` ou `--force`).
 *
 * Migrado de `assertSafeInitTarget` (`cli/governance/agents-merge.mjs`) + a lista
 * de conflitos de `cli/app/engine.mjs` (Spec 0024 · CO-3.5). PURO: a DETECÇÃO de
 * quais paths existem é IO (snapshot, produzido pela infraestrutura); aqui só a
 * decisão. Modelado como efeito `assert-init-safe` no plano — o adapter apenas
 * executa a asserção, não decide.
 */
export const INIT_GUARDED_PATHS: readonly string[] = [
  "AGENTS.md",
  ".gitattributes",
  ".prettierignore",
  ".husky",
  "package.json",
  ".github/workflows/ai-guidelines-ci.yml",
];

export function assertInitSafe(conflicts: readonly string[], force: boolean): void {
  if (conflicts.length > 0 && !force) {
    throw new Error(
      `init encontrou arquivos já presentes (${conflicts.join(", ")}). ` +
        `Use --force ou adote o repositório com o comando "adopt".`
    );
  }
}
