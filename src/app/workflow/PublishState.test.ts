import {
  parseActiveSpecs,
  stringifyActiveSpecs,
} from "../../infrastructure/yaml/activeSpecsSerializer.js";
import { parseWorkflowState } from "../../infrastructure/yaml/workflowStateSerializer.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";
import { PublishState, PublishStateError } from "./PublishState.js";

/**
 * Tests BDD pt-BR — `PublishState` é o ponto onde state.yml interno encontra
 * o índice público. Foca em: projeção correta (stage direto, status declarado),
 * upsert por id, round-trip de validação, e rejeição de inferência de intenção.
 */
class WritableFakeFs implements WorkflowFileSystem {
  files: Map<string, string>;
  directories: Set<string>;
  branch: string | null;

  constructor(
    opts: {
      files?: Map<string, string>;
      directories?: Set<string>;
      branch?: string | null;
    } = {}
  ) {
    this.files = new Map(opts.files ?? []);
    this.directories = new Set(opts.directories ?? []);
    this.branch = opts.branch ?? null;
  }

  fileExists(relPath: string): boolean {
    return this.files.has(relPath);
  }
  directoryExists(relPath: string): boolean {
    return this.directories.has(relPath);
  }
  readTextFile(relPath: string): string {
    const content = this.files.get(relPath);
    if (content === undefined) throw new Error(`missing ${relPath}`);
    return content;
  }
  writeTextFile(relPath: string, contents: string): void {
    this.files.set(relPath, contents);
  }
  listDirectory(): ReadonlyArray<string> {
    return [];
  }
  currentBranch(): string | null {
    return this.branch;
  }
  resolveAbsolute(relPath: string): string {
    return `/repo/${relPath}`;
  }
}

const SPEC_DIR = ".governance/specs/0023-workflow-runtime";
const STATE_PATH = `${SPEC_DIR}/state.yml`;
const INDEX_PATH = ".governance/runtime/active-specs.yml";

const VALID_STATE_YAML = `stage: implementation
gate:
  status: closed
focus:
  - workflow-runtime
next:
  - executar PR3
`;

function makeFs(
  opts: {
    withState?: boolean;
    withIndex?: string;
    branch?: string | null;
  } = {}
): WritableFakeFs {
  const files = new Map<string, string>();
  if (opts.withState !== false) files.set(STATE_PATH, VALID_STATE_YAML);
  if (opts.withIndex !== undefined) files.set(INDEX_PATH, opts.withIndex);
  return new WritableFakeFs({
    files,
    directories: new Set([SPEC_DIR]),
    branch: opts.branch === undefined ? "feat/spec-0023-workflow-runtime" : opts.branch,
  });
}

function makePublishState(fs: WritableFakeFs, now: Date = new Date("2026-05-21T10:00:00Z")) {
  return new PublishState(
    fs,
    parseActiveSpecs,
    stringifyActiveSpecs,
    parseWorkflowState,
    () => now
  );
}

