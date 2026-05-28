/**
 * [BR-CLI-WORKSPACE-01] Isolamento e Mapeamento Físico (root '.governance/').
 * Cobre o plano de adoção (camada de domínio). O IO físico real e os
 * comportamentos correlatos são exercitados por testes vivos sob as abstrações
 * já entregues (cf. mapa de cobertura abaixo e [DEC-0023-O02]).
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

  // ── Mapa de cobertura viva (ex-it.skip [DEC-0021-A03]/[DEC-0021-D01]) ──
  // Os comportamentos abaixo nasceram como it.skip nesta suíte quando o IO real
  // ainda não existia. Hoje são cobertos pelas abstrações já entregues; os skips
  // foram removidos para não mascarar gaps inexistentes (cf. [DEC-0023-O02]):
  //  - item denso cria pasta em '.governance/'
  //      → infrastructure/filesystem/NodeWorkspaceIntegration.test.ts (ensureDirectory)
  //  - item virtual NÃO cria diretórios
  //      → app/use-cases/RegisterItem.test.ts ("item virtual NÃO toca workspace")
  //  - repositório legado '.specify/' sugere migração para '.governance/'
  //      → domain/workspace/WorkspaceDiscovery.test.ts + LegacyPrecedence.test.ts
  //  - múltiplos roots de governança (design evoluiu: 'mixed' → 'ambiguous',
  //    sem heurística silenciosa de precedência)
  //      → domain/workspace/WorkspaceDiscovery.test.ts
  //  - escrita fora do escopo do root → erro de isolamento
  //      → NodeWorkspaceIntegration.test.ts (WORKSPACE_PATH_OUT_OF_SCOPE)
  //  - composição atômica de boilerplate (ex-"TemplateEngine")
  //      → app/use-cases/AssembleArtifact.test.ts [BR-CLI-ASSEMBLE]
});
