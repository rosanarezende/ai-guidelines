import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ROOT_DIR } from "#core/file-system";

const RULES_DIR = path.join(ROOT_DIR, ".core", "rules");

// Padrões de links markdown cujos alvos não existem em .ai-guidelines/ no
// consumidor pós-adopt. Spec 0005 estabeleceu que só .core/rules/ sincroniza
// para .ai-guidelines/rules/; .core/docs/ e paths legados (for-claude/,
// for-gemini/, for-codex/, .ai-runtime/, rules/ sem prefixo .ai-guidelines/)
// nunca chegam ao consumidor. Qualquer link markdown para esses paths
// quebra na leitura feita pelo agente no repo consumidor.
const BROKEN_LINK_PATTERNS = [
  { label: "docs/", regex: /\]\(docs\//g },
  { label: "for-claude/", regex: /\]\(for-claude\//g },
  { label: "for-gemini/", regex: /\]\(for-gemini\//g },
  { label: "for-codex/", regex: /\]\(for-codex\//g },
  { label: ".ai-runtime/", regex: /\]\(\.ai-runtime\//g },
  { label: "process/", regex: /\]\(process\//g },
];

describe("Feature: Governance Coherence (Editorial Validation) [BR-GOV-COH]", () => {
  it("[BR-GOV-COH-01] DADO arquivos em .core/rules/ QUANDO validados ENTÃO não contêm links markdown para paths inexistentes no consumidor", async () => {
    const dirents = await fs.readdir(RULES_DIR, { recursive: true, withFileTypes: true });
    const files = dirents
      .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".md"))
      .map((dirent) =>
        path.relative(RULES_DIR, path.join(dirent.path || dirent.parentPath || "", dirent.name))
      );

    const violations = [];

    for (const file of files) {
      const filePath = path.join(RULES_DIR, file);
      const content = await fs.readFile(filePath, "utf8");

      for (const { label, regex } of BROKEN_LINK_PATTERNS) {
        const matches = content.match(regex);
        if (matches) {
          violations.push(`${file}: ${matches.length}x '${label}'`);
        }
      }
    }

    assert.deepStrictEqual(
      violations,
      [],
      `Links markdown quebrados em .core/rules/ (caminho não existe em .ai-guidelines/ pós-adopt):\n${violations.join("\n")}`
    );
  });
});
