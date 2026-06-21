import {
  renderReviewPolicyBaseline,
  updateReviewPolicyProfileContent,
} from "./ReviewPolicyBaseline.js";

describe("domain/provisioning/ReviewPolicyBaseline", () => {
  it("renderiza baseline válida com o perfil ativo selecionado", () => {
    const content = renderReviewPolicyBaseline("team");

    expect(content).toContain("active_profile: team");
    expect(content).toContain("  solo:");
    expect(content).toContain("  contributor:");
    expect(content).toContain("  team:");
    expect(content).toContain("technical_audit: optional");
  });

  it("atualiza somente active_profile quando a política já declara o perfil", () => {
    const current = renderReviewPolicyBaseline("solo");
    const next = updateReviewPolicyProfileContent(current, "contributor");

    expect(next).toContain("active_profile: contributor");
    expect(next.replace("active_profile: contributor", "active_profile: solo")).toBe(current);
  });

  it("bloqueia política customizada que não declara o perfil solicitado", () => {
    expect(() =>
      updateReviewPolicyProfileContent(
        ["active_profile: solo", "profiles:", "  solo:", "    github: {}"].join("\n"),
        "team"
      )
    ).toThrow(/não declarado/);
  });
});
