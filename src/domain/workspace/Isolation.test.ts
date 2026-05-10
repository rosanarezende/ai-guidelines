/**
 * [BR-CLI-WORKSPACE-01] Isolamento e Mapeamento Físico (root '.governance/').
 * Esta suíte permanece toda em it.skip nesta fase: o IO real do workspace
 * é entregue apenas no PR2 (Topology Migration Layer) [DEC-0021-A03].
 */
describe("Domínio — Isolamento de Workspace [BR-CLI-WORKSPACE]", () => {
  describe("Inicialização do Workspace", () => {
    // [SKIP-REASON: Fase 2 — IO real do filesystem chega no PR2 (GovernanceWorkspace) [DEC-0021-A03]]
    it.skip("DADO inicialização do workspace ENTÃO cria subpastas canônicas (specs, experiments, explorations, incidents) [DEC-0021-A03]", () => {});
  });

  describe("Mapeamento Físico (Pares de Valor)", () => {
    // [SKIP-REASON: Fase 2 — criação física exige WorkspaceStore real (PR2) [DEC-0021-A03]]
    it.skip("DADO item denso ('spec', 'experiment', 'exploration', 'incident') QUANDO registrado ENTÃO cria pasta em '.governance/' [DEC-0021-A03]", () => {});
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
