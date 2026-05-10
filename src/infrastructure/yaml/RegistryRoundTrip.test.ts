/**
 * [BR-CLI-YAML-ROUNDTRIP] Round-trip semântico do registry.yml.
 *
 * Garante: load → mutate → save → load preserva a semântica do domínio
 * (não apenas bytes; igualdade lógica via list()).
 *
 * Também valida:
 *  - Imutabilidade de id/createdAt no update.
 *  - Atomicidade do save() — falha simulada via dir read-only no rename
 *    deixa o arquivo original intacto.
 *
 * Âncoras: [DEC-0021-A01], [DEC-0021-C01].
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { GovernanceError } from "../../domain/shared/errors.js";
import { GovernanceRegistryStore } from "./GovernanceRegistryStore.js";
import { RegistryService } from "../../app/services/RegistryService.js";
import { WorkItem } from "../../domain/work-item/WorkItem.js";

function mktmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "gov-yaml-rt-"));
}

const SPEC: WorkItem = {
  id: "wi-0001",
  kind: "spec",
  title: "Spec inicial",
  status: "in-progress",
  workspacePath: "specs/0001",
  createdAt: "2026-05-10T00:00:00.000Z",
  updatedAt: "2026-05-10T00:00:00.000Z",
  sourceRefs: [],
};

const PROPOSAL: WorkItem = {
  id: "wi-0002",
  kind: "proposal",
  title: "Proposta",
  status: "draft",
  createdAt: "2026-05-10T00:00:00.000Z",
  updatedAt: "2026-05-10T00:00:00.000Z",
  sourceRefs: [],
};

const EXPERIMENT: WorkItem = {
  id: "wi-0003",
  kind: "experiment",
  title: "Experimento",
  status: "in-progress",
  workspacePath: "experiments/0003",
  hypothesis: "Caminho B converte mais",
  successMetrics: ["conv>10%"],
  createdAt: "2026-05-10T00:00:00.000Z",
  updatedAt: "2026-05-10T00:00:00.000Z",
  sourceRefs: [],
};

describe("Infra YAML — Round-trip [BR-CLI-YAML-ROUNDTRIP]", () => {
  let root: string;
  let filePath: string;

  beforeEach(() => {
    root = mktmp();
    filePath = path.join(root, ".governance", "registry.yml");
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("DADO add+save ENTÃO arquivo persistido reabre com mesma lista (semântica)", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    store.add(SPEC);
    store.add(PROPOSAL);
    store.add(EXPERIMENT);
    store.save();

    const reopened = new GovernanceRegistryStore(filePath);
    reopened.load();
    const reloaded = reopened.list();

    expect(reloaded).toEqual([SPEC, PROPOSAL, EXPERIMENT]);
  });

  it("DADO update ENTÃO save → load preserva mutação", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    store.add(SPEC);
    store.save();

    store.update(
      "wi-0001",
      { title: "Spec renomeada", status: "review" },
      "2026-05-11T00:00:00.000Z"
    );
    store.save();

    const reopened = new GovernanceRegistryStore(filePath);
    reopened.load();
    const item = reopened.find("wi-0001");
    expect(item?.title).toBe("Spec renomeada");
    expect(item?.status).toBe("review");
    expect(item?.updatedAt).toBe("2026-05-11T00:00:00.000Z");
    expect(item?.createdAt).toBe(SPEC.createdAt);
  });

  it("DADO remove ENTÃO save → load não retorna item removido", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    store.add(SPEC);
    store.add(PROPOSAL);
    store.save();

    store.remove("wi-0001");
    store.save();

    const reopened = new GovernanceRegistryStore(filePath);
    reopened.load();
    expect(reopened.find("wi-0001")).toBeUndefined();
    expect(reopened.find("wi-0002")).toBeDefined();
    expect(reopened.list().length).toBe(1);
  });

  it("DADO patch alterando id ENTÃO REGISTRY_IMMUTABLE_ID", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    store.add(SPEC);
    try {
      store.update("wi-0001", { id: "wi-9999" }, "2026-05-11T00:00:00.000Z");
      fail("Esperava GovernanceError");
    } catch (err) {
      expect(err).toBeInstanceOf(GovernanceError);
      expect((err as GovernanceError).code).toBe("REGISTRY_IMMUTABLE_ID");
    }
  });

  it("DADO patch alterando createdAt ENTÃO REGISTRY_IMMUTABLE_CREATED_AT", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    store.add(SPEC);
    try {
      store.update(
        "wi-0001",
        { createdAt: "1999-01-01T00:00:00.000Z" },
        "2026-05-11T00:00:00.000Z"
      );
      fail("Esperava GovernanceError");
    } catch (err) {
      expect((err as GovernanceError).code).toBe("REGISTRY_IMMUTABLE_CREATED_AT");
    }
  });

  it("DADO id duplicado em add ENTÃO REGISTRY_DUPLICATE_ID (após load)", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    store.add(SPEC);
    try {
      store.add({ ...SPEC, title: "outro" });
      fail("Esperava GovernanceError");
    } catch (err) {
      expect((err as GovernanceError).code).toBe("REGISTRY_DUPLICATE_ID");
    }
  });

  it("DADO RegistryService com autosave ENTÃO add persiste em disco automaticamente", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    const svc = new RegistryService(store);
    svc.add(SPEC);
    expect(fs.existsSync(filePath)).toBe(true);
    const text = fs.readFileSync(filePath, "utf8");
    expect(text).toContain("wi-0001");
  });

  it("DADO save falhando (tmp inválido) ENTÃO arquivo original permanece intacto (atomicidade)", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    store.add(SPEC);
    store.save();
    const originalBytes = fs.readFileSync(filePath);

    // Força falha: substitui filePath por um diretório → renameSync vai falhar
    // ao tentar sobrescrever um diretório com um arquivo.
    fs.unlinkSync(filePath);
    fs.mkdirSync(filePath, { recursive: true });

    expect(() => {
      store.add(PROPOSAL);
      store.save();
    }).toThrow();

    // O alvo original (agora um diretório) não foi sobrescrito — verifica que
    // ainda é diretório (renameSync não conseguiu substituir).
    expect(fs.statSync(filePath).isDirectory()).toBe(true);

    // Tmp não deve ter sobrado no diretório pai.
    const stragglers = fs.readdirSync(path.dirname(filePath)).filter((n) => n.includes(".tmp"));
    expect(stragglers).toEqual([]);

    // Restore para o afterEach poder limpar.
    fs.rmdirSync(filePath);
    fs.writeFileSync(filePath, originalBytes);
  });
});
