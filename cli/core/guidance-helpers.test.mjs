import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFormatterRivalGuidance, buildMonorepoGuidance } from "./guidance-helpers.mjs";

describe("guidance-helpers", () => {
  describe("buildFormatterRivalGuidance", () => {
    it("[BR-GUI-01] DADO contexto sem rival ENTÃO retorna lista vazia", () => {
      const guidance = buildFormatterRivalGuidance({ rival: null });
      assert.deepEqual(guidance, []);
    });

    it("[BR-GUI-02] DADO contexto com rival ENTÃO retorna mensagens de alerta", () => {
      const guidance = buildFormatterRivalGuidance({
        rival: { label: "Biome" },
      });
      assert.ok(guidance.length > 0);
      assert.ok(guidance[0].includes("Biome"));
    });
  });

  describe("buildMonorepoGuidance", () => {
    it("[BR-GUI-03] DADO contexto sem monorepo ENTÃO retorna lista vazia", () => {
      const guidance = buildMonorepoGuidance({ isMonorepo: false });
      assert.deepEqual(guidance, []);
    });

    it("[BR-GUI-04] DADO contexto com monorepo ENTÃO retorna mensagens de alerta", () => {
      const guidance = buildMonorepoGuidance({
        isMonorepo: true,
        type: "pnpm",
      });
      assert.ok(guidance.length > 0);
      assert.ok(guidance[0].includes("pnpm"));
    });
  });
});
