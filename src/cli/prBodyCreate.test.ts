import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PR_BODY_PROFILES, PrProfileName } from "../domain/workflow/PrProfileContract.js";
import { buildNextNodePrBody, buildPrBody, main } from "./prBodyCreate.js";

describe("CLI — pr-body:create [BR-PR-BODY-CREATE]", () => {
  it.each(Object.keys(PR_BODY_PROFILES) as PrProfileName[])(
    "gera body compatível com o perfil %s",
    (profile) => {
      const body = buildPrBody({ profile });
      const contract = PR_BODY_PROFILES[profile];
      for (const section of [...contract.draftSections, ...contract.readySections]) {
        expect(body).toContain(section);
      }
    }
  );

  it.each(Object.keys(PR_BODY_PROFILES) as PrProfileName[])(
    "usa o template governado como fonte do perfil %s",
    (profile) => {
      const contract = PR_BODY_PROFILES[profile];
      const template = readFileSync(contract.templatePath, "utf8").trimEnd() + "\n";

      expect(buildPrBody({ profile })).toBe(template);
    }
  );

  it("gera execution body humano com escopo recolhido para open-next-node", () => {
    const body = buildNextNodePrBody({
      specId: "0024",
      currentNodeId: "co-flow-convergence",
      nextNodeId: "co-flow-continuation",
      nextCheckpoint: "checkpoint-co-flow-continuation",
      baseBranch: "feat/spec-0024-co-flow-convergence",
      headBranch: "feat/spec-0024-co-flow-continuation",
    });

    expect(body).toContain("## Visão pretendida");
    expect(body).toContain("## Resumo");
    expect(body).toContain("<details>");
    expect(body).toContain("<summary><strong>Detalhes de escopo e limites</strong></summary>");
    expect(body).toContain("### Dentro do escopo");
    expect(body).toContain("### Fora do escopo");
    expect(body).toContain("co-flow-continuation");
    expect(body).toContain("checkpoint-co-flow-continuation");
    expect(body).toContain("## Valor entregue");
    expect(body).toContain("## Test plan");
  });

  it("respeita caudas específicas dos perfis de PR", () => {
    const execution = buildPrBody({ profile: "execution" });
    const governance = buildPrBody({ profile: "governance" });
    const integration = buildPrBody({ profile: "integration" });
    const fastTrack = buildPrBody({ profile: "fast-track" });

    expect(execution).toContain("## Valor entregue");
    expect(execution).toContain("## Test plan");

    for (const body of [governance, integration, fastTrack]) {
      expect(body).not.toContain("## Valor entregue");
      expect(body).not.toContain("## Test plan");
      expect(body).toContain("## Validação, evidências e checklist");
      expect(body).toContain("## Disclosure de IA");
      expect(body).toContain("## Cross-refs");
    }
  });

  it("escreve arquivo quando --output é informado", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "pr-body-create-"));
    try {
      const output = path.join(dir, "body.md");
      const logs: string[] = [];
      const exit = main(
        [
          "--profile",
          "execution",
          "--spec",
          "0024",
          "--next-node",
          "co-flow-continuation",
          "--output",
          output,
        ],
        { logger: { info: (m) => logs.push(m), error: (m) => logs.push(m) } }
      );

      expect(exit).toBe(0);
      expect(readFileSync(output, "utf8")).toContain("co-flow-continuation");
      expect(logs.join(" ")).toContain("pr-body:create");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
