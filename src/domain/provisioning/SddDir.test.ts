import path from "node:path";
import { DEFAULT_SDD_DIR, getConfigPath, validateSddDir } from "./SddDir.js";

describe("domain/provisioning/SddDir (paridade com cli/features/core/config)", () => {
  const target = "/repo";

  it("DADO sdd_dir relativo contido ENTÃO valida sem erro", () => {
    expect(() => validateSddDir(".ai-guidelines", target)).not.toThrow();
    expect(() => validateSddDir("packages/app/.ai-guidelines", target)).not.toThrow();
  });

  it("DADO sdd_dir vazio/não-string ENTÃO lança", () => {
    expect(() => validateSddDir("", target)).toThrow(/não-vazia/);
    expect(() => validateSddDir(undefined, target)).toThrow(/não-vazia/);
  });

  it("DADO sdd_dir absoluto ENTÃO lança", () => {
    expect(() => validateSddDir("/etc", target)).toThrow(/absoluto/);
  });

  it("DADO sdd_dir que escapa do target ENTÃO lança", () => {
    expect(() => validateSddDir("../../etc", target)).toThrow(/dentro do targetDir/);
  });

  it("getConfigPath compõe targetDir/sddDir/config.json", () => {
    expect(getConfigPath(target, ".ai-guidelines")).toBe(
      path.join(target, ".ai-guidelines", "config.json")
    );
    expect(getConfigPath(target)).toBe(path.join(target, DEFAULT_SDD_DIR, "config.json"));
  });
});
