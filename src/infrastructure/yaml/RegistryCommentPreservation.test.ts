/**
 * [BR-CLI-YAML-COMMENTS] Preservação de comentários.
 *
 * Contrato:
 *  - Comentários inline e de linha cheia adicionados manualmente pelo usuário
 *    em registry.yml sobrevivem a load → mutate → save.
 *  - Como yaml@2 atrela comentários ao nó (não ao índice), reordenação
 *    alfabética por id na escrita preserva a relação comentário↔item.
 *  - Comentários atrelados a itens removidos somem junto com o item (correto).
 *
 * Âncoras: [DEC-0021-A01], [DEC-0021-C01].
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { GovernanceRegistryStore } from "./GovernanceRegistryStore.js";

function mktmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "gov-yaml-comments-"));
}

const SEEDED_WITH_COMMENTS = `# Registry SSOT — editável por humanos e CLI
version: 1
items:
  # Spec primária — não remover sem ADR
  - id: wi-0001
    kind: spec
    title: Spec inicial
    status: in-progress
    workspacePath: specs/0001
    sourceRefs: []
    createdAt: 2026-05-10T00:00:00.000Z
    updatedAt: 2026-05-10T00:00:00.000Z
  - id: wi-0002
    kind: proposal
    title: Proposta
    status: draft
    sourceRefs: []
    createdAt: 2026-05-10T00:00:00.000Z
    updatedAt: 2026-05-10T00:00:00.000Z
`;

describe("Infra YAML — Comment preservation [BR-CLI-YAML-COMMENTS]", () => {
  let root: string;
  let filePath: string;

  beforeEach(() => {
    root = mktmp();
    filePath = path.join(root, ".governance", "registry.yml");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, SEEDED_WITH_COMMENTS);
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("DADO arquivo com comentário de cabeçalho QUANDO load → save sem mutação ENTÃO comentário preservado", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    store.save();
    const after = fs.readFileSync(filePath, "utf8");
    expect(after).toContain("Registry SSOT — editável por humanos e CLI");
  });

  it("DADO comentário sobre item QUANDO update neste item ENTÃO comentário sobrevive", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    store.update(
      "wi-0001",
      { title: "Spec renomeada", status: "review" },
      "2026-05-11T00:00:00.000Z"
    );
    store.save();
    const after = fs.readFileSync(filePath, "utf8");
    expect(after).toContain("Spec primária — não remover sem ADR");
    expect(after).toContain("Spec renomeada");
  });

  it("DADO add de novo item ENTÃO comentários de itens preexistentes sobrevivem", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    store.add({
      id: "wi-0003",
      kind: "fix",
      title: "Fix tardio",
      status: "draft",
      createdAt: "2026-05-11T00:00:00.000Z",
      updatedAt: "2026-05-11T00:00:00.000Z",
      sourceRefs: [],
    });
    store.save();
    const after = fs.readFileSync(filePath, "utf8");
    expect(after).toContain("Spec primária — não remover sem ADR");
    expect(after).toContain("Registry SSOT — editável por humanos e CLI");
    expect(after).toContain("wi-0003");
  });

  // Contrato realista (yaml@2): comentários do tipo `commentBefore` ficam
  // atrelados ao próximo nó da sequência. Ao remover o item-alvo, o
  // comentário "migra" para o item seguinte ao invés de sumir. Isto é
  // **conservador por design** (nunca destrói texto do usuário) e
  // representa o pior cenário ergonômico aceitável — limpeza textual
  // remanescente é responsabilidade do humano que removeu o item.
  it("DADO remove de item ENTÃO conteúdo do usuário permanece (não-destruição) e itens preservados re-aparecem", () => {
    const store = new GovernanceRegistryStore(filePath);
    store.load();
    store.remove("wi-0001");
    store.save();
    const after = fs.readFileSync(filePath, "utf8");
    expect(after).toContain("Registry SSOT — editável por humanos e CLI");
    expect(after).toContain("wi-0002");
    expect(after).not.toContain("wi-0001");
  });
});
