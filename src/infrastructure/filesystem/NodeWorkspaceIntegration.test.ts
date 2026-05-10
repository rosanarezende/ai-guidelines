/**
 * [BR-CLI-INFRA-WORKSPACE] Integração real (filesystem) do
 * {@link NodeWorkspaceProvisioner} + {@link NodeFileSystemProbe}.
 *
 * Cobre o que fakes não cobrem: idempotência, escopo, e a invariante de
 * que rollback (`removeDirectoryIfEmpty`) JAMAIS apaga conteúdo do usuário.
 *
 * Âncoras: [DEC-0021-A03], [DEC-0021-C01].
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { GovernanceError } from "../../domain/shared/errors.js";
import { NodeFileSystemProbe } from "./NodeFileSystemProbe.js";
import { NodeWorkspaceProvisioner } from "./NodeWorkspaceProvisioner.js";

function mktmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "gov-pr2-"));
}

describe("Infra — Node workspace integration [BR-CLI-INFRA-WORKSPACE]", () => {
  let root: string;

  beforeEach(() => {
    root = mktmp();
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  describe("NodeFileSystemProbe", () => {
    it("DADO diretório existente ENTÃO directoryExists retorna true", () => {
      fs.mkdirSync(path.join(root, ".governance"));
      const probe = new NodeFileSystemProbe(root);
      expect(probe.directoryExists(".governance")).toBe(true);
    });

    it("DADO arquivo (não diretório) ENTÃO directoryExists retorna false", () => {
      fs.writeFileSync(path.join(root, ".governance"), "");
      const probe = new NodeFileSystemProbe(root);
      expect(probe.directoryExists(".governance")).toBe(false);
    });

    it("DADO caminho inexistente ENTÃO directoryExists retorna false (sem lançar)", () => {
      const probe = new NodeFileSystemProbe(root);
      expect(probe.directoryExists(".governance")).toBe(false);
    });
  });

  describe("NodeWorkspaceProvisioner", () => {
    it("DADO diretório inexistente ENTÃO ensureDirectory cria e retorna true", () => {
      const provisioner = new NodeWorkspaceProvisioner(root);
      expect(provisioner.ensureDirectory(".governance")).toBe(true);
      expect(fs.statSync(path.join(root, ".governance")).isDirectory()).toBe(true);
    });

    it("DADO diretório existente ENTÃO ensureDirectory é noop e retorna false", () => {
      const provisioner = new NodeWorkspaceProvisioner(root);
      provisioner.ensureDirectory(".governance");
      expect(provisioner.ensureDirectory(".governance")).toBe(false);
    });

    it("DADO caminho com '..' que escapa do root ENTÃO lança WORKSPACE_PATH_OUT_OF_SCOPE", () => {
      const provisioner = new NodeWorkspaceProvisioner(root);
      try {
        provisioner.ensureDirectory("../escape");
        fail("Esperava GovernanceError");
      } catch (err) {
        expect(err).toBeInstanceOf(GovernanceError);
        expect((err as GovernanceError).code).toBe("WORKSPACE_PATH_OUT_OF_SCOPE");
      }
    });

    it("DADO diretório vazio criado ENTÃO removeDirectoryIfEmpty remove", () => {
      const provisioner = new NodeWorkspaceProvisioner(root);
      provisioner.ensureDirectory(".governance/intake");
      provisioner.removeDirectoryIfEmpty(".governance/intake");
      expect(fs.existsSync(path.join(root, ".governance/intake"))).toBe(false);
    });

    it("DADO diretório com CONTEÚDO DO USUÁRIO ENTÃO removeDirectoryIfEmpty NÃO remove (invariante de não-destruição)", () => {
      const provisioner = new NodeWorkspaceProvisioner(root);
      provisioner.ensureDirectory(".governance");
      fs.writeFileSync(path.join(root, ".governance/keep.txt"), "user-content");
      provisioner.removeDirectoryIfEmpty(".governance");
      expect(fs.existsSync(path.join(root, ".governance"))).toBe(true);
      expect(fs.readFileSync(path.join(root, ".governance/keep.txt"), "utf8")).toBe("user-content");
    });

    it("DADO diretório inexistente ENTÃO removeDirectoryIfEmpty é silencioso (idempotente)", () => {
      const provisioner = new NodeWorkspaceProvisioner(root);
      expect(() => provisioner.removeDirectoryIfEmpty(".governance/nope")).not.toThrow();
    });
  });
});
