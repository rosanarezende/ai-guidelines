import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  describeTemplateTransition,
  formatTemplateHeader,
  parseTemplateMetadata,
} from "./template-metadata.mjs";

describe("features/core/template-metadata", () => {
  describe("parseTemplateMetadata", () => {
    it("DADO header válido na primeira linha QUANDO parse ENTÃO retorna nome e versão", () => {
      const content = "<!-- ai-guidelines-template: spec-boilerplate v=1 -->\n\n# Spec\n";
      assert.deepEqual(parseTemplateMetadata(content), {
        name: "spec-boilerplate",
        version: 1,
      });
    });

    it("DADO header com slug contendo dot QUANDO parse ENTÃO aceita", () => {
      const content = "<!-- ai-guidelines-template: spec.boilerplate v=42 -->\n";
      assert.deepEqual(parseTemplateMetadata(content), {
        name: "spec.boilerplate",
        version: 42,
      });
    });

    it("DADO conteúdo sem header QUANDO parse ENTÃO retorna null", () => {
      assert.equal(parseTemplateMetadata("# Spec sem header\n"), null);
    });

    it("DADO input não-string QUANDO parse ENTÃO retorna null", () => {
      assert.equal(parseTemplateMetadata(null), null);
      assert.equal(parseTemplateMetadata(undefined), null);
      assert.equal(parseTemplateMetadata(42), null);
    });

    it("DADO header em linha posterior QUANDO parse ENTÃO ainda encontra (multiline)", () => {
      const content = "\n<!-- ai-guidelines-template: foo v=2 -->\n";
      assert.deepEqual(parseTemplateMetadata(content), { name: "foo", version: 2 });
    });
  });

  describe("formatTemplateHeader", () => {
    it("DADO metadata QUANDO format ENTÃO emite header canônico", () => {
      assert.equal(
        formatTemplateHeader({ name: "tasks-mixed-boilerplate", version: 3 }),
        "<!-- ai-guidelines-template: tasks-mixed-boilerplate v=3 -->"
      );
    });
  });

  describe("describeTemplateTransition", () => {
    it("DADO source sem metadata QUANDO describe ENTÃO retorna null", () => {
      assert.equal(describeTemplateTransition(null, null), null);
    });

    it("DADO destino inexistente QUANDO describe ENTÃO retorna versão atual", () => {
      assert.equal(describeTemplateTransition({ name: "spec", version: 1 }, null), "template v=1");
    });

    it("DADO mesma versão QUANDO describe ENTÃO retorna versão única", () => {
      assert.equal(
        describeTemplateTransition({ name: "spec", version: 2 }, { name: "spec", version: 2 }),
        "template v=2"
      );
    });

    it("DADO versão antiga no destino QUANDO describe ENTÃO retorna transição", () => {
      assert.equal(
        describeTemplateTransition({ name: "spec", version: 3 }, { name: "spec", version: 1 }),
        "template v=1 -> v=3"
      );
    });
  });
});
