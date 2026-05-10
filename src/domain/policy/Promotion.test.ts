/**
 * [BR-CLI-POLICY] Ciclo de Vida e Promoção.
 * Regras de transição de estado e maturidade [DEC-0021-A02].
 */
import { GovernancePolicies } from "./GovernancePolicies.js";
import { GovernanceError } from "../shared/errors.js";
import { DenseWorkItem, VirtualWorkItem, WorkItem } from "../work-item/WorkItem.js";

const policy = new GovernancePolicies();

// `Partial<WorkItem>` colapsa o discriminator `kind` em `never` quando o
// override troca a categoria (virtual → dense). Aceitamos um shape "achatado"
// e validamos via cast — o teste é o consumidor final, não há risco de vazar.
type WorkItemOverrides = Partial<Omit<DenseWorkItem, "kind"> & Omit<VirtualWorkItem, "kind">> & {
  kind?: WorkItem["kind"];
};

function makeItem(over: WorkItemOverrides): WorkItem {
  return {
    id: "wi-1",
    kind: "proposal",
    title: "Item base",
    status: "draft",
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
    sourceRefs: [],
    ...over,
  } as WorkItem;
}

describe("Domínio — Promoção e Maturidade [BR-CLI-POLICY]", () => {
  describe("Promoção: Proposal -> Spec", () => {
    it("DADO uma 'proposal' em status 'draft' QUANDO promovida ENTÃO POLICY_PROPOSAL_NOT_MATURE [BR-CLI-POLICY-01]", () => {
      const item = makeItem({ status: "draft" });
      try {
        policy.promote(item, { target: "spec", workspacePath: ".governance/specs/01" });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("POLICY_PROPOSAL_NOT_MATURE");
        expect((e as GovernanceError).message).toContain(
          "só pode ser promovida a 'spec' quando estiver em status 'review' ou 'done'"
        );
      }
    });

    it("DADO uma 'proposal' em 'review' SEM workspacePath ENTÃO POLICY_PROMOTION_REQUIRES_WORKSPACE", () => {
      const item = makeItem({ status: "review" });
      try {
        policy.promote(item, { target: "spec" });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("POLICY_PROMOTION_REQUIRES_WORKSPACE");
      }
    });

    it("DADO uma 'proposal' madura COM workspacePath ENTÃO retorna patch para 'spec'", () => {
      const item = makeItem({ status: "review" });
      const patch = policy.promote(item, {
        target: "spec",
        workspacePath: ".governance/specs/01",
      });
      expect(patch.kind).toBe("spec");
      expect(patch.workspacePath).toBe(".governance/specs/01");
      expect(patch.status).toBe("in-progress");
    });
  });

  describe("Promoção: Experiment -> Spec (Shape-up)", () => {
    it("DADO um 'experiment' com outcome != won ENTÃO POLICY_EXPERIMENT_NOT_WON [BR-CLI-POLICY-03]", () => {
      const item = makeItem({
        kind: "experiment",
        status: "done",
        outcome: "lost",
        hypothesis: "Hipótese suficiente",
        successMetrics: ["ctr"],
      });
      try {
        policy.promote(item, {
          target: "spec",
          workspacePath: ".governance/specs/02",
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("POLICY_EXPERIMENT_NOT_WON");
        expect((e as GovernanceError).message).toContain("Apenas experimentos com resultado 'won'");
      }
    });

    it("DADO um 'experiment' won ENTÃO patch herda hypothesis e métricas", () => {
      const item = makeItem({
        kind: "experiment",
        status: "done",
        outcome: "won",
        hypothesis: "Aumentaremos a conversão em 10%",
        successMetrics: ["ctr", "rev"],
      });
      const patch = policy.promote(item, {
        target: "spec",
        workspacePath: ".governance/specs/02",
      });
      expect(patch.kind).toBe("spec");
      expect(patch.hypothesis).toBe("Aumentaremos a conversão em 10%");
      expect(patch.successMetrics).toEqual(["ctr", "rev"]);
    });
  });

  describe("Imutabilidade de Ciclo Fechado", () => {
    it.each(["patch", "fix", "incident"] as const)(
      "DADO um '%s' QUANDO tentada promoção ENTÃO POLICY_MAINTENANCE_NOT_PROMOTABLE [BR-CLI-POLICY-01]",
      (kind) => {
        const item = makeItem({
          kind,
          severity: kind === "incident" ? "high" : undefined,
        });
        try {
          policy.promote(item, {
            target: "spec",
            workspacePath: ".governance/specs/03",
          });
          fail("deveria ter lançado");
        } catch (e) {
          expect((e as GovernanceError).code).toBe("POLICY_MAINTENANCE_NOT_PROMOTABLE");
        }
      }
    );
  });
});
