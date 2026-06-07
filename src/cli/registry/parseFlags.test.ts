import { parseFlags, stringFlag, boolFlag } from "./parseFlags.js";

describe("parseFlags", () => {
  it("DADO posicionais QUANDO parseFlags ENTÃO preserva ordem e os separa das flags", () => {
    const { positionals, flags } = parseFlags(["publish-state", "extra"]);
    expect(positionals).toEqual(["publish-state", "extra"]);
    expect(flags.size).toBe(0);
  });

  it("DADO --chave=valor QUANDO parseFlags ENTÃO captura como string (qualquer chave)", () => {
    const { flags } = parseFlags(["--status=active", "--updated-by=@rosana"]);
    expect(flags.get("status")).toBe("active");
    expect(flags.get("updated-by")).toBe("@rosana");
  });

  it("DADO --flag declarada booleana QUANDO parseFlags ENTÃO captura como true", () => {
    const { flags } = parseFlags(["--dry-run"], { booleans: ["dry-run"] });
    expect(flags.get("dry-run")).toBe(true);
  });

  it("DADO --chave valor (espaço) p/ chave NÃO booleana QUANDO parseFlags ENTÃO consome o próximo token", () => {
    const { positionals, flags } = parseFlags(["--version", "9.9.9"]);
    expect(flags.get("version")).toBe("9.9.9");
    expect(positionals).toEqual([]); // o valor NÃO vira posicional
  });

  it("DADO mistura posicional + boolean + valor-espaço QUANDO parseFlags ENTÃO separa tudo certo", () => {
    const { positionals, flags } = parseFlags(
      ["publish-state", "--status", "active", "--dry-run"],
      { booleans: ["dry-run"] }
    );
    expect(positionals).toEqual(["publish-state"]);
    expect(flags.get("status")).toBe("active");
    expect(flags.get("dry-run")).toBe(true);
  });

  it("DADO --chave=valor-com-= QUANDO parseFlags ENTÃO só o primeiro = separa", () => {
    const { flags } = parseFlags(["--title=a=b=c"]);
    expect(flags.get("title")).toBe("a=b=c");
  });

  it("DADO chave de valor sem próximo token QUANDO parseFlags ENTÃO lança 'Valor ausente'", () => {
    expect(() => parseFlags(["--version"])).toThrow(/Valor ausente para --version/);
  });

  it("DADO chave de valor seguida de outra flag QUANDO parseFlags ENTÃO lança 'Valor ausente'", () => {
    expect(() => parseFlags(["--version", "--remote=x"])).toThrow(/Valor ausente para --version/);
  });

  describe("helpers", () => {
    it("stringFlag devolve string ou undefined (nunca o boolean)", () => {
      const { flags } = parseFlags(["--version=1.2.3", "--dry-run"], { booleans: ["dry-run"] });
      expect(stringFlag(flags, "version")).toBe("1.2.3");
      expect(stringFlag(flags, "dry-run")).toBeUndefined();
      expect(stringFlag(flags, "ausente")).toBeUndefined();
    });

    it("boolFlag devolve true só quando presente como --flag booleana", () => {
      const { flags } = parseFlags(["--dry-run", "--version=1"], { booleans: ["dry-run"] });
      expect(boolFlag(flags, "dry-run")).toBe(true);
      expect(boolFlag(flags, "version")).toBe(false);
      expect(boolFlag(flags, "ausente")).toBe(false);
    });
  });
});
