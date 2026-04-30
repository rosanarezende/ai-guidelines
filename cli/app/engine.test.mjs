import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { execute } from "#app/engine";

describe("app/engine", () => {
  it("DADO modo inválido QUANDO execute ENTÃO lança erro de comando não suportado", async () => {
    await assert.rejects(() => execute("invalid", {}), /Comando não suportado/);
  });
});
