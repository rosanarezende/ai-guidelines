import { renderBrief, renderDecisionList, renderPlanPreview } from "./render.js";
import { CloseDispositionsDefinition } from "./closeDispositions.js";
import { HumanGateDefinition } from "./humanGate.js";
import { makeDecisionSnapshot } from "../../test-utils/decisionFixtures.js";

const close = new CloseDispositionsDefinition();
const gate = new HumanGateDefinition();
const snap = makeDecisionSnapshot();

describe("render [decide]", () => {
  it("lista mostra disponível/indisponível", () => {
    const out = renderDecisionList([
      { index: 1, id: "close-dispositions", title: "Encerrar", availability: close.detect(snap) },
      { index: 2, id: "human-gate", title: "Human Gate", availability: gate.detect(snap) },
    ]);
    expect(out).toMatch(/Decisões humanas pendentes/);
    expect(out).toMatch(/1\. Encerrar\n\s+Disponível/);
    expect(out).toMatch(/Indisponível/);
  });

  it("briefing humano por default não exibe bloco técnico", () => {
    const b = close.buildBrief(snap, { technical: false });
    const out = renderBrief(b, { technical: false });
    expect(out).not.toMatch(/Detalhes técnicos/);
    expect(out).toMatch(/O que você está decidindo\?/);
  });

  it("--technical exibe Detalhes técnicos + Fontes", () => {
    const b = close.buildBrief(snap, { technical: true });
    const out = renderBrief(b, { technical: true });
    expect(out).toMatch(/Detalhes técnicos/);
    expect(out).toMatch(/Fontes/);
  });

  it("prévia mutante mostra alterações + preservado + commit; read-only diz que nada muda", () => {
    const mut = renderPlanPreview(close.plan(snap, "accept-all"));
    expect(mut).toMatch(/Alterações propostas/);
    expect(mut).toMatch(/Não será alterado/);
    expect(mut).toMatch(/Commit \(exclusivo\)/);
    const ro = renderPlanPreview(close.plan(snap, "cancel"));
    expect(ro).toMatch(/Nenhuma alteração/);
  });
});
