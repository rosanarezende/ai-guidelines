import { NodeClipboard } from "./NodeClipboard.js";

describe("Infrastructure — NodeClipboard [BR-INFRA-CLIPBOARD]", () => {
  it("DADO detector retornando null QUANDO copy ENTÃO retorna false sem throw", async () => {
    const clipboard = new NodeClipboard(() => null);

    const result = await clipboard.copy("hello");

    expect(result).toBe(false);
  });

  it("DADO comando inexistente QUANDO copy ENTÃO retorna false (fail-graceful) sem throw", async () => {
    const clipboard = new NodeClipboard(() => ({
      command: "comando-que-nao-existe-no-sistema-xyz",
      args: [],
    }));

    const result = await clipboard.copy("hello");

    expect(result).toBe(false);
  });

  it("DADO detector retornando comando válido (cat como echo no-op) QUANDO copy ENTÃO retorna true", async () => {
    const clipboard = new NodeClipboard(() => ({
      command: "cat",
      args: [],
    }));

    const result = await clipboard.copy("hello");

    expect(result).toBe(true);
  });
});
