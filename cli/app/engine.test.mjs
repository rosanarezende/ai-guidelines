import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { execute, main } from "#app/engine";

describe("app/engine", () => {
  it("DADO modo inválido QUANDO execute ENTÃO lança erro de comando não suportado", async () => {
    await assert.rejects(() => execute("invalid", {}), /Comando não suportado/);
  });

  it("DADO dist/ ausente E um comando do registry QUANDO main ENTÃO falha pedindo build (não cai no wizard de bootstrap — auditoria #35 #3)", async () => {
    const errors = [];
    const originalError = console.error;
    const previousExitCode = process.exitCode;
    console.error = (msg) => errors.push(String(msg));
    try {
      await main(["workflow"], { loadRegistry: async () => null });
    } finally {
      console.error = originalError;
      process.exitCode = previousExitCode;
    }
    const output = errors.join("\n");
    assert.match(output, /yarn build/, "deveria orientar a buildar");
    assert.doesNotMatch(
      output,
      /Comando não suportado/,
      "não deveria ter alcançado o execute legado (wizard de bootstrap)"
    );
  });
});
