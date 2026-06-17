import { runLineMatchesRequiredRun } from "./scriptContracts.js";

describe("scriptContracts workflow run matcher", () => {
  it("aceita comando contratado com argumentos adicionais", () => {
    expect(
      runLineMatchesRequiredRun(
        "npm run validate:changed -- --base origin/feat/spec-0024",
        "npm run validate:changed"
      )
    ).toBe(true);
  });

  it("não aceita comando apenas parecido", () => {
    expect(
      runLineMatchesRequiredRun("npm run validate:changed-extra", "npm run validate:changed")
    ).toBe(false);
  });
});
