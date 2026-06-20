import { readFileSync } from "node:fs";
import path from "node:path";

import { FLOW_COPY } from "./copy/flowCopy.js";
import { buildSitePromptFlows, checkSitePromptFlows } from "./sitePromptFlows.js";
import type { PromptFlow, PromptStep } from "./sitePromptFlows.js";

/**
 * Guard da MÁQUINA DE PROMPTS do site (decisão "projeção gerada da sequência").
 *
 * Operacionaliza a premissa da owner: o simulador não pode inventar prompt.
 * Cada pergunta REAL (select/confirm/input) tem de existir na copy real da CLI
 * (`FLOW_COPY`) — texto autoral é proibido. A sequência e a ramificação vêm de
 * execução controlada do wizard (`command.prompt`), não de strings escritas à mão.
 */

const REPO_ROOT = process.cwd();
const MANDATORY_FLOW_IDS = ["empty", "existing", "conflict", "governed"] as const;
// "Operation" é a mensagem LITERAL do BootstrapWizard real (wizard.ts), não copy.
const NON_COPY_MESSAGES = new Set<string>(["Operation"]);

function collectStrings(value: unknown, sink: Set<string>): void {
  if (typeof value === "string") {
    sink.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, sink);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, sink);
  }
}

function realCopyStrings(): Set<string> {
  const sink = new Set<string>();
  collectStrings(FLOW_COPY, sink);
  return sink;
}

function stepsOf(flow: PromptFlow, kind: PromptStep["kind"]): readonly PromptStep[] {
  return flow.steps.filter((step) => step.kind === kind);
}

function hasMessage(flow: PromptFlow, message: string): boolean {
  return flow.steps.some((step) => step.message === message);
}

describe("máquina de prompts do site (projeção gerada)", () => {
  let flows: readonly PromptFlow[];

  beforeAll(async () => {
    flows = await buildSitePromptFlows(REPO_ROOT);
  });

  it("cobre os 4 contextos obrigatórios do onboarding público", () => {
    expect(flows.map((flow) => flow.id).sort()).toEqual([...MANDATORY_FLOW_IDS].sort());
  });

  it("todo cenário começa pela porta pública npx ai-guidelines", () => {
    for (const flow of flows) {
      expect(flow.command).toBe("npx ai-guidelines");
    }
  });

  it("toda pergunta real vem da copy real da CLI (nada autoral)", () => {
    const copy = realCopyStrings();
    for (const flow of flows) {
      for (const step of flow.steps) {
        if (step.kind === "select" || step.kind === "confirm" || step.kind === "input") {
          expect(step.message.length).toBeGreaterThan(0);
          if (NON_COPY_MESSAGES.has(step.message)) continue;
          expect(copy.has(step.message)).toBe(true);
        }
      }
    }
  });

  it("as opções dos providers vêm dos rótulos reais do catálogo", () => {
    const copy = realCopyStrings();
    for (const flow of flows) {
      for (const step of stepsOf(flow, "multiselect")) {
        for (const group of step.groups ?? []) {
          expect(copy.has(group.group)).toBe(true);
          for (const choice of group.choices) {
            expect(copy.has(choice.label)).toBe(true);
          }
        }
      }
    }
  });

  it("liga cada cenário a um transcript REAL de dry-run (não a texto)", () => {
    const scenariosSource = readFileSync(
      path.join(REPO_ROOT, "site/src/generated/flow-scenarios.generated.ts"),
      "utf-8"
    );
    for (const flow of flows) {
      expect(scenariosSource).toContain(`"id": "${flow.transcriptId}"`);
    }
  });

  it("o conflito de formatter é detecção REAL (Biome), não invenção", () => {
    const conflict = flows.find((flow) => flow.id === "conflict");
    expect(conflict?.detection.formatterRival).toBe("Biome");
    // E o passo de decisão do conflito existe e é gateado pelo avançado.
    const forcePrettier = conflict?.steps.find(
      (step) => step.message === FLOW_COPY.provisioning.flow.prompts.forcePrettier
    );
    expect(forcePrettier?.gatedBy?.equals).toBe(true);
  });

  it("update não pergunta práticas; init/adopt perguntam", () => {
    const featuresQuestion = FLOW_COPY.provisioning.featureInstallQuestion;
    expect(hasMessage(flows.find((flow) => flow.id === "governed")!, featuresQuestion)).toBe(false);
    expect(hasMessage(flows.find((flow) => flow.id === "empty")!, featuresQuestion)).toBe(true);
    expect(hasMessage(flows.find((flow) => flow.id === "existing")!, featuresQuestion)).toBe(true);
  });

  it("o bloco avançado é ramificação real (gated), não passo incondicional", () => {
    for (const flow of flows) {
      const advanced = flow.steps.find(
        (step) => step.message === FLOW_COPY.provisioning.flow.prompts.advanced
      );
      expect(advanced).toBeDefined();
      const runtimeDir = flow.steps.find(
        (step) => step.message === FLOW_COPY.provisioning.flow.prompts.runtimeDir
      );
      expect(runtimeDir?.gatedBy).toEqual({ stepId: advanced!.id, equals: true });
    }
  });

  it("a confirmação de aplicar é o último passo (segurança antes do efeito)", () => {
    for (const flow of flows) {
      const last = flow.steps[flow.steps.length - 1];
      expect(last.kind).toBe("confirm");
      expect(last.message).toBe(FLOW_COPY.provisioning.flow.prompts.confirmApply);
    }
  });

  it("o módulo gerado está em sync com o runtime (sem drift)", async () => {
    const violations = await checkSitePromptFlows(REPO_ROOT);
    expect(violations).toEqual([]);
  });
});
