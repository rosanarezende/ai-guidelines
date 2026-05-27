/**
 * [BR-CLI-REGISTRY-01] Integridade do Registro (camada em memória).
 * Comportamento de IO/YAML (parsing com erro estável, preservação de
 * comentários, ordem de blocos, atomicidade) é testado na camada de
 * infraestrutura: `infrastructure/yaml/RegistrySchemaGuard.test.ts` e
 * `infrastructure/yaml/RegistryRoundTrip.test.ts`.
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

    // Parsing de YAML inválido → erro descritivo: coberto em
    // infrastructure/yaml/RegistrySchemaGuard.test.ts (REGISTRY_YAML_PARSE_ERROR).

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

  // Preservação de comentários humanos e ordem estável de blocos no YAML são
  // comportamento do writer (infraestrutura): cobertos em
  // infrastructure/yaml/RegistryRoundTrip.test.ts.

  describe("Arquivamento (Soft Delete) [BR-CLI-REGISTRY-01]", () => {
    it("DADO archive() de item crítico ('spec') ENTÃO status vira 'archived' e item é preservado [DEC-0021-A01]", () => {
      const r = new InMemoryRegistry();
      r.add(make({ id: "wi-spec", kind: "spec", workspacePath: ".governance/specs/01" }));

      const archived = r.archive("wi-spec", "2026-05-27T00:00:00.000Z");

      expect(archived.status).toBe("archived");
      expect(archived.updatedAt).toBe("2026-05-27T00:00:00.000Z");
      expect(r.has("wi-spec")).toBe(true);
      expect(r.find("wi-spec")?.status).toBe("archived");
    });

    it("DADO archive() de item crítico ('incident') ENTÃO preserva no registry como 'archived' [DEC-0021-A01]", () => {
      const r = new InMemoryRegistry();
      r.add(
        make({
          id: "wi-inc",
          kind: "incident",
          workspacePath: ".governance/incidents/01",
          severity: "high",
        })
      );

      r.archive("wi-inc", "2026-05-27T00:00:00.000Z");

      expect(r.list().map((i) => i.id)).toContain("wi-inc");
      expect(r.find("wi-inc")?.status).toBe("archived");
    });

    it("DADO archive() de id inexistente ENTÃO REGISTRY_NOT_FOUND", () => {
      const r = new InMemoryRegistry();
      try {
        r.archive("wi-missing", "2026-05-27T00:00:00.000Z");
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("REGISTRY_NOT_FOUND");
      }
    });
  });
});
