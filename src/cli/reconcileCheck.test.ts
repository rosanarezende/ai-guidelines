import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";
import { deriveCanonicalNext, main, reconcileTopology } from "./reconcileCheck.js";

/**
 * Monta um state.yml com topology. `nextLine` = afirmação viva (next[0]);
 * `cursorPr`/`cursorCp` permitem desalinhar o cursor para os casos de divergência.
 * A topologia base: 1 execution concluído (seq 1) + `co-reconcile` pendente
 * (seq 2) + terminal de integração — análoga (em miniatura) à 0024.
 */
function stateWithTopology(opts: {
  nextLine?: string | null;
  cursorPr?: string;
  cursorCp?: string;
  drainExecution?: boolean; // true: nenhum execution pendente (stack esgotada)
}): string {
  const cursorPr = opts.cursorPr ?? (opts.drainExecution ? "integration-final" : "co-reconcile");
  const cursorCp =
    opts.cursorCp ?? (opts.drainExecution ? "review-and-merge" : "checkpoint-co-reconcile");
  const nextBlock =
    opts.nextLine === null || opts.nextLine === undefined
      ? "next: []"
      : `next:\n  - "${opts.nextLine}"`;

  const plannedExecution = opts.drainExecution
    ? ""
    : `      - id: co-reconcile
        github_pr: null
        role: execution
        terminal: false
        sequence: 2
        checkpoints:
          - checkpoint-co-reconcile
`;

  return `stage: implementation
gate:
  status: closed
focus: []
${nextBlock}
topology:
  cursor:
    pr: ${cursorPr}
    checkpoint: ${cursorCp}
  prs:
    concluded:
      - id: done-1
        github_pr: 33
        role: execution
        terminal: false
        sequence: 1
        checkpoints:
          - checkpoint-done-1
    active: []
    planned:
${plannedExecution}      - id: integration-final
        github_pr: null
        role: integration
        terminal: true
        sequence: null
        checkpoints:
          - review-and-merge
`;
}

/** state.yml sem topology (schema 4-chave). */
function stateNoTopology(): string {
  return `stage: implementation
gate:
  status: closed
focus: []
next:
  - "qualquer coisa"
`;
}

