import { SpecLocation } from "../../domain/workflow/SpecLocation.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";
import {
  CheckIntegrationReadiness,
  parseChecklistGates,
  READINESS_GATES,
} from "./CheckIntegrationReadiness.js";

/** Fake fs mínimo: só `fileExists` + `readTextFile` são exercitados. */
class FakeFs implements WorkflowFileSystem {
  constructor(private readonly files: Map<string, string>) {}
  fileExists(p: string): boolean {
    return this.files.has(p);
  }
  readTextFile(p: string): string {
    const f = this.files.get(p);
    if (f === undefined) throw new Error(`missing ${p}`);
    return f;
  }
  directoryExists(): boolean {
    throw new Error("not used");
  }
  writeTextFile(): void {
    throw new Error("not used");
  }
  listDirectory(): ReadonlyArray<string> {
    throw new Error("not used");
  }
  currentBranch(): string | null {
    throw new Error("not used");
  }
  resolveAbsolute(p: string): string {
    return `/repo/${p}`;
  }
}

const LOCATION: SpecLocation = {
  slug: "0023-workflow-runtime",
  absolutePath: "/repo/.governance/specs/0023-workflow-runtime",
  source: "governance",
};
const REVIEW_PATH = ".governance/specs/0023-workflow-runtime/review.md";

/** Monta um review.md com os marcadores dados para R1..R8 (` `=aberto, `x`=fechado). */
function review(marks: Partial<Record<string, string>>): string {
  const ids = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"];
  return ["# Review", ...ids.map((id) => `- [${marks[id] ?? " "}] **${id}** gate ${id}`)].join(
    "\n"
  );
}

describe("parseChecklistGates [BR-WORKFLOW-READINESS]", () => {
  it("DADO linha `- [ ] **R1** ...` QUANDO parse ENTÃO captura id, aberto, linha", () => {
    const [gate] = parseChecklistGates("- [ ] **R1** Stack reviewed/ready.");
    expect(gate).toEqual({
      id: "R1",
      checked: false,
      marker: " ",
      line: "- [ ] **R1** Stack reviewed/ready.",
    });
  });

  it("DADO marcador `[x]` QUANDO parse ENTÃO checked=true", () => {
    const [gate] = parseChecklistGates("- [x] **R2** feito");
    expect(gate.checked).toBe(true);
    expect(gate.marker).toBe("x");
  });

  it("DADO marcador `[/]` (em progresso) QUANDO parse ENTÃO conta como aberto", () => {
    const [gate] = parseChecklistGates("- [/] **R3** em curso");
    expect(gate.checked).toBe(false);
    expect(gate.marker).toBe("/");
  });

  it("DADO id com colchetes (tasks.md) `**1.H.[REVIEW]**` QUANDO parse ENTÃO captura id literal", () => {
    const [gate] = parseChecklistGates("- [ ] **1.H.[REVIEW]** Aprovação humana");
    expect(gate.id).toBe("1.H.[REVIEW]");
  });

  it("DADO linhas que não são checklist QUANDO parse ENTÃO são ignoradas", () => {
    const gates = parseChecklistGates("# Header\n> nota\ntexto solto\n- [x] **R1** item");
    expect(gates).toHaveLength(1);
    expect(gates[0].id).toBe("R1");
  });
});

describe("CheckIntegrationReadiness [BR-WORKFLOW-READINESS]", () => {
  describe("integration-pr (opção 4 — lê review.md, exige R1–R7)", () => {
    it("DADO R1–R7 abertos QUANDO run ENTÃO ready=false com 7 openGates (R8 não exigido)", () => {
      const fs = new FakeFs(new Map([[REVIEW_PATH, review({})]]));
      const result = new CheckIntegrationReadiness(fs).run(LOCATION, "integration-pr");
      expect(result.ready).toBe(false);
      expect(result.openGates.map((g) => g.id)).toEqual(["R1", "R2", "R3", "R4", "R5", "R6", "R7"]);
      expect(result.missingFile).toBe(false);
      expect(result.missingGateIds).toEqual([]);
    });

    it("DADO R1–R7 fechados E R8 ainda aberto QUANDO run ENTÃO ready=true (R8 é gate de merge)", () => {
      const fs = new FakeFs(
        new Map([
          [REVIEW_PATH, review({ R1: "x", R2: "x", R3: "x", R4: "x", R5: "x", R6: "x", R7: "x" })],
        ])
      );
      const result = new CheckIntegrationReadiness(fs).run(LOCATION, "integration-pr");
      expect(result.ready).toBe(true);
      expect(result.openGates).toEqual([]);
    });

    it("DADO um único gate aberto (R5) QUANDO run ENTÃO ready=false só com ele", () => {
      const fs = new FakeFs(
        new Map([[REVIEW_PATH, review({ R1: "x", R2: "x", R3: "x", R4: "x", R6: "x", R7: "x" })]])
      );
      const result = new CheckIntegrationReadiness(fs).run(LOCATION, "integration-pr");
      expect(result.ready).toBe(false);
      expect(result.openGates.map((g) => g.id)).toEqual(["R5"]);
    });

    it("DADO review.md ausente QUANDO run ENTÃO ready=false + missingFile", () => {
      const fs = new FakeFs(new Map());
      const result = new CheckIntegrationReadiness(fs).run(LOCATION, "integration-pr");
      expect(result.ready).toBe(false);
      expect(result.missingFile).toBe(true);
      expect(result.checkedPath).toBe(REVIEW_PATH);
    });

    it("DADO gate exigido ausente do arquivo QUANDO run ENTÃO bloqueia fail-safe", () => {
      const fs = new FakeFs(new Map([[REVIEW_PATH, "# Review\n- [x] **R1** ok\n- [x] **R2** ok"]]));
      const result = new CheckIntegrationReadiness(fs).run(LOCATION, "integration-pr");
      expect(result.ready).toBe(false);
      expect(result.missingGateIds).toEqual(["R3", "R4", "R5", "R6", "R7"]);
    });
  });

  describe("merge-stack (opção 5 — lê review.md, exige R1–R8)", () => {
    it("DADO R1–R7 fechados mas R8 aberto QUANDO run ENTÃO ready=false só com R8", () => {
      const fs = new FakeFs(
        new Map([
          [REVIEW_PATH, review({ R1: "x", R2: "x", R3: "x", R4: "x", R5: "x", R6: "x", R7: "x" })],
        ])
      );
      const result = new CheckIntegrationReadiness(fs).run(LOCATION, "merge-stack");
      expect(result.ready).toBe(false);
      expect(result.openGates.map((g) => g.id)).toEqual(["R8"]);
    });

    it("DADO R1–R8 todos fechados QUANDO run ENTÃO ready=true", () => {
      const fs = new FakeFs(
        new Map([
          [
            REVIEW_PATH,
            review({ R1: "x", R2: "x", R3: "x", R4: "x", R5: "x", R6: "x", R7: "x", R8: "x" }),
          ],
        ])
      );
      const result = new CheckIntegrationReadiness(fs).run(LOCATION, "merge-stack");
      expect(result.ready).toBe(true);
    });
  });

  it("READINESS_GATES crava os IDs exatos por tipo (sem inventar gates)", () => {
    expect(READINESS_GATES["integration-pr"]).toEqual(["R1", "R2", "R3", "R4", "R5", "R6", "R7"]);
    expect(READINESS_GATES["merge-stack"]).toEqual([
      "R1",
      "R2",
      "R3",
      "R4",
      "R5",
      "R6",
      "R7",
      "R8",
    ]);
  });
});
