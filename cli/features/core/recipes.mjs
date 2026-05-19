/**
 * Wrapper mjs entre o CLI e a TemplateEngine TS compilada em dist/.
 *
 * Responsabilidades:
 *   - Resolver recipeName a partir do filename do boilerplate legado
 *     (R4: mesmo filename na saída para evitar regressão silenciosa).
 *   - Carregar e rodar AssembleArtifact + NodeRecipeStore via import dinâmico
 *     de dist/ (precedente: cli/living-docs.mjs).
 *   - Aplicar normalize() (E1+E2+E3) antes de gravar.
 *   - Gravar em `<destinationDir>/<sourceFilename>` (mesmo nome do mirror).
 *
 * Não faz fallback silencioso para o mirror em caso de erro de validação —
 * propaga o erro para o caller, que decide. Fallback per-kind acontece
 * apenas quando a recipe **não existe** (rendered: false).
 *
 * Persistência (escrita em disco) e normalização ficam exclusivamente aqui;
 * o domínio TS de src/ permanece puro.
 */

import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { normalize } from "./template-equivalence.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

const RECIPES_SUBDIR = path.join(".core", "governance", "recipes");
const BOILERPLATE_SUFFIX = "-boilerplate.md";

const engineCache = new Map();

// Cache por repoRoot: armazena tanto o engine carregado quanto `null` (sinal
// de que dist/ não existia em uma chamada anterior). Comportamento esperado:
// a CLI roda como processo curto-vivido (init/adopt/update terminam após
// uma rodada); cache não invalida automaticamente. Se `dist/` for criado
// durante o mesmo processo (cenário só relevante em testes de dev), reiniciar
// o processo é o caminho. Sem hot-reload por design (regressão silenciosa
// seria pior que falha explícita).
async function loadEngine(repoRoot) {
  if (engineCache.has(repoRoot)) {
    return engineCache.get(repoRoot);
  }

  const assembleModulePath = path.resolve(repoRoot, "dist/app/use-cases/AssembleArtifact.js");
  const storeModulePath = path.resolve(repoRoot, "dist/infrastructure/yaml/NodeRecipeStore.js");

  if (!existsSync(assembleModulePath) || !existsSync(storeModulePath)) {
    engineCache.set(repoRoot, null);
    return null;
  }

  const [{ AssembleArtifact }, { NodeRecipeStore }] = await Promise.all([
    import(pathToFileURL(assembleModulePath).href),
    import(pathToFileURL(storeModulePath).href),
  ]);

  const engine = { AssembleArtifact, NodeRecipeStore };
  engineCache.set(repoRoot, engine);
  return engine;
}

export function deriveRecipeName(sourceFilename) {
  if (!sourceFilename.endsWith(BOILERPLATE_SUFFIX)) {
    return null;
  }
  return sourceFilename.slice(0, -BOILERPLATE_SUFFIX.length);
}

export function recipeExists(recipeName, repoRoot = DEFAULT_REPO_ROOT) {
  if (!recipeName) return false;
  const recipePath = path.resolve(repoRoot, RECIPES_SUBDIR, `${recipeName}.recipe.yml`);
  return existsSync(recipePath);
}

export async function tryRenderViaEngine({
  sourceFilename,
  destinationDir,
  repoRoot = DEFAULT_REPO_ROOT,
  dryRun = false,
}) {
  const recipeName = deriveRecipeName(sourceFilename);
  if (!recipeName) {
    return { rendered: false, reason: "not-boilerplate" };
  }

  if (!recipeExists(recipeName, repoRoot)) {
    return { rendered: false, reason: "no-recipe", recipeName };
  }

  const engine = await loadEngine(repoRoot);
  if (!engine) {
    return { rendered: false, reason: "engine-unavailable", recipeName };
  }
  const { AssembleArtifact, NodeRecipeStore } = engine;
  const store = new NodeRecipeStore(repoRoot);
  const useCase = new AssembleArtifact({ store });

  const composed = useCase.execute({ recipeName });
  const normalized = normalize(composed.content);
  const outputPath = path.join(destinationDir, sourceFilename);

  if (!dryRun) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, normalized, "utf8");
  }

  return {
    rendered: true,
    recipeName,
    outputPath,
    content: normalized,
    slots: composed.metadata.composedSlots,
  };
}
