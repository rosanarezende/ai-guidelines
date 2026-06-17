import { ValidateCommand } from "./ValidateCommand.js";

describe("ValidateCommand", () => {
  it("parseia validate changed sem flags", () => {
    expect(new ValidateCommand().parse(["changed"])).toEqual({ kind: "changed" });
  });

  it("parseia validate changed com --fix e --base", () => {
    expect(new ValidateCommand().parse(["changed", "--fix", "--base", "origin/main"])).toEqual({
      kind: "changed",
      fix: true,
      base: "origin/main",
    });
  });

  it("falha para subcomando desconhecido", () => {
    expect(() => new ValidateCommand().parse(["full"])).toThrow(/validate changed/);
  });

  it("falha para flag desconhecida", () => {
    expect(() => new ValidateCommand().parse(["changed", "--all=true"])).toThrow(
      /Flag desconhecida/
    );
  });
});
