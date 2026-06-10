import { parseWorkflowChecks } from "./workflowChecksReader.js";

describe("workflowChecksReader [Checkpoint 2.2]", () => {
  it("job sem matriz → produtor ESTÁVEL com context = job.name", () => {
    const yaml = `
name: Repo Validation
on: { pull_request: {} }
jobs:
  repo-validation:
    runs-on: ubuntu-latest
    steps:
      - run: npm run validate
`;
    const { stable, matrix } = parseWorkflowChecks(yaml, "repo-validation.yml");
    expect(matrix).toHaveLength(0);
    expect(stable).toEqual([
      {
        context: "repo-validation",
        workflow: "repo-validation.yml",
        job: "repo-validation",
        triggers: ["pull_request"],
      },
    ]);
  });

  it("job sem `name:` → context = id do job", () => {
    const yaml = `
on: { pull_request: {} }
jobs:
  my-job:
    runs-on: ubuntu-latest
    steps: [{ run: echo hi }]
`;
    const { stable } = parseWorkflowChecks(yaml, "x.yml");
    expect(stable[0].context).toBe("my-job");
    expect(stable[0].triggers).toEqual(["pull_request"]);
  });

  it("job com strategy.matrix → produtor de MATRIZ (instável), nunca estável", () => {
    const yaml = `
name: Smoke Tests
on: { pull_request: {} }
jobs:
  smoke:
    name: smoke / \${{ matrix.os }} / node \${{ matrix.node }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: ["22.x", "24.x"]
    runs-on: \${{ matrix.os }}
    steps: [{ run: npm run test:smoke }]
`;
    const { stable, matrix } = parseWorkflowChecks(yaml, "smoke-multi-os.yml");
    expect(stable).toHaveLength(0);
    expect(matrix).toHaveLength(1);
    expect(matrix[0].nameTemplate).toBe("smoke / ${{ matrix.os }} / node ${{ matrix.node }}");
    expect(matrix[0].staticPrefix).toBe("smoke / ");
    expect(matrix[0].job).toBe("smoke");
    expect(matrix[0].triggers).toEqual(["pull_request"]);
  });

  it("matriz + agregador (needs:) → agregador é ESTÁVEL, matriz fica instável", () => {
    const yaml = `
name: Smoke Tests
on: { pull_request: {} }
jobs:
  smoke-matrix:
    name: smoke / \${{ matrix.os }} / node \${{ matrix.node }}
    strategy: { matrix: { os: [ubuntu-latest], node: ["24.x"] } }
    runs-on: \${{ matrix.os }}
    steps: [{ run: npm run test:smoke }]
  smoke:
    needs: [smoke-matrix]
    runs-on: ubuntu-latest
    steps: [{ run: echo aggregated }]
`;
    const { stable, matrix } = parseWorkflowChecks(yaml, "smoke-multi-os.yml");
    expect(stable.map((s) => s.context)).toEqual(["smoke"]);
    expect(stable[0].triggers).toEqual(["pull_request"]);
    expect(matrix.map((m) => m.job)).toEqual(["smoke-matrix"]);
  });

  it("YAML malformado ou sem jobs → vazio (sem throw)", () => {
    expect(parseWorkflowChecks(": : :", "bad.yml")).toEqual({ stable: [], matrix: [] });
    expect(parseWorkflowChecks("name: X\non: push\n", "nojobs.yml")).toEqual({
      stable: [],
      matrix: [],
    });
  });
});
