import { parseFlags, stringFlag, boolFlag } from "./parseFlags.js";

describe("parseFlags", () => {
  it("DADO posicionais QUANDO parseFlags ENTÃO preserva ordem e os separa das flags", () => {
    const { positionals, flags } = parseFlags(["publish-state", "extra"]);
    expect(positionals).toEqual(["publish-state", "extra"]);
    expect(flags.size).toBe(0);
  });

  it("DADO --chave=valor QUANDO parseFlags ENTÃO captura como string", () => {
    const { flags } = parseFlags(["--status=active", "--updated-by=@rosana"]);
    expect(flags.get("status")).toBe("active");
    expect(flags.get("updated-by")).toBe("@rosana");
  });

  it("DADO --flag sem valor QUANDO parseFlags ENTÃO captura como boolean true", () => {
    const { flags } = parseFlags(["--dry-run"]);
    expect(flags.get("dry-run")).toBe(true);
  });

  it("DADO mistura de posicional + flags QUANDO parseFlags ENTÃO separa corretamente", () => {
    const { positionals, flags } = parseFlags(["publish-state", "--status=active", "--dry-run"]);
    expect(positionals).toEqual(["publish-state"]);
    expect(flags.get("status")).toBe("active");
    expect(flags.get("dry-run")).toBe(true);
  });

  it("DADO --chave=valor-com-=  QUANDO parseFlags ENTÃO só o primeiro = separa", () => {
    const { flags } = parseFlags(["--title=a=b=c"]);
    expect(flags.get("title")).toBe("a=b=c");
  });

  describe("helpers", () => {
    it("stringFlag devolve string ou undefined (nunca o boolean)", () => {
      const { flags } = parseFlags(["--version=1.2.3", "--dry-run"]);
      expect(stringFlag(flags, "version")).toBe("1.2.3");
      expect(stringFlag(flags, "dry-run")).toBeUndefined();
      expect(stringFlag(flags, "ausente")).toBeUndefined();
    });

    it("boolFlag devolve true só quando presente como --flag", () => {
      const { flags } = parseFlags(["--dry-run", "--version=1"]);
      expect(boolFlag(flags, "dry-run")).toBe(true);
      expect(boolFlag(flags, "version")).toBe(false);
      expect(boolFlag(flags, "ausente")).toBe(false);
    });
  });
});
