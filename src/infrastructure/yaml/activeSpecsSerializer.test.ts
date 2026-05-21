import {
  ActiveSpecsParseError,
  parseActiveSpecs,
  stringifyActiveSpecs,
} from "./activeSpecsSerializer.js";
import { ActiveSpecsRoot } from "../../domain/workflow/ActiveSpecEntry.js";

/**
 * Tests BDD pt-BR (OPT-0201) — contrato cravado em [DEC-0023-G02] + [DEC-0023-G04].
 *
 * Cobertura intencionalmente focada no SCHEMA do índice público; drift guard
 * de ambiente (verificar spec_path no disco) vive em `ListActiveSpecs.test.ts`
 * para não misturar pureza com efeito colateral.
 */
describe("Infra — activeSpecsSerializer [BR-WORKFLOW-RUNTIME-INDEX]", () => {
  describe("parseActiveSpecs — happy paths", () => {
    it("DADO yaml mínimo com 1 entry só com obrigatórios QUANDO parseActiveSpecs ENTÃO devolve root tipado com version=1 e entry parseada", () => {
      const yaml = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
`;
      const root = parseActiveSpecs(yaml);
      expect(root.version).toBe(1);
      expect(root.activeSpecs).toHaveLength(1);
      const entry = root.activeSpecs[0];
      expect(entry.id).toBe("0023");
      expect(entry.slug).toBe("workflow-runtime");
      expect(entry.stage).toBe("implementation");
      expect(entry.status).toBe("active");
      expect(entry.specPath).toBe(".governance/specs/0023-workflow-runtime");
      expect(entry.updatedAt).toBe("2026-05-21T00:00:00Z");
      expect(entry.title).toBeUndefined();
    });

    it("DADO entry com todos os opcionais QUANDO parseActiveSpecs ENTÃO aceita e expõe opcionais tipados", () => {
      const yaml = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    title: "Workflow Runtime"
    branch: "feat/spec-0023-runtime-active-state"
    base_branch: "feat/spec-0023-lifecycle"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    source_state_path: ".governance/specs/0023-workflow-runtime/state.yml"
    updated_at: "2026-05-21T00:00:00Z"
    updated_by: "@rosanarezende"
    last_sync_commit: "d01a929"
`;
      const entry = parseActiveSpecs(yaml).activeSpecs[0];
      expect(entry.title).toBe("Workflow Runtime");
      expect(entry.baseBranch).toBe("feat/spec-0023-lifecycle");
      expect(entry.sourceStatePath).toBe(".governance/specs/0023-workflow-runtime/state.yml");
      expect(entry.updatedBy).toBe("@rosanarezende");
      expect(entry.lastSyncCommit).toBe("d01a929");
    });

    it("DADO yaml com active_specs vazio QUANDO parseActiveSpecs ENTÃO aceita lista vazia (sem specs ativas é estado válido)", () => {
      const yaml = `version: 1
active_specs: []
`;
      const root = parseActiveSpecs(yaml);
      expect(root.activeSpecs).toEqual([]);
    });

    it("DADO entry com stage=implementation + status=blocked QUANDO parseActiveSpecs ENTÃO aceita (status é dimensão independente per [DEC-0023-G04])", () => {
      const yaml = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "blocked"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
`;
      const entry = parseActiveSpecs(yaml).activeSpecs[0];
      expect(entry.stage).toBe("implementation");
      expect(entry.status).toBe("blocked");
    });
  });

  describe("parseActiveSpecs — rejeições de schema (acreção silenciosa)", () => {
    it("DADO yaml com chave top-level inesperada QUANDO parseActiveSpecs ENTÃO rejeita citando [DEC-0023-G02]", () => {
      const yaml = `version: 1
extra: "noise"
active_specs: []
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(ActiveSpecsParseError);
      expect(() => parseActiveSpecs(yaml)).toThrow(/unexpected top-level key "extra"/);
      expect(() => parseActiveSpecs(yaml)).toThrow(/\[DEC-0023-G02\]/);
    });

    it("DADO version=2 QUANDO parseActiveSpecs ENTÃO rejeita (apenas v1 suportado; bump exige DEC própria)", () => {
      const yaml = `version: 2
active_specs: []
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/version must be 1/);
    });

    it("DADO entry com campo proibido 'next' QUANDO parseActiveSpecs ENTÃO rejeita citando [DEC-0023-G01] (canal lateral de merge)", () => {
      const yaml = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
    next:
      - "implementar leitura"
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/prohibited key "next"/);
      expect(() => parseActiveSpecs(yaml)).toThrow(/\[DEC-0023-G01\]/);
    });

    it("DADO entry com campo proibido 'gate' QUANDO parseActiveSpecs ENTÃO rejeita citando [DEC-0023-G01]", () => {
      const yaml = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
    gate:
      status: "closed"
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/prohibited key "gate"/);
    });

    it("DADO entry sem id (obrigatório ausente) QUANDO parseActiveSpecs ENTÃO rejeita narrativamente", () => {
      const yaml = `version: 1
active_specs:
  - slug: "workflow-runtime"
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/missing required key "id"/);
    });

    it("DADO entry sem updated_at QUANDO parseActiveSpecs ENTÃO rejeita narrativamente", () => {
      const yaml = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/missing required key "updated_at"/);
    });
  });

  describe("parseActiveSpecs — rejeições de enum/formato (vocabulário cravado)", () => {
    it("DADO stage='C' (letra do narrative do spec.md) QUANDO parseActiveSpecs ENTÃO rejeita citando [DEC-0023-A04] (enum compartilhado)", () => {
      const yaml = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "feat/spec-0023-runtime-active-state"
    stage: "C"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/stage must be one of/);
      expect(() => parseActiveSpecs(yaml)).toThrow(/\[DEC-0023-A04\]/);
    });

    it("DADO status='implementation_in_progress' QUANDO parseActiveSpecs ENTÃO rejeita citando [DEC-0023-G04] (vocabulário fechado)", () => {
      const yaml = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "implementation_in_progress"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/status must be one of/);
      expect(() => parseActiveSpecs(yaml)).toThrow(/\[DEC-0023-G04\]/);
    });

    it("DADO updated_at='2026-05-21' (sem hora) QUANDO parseActiveSpecs ENTÃO rejeita por ISO-8601 estrita", () => {
      const yaml = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21"
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/strict ISO-8601/);
    });

    it("DADO root como lista em vez de mapping QUANDO parseActiveSpecs ENTÃO rejeita", () => {
      const yaml = `- foo
- bar
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/root must be a mapping/);
    });

    it("DADO yaml sem active_specs QUANDO parseActiveSpecs ENTÃO rejeita chave obrigatória ausente", () => {
      const yaml = `version: 1
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/missing required key `active_specs`/);
    });

    it("DADO active_specs não-array QUANDO parseActiveSpecs ENTÃO rejeita", () => {
      const yaml = `version: 1
active_specs: "not a list"
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/active_specs` must be a list/);
    });

    it("DADO entry escalar em vez de mapping QUANDO parseActiveSpecs ENTÃO rejeita posição específica", () => {
      const yaml = `version: 1
active_specs:
  - "not a mapping"
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/active_specs\[0\] must be a mapping/);
    });

    it("DADO entry com chave desconhecida que NÃO está no hint de proibidas QUANDO parseActiveSpecs ENTÃO rejeita citando [DEC-0023-G02]", () => {
      const yaml = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
    extra_attribute: "wat"
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/unexpected key "extra_attribute"/);
      expect(() => parseActiveSpecs(yaml)).toThrow(/\[DEC-0023-G02\]/);
    });

    it("DADO id numérico (não-string) QUANDO parseActiveSpecs ENTÃO rejeita (campos obrigatórios são string)", () => {
      const yaml = `version: 1
active_specs:
  - id: 23
    slug: "workflow-runtime"
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/id must be a string/);
    });

    it("DADO title (opcional) com tipo errado QUANDO parseActiveSpecs ENTÃO rejeita citando o campo", () => {
      const yaml = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    title: 42
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/title must be a string when present/);
    });

    it("DADO title (opcional) vazio QUANDO parseActiveSpecs ENTÃO rejeita orientando a omitir a chave", () => {
      const yaml = `version: 1
active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    title: ""
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/omit the key instead/);
    });

    it("DADO entry com slug vazio QUANDO parseActiveSpecs ENTÃO rejeita por string vazia (validação mínima de naming sem regex)", () => {
      const yaml = `version: 1
active_specs:
  - id: "0023"
    slug: ""
    branch: "feat/spec-0023-runtime-active-state"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    updated_at: "2026-05-21T00:00:00Z"
`;
      expect(() => parseActiveSpecs(yaml)).toThrow(/slug must be a non-empty string/);
    });
  });

  describe("parseActiveSpecs — entry corrente do repo é o próprio fixture", () => {
    it("DADO o conteúdo atual de .governance/runtime/active-specs.yml QUANDO parseActiveSpecs ENTÃO aceita (dogfood do contrato)", () => {
      const yaml = `version: 1

active_specs:
  - id: "0023"
    slug: "workflow-runtime"
    title: "Workflow Runtime"
    branch: "feat/spec-0023-runtime-active-state"
    base_branch: "feat/spec-0023-lifecycle"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0023-workflow-runtime"
    source_state_path: ".governance/specs/0023-workflow-runtime/state.yml"
    updated_at: "2026-05-21T00:00:00Z"
    updated_by: "@rosanarezende"
`;
      const root = parseActiveSpecs(yaml);
      expect(root.activeSpecs[0].slug).toBe("workflow-runtime");
      expect(root.activeSpecs[0].updatedBy).toBe("@rosanarezende");
    });
  });

  describe("stringifyActiveSpecs — round-trip determinístico (entrada do publish-state)", () => {
    const fullRoot: ActiveSpecsRoot = {
      version: 1,
      activeSpecs: [
        {
          id: "0023",
          slug: "workflow-runtime",
          title: "Workflow Runtime",
          branch: "feat/spec-0023-runtime-active-state",
          baseBranch: "feat/spec-0023-lifecycle",
          stage: "implementation",
          status: "active",
          specPath: ".governance/specs/0023-workflow-runtime",
          sourceStatePath: ".governance/specs/0023-workflow-runtime/state.yml",
          updatedAt: "2026-05-21T00:00:00Z",
          updatedBy: "@rosanarezende",
          lastSyncCommit: "d01a929",
        },
      ],
    };

    it("DADO root com 1 entry obrigatórios-only QUANDO stringify→parse ENTÃO devolve estrutura idêntica", () => {
      const minimal: ActiveSpecsRoot = {
        version: 1,
        activeSpecs: [
          {
            id: "0024",
            slug: "foo",
            branch: "feat/spec-0024-foo",
            stage: "discovery",
            status: "paused",
            specPath: ".governance/specs/0024-foo",
            updatedAt: "2026-05-21T12:00:00Z",
          },
        ],
      };
      const yaml = stringifyActiveSpecs(minimal);
      const reparsed = parseActiveSpecs(yaml);
      expect(reparsed).toEqual(minimal);
    });

    it("DADO root com todos os opcionais QUANDO stringify→parse ENTÃO preserva todos os campos", () => {
      const yaml = stringifyActiveSpecs(fullRoot);
      const reparsed = parseActiveSpecs(yaml);
      expect(reparsed).toEqual(fullRoot);
    });

    it("DADO root com lista vazia QUANDO stringify→parse ENTÃO devolve lista vazia (estado válido)", () => {
      const empty: ActiveSpecsRoot = { version: 1, activeSpecs: [] };
      expect(parseActiveSpecs(stringifyActiveSpecs(empty))).toEqual(empty);
    });

    it("DADO duas serializações do mesmo root QUANDO comparadas ENTÃO produzem output byte-idêntico (determinismo para diff git limpo)", () => {
      expect(stringifyActiveSpecs(fullRoot)).toBe(stringifyActiveSpecs(fullRoot));
    });

    it("DADO opcionais ausentes QUANDO stringify ENTÃO omite as chaves no YAML (não escreve null/empty)", () => {
      const partial: ActiveSpecsRoot = {
        version: 1,
        activeSpecs: [
          {
            id: "0024",
            slug: "foo",
            branch: "feat/spec-0024-foo",
            stage: "discovery",
            status: "paused",
            specPath: ".governance/specs/0024-foo",
            updatedAt: "2026-05-21T12:00:00Z",
          },
        ],
      };
      const yaml = stringifyActiveSpecs(partial);
      expect(yaml).not.toMatch(/title:/);
      expect(yaml).not.toMatch(/base_branch:/);
      expect(yaml).not.toMatch(/updated_by:/);
      expect(yaml).not.toMatch(/last_sync_commit:/);
      expect(yaml).not.toMatch(/source_state_path:/);
    });

    it("DADO ordem canônica das chaves QUANDO stringify ENTÃO id vem antes de slug, stage vem antes de status, updated_at vem antes de updated_by", () => {
      const yaml = stringifyActiveSpecs(fullRoot);
      const idIdx = yaml.indexOf("id:");
      const slugIdx = yaml.indexOf("slug:");
      const stageIdx = yaml.indexOf("stage:");
      const statusIdx = yaml.indexOf("status:");
      const updatedAtIdx = yaml.indexOf("updated_at:");
      const updatedByIdx = yaml.indexOf("updated_by:");
      expect(idIdx).toBeLessThan(slugIdx);
      expect(stageIdx).toBeLessThan(statusIdx);
      expect(updatedAtIdx).toBeLessThan(updatedByIdx);
    });
  });
});
