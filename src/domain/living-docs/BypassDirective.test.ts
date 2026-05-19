/**
 * [BR-CLI-LIVING-DOCS-BYPASS] Parser da diretiva de bypass auditável.
 *
 * Aplica ADR 0012 (.core/governance/adrs/0012-drift-guard-bypass.md):
 * sintaxe canônica `// <guard-id>:allow-drift until=YYYY-MM-DD ref=ID
 * reason="..."`. Campos obrigatórios na ordem; ausência → BYPASS_MALFORMED;
 * `until` no passado → BYPASS_EXPIRED.
 *
 * Função pura: recebe o texto do comentário + `todayIso` (injetado para
 * teste determinístico). Sem IO.
 */
import { GovernanceError } from "../shared/errors.js";
import { parseBypassDirective, findBypassDirective } from "./BypassDirective.js";

const TODAY = "2026-05-11T00:00:00.000Z";

describe("Domínio — BypassDirective [BR-CLI-LIVING-DOCS-BYPASS]", () => {
  describe("Reconhecimento da diretiva", () => {
    it("DADO comentário canônico ENTÃO findBypassDirective retorna guardId [BR-CLI-LIVING-DOCS-BYPASS-01]", () => {
      const text = `living-docs:allow-drift until=2026-12-31 ref=INC-20260511-3 reason="regra em transição"`;
      const result = findBypassDirective(text);
      expect(result).not.toBeNull();
      expect(result!.guardId).toBe("living-docs");
    });

    it("DADO comentário sem padrão ENTÃO findBypassDirective retorna null [BR-CLI-LIVING-DOCS-BYPASS-02]", () => {
      expect(findBypassDirective("apenas um comentário comum")).toBeNull();
      expect(findBypassDirective("")).toBeNull();
    });

    it("DADO diretiva de outro guard (boundary-lock) ENTÃO findBypassDirective reconhece o guardId [BR-CLI-LIVING-DOCS-BYPASS-03]", () => {
      const text = `boundary-lock:allow-drift until=2026-12-31 ref=DEC-0021-C01 reason="autorizado"`;
      const result = findBypassDirective(text);
      expect(result?.guardId).toBe("boundary-lock");
    });
  });

  describe("Parsing válido", () => {
    it("DADO diretiva completa válida ENTÃO retorna bypass tipado [BR-CLI-LIVING-DOCS-BYPASS-04]", () => {
      const text = `living-docs:allow-drift until=2026-12-31 ref=INC-20260511-3 reason="regra em transição"`;
      const result = parseBypassDirective(text, { todayIso: TODAY });
      expect(result).not.toBeNull();
      expect(result!.guardId).toBe("living-docs");
      expect(result!.bypass).toEqual({
        until: "2026-12-31",
        ref: "INC-20260511-3",
        reason: "regra em transição",
      });
    });

    it("DADO diretiva embutida em comentário de linha ENTÃO parseBypassDirective reconhece [BR-CLI-LIVING-DOCS-BYPASS-05]", () => {
      const text = `// living-docs:allow-drift until=2026-12-31 ref=DEC-0021-C01 reason="motivo válido aqui"`;
      const result = parseBypassDirective(text, { todayIso: TODAY });
      expect(result?.bypass.ref).toBe("DEC-0021-C01");
    });

    it("DADO ausência de diretiva ENTÃO retorna null (não-erro) [BR-CLI-LIVING-DOCS-BYPASS-06]", () => {
      expect(parseBypassDirective("comentário comum", { todayIso: TODAY })).toBeNull();
    });
  });

  describe("Campos obrigatórios", () => {
    it("DADO diretiva SEM 'until' ENTÃO LIVING_DOCS_BYPASS_MALFORMED [BR-CLI-LIVING-DOCS-BYPASS-07]", () => {
      const text = `living-docs:allow-drift ref=DEC-0021-C01 reason="motivo válido"`;
      try {
        parseBypassDirective(text, { todayIso: TODAY });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        const err = e as GovernanceError;
        expect(err.code).toBe("LIVING_DOCS_BYPASS_MALFORMED");
        expect(err.message).toContain("until");
      }
    });

    it("DADO diretiva SEM 'ref' ENTÃO LIVING_DOCS_BYPASS_MALFORMED [BR-CLI-LIVING-DOCS-BYPASS-08]", () => {
      const text = `living-docs:allow-drift until=2026-12-31 reason="motivo válido"`;
      try {
        parseBypassDirective(text, { todayIso: TODAY });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_BYPASS_MALFORMED");
        expect((e as GovernanceError).message).toContain("ref");
      }
    });

    it("DADO diretiva SEM 'reason' ENTÃO LIVING_DOCS_BYPASS_MALFORMED [BR-CLI-LIVING-DOCS-BYPASS-09]", () => {
      const text = `living-docs:allow-drift until=2026-12-31 ref=DEC-0021-C01`;
      try {
        parseBypassDirective(text, { todayIso: TODAY });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_BYPASS_MALFORMED");
        expect((e as GovernanceError).message).toContain("reason");
      }
    });

    it("DADO 'reason' < 8 caracteres significativos ENTÃO LIVING_DOCS_BYPASS_MALFORMED [BR-CLI-LIVING-DOCS-BYPASS-10]", () => {
      const text = `living-docs:allow-drift until=2026-12-31 ref=X reason="curto"`;
      try {
        parseBypassDirective(text, { todayIso: TODAY });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_BYPASS_MALFORMED");
      }
    });

    it("DADO 'until' com formato não-ISO ENTÃO LIVING_DOCS_BYPASS_MALFORMED [BR-CLI-LIVING-DOCS-BYPASS-11]", () => {
      const text = `living-docs:allow-drift until=31/12/2026 ref=X reason="motivo válido aqui"`;
      try {
        parseBypassDirective(text, { todayIso: TODAY });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_BYPASS_MALFORMED");
      }
    });
  });

  describe("Expiração", () => {
    it("DADO 'until' em data PASSADA ENTÃO LIVING_DOCS_BYPASS_EXPIRED [BR-CLI-LIVING-DOCS-BYPASS-12]", () => {
      const text = `living-docs:allow-drift until=2026-01-01 ref=INC-1 reason="motivo válido"`;
      try {
        parseBypassDirective(text, { todayIso: TODAY });
        fail("deveria ter lançado");
      } catch (e) {
        expect(e).toBeInstanceOf(GovernanceError);
        const err = e as GovernanceError;
        expect(err.code).toBe("LIVING_DOCS_BYPASS_EXPIRED");
        expect(err.message).toContain("INC-1");
        expect(err.message).toContain("2026-01-01");
      }
    });

    it("DADO 'until' IGUAL ao today ENTÃO LIVING_DOCS_BYPASS_EXPIRED (estritamente futuro) [BR-CLI-LIVING-DOCS-BYPASS-13]", () => {
      const text = `living-docs:allow-drift until=2026-05-11 ref=X reason="motivo válido"`;
      try {
        parseBypassDirective(text, { todayIso: TODAY });
        fail("deveria ter lançado");
      } catch (e) {
        expect((e as GovernanceError).code).toBe("LIVING_DOCS_BYPASS_EXPIRED");
      }
    });

    it("DADO 'until' um dia depois do today ENTÃO aceita [BR-CLI-LIVING-DOCS-BYPASS-14]", () => {
      const text = `living-docs:allow-drift until=2026-05-12 ref=X reason="motivo válido"`;
      const result = parseBypassDirective(text, { todayIso: TODAY });
      expect(result?.bypass.until).toBe("2026-05-12");
    });
  });

  describe("Filtro por guard-id esperado (uso pelo extractor)", () => {
    it("DADO expectedGuardId='living-docs' E diretiva de outro guard ENTÃO retorna null (não-aplica) [BR-CLI-LIVING-DOCS-BYPASS-15]", () => {
      const text = `boundary-lock:allow-drift until=2026-12-31 ref=X reason="motivo válido"`;
      const result = parseBypassDirective(text, {
        todayIso: TODAY,
        expectedGuardId: "living-docs",
      });
      expect(result).toBeNull();
    });

    it("DADO expectedGuardId='living-docs' E diretiva do mesmo guard ENTÃO parseia normalmente [BR-CLI-LIVING-DOCS-BYPASS-16]", () => {
      const text = `living-docs:allow-drift until=2026-12-31 ref=X reason="motivo válido"`;
      const result = parseBypassDirective(text, {
        todayIso: TODAY,
        expectedGuardId: "living-docs",
      });
      expect(result?.bypass.ref).toBe("X");
    });
  });
});
