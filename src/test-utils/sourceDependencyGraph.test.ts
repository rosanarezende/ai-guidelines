import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  collectSourceDependencyGraph,
  extractSourceDependencyReferences,
  transitiveSourceFiles,
} from "./sourceDependencyGraph.js";

describe("sourceDependencyGraph", () => {
  it("reconhece imports, reexports, import dinâmico e require", () => {
    const references = extractSourceDependencyReferences(
      [
        'import { alpha } from "./alpha.js";',
        'export { beta } from "./beta.js";',
        'import "./side-effect.js";',
        'const dynamic = import("./dynamic.js");',
        'const legacy = require("./legacy.js");',
      ].join("\n")
    );

    expect(references).toEqual(
      expect.arrayContaining([
        { kind: "static", specifier: "./alpha.js" },
        { kind: "static", specifier: "./beta.js" },
        { kind: "side-effect", specifier: "./side-effect.js" },
        { kind: "dynamic", specifier: "./dynamic.js" },
        { kind: "require", specifier: "./legacy.js" },
      ])
    );
  });

  it("resolve reexports e percorre o fechamento transitivo", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "source-dependency-graph-"));
    try {
      fs.writeFileSync(path.join(root, "entry.ts"), 'export { middle } from "./middle.js";\n');
      fs.writeFileSync(
        path.join(root, "middle.ts"),
        'import { leaf } from "./leaf.js";\nexport const middle = leaf;\n'
      );
      fs.writeFileSync(path.join(root, "leaf.ts"), 'export const leaf = "leaf";\n');

      const graph = collectSourceDependencyGraph(root);
      const closure = transitiveSourceFiles(graph, path.join(root, "entry.ts"));

      expect(closure.map((file) => path.basename(file))).toEqual([
        "entry.ts",
        "leaf.ts",
        "middle.ts",
      ]);
      expect(graph.references).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sourceFile: path.join(root, "entry.ts"),
            specifier: "./middle.js",
            targetFile: path.join(root, "middle.ts"),
          }),
        ])
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
