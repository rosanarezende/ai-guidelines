/**
 * Gate de equivalência byte-a-byte: tasks-evidence-driven via engine
 * deve produzir o mesmo conteúdo (após normalização) que o boilerplate
 * legado em .specify/templates/tasks-evidence-driven-boilerplate.md.
 *
 * Implementa o exit gate de 4.C.0.b: prova viva que a primeira recipe
 * materializada é equivalente ao mirror em produção.
 *
 * Normalizer aplicado (E1+E2+E3, alinhado com cli/features/core/template-equivalence.mjs):
 *   - CRLF/CR → LF
 *   - trailing whitespace por linha removido
 *   - exatamente uma newline final
 *
 * Importar o normalizer mjs em ts-jest gera fricção desnecessária com
 * resolução ESM; a implementação aqui é mínima e bisimulada nos testes
 * mjs (cli/features/core/template-equivalence.test.mjs).
 */
import * as fs from "node:fs";
import * as path from "node:path";

import { AssembleArtifact } from "../../app/use-cases/AssembleArtifact.js";
import { NodeRecipeStore } from "./NodeRecipeStore.js";

const ROOT_DIR = process.cwd();
const LEGACY_BOILERPLATE_PATH = path.join(
  ROOT_DIR,
  ".specify",
  "templates",
  "tasks-evidence-driven-boilerplate.md"
);

function normalize(content: string): string {
  let result = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  result = result
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n");
  result = result.replace(/\n+$/, "") + "\n";
  return result;
}

describe("TasksEvidenceDriven Engine Equivalence [4.C.0.b]", () => {
  it("DADO recipe tasks-evidence-driven QUANDO assembled ENTÃO output é byte-equivalente ao boilerplate legado após normalização", () => {
    const store = new NodeRecipeStore(ROOT_DIR);
    const useCase = new AssembleArtifact({ store });

    const composed = useCase.execute({ recipeName: "tasks-evidence-driven" });
    const engineOutput = normalize(composed.content);

    const legacyContent = normalize(fs.readFileSync(LEGACY_BOILERPLATE_PATH, "utf-8"));

    expect(engineOutput).toEqual(legacyContent);
  });

  it("DADO recipe tasks-evidence-driven QUANDO assembled ENTÃO metadata reflete artifactKind/language corretos", () => {
    const store = new NodeRecipeStore(ROOT_DIR);
    const useCase = new AssembleArtifact({ store });

    const composed = useCase.execute({ recipeName: "tasks-evidence-driven" });

    expect(composed.metadata.artifactKind).toBe("tasks");
    expect(composed.metadata.language).toBe("pt-BR");
    expect(composed.metadata.composedSlots).toHaveLength(10);
  });
});
