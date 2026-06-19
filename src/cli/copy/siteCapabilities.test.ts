import { readFileSync } from "node:fs";
import path from "node:path";

import { buildDecisionRegistry } from "../decide/registry.js";
import { siteDecisionSurface, siteFlowCopyPayload } from "../siteFlowCopy.js";

/**
 * Auditoria de capacidades do site (fecha A2).
 *
 * Regra dura: o site não pode apresentar como comportamento ATUAL algo que o
 * runtime não faz. Classificação:
 *  - (a) derivada: a capacidade vem do runtime (registry de decisões);
 *  - (b) parcial: exibida como exemplo guiado (kind="guided" nos cenários);
 *  - (c) inexistente: não pode aparecer como comportamento atual.
 *
 * Aqui auditamos as DECISÕES reservadas ao humano (Ready/Human Gate/transição):
 * a projeção deve casar com o registry real e o site deve enquadrá-las como
 * decisões humanas/bloqueáveis, nunca como automação.
 */

const REPO_ROOT = process.cwd();

interface PayloadShape {
  readonly decisions: ReadonlyArray<{ readonly id: string; readonly title: string }>;
}

function readSite(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf-8");
}

describe("auditoria de capacidades de decisão (A2)", () => {
  it("projeta exatamente as decisões reais do registry", () => {
    const projected = siteDecisionSurface().map((decision) => decision.id);
    const real = [...buildDecisionRegistry().ids()];
    expect([...projected].sort()).toEqual([...real].sort());

    const payload = siteFlowCopyPayload() as PayloadShape;
    expect(payload.decisions.map((decision) => decision.id).sort()).toEqual([...real].sort());
  });

  it("inclui human-gate e advance/transição como decisões humanas reais", () => {
    const ids = new Set(siteDecisionSurface().map((decision) => decision.id));
    expect(ids.has("human-gate")).toBe(true);
    expect(ids.has("advance-subcheckpoint")).toBe(true);
    expect(ids.has("open-next-node")).toBe(true);
  });

  it("o site enquadra Ready/Human Gate/merge como autoridade humana, não automação", () => {
    const flowData = readSite("site/src/flowData.ts");
    const app = readSite("site/src/App.tsx");
    const corpus = `${flowData}\n${app}`;

    // A capacidade aparece (derivada/guiada) E com enquadramento de autoridade humana.
    expect(corpus).toContain("Human Gate");
    expect(/owner|decisão humana|autoridade/i.test(corpus)).toBe(true);
    expect(/bloque|não autoriza|não são atalhos|reservad/i.test(corpus)).toBe(true);

    // Falsificação: o site não pode prometer execução automática dessas decisões.
    expect(/merge automático|Human Gate automático|Ready automático/i.test(corpus)).toBe(false);
  });
});
