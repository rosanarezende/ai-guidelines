import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { discoverStateYmlFiles, runStateYmlCheck } from "./stateYmlCheck.js";

const VALID_YAML = `stage: discovery
gate:
  status: open
focus:
  - "Item de foco 1"
next:
  - "Próxima ação"
`;

describe("CLI — state-yml:check [BR-STATE-YML-SCHEMA]", () => {
  describe("runStateYmlCheck — validação contra schema canônico", () => {
    it("DADO state.yml válido com 4 chaves canônicas ENTÃO retorna ok com count correto", () => {
      const result = runStateYmlCheck({
        files: ["/fake/spec-0001/state.yml"],
        readFile: () => VALID_YAML,
      });
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") expect(result.count).toBe(1);
    });

    it("DADO state.yml com stage inválido (ex.: 'research') ENTÃO retorna fail com mensagem orientativa", () => {
      const invalid = `stage: research
gate:
  status: open
focus: []
next: []
`;
      const result = runStateYmlCheck({
        files: ["/fake/spec-0001/state.yml"],
        readFile: () => invalid,
      });
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.failures).toHaveLength(1);
        expect(result.failures[0].message).toMatch(/stage must be one of/);
      }
    });

    it("DADO state.yml com focus como string escalar ENTÃO retorna fail (schema exige lista)", () => {
      const invalid = `stage: discovery
gate:
  status: open
focus: "uma string só, em vez de lista"
next: []
`;
      const result = runStateYmlCheck({
        files: ["/fake/spec-0001/state.yml"],
        readFile: () => invalid,
      });
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.failures[0].message).toMatch(/focus must be a list of strings/);
      }
    });

    it("DADO state.yml com next como string escalar ENTÃO retorna fail", () => {
      const invalid = `stage: discovery
gate:
  status: open
focus: []
next: "uma string só"
`;
      const result = runStateYmlCheck({
        files: ["/fake/spec-0001/state.yml"],
        readFile: () => invalid,
      });
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.failures[0].message).toMatch(/next must be a list of strings/);
      }
    });

    it("DADO state.yml com chave desconhecida no top-level ENTÃO retorna fail (protege acreção silenciosa)", () => {
      const invalid = `stage: discovery
gate:
  status: open
focus: []
next: []
extra_field: "deveria-ser-rejeitada"
`;
      const result = runStateYmlCheck({
        files: ["/fake/spec-0001/state.yml"],
        readFile: () => invalid,
      });
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.failures[0].message).toMatch(/unexpected top-level key/);
      }
    });

    it("DADO state.yml com gate.status inválido ENTÃO retorna fail", () => {
      const invalid = `stage: discovery
gate:
  status: maybe
focus: []
next: []
`;
      const result = runStateYmlCheck({
        files: ["/fake/spec-0001/state.yml"],
        readFile: () => invalid,
      });
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.failures[0].message).toMatch(/gate\.status must be one of/);
      }
    });

    it("DADO múltiplos arquivos com 1 inválido entre 3 ENTÃO reporta apenas o failing com path", () => {
      const invalid = `stage: bogus_stage
gate:
  status: open
focus: []
next: []
`;
      const files = ["/fake/a/state.yml", "/fake/b/state.yml", "/fake/c/state.yml"];
      const result = runStateYmlCheck({
        files,
        readFile: (p) => (p.endsWith("b/state.yml") ? invalid : VALID_YAML),
      });
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.failures).toHaveLength(1);
        expect(result.failures[0].file).toBe("/fake/b/state.yml");
        expect(result.total).toBe(3);
      }
    });

    it("DADO lista vazia de arquivos ENTÃO retorna ok com count 0 (estado válido)", () => {
      const result = runStateYmlCheck({
        files: [],
        readFile: () => "",
      });
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") expect(result.count).toBe(0);
    });
  });

  describe("discoverStateYmlFiles — descoberta de specs com state.yml", () => {
    let tmpRoot: string;

    beforeEach(() => {
      tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "state-yml-check-"));
    });

    afterEach(() => {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    });

    it("DADO repo sem .governance/specs/ nem .specify/specs/ ENTÃO retorna lista vazia", () => {
      expect(discoverStateYmlFiles(tmpRoot)).toEqual([]);
    });

    it("DADO 2 specs com state.yml em .governance/specs/ ENTÃO descobre ambas ordenadas", () => {
      const dirA = path.join(tmpRoot, ".governance", "specs", "0024-alfa");
      const dirB = path.join(tmpRoot, ".governance", "specs", "0025-beta");
      fs.mkdirSync(dirA, { recursive: true });
      fs.mkdirSync(dirB, { recursive: true });
      fs.writeFileSync(path.join(dirA, "state.yml"), VALID_YAML);
      fs.writeFileSync(path.join(dirB, "state.yml"), VALID_YAML);
      const files = discoverStateYmlFiles(tmpRoot);
      expect(files).toHaveLength(2);
      expect(files[0]).toContain("0024-alfa");
      expect(files[1]).toContain("0025-beta");
    });

    it("DADO specs em ambos os roots (.governance + .specify legacy) ENTÃO descobre nos dois", () => {
      const govDir = path.join(tmpRoot, ".governance", "specs", "0024-novo");
      const legacyDir = path.join(tmpRoot, ".specify", "specs", "0020-legado");
      fs.mkdirSync(govDir, { recursive: true });
      fs.mkdirSync(legacyDir, { recursive: true });
      fs.writeFileSync(path.join(govDir, "state.yml"), VALID_YAML);
      fs.writeFileSync(path.join(legacyDir, "state.yml"), VALID_YAML);
      const files = discoverStateYmlFiles(tmpRoot);
      expect(files).toHaveLength(2);
    });

    it("DADO subdiretórios não-spec (roadmap, research-library) ENTÃO ignora (sem state.yml dentro)", () => {
      const govSpecs = path.join(tmpRoot, ".governance", "specs");
      fs.mkdirSync(path.join(govSpecs, "roadmap"), { recursive: true });
      fs.mkdirSync(path.join(govSpecs, "research-library"), { recursive: true });
      const specDir = path.join(govSpecs, "0001-test");
      fs.mkdirSync(specDir, { recursive: true });
      fs.writeFileSync(path.join(specDir, "state.yml"), VALID_YAML);
      const files = discoverStateYmlFiles(tmpRoot);
      expect(files).toHaveLength(1);
      expect(files[0]).toContain("0001-test");
    });

    it("DADO diretório de spec sem state.yml ENTÃO ignora (spec ainda não bootstrap)", () => {
      const govSpecs = path.join(tmpRoot, ".governance", "specs");
      const specA = path.join(govSpecs, "0001-com-state");
      const specB = path.join(govSpecs, "0002-sem-state");
      fs.mkdirSync(specA, { recursive: true });
      fs.mkdirSync(specB, { recursive: true });
      fs.writeFileSync(path.join(specA, "state.yml"), VALID_YAML);
      // specB intencionalmente sem state.yml
      const files = discoverStateYmlFiles(tmpRoot);
      expect(files).toHaveLength(1);
      expect(files[0]).toContain("0001-com-state");
    });
  });
});
