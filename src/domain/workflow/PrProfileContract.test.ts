import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PR_BODY_PROFILES } from "./PrProfileContract.js";

describe("PrProfileContract — Coherence Guard", () => {
  it("templates must exist and contain all required sections", () => {
    const rootDir = path.resolve(__dirname, "../../../");

    for (const profile of Object.values(PR_BODY_PROFILES)) {
      const templatePath = path.join(rootDir, profile.templatePath);
      expect(existsSync(templatePath)).toBe(true);

      const content = readFileSync(templatePath, "utf-8");

      // All draft sections must be in the template
      for (const section of profile.draftSections) {
        expect(content).toContain(section);
      }

      // All ready sections must be in the template
      for (const section of profile.readySections) {
        expect(content).toContain(section);
      }
    }
  });

  it("every section in a profile (except sub-headers) must be classified as preserved, final or mutable", () => {
    for (const profile of Object.values(PR_BODY_PROFILES)) {
      const allHeaders = [...profile.draftSections, ...profile.readySections].filter((s) =>
        s.startsWith("## ")
      ); // Only level 2 headers

      for (const header of allHeaders) {
        const isPreserved = profile.preservedBaselines.includes(header);
        const isFinal = profile.finalSections.includes(header);
        const isMutable = profile.mutableSections.includes(header);

        const isClassified = isPreserved || isFinal || isMutable;

        expect({ profile: profile.name, header, isClassified }).toEqual({
          profile: profile.name,
          header,
          isClassified: true,
        });
      }
    }
  });

  it("preserved baselines must only belong to profiles that require them", () => {
    // Only execution and governance have preserved baselines
    expect(PR_BODY_PROFILES.execution.preservedBaselines).toEqual(["## Visão pretendida"]);
    expect(PR_BODY_PROFILES.governance.preservedBaselines).toEqual([
      "## Visão de valor",
      "## Arquitetura pretendida",
    ]);
    expect(PR_BODY_PROFILES.integration.preservedBaselines).toEqual([]);
    expect(PR_BODY_PROFILES["fast-track"].preservedBaselines).toEqual([]);
  });
});
