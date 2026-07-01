// pull-models.ts — puxa os modelos LOCAIS (Ollama) da escada de viabilidade do matcher. Uso: `node pull-models.ts`
// (ou `npm run models:pull` de acme-governance). Lista EDITÁVEL. Requer o Ollama no ar (`ollama serve`). Ver MATCHER.md.
import { execSync } from "node:child_process";

const MODELS: [string, string][] = [
  ["nomic-embed-text", "tier 1 — embedding (ranking semântico) · ~270MB"],
  ["qwen3:1.7b", "tier 2 simples · ~1.4GB"],
  ["qwen3:4b", "tier 2 médio · ~2.6GB"],
  ["gemma3:12b", "tier 2 alto · ~8GB (RTX 3060 12GB: justo, roda)"],
];

let ok = 0;
for (const [model, note] of MODELS) {
  console.log(`\n⬇️  ${model}  (${note})`);
  try {
    execSync(`ollama pull ${model}`, { stdio: "inherit" });
    ok++;
  } catch {
    console.error(`✗ falhou: ${model} — o Ollama está no ar? (\`ollama serve\`)`);
  }
}
console.log(
  `\n✓ ${ok}/${MODELS.length} puxados. Confira: \`ollama list\`. Ative um no matcher.yml (ver MATCHER.md).`
);
