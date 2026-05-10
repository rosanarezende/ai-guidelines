/**
 * [BR-CLI-YAML-SCHEMA] Schema guard determinístico para registry.yml.
 *
 * Cobre todos os códigos REGISTRY_YAML_* estáveis. Mensagens podem evoluir;
 * códigos não.
 *
 * Âncoras: [DEC-0021-A01], [DEC-0021-C01].
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { GovernanceError } from "../../domain/shared/errors.js";
import { GovernanceRegistryStore } from "./GovernanceRegistryStore.js";
import { parseRegistry } from "./registrySchema.js";

function mktmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "gov-yaml-schema-"));
}

function expectCode(fn: () => unknown, code: string): void {
  try {
    fn();
    fail(`Esperava GovernanceError(${code}) mas nada foi lançado.`);
  } catch (err) {
    if (!(err instanceof GovernanceError)) {
      fail(`Esperava GovernanceError, recebi ${(err as Error)?.name}: ${(err as Error)?.message}`);
    }
    expect((err as GovernanceError).code).toBe(code);
  }
}

describe("Infra YAML — Schema guard [BR-CLI-YAML-SCHEMA]", () => {
  it("DADO YAML sintaticamente inválido ENTÃO REGISTRY_YAML_PARSE_ERROR", () => {
    expectCode(() => parseRegistry("version: 1\nitems: [::["), "REGISTRY_YAML_PARSE_ERROR");
  });

  it("DADO raiz não-map ENTÃO REGISTRY_YAML_INVALID_ROOT", () => {
    expectCode(() => parseRegistry("- foo\n- bar"), "REGISTRY_YAML_INVALID_ROOT");
  });

  it("DADO version != 1 ENTÃO REGISTRY_YAML_INVALID_VERSION", () => {
    expectCode(() => parseRegistry("version: 2\nitems: []"), "REGISTRY_YAML_INVALID_VERSION");
  });

  it("DADO items ausente ENTÃO REGISTRY_YAML_INVALID_ITEMS", () => {
    expectCode(() => parseRegistry("version: 1"), "REGISTRY_YAML_INVALID_ITEMS");
  });

  it("DADO items não-seq ENTÃO REGISTRY_YAML_INVALID_ITEMS", () => {
    expectCode(() => parseRegistry("version: 1\nitems: foo"), "REGISTRY_YAML_INVALID_ITEMS");
  });

  it("DADO item escalar ENTÃO REGISTRY_YAML_INVALID_ITEM_SHAPE", () => {
    expectCode(
      () => parseRegistry("version: 1\nitems:\n  - foo"),
      "REGISTRY_YAML_INVALID_ITEM_SHAPE"
    );
  });

  it("DADO campo obrigatório ausente (title) ENTÃO REGISTRY_YAML_INVALID_FIELD_TYPE", () => {
    const yaml = [
      "version: 1",
      "items:",
      "  - id: wi-0001",
      "    kind: spec",
      "    status: in-progress",
      "    workspacePath: specs/x",
      "    sourceRefs: []",
      "    createdAt: 2026-05-10T00:00:00.000Z",
      "    updatedAt: 2026-05-10T00:00:00.000Z",
      "",
    ].join("\n");
    expectCode(() => parseRegistry(yaml), "REGISTRY_YAML_INVALID_FIELD_TYPE");
  });

  it("DADO kind desconhecido ENTÃO REGISTRY_YAML_UNKNOWN_KIND", () => {
    const yaml = [
      "version: 1",
      "items:",
      "  - id: wi-0001",
      "    kind: alienigena",
      "    title: x",
      "    status: in-progress",
      "    sourceRefs: []",
      "    createdAt: 2026-05-10T00:00:00.000Z",
      "    updatedAt: 2026-05-10T00:00:00.000Z",
      "",
    ].join("\n");
    expectCode(() => parseRegistry(yaml), "REGISTRY_YAML_UNKNOWN_KIND");
  });

  it("DADO item denso sem workspacePath ENTÃO REGISTRY_YAML_DENSE_MISSING_WORKSPACE", () => {
    const yaml = [
      "version: 1",
      "items:",
      "  - id: wi-0001",
      "    kind: spec",
      "    title: spec sem workspace",
      "    status: in-progress",
      "    sourceRefs: []",
      "    createdAt: 2026-05-10T00:00:00.000Z",
      "    updatedAt: 2026-05-10T00:00:00.000Z",
      "",
    ].join("\n");
    expectCode(() => parseRegistry(yaml), "REGISTRY_YAML_DENSE_MISSING_WORKSPACE");
  });

  it("DADO item virtual com campo denso ENTÃO REGISTRY_YAML_VIRTUAL_HAS_DENSE_FIELD", () => {
    const yaml = [
      "version: 1",
      "items:",
      "  - id: wi-0001",
      "    kind: proposal",
      "    title: proposta com workspace",
      "    status: draft",
      "    workspacePath: nao-deveria-existir",
      "    sourceRefs: []",
      "    createdAt: 2026-05-10T00:00:00.000Z",
      "    updatedAt: 2026-05-10T00:00:00.000Z",
      "",
    ].join("\n");
    expectCode(() => parseRegistry(yaml), "REGISTRY_YAML_VIRTUAL_HAS_DENSE_FIELD");
  });

  it("DADO ids duplicados ENTÃO REGISTRY_YAML_DUPLICATE_ID", () => {
    const yaml = [
      "version: 1",
      "items:",
      "  - id: wi-0001",
      "    kind: proposal",
      "    title: a",
      "    status: draft",
      "    sourceRefs: []",
      "    createdAt: 2026-05-10T00:00:00.000Z",
      "    updatedAt: 2026-05-10T00:00:00.000Z",
      "  - id: wi-0001",
      "    kind: proposal",
      "    title: b",
      "    status: draft",
      "    sourceRefs: []",
      "    createdAt: 2026-05-10T00:00:00.000Z",
      "    updatedAt: 2026-05-10T00:00:00.000Z",
      "",
    ].join("\n");
    expectCode(() => parseRegistry(yaml), "REGISTRY_YAML_DUPLICATE_ID");
  });

  it("DADO sourceRefs com não-string ENTÃO REGISTRY_YAML_INVALID_FIELD_TYPE", () => {
    const yaml = [
      "version: 1",
      "items:",
      "  - id: wi-0001",
      "    kind: proposal",
      "    title: a",
      "    status: draft",
      "    sourceRefs: [123]",
      "    createdAt: 2026-05-10T00:00:00.000Z",
      "    updatedAt: 2026-05-10T00:00:00.000Z",
      "",
    ].join("\n");
    expectCode(() => parseRegistry(yaml), "REGISTRY_YAML_INVALID_FIELD_TYPE");
  });

  it("DADO atomicidade — store carregando arquivo corrompido ENTÃO erro identifica código estável", () => {
    const root = mktmp();
    const filePath = path.join(root, ".governance", "registry.yml");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "version: 2\nitems: []\n");
    const store = new GovernanceRegistryStore(filePath);
    expectCode(() => store.load(), "REGISTRY_YAML_INVALID_VERSION");
    fs.rmSync(root, { recursive: true, force: true });
  });
});
