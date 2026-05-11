/**
 * [BR-CLI-REGISTRY-INTEGRITY] Helper puro `assertRegistryImmutables`.
 *
 * Garante que id/createdAt rejeitam divergência com códigos estáveis.
 * O contrato é compartilhado entre `InMemoryRegistry` e `GovernanceRegistryStore`
 * — testá-lo aqui evita drift de mensagem entre as implementações.
 */
import { GovernanceError } from "../shared/errors.js";
import { WorkItem, WorkItemPatch } from "../work-item/WorkItem.js";
import { assertRegistryImmutables } from "./integrity.js";

const baseItem: WorkItem = {
  id: "wi-0001",
  kind: "spec",
  title: "Spec base",
  status: "in-progress",
  workspacePath: ".governance/specs/0001-x",
  createdAt: "2026-05-10T00:00:00.000Z",
  updatedAt: "2026-05-10T00:00:00.000Z",
  sourceRefs: [],
};

describe("assertRegistryImmutables", () => {
  it("DADO patch sem id/createdAt ENTÃO passa", () => {
    expect(() => assertRegistryImmutables(baseItem, { title: "novo" })).not.toThrow();
  });

  it("DADO patch.id igual ao atual ENTÃO passa (idempotência editorial)", () => {
    expect(() => assertRegistryImmutables(baseItem, { id: baseItem.id })).not.toThrow();
  });

  it("DADO patch.id divergente ENTÃO lança REGISTRY_IMMUTABLE_ID", () => {
    try {
      assertRegistryImmutables(baseItem, { id: "wi-0099" } as WorkItemPatch);
      fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(GovernanceError);
      expect((e as GovernanceError).code).toBe("REGISTRY_IMMUTABLE_ID");
    }
  });

  it("DADO patch.createdAt igual ao atual ENTÃO passa", () => {
    expect(() =>
      assertRegistryImmutables(baseItem, { createdAt: baseItem.createdAt })
    ).not.toThrow();
  });

  it("DADO patch.createdAt divergente ENTÃO lança REGISTRY_IMMUTABLE_CREATED_AT", () => {
    try {
      assertRegistryImmutables(baseItem, { createdAt: "2099-01-01T00:00:00.000Z" });
      fail("deveria ter lançado");
    } catch (e) {
      expect((e as GovernanceError).code).toBe("REGISTRY_IMMUTABLE_CREATED_AT");
    }
  });
});