describe("App — PublishState [BR-WORKFLOW-PUBLISH-STATE]", () => {
  describe("Happy paths — escrita do índice", () => {
    it("DADO spec corrente E state.yml válido E status='active' E updated_by QUANDO publish ENTÃO escreve nova entry e retorna wasUpdate=false", () => {
      const fs = makeFs();
      const result = makePublishState(fs).run({
        status: "active",
        updatedBy: "@rosanarezende",
      });

      expect(result.wasUpdate).toBe(false);
      expect(result.indexPath).toBe(INDEX_PATH);
      expect(result.entry.id).toBe("0023");
      expect(result.entry.slug).toBe("workflow-runtime");
      expect(result.entry.stage).toBe("implementation");
      expect(result.entry.status).toBe("active");
      expect(result.entry.branch).toBe("feat/spec-0023-workflow-runtime");
      expect(result.entry.specPath).toBe(SPEC_DIR);
      expect(result.entry.sourceStatePath).toBe(STATE_PATH);
      expect(result.entry.updatedAt).toBe("2026-05-21T10:00:00.000Z");
      expect(result.entry.updatedBy).toBe("@rosanarezende");

      // verifica que o arquivo foi de fato escrito e é parseável
      const written = fs.readTextFile(INDEX_PATH);
      const reparsed = parseActiveSpecs(written);
      expect(reparsed.activeSpecs).toHaveLength(1);
      expect(reparsed.activeSpecs[0]).toEqual(result.entry);
    });

    it("DADO opcionais title/baseBranch/lastSyncCommit fornecidos QUANDO publish ENTÃO inclui no entry escrito", () => {
      const fs = makeFs();
      const result = makePublishState(fs).run({
        status: "active",
        updatedBy: "@rosanarezende",
        title: "Workflow Runtime",
        baseBranch: "main",
        lastSyncCommit: "abc1234",
      });

      expect(result.entry.title).toBe("Workflow Runtime");
      expect(result.entry.baseBranch).toBe("main");
      expect(result.entry.lastSyncCommit).toBe("abc1234");
    });

    it("DADO opcionais omitidos QUANDO publish ENTÃO YAML escrito não contém chaves para opcionais ausentes", () => {
      const fs = makeFs();
      makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" });
      const written = fs.readTextFile(INDEX_PATH);
      expect(written).not.toMatch(/title:/);
      expect(written).not.toMatch(/base_branch:/);
      expect(written).not.toMatch(/last_sync_commit:/);
    });

    it("DADO stage=blocked declarado QUANDO publish ENTÃO escreve combinação válida implementation/blocked (dimensões independentes per [DEC-0023-G04])", () => {
      const fs = makeFs();
      const result = makePublishState(fs).run({
        status: "blocked",
        updatedBy: "@rosanarezende",
      });
      // stage vem do state.yml (implementation), status é declarado (blocked)
      expect(result.entry.stage).toBe("implementation");
      expect(result.entry.status).toBe("blocked");
    });
  });

  describe("Upsert por id — atualização in-place vs append", () => {
    it("DADO active-specs.yml já tem entry para id=0023 QUANDO publish ENTÃO atualiza in-place E wasUpdate=true", () => {
      const existingIndex = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "feat/spec-0023-old-branch"
    stage: "decision"
    status: "paused"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-20T00:00:00Z"
`;
      const fs = makeFs({ withIndex: existingIndex });
      const result = makePublishState(fs).run({
        status: "active",
        updatedBy: "@rosanarezende",
      });

      expect(result.wasUpdate).toBe(true);
      const reparsed = parseActiveSpecs(fs.readTextFile(INDEX_PATH));
      expect(reparsed.activeSpecs).toHaveLength(1);
      expect(reparsed.activeSpecs[0].status).toBe("active");
      expect(reparsed.activeSpecs[0].stage).toBe("implementation");
      expect(reparsed.activeSpecs[0].branch).toBe("feat/spec-0023-workflow-runtime");
    });

    it("DADO active-specs.yml tem outras entries (id diferente) QUANDO publish ENTÃO append no fim sem alterar as outras E wasUpdate=false", () => {
      const existingIndex = `version: 1
active_specs:
  - id: "0099"
    slug: "outra"
    branch: "feat/spec-0099-outra"
    stage: "discovery"
    status: "paused"
    spec_path: ".governance/specs/0099-outra"
    updated_at: "2026-05-19T00:00:00Z"
`;
      const fs = makeFs({ withIndex: existingIndex });
      const result = makePublishState(fs).run({
        status: "active",
        updatedBy: "@rosanarezende",
      });

      expect(result.wasUpdate).toBe(false);
      const reparsed = parseActiveSpecs(fs.readTextFile(INDEX_PATH));
      expect(reparsed.activeSpecs).toHaveLength(2);
      expect(reparsed.activeSpecs[0].id).toBe("0099"); // outra mantém posição
      expect(reparsed.activeSpecs[1].id).toBe("0023"); // nova vai no fim
    });

    it("DADO publish chamado duas vezes para a mesma spec QUANDO segunda execução ENTÃO não duplica E mantém 1 entry", () => {
      const fs = makeFs();
      makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" });
      makePublishState(fs, new Date("2026-05-21T11:00:00Z")).run({
        status: "blocked",
        updatedBy: "@rosanarezende",
      });

      const reparsed = parseActiveSpecs(fs.readTextFile(INDEX_PATH));
      expect(reparsed.activeSpecs).toHaveLength(1);
      expect(reparsed.activeSpecs[0].status).toBe("blocked");
      expect(reparsed.activeSpecs[0].updatedAt).toBe("2026-05-21T11:00:00.000Z");
    });
  });

  describe("Rejeições — sem inferência de intenção operacional", () => {
    it("DADO status='wip' (fora do enum) QUANDO publish ENTÃO lança erro narrativo citando [DEC-0023-G04] E não escreve", () => {
      const fs = makeFs();
      expect(() =>
        makePublishState(fs).run({
          // @ts-expect-error testando string inválida em runtime
          status: "wip",
          updatedBy: "@rosanarezende",
        })
      ).toThrow(PublishStateError);
      expect(() =>
        makePublishState(fs).run({
          // @ts-expect-error testando string inválida em runtime
          status: "wip",
          updatedBy: "@rosanarezende",
        })
      ).toThrow(/\[DEC-0023-G04\]/);
      expect(fs.fileExists(INDEX_PATH)).toBe(false);
    });

    it("DADO updated_by vazio QUANDO publish ENTÃO lança erro narrativo distinguindo 'autorizou' de 'executou' E não escreve", () => {
      const fs = makeFs();
      expect(() => makePublishState(fs).run({ status: "active", updatedBy: "  " })).toThrow(
        /updated_by é obrigatório/
      );
      expect(() => makePublishState(fs).run({ status: "active", updatedBy: "" })).toThrow(
        /quem autorizou/
      );
      expect(fs.fileExists(INDEX_PATH)).toBe(false);
    });

    it("DADO branch null (HEAD detached) QUANDO publish ENTÃO lança erro E não escreve", () => {
      const fs = makeFs({ branch: null });
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/HEAD detached|nenhum branch git ativo/i);
      expect(fs.fileExists(INDEX_PATH)).toBe(false);
    });

    it("DADO branch fora do padrão feat/spec-NNNN-* E índice ausente QUANDO publish ENTÃO erro do fallback orientando branch canônica ou publish prévio E não escreve", () => {
      // Pós-fallback (proposta aprovada pelo owner pós-validação humana):
      // branch "main" cai no fallback via índice; se o índice também não
      // existe, mensagem narrativa orienta as duas saídas possíveis.
      const fs = makeFs({ branch: "main" });
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/Branch "main" não casa diretório/);
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/índice público.*também está ausente/);
      expect(fs.fileExists(INDEX_PATH)).toBe(false);
    });

    it("DADO state.yml ausente QUANDO publish ENTÃO lança erro orientativo E não escreve", () => {
      const fs = makeFs({ withState: false });
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/state\.yml não encontrado/);
      expect(fs.fileExists(INDEX_PATH)).toBe(false);
    });
  });

  describe("Round-trip de validação — fail-fast contra inconsistência interna", () => {
    it("DADO publish bem-sucedido QUANDO inspecionar YAML escrito ENTÃO ele é parseável pelo serializer sem erro (smoke test)", () => {
      const fs = makeFs();
      makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" });

      const written = fs.readTextFile(INDEX_PATH);
      // Round-trip explícito: o que escrevi tem que voltar idêntico ao que o
      // próprio runtime leria de volta.
      expect(() => parseActiveSpecs(written)).not.toThrow();
    });
  });

  describe("Fallback via índice quando branch ≠ slug canônico (lookup/translation, sem orchestration)", () => {
    // Branch "de trabalho" — nome reflete escopo do PR, não slug canônico
    // da spec. Convenção comum em stacks de PRs. Antes do fallback, isso
    // quebrava publish-state mesmo com a entry no índice.
    const WORK_BRANCH = "feat/spec-0023-runtime-active-state";

    function makeFsWithWorkBranch(
      opts: { withIndex?: string; withState?: boolean } = {}
    ): WritableFakeFs {
      const files = new Map<string, string>();
      if (opts.withState !== false) files.set(STATE_PATH, VALID_STATE_YAML);
      if (opts.withIndex !== undefined) files.set(INDEX_PATH, opts.withIndex);
      return new WritableFakeFs({
        files,
        directories: new Set([SPEC_DIR]),
        branch: WORK_BRANCH,
      });
    }

    it("DADO branch casa diretório E índice ausente QUANDO publish ENTÃO comportamento atual (sem fallback ativado) — backwards-compat", () => {
      // Sanity check: a presença do fallback não muda o fluxo quando a
      // detecção via branch já funciona. Cenário do Cenário 1 do happy path.
      const fs = makeFs(); // branch="feat/spec-0023-workflow-runtime" casa SPEC_DIR
      const result = makePublishState(fs).run({
        status: "active",
        updatedBy: "@rosanarezende",
      });
      expect(result.entry.slug).toBe("workflow-runtime");
      expect(fs.fileExists(INDEX_PATH)).toBe(true);
    });

    it("DADO branch de trabalho (não casa diretório) E índice tem entry com branch exata QUANDO publish ENTÃO usa fallback, escreve corretamente e a entry atualizada reflete a branch atual", () => {
      // Reproduz exatamente o cenário do dogfooding do owner: branch
      // "de trabalho" do PR, mas o índice já tem entry registrando essa
      // branch como pertencente à spec 0023.
      const existingIndex = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "${WORK_BRANCH}"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T08:00:00Z"
`;
      const fs = makeFsWithWorkBranch({ withIndex: existingIndex });
      const result = makePublishState(fs).run({
        status: "blocked",
        updatedBy: "@rosanarezende",
      });

      expect(result.wasUpdate).toBe(true);
      expect(result.entry.slug).toBe("workflow-runtime");
      expect(result.entry.branch).toBe(WORK_BRANCH);
      expect(result.entry.stage).toBe("implementation"); // projetado do state.yml
      expect(result.entry.status).toBe("blocked"); // declarado pelo humano

      // verifica que o write é round-trippable
      const reparsed = parseActiveSpecs(fs.readTextFile(INDEX_PATH));
      expect(reparsed.activeSpecs).toHaveLength(1);
      expect(reparsed.activeSpecs[0].branch).toBe(WORK_BRANCH);
    });

    it("DADO branch de trabalho E active-specs.yml ausente QUANDO publish ENTÃO erro narrativo orientando branch canônica ou publicar primeiro E não escreve", () => {
      const fs = makeFsWithWorkBranch(); // sem índice
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(PublishStateError);
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/Branch "feat\/spec-0023-runtime-active-state" não casa diretório/);
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/índice público .* também está ausente/);
      expect(fs.fileExists(INDEX_PATH)).toBe(false);
    });

    it("DADO branch de trabalho E índice presente E nenhuma entry casa branch atual QUANDO publish ENTÃO erro narrativo com 3 opções E não escreve", () => {
      const unrelatedIndex = `version: 1
active_specs:
  - id: "0099"
    slug: "outra-spec"
    branch: "feat/spec-0099-outra-spec"
    stage: "discovery"
    status: "paused"
    spec_path: ".governance/specs/0099-outra-spec"
    updated_at: "2026-05-19T00:00:00Z"
`;
      const fs = makeFsWithWorkBranch({ withIndex: unrelatedIndex });
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/nenhuma entry do índice público referencia esta branch/);
      // mensagem deve listar as 3 opções para orientar o humano
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/rode da branch canônica/);
      // não deve sobrescrever o índice existente
      expect(fs.readTextFile(INDEX_PATH)).toBe(unrelatedIndex);
    });

    it("DADO branch de trabalho E ≥2 entries do índice referenciam a mesma branch QUANDO publish ENTÃO erro narrativo listando slugs ambíguos E não escreve", () => {
      const ambiguousIndex = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "${WORK_BRANCH}"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T08:00:00Z"
  - id: "0099"
    slug: "outra"
    branch: "${WORK_BRANCH}"
    stage: "discovery"
    status: "paused"
    spec_path: ".governance/specs/0099-outra"
    updated_at: "2026-05-19T00:00:00Z"
`;
      const fs = new WritableFakeFs({
        files: new Map([
          [STATE_PATH, VALID_STATE_YAML],
          [INDEX_PATH, ambiguousIndex],
        ]),
        directories: new Set([SPEC_DIR]),
        branch: WORK_BRANCH,
      });
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/referenciada por múltiplas entries/);
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/0023\/workflow-runtime/);
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/0099\/outra/);
      // garante que o índice ambíguo NÃO foi alterado
      expect(fs.readTextFile(INDEX_PATH)).toBe(ambiguousIndex);
    });
  });
});