describe("CO-1 — reconcile:check · contrato de autoridade [BR-CO-RECONCILE]", () => {
  describe("deriveCanonicalNext", () => {
    it("DADO execution pendentes QUANDO deriva ENTÃO retorna o de menor sequence", () => {
      const state = parseWorkflowState(stateWithTopology({}));
      const next = deriveCanonicalNext(state.topology!);
      expect(next?.id).toBe("co-reconcile");
      expect(next?.sequence).toBe(2);
    });

    it("DADO stack esgotada (nenhum execution pendente) QUANDO deriva ENTÃO null", () => {
      const state = parseWorkflowState(stateWithTopology({ drainExecution: true }));
      expect(deriveCanonicalNext(state.topology!)).toBeNull();
    });
  });

  describe("reconcileTopology", () => {
    it("DADO cursor e next[0] fiéis ao canônico QUANDO reconcilia ENTÃO ok (caso verde)", () => {
      const state = parseWorkflowState(
        stateWithTopology({ nextLine: "PROXIMO = co-reconcile: reconcile:check" })
      );
      const r = reconcileTopology(state);
      expect(r.kind).toBe("ok");
      if (r.kind === "ok") expect(r.canonicalNextId).toBe("co-reconcile");
    });

    it("DADO next[0] que não cita o canônico QUANDO reconcilia ENTÃO diverge (narração stale)", () => {
      const state = parseWorkflowState(
        stateWithTopology({ nextLine: "PROXIMO = bootstrap-compiler (nome stale)" })
      );
      const r = reconcileTopology(state);
      expect(r.kind).toBe("diverge");
      if (r.kind === "diverge") {
        expect(r.divergences.map((d) => d.code)).toContain("narrated-next-omits-canonical");
      }
    });

    it("DADO cursor apontando para nó concluído QUANDO reconcilia ENTÃO diverge (cursor não-canônico)", () => {
      const state = parseWorkflowState(
        stateWithTopology({
          nextLine: "PROXIMO = co-reconcile",
          cursorPr: "done-1",
          cursorCp: "checkpoint-done-1",
        })
      );
      const r = reconcileTopology(state);
      expect(r.kind).toBe("diverge");
      if (r.kind === "diverge") {
        const codes = r.divergences.map((d) => d.code);
        expect(codes).toContain("cursor-not-canonical-next");
        expect(codes).not.toContain("cursor-checkpoint-mismatch"); // checkpoint é coerente com done-1
      }
    });

    it("DADO cursor.checkpoint de outro nó QUANDO reconcilia ENTÃO diverge (checkpoint mismatch)", () => {
      const state = parseWorkflowState(
        stateWithTopology({
          nextLine: "PROXIMO = co-reconcile",
          cursorCp: "checkpoint-done-1", // existe, mas não no nó co-reconcile
        })
      );
      const r = reconcileTopology(state);
      expect(r.kind).toBe("diverge");
      if (r.kind === "diverge") {
        expect(r.divergences.map((d) => d.code)).toContain("cursor-checkpoint-mismatch");
      }
    });

    it("DADO stack esgotada QUANDO reconcilia ENTÃO ok com canonicalNextId null (sem próximo nó)", () => {
      const state = parseWorkflowState(stateWithTopology({ drainExecution: true }));
      const r = reconcileTopology(state);
      expect(r.kind).toBe("ok");
      if (r.kind === "ok") expect(r.canonicalNextId).toBeNull();
    });

    it("DADO next vazio QUANDO reconcilia ENTÃO não acusa narração (limite: narração ausente ≠ divergência)", () => {
      const state = parseWorkflowState(stateWithTopology({ nextLine: null }));
      const r = reconcileTopology(state);
      expect(r.kind).toBe("ok");
    });

    it("DADO state.yml sem topology QUANDO reconcilia ENTÃO skip (nada estrutural a reconciliar)", () => {
      const state = parseWorkflowState(stateNoTopology());
      expect(reconcileTopology(state).kind).toBe("skip");
    });
  });

  describe("main (advisory-first)", () => {
    let tmpRoot: string;

    beforeEach(() => {
      tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "reconcile-check-"));
    });

    afterEach(() => {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    });

    function writeStateYml(content: string): void {
      const dir = path.join(tmpRoot, ".governance/specs/0099-fixture");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "state.yml"), content, "utf-8");
    }

    function captureLogger() {
      const lines: string[] = [];
      return {
        logger: { info: (m: string) => lines.push(m), error: (m: string) => lines.push(m) },
        text: () => lines.join("\n"),
      };
    }

    it("DADO divergência QUANDO main roda ENTÃO retorna 0 (advisory) e reporta ⚠️", () => {
      writeStateYml(stateWithTopology({ nextLine: "PROXIMO = bootstrap-compiler (stale)" }));
      const { logger, text } = captureLogger();
      const code = main(tmpRoot, logger);
      expect(code).toBe(0); // advisory-first: NUNCA bloqueia
      expect(text()).toContain("⚠️");
      expect(text()).toContain("narrated-next-omits-canonical");
    });

    it("DADO repo reconciliado QUANDO main roda ENTÃO retorna 0 e reporta ✅", () => {
      writeStateYml(stateWithTopology({ nextLine: "PROXIMO = co-reconcile" }));
      const { logger, text } = captureLogger();
      const code = main(tmpRoot, logger);
      expect(code).toBe(0);
      expect(text()).toContain("✅");
    });

    it("DADO nenhum state.yml QUANDO main roda ENTÃO retorna 0 (nada a reconciliar)", () => {
      const { logger, text } = captureLogger();
      const code = main(tmpRoot, logger);
      expect(code).toBe(0);
      expect(text()).toContain("Nada a reconciliar");
    });
  });
});
