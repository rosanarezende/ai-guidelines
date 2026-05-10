/**
 * [BR-CLI-REGISTRY-01] Integridade do Registro (camada em memória — Fase 1).
 * IO real (YAML, parsing, comentários) é Fase 2 [DEC-0021-A01].
 */
import { GovernanceError } from "../shared/errors.js";
import { WorkItem } from "../work-item/WorkItem.js";
import { InMemoryRegistry } from "./Registry.js";

function make(over: Partial<WorkItem>): WorkItem {
  return {
    id: "wi-1",
    kind: "spec",
    title: "Item base",
    status: "draft",
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
    sourceRefs: [],
    workspacePath: ".governance/specs/00",
    ...over,
  };
}

describe("Domínio — Integridade do Registro [BR-CLI-REGISTRY]", () => {
  describe("[BR-CLI-REGISTRY-01] Validação de Tipo", () => {
    it("DADO um item com kind desconhecido ENTÃO REGISTRY_UNKNOWN_KIND", () => {
      const r = new InMemoryRegistry();
      try {
        r.add(make({ kind: "lol" as unknown as WorkItem["kind"] }));
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("REGISTRY_UNKNOWN_KIND");
      }
    });

    // [SKIP-REASON: Fase 2 — parsing de YAML real e schema-guard sobre YAML chega no PR2 [DEC-0021-A01]]
    it.skip("DADO um arquivo 'registry.yml' com sintaxe inválida QUANDO lido ENTÃO erro descritivo de parsing [DEC-0021-A01]", () => {});

    it("DADO um item de 'experiment' completo ENTÃO add() não lança", () => {
      const r = new InMemoryRegistry();
      expect(() =>
        r.add(
          make({
            id: "wi-exp",
            kind: "experiment",
            workspacePath: ".governance/experiments/01",
            hypothesis: "Aumentaremos a conversão em 10%",
            successMetrics: ["ctr"],
          })
        )
      ).not.toThrow();
    });
  });

  describe("Unicidade e Imutabilidade", () => {
    it("DADO um item já existente QUANDO add() do mesmo id ENTÃO REGISTRY_DUPLICATE_ID", () => {
      const r = new InMemoryRegistry();
      r.add(make({ id: "wi-1" }));
      try {
        r.add(make({ id: "wi-1" }));
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("REGISTRY_DUPLICATE_ID");
      }
    });

    it("DADO update() com 'id' divergente ENTÃO REGISTRY_IMMUTABLE_ID", () => {
      const r = new InMemoryRegistry();
      r.add(make({ id: "wi-1" }));
      try {
        r.update("wi-1", { id: "wi-2" }, "2026-05-11T00:00:00.000Z");
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("REGISTRY_IMMUTABLE_ID");
      }
    });

    it("DADO update() com 'createdAt' divergente ENTÃO REGISTRY_IMMUTABLE_CREATED_AT", () => {
      const r = new InMemoryRegistry();
      r.add(make({ id: "wi-1" }));
      try {
        r.update("wi-1", { createdAt: "1999-01-01T00:00:00.000Z" }, "2026-05-11T00:00:00.000Z");
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("REGISTRY_IMMUTABLE_CREATED_AT");
      }
    });

    it("DADO update() válido ENTÃO updatedAt é atualizado e id/createdAt preservados", () => {
      const r = new InMemoryRegistry();
      r.add(make({ id: "wi-1" }));
      const next = r.update("wi-1", { title: "Novo título" }, "2026-05-11T00:00:00.000Z");
      expect(next.id).toBe("wi-1");
      expect(next.createdAt).toBe("2026-05-10T00:00:00.000Z");
      expect(next.updatedAt).toBe("2026-05-11T00:00:00.000Z");
      expect(next.title).toBe("Novo título");
    });
  });

  describe("Ordenação determinística", () => {
    it("DADO inserções fora de ordem QUANDO list() ENTÃO retorna ordenado por id ascendente", () => {
      const r = new InMemoryRegistry();
      r.add(make({ id: "wi-3" }));
      r.add(make({ id: "wi-1" }));
      r.add(make({ id: "wi-2" }));
      expect(r.list().map((i) => i.id)).toEqual(["wi-1", "wi-2", "wi-3"]);
    });
  });

  describe("Interface Humana (YAML Preservation)", () => {
    // [SKIP-REASON: Fase 2 — preservação de comentários depende do writer YAML (PR2) [DEC-0021-A01]]
    it.skip("DADO um 'registry.yml' com comentários humanos QUANDO salvo ENTÃO preserva comentários [DEC-0021-A01]", () => {});
    // [SKIP-REASON: Fase 2 — estabilidade de bloco no YAML depende do writer (PR2) [DEC-0021-A01]]
    it.skip("DADO gravação ENTÃO mantém ordem estável dos blocos [DEC-0021-A01]", () => {});
  });

  describe("Arquivamento (Soft Delete)", () => {
    // [SKIP-REASON: Fase 2 — soft delete será modelado quando IO/lifecycle for finalizado (PR2) [DEC-0021-A01]]
    it.skip("DADO deleção de item crítico ('spec', 'incident') ENTÃO arquiva (soft delete) [DEC-0021-A01]", () => {});
  });
});
