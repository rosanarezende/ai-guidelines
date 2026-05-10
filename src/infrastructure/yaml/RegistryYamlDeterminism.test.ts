/**
 * [BR-CLI-YAML-DET] Determinismo de serialização do registry.yml.
 *
 * Contrato:
 *  - Mesma entrada lógica → mesmos bytes.
 *  - Ordem de inserção não pode afetar a saída.
 *  - load → save (sem mutação) preserva bytes.
 *
 * Âncoras: [DEC-0021-A01], [DEC-0021-C01].
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { GovernanceRegistryStore } from "./GovernanceRegistryStore.js";
import { WorkItem } from "../../domain/work-item/WorkItem.js";

function mktmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "gov-yaml-det-"));
}

const ITEM_A: WorkItem = {
  id: "wi-0001",
  kind: "spec",
  title: "Primeira spec",
  status: "in-progress",
  workspacePath: "specs/0001-primeira",
  createdAt: "2026-05-10T00:00:00.000Z",
  updatedAt: "2026-05-10T00:00:00.000Z",
  sourceRefs: [],
};

const ITEM_B: WorkItem = {
  id: "wi-0002",
  kind: "proposal",
  title: "Proposta inicial",
  status: "draft",
  createdAt: "2026-05-10T00:00:00.000Z",
  updatedAt: "2026-05-10T00:00:00.000Z",
  sourceRefs: ["docs/intake/2026-05-10.md"],
};

const ITEM_C: WorkItem = {
  id: "wi-0003",
  kind: "experiment",
  title: "Hipótese X",
  status: "in-progress",
  workspacePath: "experiments/0003-x",
  hypothesis: "Usuários preferem caminho B sobre A",
  successMetrics: ["conversao>10%", "churn<5%"],
  createdAt: "2026-05-10T00:00:00.000Z",
  updatedAt: "2026-05-10T00:00:00.000Z",
  sourceRefs: [],
};

describe("Infra YAML — Determinismo do registry.yml [BR-CLI-YAML-DET]", () => {
  let root: string;
  let filePath: string;

  beforeEach(() => {
    root = mktmp();
    filePath = path.join(root, ".governance", "registry.yml");
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("DADO mesmos itens inseridos em ordens distintas ENTÃO bytes serializados são idênticos", () => {
    const store1 = new GovernanceRegistryStore(filePath);
    store1.load();
    store1.add(ITEM_A);
    store1.add(ITEM_B);
    store1.add(ITEM_C);
    const yaml1 = store1.toYaml();

    const filePath2 = path.join(root, "alt", "registry.yml");
    const store2 = new GovernanceRegistryStore(filePath2);
    store2.load();
    // Ordem reversa
    store2.add(ITEM_C);
    store2.add(ITEM_B);
    store2.add(ITEM_A);
    const yaml2 = store2.toYaml();

    expect(yaml1).toBe(yaml2);
  });

  it("DADO arquivo escrito QUANDO recarregado e re-salvo sem mutação ENTÃO bytes idênticos", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    store.add(ITEM_A);
    store.add(ITEM_B);
    store.save();
    const first = fs.readFileSync(filePath, "utf8");

    const store2 = new GovernanceRegistryStore(filePath);
    store2.load();
    store2.save();
    const second = fs.readFileSync(filePath, "utf8");

    expect(second).toBe(first);
  });

  it("DADO serialização ENTÃO itens aparecem em ordem alfa de id", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    store.add(ITEM_C);
    store.add(ITEM_A);
    store.add(ITEM_B);
    const yaml = store.toYaml();

    const idxA = yaml.indexOf("wi-0001");
    const idxB = yaml.indexOf("wi-0002");
    const idxC = yaml.indexOf("wi-0003");
    expect(idxA).toBeGreaterThan(-1);
    expect(idxB).toBeGreaterThan(idxA);
    expect(idxC).toBeGreaterThan(idxB);
  });

  it("DADO item com campos opcionais ENTÃO chaves aparecem em ordem canônica (id, kind, title, status, workspacePath...)", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    store.add(ITEM_C);
    const yaml = store.toYaml();
    const idxId = yaml.indexOf("id:");
    const idxKind = yaml.indexOf("kind:");
    const idxTitle = yaml.indexOf("title:");
    const idxStatus = yaml.indexOf("status:");
    const idxWs = yaml.indexOf("workspacePath:");
    const idxHyp = yaml.indexOf("hypothesis:");
    const idxCreated = yaml.indexOf("createdAt:");
    expect(idxId).toBeLessThan(idxKind);
    expect(idxKind).toBeLessThan(idxTitle);
    expect(idxTitle).toBeLessThan(idxStatus);
    expect(idxStatus).toBeLessThan(idxWs);
    expect(idxWs).toBeLessThan(idxHyp);
    expect(idxHyp).toBeLessThan(idxCreated);
  });
});
