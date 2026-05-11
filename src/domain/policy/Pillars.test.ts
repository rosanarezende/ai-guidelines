/**
 * [BR-CLI-POLICY] Os 7 Pilares de Valor (MECE).
 * Regras de intenção de saída e carga operacional conforme [DEC-0021-A02].
 */
import { GovernanceError } from "../shared/errors.js";
import { VirtualKind } from "../work-item/WorkItem.js";
import { assertValidDraft } from "../work-item/WorkItemPolicy.js";

describe("Domínio — Definição dos Pilares [BR-CLI-POLICY]", () => {
  describe("Pilar denso (spec/experiment/exploration/incident)", () => {
    it.each(["spec", "exploration"] as const)(
      "DADO um item denso '%s' SEM workspacePath ENTÃO POLICY_DENSE_REQUIRES_WORKSPACE [BR-CLI-POLICY-01]",
      (kind) => {
        try {
          assertValidDraft({ id: "wi-1", kind, title: "Item denso" });
          fail("deveria ter lançado");
        } catch (e) {
          expect(e).toBeInstanceOf(GovernanceError);
          expect((e as GovernanceError).code).toBe("POLICY_DENSE_REQUIRES_WORKSPACE");
        }
      }
    );

    it("DADO uma 'spec' COM 'workspacePath' e título válido ENTÃO passa", () => {
      expect(() =>
        assertValidDraft({
          id: "wi-1",
          kind: "spec",
          title: "Spec válida",
          workspacePath: ".governance/specs/0001-x",
        })
      ).not.toThrow();
    });
  });

  describe("Pilar: Experiment (Growth Engineering)", () => {
    it("DADO um 'experiment' SEM hypothesis ENTÃO falha com POLICY_EXPERIMENT_REQUIRES_HYPOTHESIS [BR-CLI-POLICY-03]", () => {
      try {
        assertValidDraft({
          id: "wi-2",
          kind: "experiment",
          title: "Exp título",
          successMetrics: ["ctr"],
          workspacePath: ".governance/experiments/01",
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("POLICY_EXPERIMENT_REQUIRES_HYPOTHESIS");
      }
    });

    it("DADO um 'experiment' com hypothesis curta (<10) ENTÃO falha", () => {
      try {
        assertValidDraft({
          id: "wi-2",
          kind: "experiment",
          title: "Exp título",
          hypothesis: "curta",
          successMetrics: ["ctr"],
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("POLICY_EXPERIMENT_REQUIRES_HYPOTHESIS");
      }
    });

    it("DADO um 'experiment' SEM successMetrics ENTÃO falha com POLICY_EXPERIMENT_REQUIRES_METRICS", () => {
      try {
        assertValidDraft({
          id: "wi-2",
          kind: "experiment",
          title: "Exp título",
          hypothesis: "Aumentaremos a conversão em 10%",
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("POLICY_EXPERIMENT_REQUIRES_METRICS");
      }
    });
  });

  describe("Pilar: Incident (Fricção Crítica)", () => {
    it("DADO um 'incident' SEM severity ENTÃO falha com POLICY_INCIDENT_REQUIRES_SEVERITY [BR-CLI-POLICY-02]", () => {
      try {
        assertValidDraft({
          id: "wi-3",
          kind: "incident",
          title: "Incidente xpto",
          workspacePath: ".governance/incidents/01",
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("POLICY_INCIDENT_REQUIRES_SEVERITY");
      }
    });

    it("DADO um 'incident' com severity e workspacePath ENTÃO passa", () => {
      expect(() =>
        assertValidDraft({
          id: "wi-3",
          kind: "incident",
          title: "Incidente xpto",
          severity: "high",
          workspacePath: ".governance/incidents/01",
        })
      ).not.toThrow();
    });
  });

  describe("Pilares virtuais (proposal/patch/fix) rejeitam workspacePath", () => {
    it.each(["proposal", "patch", "fix"] as const satisfies readonly VirtualKind[])(
      "DADO um item virtual '%s' COM workspacePath ENTÃO falha com POLICY_VIRTUAL_REJECTS_WORKSPACE [BR-CLI-POLICY-01]",
      (kind) => {
        try {
          assertValidDraft({
            id: `wi-virtual-${kind}`,
            kind,
            title: `Virtual ${kind}`,
            workspacePath: `.governance/${kind}s/01`,
          });
          fail("deveria ter lançado");
        } catch (e) {
          expect(e).toBeInstanceOf(GovernanceError);
          expect((e as GovernanceError).code).toBe("POLICY_VIRTUAL_REJECTS_WORKSPACE");
        }
      }
    );

    it("DADO uma 'proposal' SEM workspacePath ENTÃO passa", () => {
      expect(() =>
        assertValidDraft({ id: "wi-prop-ok", kind: "proposal", title: "Proposta válida" })
      ).not.toThrow();
    });
  });

  describe("Pilares de Manutenção: Fix e Patch", () => {
    it("DADO um 'patch' COM hypothesis ENTÃO falha com POLICY_PATCH_REJECTS_EXPERIMENT_FIELDS [BR-CLI-POLICY-01]", () => {
      try {
        assertValidDraft({
          id: "wi-5",
          kind: "patch",
          title: "Patch xpto",
          hypothesis: "isso é proibido em patch",
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("POLICY_PATCH_REJECTS_EXPERIMENT_FIELDS");
      }
    });

    it("DADO um 'patch' COM severity ENTÃO falha com POLICY_PATCH_REJECTS_INCIDENT_FIELDS", () => {
      try {
        assertValidDraft({
          id: "wi-5",
          kind: "patch",
          title: "Patch xpto",
          severity: "low",
        });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("POLICY_PATCH_REJECTS_INCIDENT_FIELDS");
      }
    });

    it("DADO um 'patch' simples ENTÃO passa", () => {
      expect(() =>
        assertValidDraft({ id: "wi-5", kind: "patch", title: "Patch limpo" })
      ).not.toThrow();
    });
  });

  describe("Validações Comuns", () => {
    it("DADO qualquer item COM título <5 chars ENTÃO falha com POLICY_TITLE_TOO_SHORT [BR-CLI-POLICY-01]", () => {
      try {
        assertValidDraft({ id: "wi-6", kind: "fix", title: "ab" });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("POLICY_TITLE_TOO_SHORT");
      }
    });
  });
});
