import { parseConsumerConfig, resolveConfig } from "./ConsumerConfig.js";

const target = "/repo";

describe("domain/provisioning/ConsumerConfig (paridade com resolveAiGuidelinesConfig)", () => {
  describe("parseConsumerConfig", () => {
    it("DADO null/vazio/JSON inválido ENTÃO retorna null", () => {
      expect(parseConsumerConfig(null)).toBeNull();
      expect(parseConsumerConfig("")).toBeNull();
      expect(parseConsumerConfig("{quebrado")).toBeNull();
    });
    it("DADO JSON válido ENTÃO retorna o objeto", () => {
      expect(parseConsumerConfig('{"lang":"en"}')).toEqual({ lang: "en" });
    });
  });

  describe("resolveConfig", () => {
    it("DADO nada descoberto nem opções ENTÃO usa defaults", () => {
      expect(resolveConfig(null, {}, target)).toEqual({
        sdd_dir: ".ai-guidelines",
        providers: ["claude", "gemini", "openai"],
        features: [],
        lang: "pt",
      });
    });

    it("DADO opções ENTÃO sobrescrevem a config descoberta (sdd_dir vem do disco se não passado)", () => {
      const resolved = resolveConfig(
        { sdd_dir: ".x", providers: ["claude"], features: ["tdd"], lang: "en" },
        { providers: "gemini", features: "bdd", lang: "pt" },
        target
      );
      expect(resolved).toEqual({
        sdd_dir: ".x",
        providers: ["gemini"],
        features: ["bdd"],
        lang: "pt",
      });
    });

    it("DADO modo providers com --providers ENTÃO faz append à lista existente (ex-comando providers)", () => {
      const resolved = resolveConfig(
        { providers: ["claude"] },
        { mode: "providers", providers: "gemini" },
        target
      );
      expect(resolved.providers).toEqual(["claude", "gemini"]);
    });

    it("DADO modo update com --providers ENTÃO substitui (NÃO faz append)", () => {
      const resolved = resolveConfig(
        { providers: ["claude"] },
        { mode: "update", providers: "gemini" },
        target
      );
      expect(resolved.providers).toEqual(["gemini"]);
    });

    it("DADO modo providers com --prune ENTÃO NÃO faz append (substitui)", () => {
      const resolved = resolveConfig(
        { providers: ["claude"] },
        { mode: "providers", providers: "gemini", prune: true },
        target
      );
      expect(resolved.providers).toEqual(["gemini"]);
    });

    it("DADO sdd_dir inseguro ENTÃO lança", () => {
      expect(() => resolveConfig({ sdd_dir: "../../etc" }, {}, target)).toThrow(
        /dentro do targetDir/
      );
    });
  });
});
