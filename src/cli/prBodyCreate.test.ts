import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PR_BODY_PROFILES, PrProfileName } from "../domain/workflow/PrProfileContract.js";
import {
  buildNextNodePrBody,
  buildPrBody,
  extractPrBodyTemplateTokens,
  main,
} from "./prBodyCreate.js";

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

  it("declara os slots variáveis no template execution governado", () => {
    const template = readFileSync(PR_BODY_PROFILES.execution.templatePath, "utf8");

    expect(extractPrBodyTemplateTokens(template)).toEqual(
      PR_BODY_PROFILES.execution.templateTokens.map((token) => token.name).sort()
    );
  });

  it("mantém orientação editorial em comentários HTML do template execution", () => {
    const template = readFileSync(PR_BODY_PROFILES.execution.templatePath, "utf8");
    const comments = Array.from(template.matchAll(/<!--([\s\S]*?)-->/g))
      .map((match) => match[1].trim())
      .join("\n");

    expect(comments).toContain("Texto visível para humanos");
    expect(comments).toContain("Esta seção é recolhida de propósito");
    expect(comments).toContain("Agentes/revisores podem abrir quando precisarem");
  });

  it("renderiza templates sem deixar slots pendentes no body inicial", () => {
    const rendered = (Object.keys(PR_BODY_PROFILES) as PrProfileName[]).map((profile) => ({
      profile,
      tokens: extractPrBodyTemplateTokens(buildPrBody({ profile })),
    }));

    expect(rendered).toEqual([
      { profile: "execution", tokens: [] },
      { profile: "governance", tokens: [] },
      { profile: "integration", tokens: [] },
      { profile: "fast-track", tokens: [] },
    ]);
  });

  it("gera execution body contextual por slots do template para open-next-node", () => {
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
    expect(body).toContain("<summary><strong>Escopo técnico e limites</strong></summary>");
    expect(body).toContain("### Dentro do escopo");
    expect(body).toContain("### Fora do escopo");
    expect(body).toContain("Abrir co-flow-continuation como próximo PR stacked da Spec 0024");
    expect(body).toContain(
      "Este PR abre o próximo nó governado da Spec 0024: `co-flow-continuation`."
    );
    expect(body).toContain("co-flow-continuation");
    expect(body).toContain("checkpoint-co-flow-continuation");
    expect(body).toContain("## Valor entregue");
    expect(body).toContain("## Test plan");
  });

  it("renderiza os perfis a partir dos templates declarados no contrato", () => {
    const renderedSections = (Object.keys(PR_BODY_PROFILES) as PrProfileName[]).map((profile) => {
      const body = buildPrBody({ profile });
      const contract = PR_BODY_PROFILES[profile];
      return {
        profile,
        sections: [...contract.draftSections, ...contract.readySections].filter((section) =>
          body.includes(section)
        ),
      };
    });

    expect(renderedSections).toEqual(
      (Object.keys(PR_BODY_PROFILES) as PrProfileName[]).map((profile) => ({
        profile,
        sections: [
          ...PR_BODY_PROFILES[profile].draftSections,
          ...PR_BODY_PROFILES[profile].readySections,
        ],
      }))
    );
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
