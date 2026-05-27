/**
 * [BR-CLI-WORKSPACE-01] Isolamento e Mapeamento Físico (root '.governance/').
 * Provisionamento do scaffold canônico mínimo já é coberto por testes vivos
 * (cf. [DEC-0023-O01]). O IO físico real do workspace (criação de pastas por
 * classe, migração Strangler de '.specify/', composição atômica) permanece em
 * it.skip — entregue no PR2/PR3 da Spec 0021 [DEC-0021-A03].
 */
import {
  GOVERNANCE_SCAFFOLD_FILES,
  GOVERNANCE_SPECS_SCAFFOLD_DIRS,
  planAdoption,
} from "./MigrationPlan.js";
import { GOVERNANCE_ROOT } from "./WorkspaceState.js";

describe("Domínio — Isolamento de Workspace [BR-CLI-WORKSPACE]", () => {
  describe("Inicialização do Workspace", () => {
    // [DEC-0023-O01] Bootstrap provisiona a estrutura canônica mínima de fechamento.
    // (A topologia de pilares por classe — experiments/spikes/incidents — segue
    // como escopo de `boilerplate-system-modernization`, fora do Bloco O.)
    it("DADO inicialização do workspace (pristine) ENTÃO o plano cria a estrutura canônica mínima de specs (`specs`, `specs/roadmap`, `specs/research-library`) [DEC-0023-O01]", () => {
      const plan = planAdoption({ kind: "pristine" });
      const dirs = plan.steps.filter((s) => s.kind === "ensure-directory").map((s) => s.path);

      for (const sub of GOVERNANCE_SPECS_SCAFFOLD_DIRS) {
        expect(dirs).toContain(`${GOVERNANCE_ROOT}/${sub}`);
      }
    });

    it("DADO inicialização do workspace (pristine) ENTÃO o plano cria os índices canônicos via ensure-file (`backlog`, `historico`, `research-index`) com stub não-destrutivo [DEC-0023-O01]", () => {
      const plan = planAdoption({ kind: "pristine" });
      const files = plan.steps.filter((s) => s.kind === "ensure-file");

      for (const f of GOVERNANCE_SCAFFOLD_FILES) {
        const step = files.find((s) => s.path === `${GOVERNANCE_ROOT}/${f.path}`);
        expect(step).toBeDefined();
        expect(step?.kind === "ensure-file" && step.content.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Mapeamento Físico (Pares de Valor)", () => {
    // [SKIP-REASON: Fase 2 — criação física exige WorkspaceStore real (PR2) [DEC-0021-A03]]
    it.skip("DADO item denso ('spec', 'experiment', 'spike', 'incident') QUANDO registrado ENTÃO cria pasta em '.governance/' [DEC-0021-A03]", () => {});
    // [SKIP-REASON: Fase 2 — proteção contra IO em itens virtuais é parte do PR2 [DEC-0021-A03]]
    it.skip("DADO item virtual ('proposal', 'patch', 'fix') QUANDO registrado ENTÃO NÃO cria diretórios [DEC-0021-A03]", () => {});
  });

  describe("Retrocompatibilidade e Migração", () => {
    // [SKIP-REASON: Fase 2 — Strangler Fig de '.specify/' chega no PR2 [DEC-0021-A03]]
    it.skip("DADO repositório legado com '.specify/' QUANDO WorkspaceService inicializado ENTÃO sugere migração para '.governance/' [DEC-0021-A03]", () => {});
    // [SKIP-REASON: Fase 2 — política de precedência é PR2 [DEC-0021-A03]]
    it.skip("DADO múltiplos roots de governança ENTÃO prioriza '.governance/' [DEC-0021-A03]", () => {});
  });

  describe("Proteção de Escopo e IO", () => {
    // [SKIP-REASON: Fase 2 — guard de IO sobre itens virtuais depende do FileSystemAdapter real [DEC-0021-A03]]
    it.skip("DADO escrita de arquivo em item virtual ENTÃO erro de isolamento de workspace [DEC-0021-A03]", () => {});
    // [SKIP-REASON: Fase 3 — Composição Atômica é entregue pelo TemplateEngine no PR3 [DEC-0021-D01]]
    it.skip("DADO criação de 'spec' ENTÃO usa Composição Atômica para boilerplate [DEC-0021-D01]", () => {});
  });
});
