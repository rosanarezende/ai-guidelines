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
  directoryContents: Map<string, ReadonlyArray<string>>;
  branch: string | null;

  constructor(
    opts: {
      files?: Map<string, string>;
      directories?: Set<string>;
      directoryContents?: Map<string, ReadonlyArray<string>>;
      branch?: string | null;
    } = {}
  ) {
    this.files = new Map(opts.files ?? []);
    this.directories = new Set(opts.directories ?? []);
    this.directoryContents = new Map(opts.directoryContents ?? []);
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
  listDirectory(relPath: string): ReadonlyArray<string> {
    return this.directoryContents.get(relPath) ?? [];
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
    directories: new Set([SPEC_DIR, ".governance/specs"]),
    // DetectActiveSpec lookup por id NNNN exige que listDirectory devolva
    // o conteúdo real do root para resolver `0023-workflow-runtime`.
    directoryContents: new Map([[".governance/specs", ["0023-workflow-runtime"]]]),
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
      // now() = 10:00 UTC → emitido como 07:00 em offset -03:00 (mesmo instante).
      expect(result.entry.updatedAt).toBe("2026-05-21T07:00:00.000-03:00");
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
      // segunda execução: now() = 11:00 UTC → 08:00 em offset -03:00.
      expect(reparsed.activeSpecs[0].updatedAt).toBe("2026-05-21T08:00:00.000-03:00");
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

    it("DADO branch fora do padrão feat/spec-NNNN-* QUANDO publish ENTÃO erro narrativo de DetectActiveSpec propagado E não escreve (per [DEC-0023-I01], sem fallback à projection layer)", () => {
      // Pós-refator [DEC-0023-I01]: branch "main" → DetectActiveSpec falha
      // por padrão de branch inválido; PublishState propaga o reason sem
      // consultar active-specs.yml (projection ≠ primary resolver).
      const fs = makeFs({ branch: "main" });
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(PublishStateError);
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/Não foi possível detectar spec ativa/);
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/branch "main" não segue o padrão/);
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

  describe("Resolução via id canônico — branch escopo-de-PR (per [DEC-0023-I01])", () => {
    // Pós-refator: branch "de trabalho" (sufixo ≠ slug canônico) resolve
    // automaticamente via DetectActiveSpec por id NNNN — sem consultar
    // active-specs.yml. Projection layer ≠ primary resolver de identity.
    // O describe anterior testava o fallback `resolveLocationFromIndexBranchMatch`
    // que foi removido como dead code.
    const WORK_BRANCH = "feat/spec-0023-runtime-active-state";

    function makeFsWithWorkBranch(
      opts: { withIndex?: string; withState?: boolean } = {}
    ): WritableFakeFs {
      const files = new Map<string, string>();
      if (opts.withState !== false) files.set(STATE_PATH, VALID_STATE_YAML);
      if (opts.withIndex !== undefined) files.set(INDEX_PATH, opts.withIndex);
      return new WritableFakeFs({
        files,
        directories: new Set([SPEC_DIR, ".governance/specs"]),
        directoryContents: new Map([[".governance/specs", ["0023-workflow-runtime"]]]),
        branch: WORK_BRANCH,
      });
    }

    it("DADO branch canônico (sufixo = slug) E índice ausente QUANDO publish ENTÃO sanity-check — comportamento default não muda", () => {
      const fs = makeFs(); // branch="feat/spec-0023-workflow-runtime"
      const result = makePublishState(fs).run({
        status: "active",
        updatedBy: "@rosanarezende",
      });
      expect(result.entry.slug).toBe("workflow-runtime");
      expect(fs.fileExists(INDEX_PATH)).toBe(true);
    });

    it("DADO branch escopo-de-PR (não casa slug literal) E índice ausente QUANDO publish ENTÃO resolve via id E escreve E entry reflete branch atual", () => {
      // Reproduz o cenário do bug 2026-05-23: na branch
      // `feat/spec-0023-runtime-active-state`, a spec é resolvida pelo id
      // `0023` apontando para o diretório canônico `0023-workflow-runtime`,
      // independente do sufixo do branch. Índice nem precisa existir.
      const fs = makeFsWithWorkBranch(); // sem índice
      const result = makePublishState(fs).run({
        status: "active",
        updatedBy: "@rosanarezende",
      });

      expect(result.wasUpdate).toBe(false);
      expect(result.entry.slug).toBe("workflow-runtime"); // do diretório canônico
      expect(result.entry.branch).toBe(WORK_BRANCH); // branch corrente, factual
      expect(result.entry.stage).toBe("implementation"); // projetado do state.yml
      expect(fs.fileExists(INDEX_PATH)).toBe(true);
    });

    it("DADO branch escopo-de-PR E índice já existente com entry para id=0023 QUANDO publish ENTÃO atualiza in-place (upsert por id, não por branch)", () => {
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
      const fs = makeFsWithWorkBranch({ withIndex: existingIndex });
      const result = makePublishState(fs).run({
        status: "blocked",
        updatedBy: "@rosanarezende",
      });

      // Upsert por id: substitui in-place, branch atualiza para WORK_BRANCH.
      expect(result.wasUpdate).toBe(true);
      expect(result.entry.branch).toBe(WORK_BRANCH);
      expect(result.entry.status).toBe("blocked");
      const reparsed = parseActiveSpecs(fs.readTextFile(INDEX_PATH));
      expect(reparsed.activeSpecs).toHaveLength(1);
      expect(reparsed.activeSpecs[0].branch).toBe(WORK_BRANCH);
    });

    it("DADO branch escopo-de-PR E spec com mesmo id ausente do filesystem QUANDO publish ENTÃO erro narrativo de DetectActiveSpec (id sem diretório)", () => {
      // Edge case: branch carrega id 9999 que não tem diretório correspondente
      // — DetectActiveSpec falha narrativamente; PublishState propaga sem
      // tentar consultar active-specs.yml.
      const fs = new WritableFakeFs({
        files: new Map([[STATE_PATH, VALID_STATE_YAML]]),
        directories: new Set([SPEC_DIR, ".governance/specs"]),
        directoryContents: new Map([[".governance/specs", ["0023-workflow-runtime"]]]),
        branch: "feat/spec-9999-nonexistent",
      });
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(PublishStateError);
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/Não foi possível detectar spec ativa/);
      expect(() =>
        makePublishState(fs).run({ status: "active", updatedBy: "@rosanarezende" })
      ).toThrow(/nenhum diretório com id "9999"/);
      expect(fs.fileExists(INDEX_PATH)).toBe(false);
    });
  });
});
