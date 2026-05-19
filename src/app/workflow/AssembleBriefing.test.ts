import { SpecLocation } from "../../domain/workflow/SpecLocation.js";
import { WorkflowState } from "../../domain/workflow/WorkflowState.js";
import { assembleBriefing, extractSpecHeaders } from "./AssembleBriefing.js";

const sampleSpec = `# Spec 0023 — Workflow Runtime

> Status: Draft (Stage B — Decision closed)
> Author: foo
`;

const sampleResearch = `# Research

## 1. Hipóteses

### H1 — O problema não é "falta de planning"

texto.

### H2 — Os 7 pilares atuais podem estar errados

texto.

## 8. O que falta

### 8.1 Lacunas por hipótese

- **H1 — "planning antes de discovery":** evidência atual...
- **H2 — "7 pilares":** evidência argumentativa.

### 8.2 Lacunas na matriz

- texto.
`;

const location: SpecLocation = {
  slug: "0023-workflow-runtime",
  absolutePath: "/repo/.governance/specs/0023-workflow-runtime",
  source: "governance",
};

const state: WorkflowState = {
  stage: "implementation",
  gate: { status: "closed" },
  focus: ["workflow-runtime", "cognitive-load-reduction"],
  next: ["implementar PR1"],
};

describe("App — AssembleBriefing [BR-WORKFLOW-BRIEFING]", () => {
  describe("extractSpecHeaders", () => {
    it("DADO um spec.md típico ENTÃO extrai title e status", () => {
      const h = extractSpecHeaders(sampleSpec, null);
      expect(h.title).toBe("Spec 0023 — Workflow Runtime");
      expect(h.status).toBe("Draft (Stage B — Decision closed)");
    });

    it("DADO um research.md com hipóteses H1/H2 ENTÃO extrai todas", () => {
      const h = extractSpecHeaders(null, sampleResearch);
      expect(h.openHypotheses.length).toBe(2);
      expect(h.openHypotheses[0]).toMatch(/^H1 —/);
    });

    it("DADO um research.md sem seção 8 ENTÃO blockers fica vazio", () => {
      const h = extractSpecHeaders(null, "# only hypotheses\n### H1 — foo\n");
      expect(h.blockers).toEqual([]);
    });

    it("DADO ambos arquivos nulos ENTÃO retorna headers vazios", () => {
      const h = extractSpecHeaders(null, null);
      expect(h.title).toBeNull();
      expect(h.status).toBeNull();
      expect(h.openHypotheses).toEqual([]);
      expect(h.blockers).toEqual([]);
    });
  });

  describe("assembleBriefing", () => {
    it("DADO state válido + headers ENTÃO produz briefing legível com seções esperadas", () => {
      const headers = extractSpecHeaders(sampleSpec, sampleResearch);
      const text = assembleBriefing({
        location,
        state,
        defaulted: false,
        headers,
      });
      expect(text).toMatch(/Spec: 0023-workflow-runtime/);
      expect(text).toMatch(/Stage: implementation/);
      expect(text).toMatch(/Gate: closed/);
      expect(text).toMatch(/Foco: workflow-runtime, cognitive-load-reduction/);
      expect(text).toMatch(/Hipóteses \(research\):/);
      expect(text).toMatch(/Próxima ação:/);
    });

    it("DADO spec em .specify/ legacy ENTÃO inclui aviso de bridge", () => {
      const legacy: SpecLocation = { ...location, source: "specify-legacy" };
      const text = assembleBriefing({
        location: legacy,
        state,
        defaulted: false,
        headers: extractSpecHeaders(null, null),
      });
      expect(text).toMatch(/bridge legacy/);
    });

    it("DADO state.yml ausente ENTÃO sinaliza defaulted no briefing", () => {
      const text = assembleBriefing({
        location,
        state,
        defaulted: true,
        headers: extractSpecHeaders(null, null),
      });
      expect(text).toMatch(/state.yml ausente/);
    });

    it("DADO briefing montado ENTÃO produz no máximo 25 linhas", () => {
      const headers = extractSpecHeaders(sampleSpec, sampleResearch);
      const text = assembleBriefing({ location, state, defaulted: false, headers });
      expect(text.split("\n").length).toBeLessThanOrEqual(25);
    });
  });
});
