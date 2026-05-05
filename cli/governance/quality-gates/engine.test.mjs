import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import { runQualityGates, buildRuleDetectorsMap } from "./engine.mjs";
import { tagDetectors } from "./detectors.mjs";

describe("Quality Gates Engine", () => {
  it("DADO um catálogo com tags relevantes QUANDO o mapa de detectores é construído ENTÃO associa a regra ao detector correspondente", () => {
    const mockCatalog = {
      rules: [
        { id: "GR-0001", tags: ["typing", "foo"] },
        { id: "GR-0002", tags: ["bar"] },
        { id: "GR-0003", tags: ["errors"] },
      ],
    };

    const map = buildRuleDetectorsMap(mockCatalog);
    assert.equal(map.length, 2);
    assert.equal(map[0].ruleId, "GR-0001");
    assert.equal(map[0].detector, tagDetectors.typing);
    assert.equal(map[1].ruleId, "GR-0003");
    assert.equal(map[1].detector, tagDetectors.errors);
  });

  it("DADO arquivos com violações QUANDO runQualityGates é executado ENTÃO retorna as violações apontando para o ID da regra", async () => {
    const tmpCatalog = path.join(process.cwd(), ".tmp-mock-rules.json");
    await fs.writeFile(
      tmpCatalog,
      JSON.stringify({
        rules: [
          { id: "GR-TYPE-01", tags: ["typing"] },
          { id: "GR-ERR-01", tags: ["errors"] },
        ],
      })
    );

    const tmpFile = path.join(process.cwd(), ".tmp-mock-file.ts");
    await fs.writeFile(tmpFile, "try {} catch(e) {} const a = b as any;");

    const result = await runQualityGates([tmpFile], tmpCatalog);

    assert.equal(result.violations.length, 2);
    assert(result.violations.some((v) => v.ruleId === "GR-TYPE-01" && v.file === tmpFile));
    assert(result.violations.some((v) => v.ruleId === "GR-ERR-01" && v.file === tmpFile));

    await fs.unlink(tmpCatalog);
    await fs.unlink(tmpFile);
  });
});
