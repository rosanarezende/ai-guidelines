import { describeTemplateTransition, parseTemplateMetadata } from "./TemplateMetadata.js";

describe("domain/provisioning/TemplateMetadata", () => {
  it("parseTemplateMetadata extrai slug e versão do header governado", () => {
    expect(
      parseTemplateMetadata("<!-- ai-guidelines-template: spec-boilerplate v=2 -->\n\n# Spec\n")
    ).toEqual({ name: "spec-boilerplate", version: 2 });
  });

  it("parseTemplateMetadata retorna null quando não há header", () => {
    expect(parseTemplateMetadata("# Sem header\n")).toBeNull();
    expect(parseTemplateMetadata(null)).toBeNull();
  });

  it("describeTemplateTransition descreve create, same-version e upgrade", () => {
    expect(describeTemplateTransition(null, null)).toBeNull();
    expect(describeTemplateTransition({ name: "spec", version: 1 }, null)).toBe("template v=1");
    expect(
      describeTemplateTransition({ name: "spec", version: 2 }, { name: "spec", version: 2 })
    ).toBe("template v=2");
    expect(
      describeTemplateTransition({ name: "spec", version: 3 }, { name: "spec", version: 1 })
    ).toBe("template v=1 -> v=3");
  });
});
