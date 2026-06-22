import { existsSync } from "node:fs";
import { parseContextTarget } from "./parseContextTarget.js";
import { renderVisualPrompt } from "./renderVisualPrompt.js";
import { collectLocalContext } from "./collectLocalContext.js";
import { VISUAL_PROMPT_OPTIONS } from "./visualPromptCatalog.js";
import { WorkflowFileSystem } from "../../app/ports/WorkflowFileSystem.js";

class StubFs implements WorkflowFileSystem {
  constructor(
    private readonly files: Map<string, string>,
    private readonly dirs: Set<string>
  ) {}
  fileExists(p: string): boolean {
    return this.files.has(p);
  }
  directoryExists(p: string): boolean {
    return this.dirs.has(p);
  }
  readTextFile(p: string): string {
    const f = this.files.get(p);
    if (f === undefined) throw new Error(`missing ${p}`);
    return f;
  }
  writeTextFile(): void {
    throw new Error("not used");
  }
  listDirectory(p: string): ReadonlyArray<string> {
    if (p === ".governance/specs") {
      return ["0023-workflow-runtime", "0024-other-spec"];
    }
    return [];
  }
  currentBranch(): string | null {
    return "feat/spec-0023-workflow-runtime";
  }
  resolveAbsolute(p: string): string {
    return `/repo/${p}`;
  }
}

describe("CLI — Visual Prompts [BR-WORKFLOW-VISUAL-PROMPTS]", () => {
  describe("visualPromptCatalog", () => {
    it("DADO o catálogo de prompts visuais QUANDO validar ENTÃO cada slug aponta para template versionado", () => {
      for (const option of VISUAL_PROMPT_OPTIONS) {
        expect(existsSync(`.governance/visual-prompts/${option.slug}.prompt.md`)).toBe(true);
      }
    });

    it("DADO o modo visão pretendida QUANDO consultar o catálogo ENTÃO exige contexto de PR/spec", () => {
      expect(VISUAL_PROMPT_OPTIONS).toContainEqual(
        expect.objectContaining({
          value: "pr-intended-vision",
          slug: "pr-intended-vision",
          needsContext: true,
        })
      );
    });
  });

  describe("parseContextTarget", () => {
    it("DADO um input de PR com cerquilha QUANDO parsear ENTÃO retorna o tipo pr e o número correto", () => {
      const result = parseContextTarget("PR #25");
      expect(result).toEqual({ kind: "pr", number: 25 });
    });

    it("DADO um input de PR sem cerquilha e minúsculo QUANDO parsear ENTÃO retorna o tipo pr e o número correto", () => {
      const result = parseContextTarget("pr 42");
      expect(result).toEqual({ kind: "pr", number: 42 });
    });

    it("DADO um input de spec com slug longo QUANDO parsear ENTÃO retorna o tipo spec e o identificador de 4 dígitos", () => {
      const result = parseContextTarget("spec 0023-workflow-runtime");
      expect(result).toEqual({ kind: "spec", identifier: "0023" });
    });

    it("DADO um input que é apenas o número da spec QUANDO parsear ENTÃO retorna o tipo spec e o identificador correto", () => {
      const result = parseContextTarget("0023");
      expect(result).toEqual({ kind: "spec", identifier: "0023" });
    });

    it("DADO um input livre desconhecido QUANDO parsear ENTÃO retorna tipo unknown", () => {
      const result = parseContextTarget("algum texto aleatório");
      expect(result).toEqual({ kind: "unknown" });
    });
  });

  describe("renderVisualPrompt", () => {
    it("DADO um template com variáveis e um localContext preenchido QUANDO renderizar ENTÃO substitui todos os placeholders perfeitamente", () => {
      const files = new Map<string, string>([
        [
          ".governance/visual-prompts/my-template.prompt.md",
          "Context: {{context}}\nPRE-COLLECTED LOCAL CONTEXT (bruto):\n{{localContext}}\nFooter",
        ],
      ]);
      const fs = new StubFs(files, new Set());

      const result = renderVisualPrompt(fs, "my-template", {
        context: "PR #25",
        localContext: "Alguma evidência git diff",
      });

      expect(result).toContain("Context: PR #25");
      expect(result).toContain("Alguma evidência git diff");
      expect(result).not.toContain("{{localContext}}");
    });

    it("DADO um template com bloco de contexto local QUANDO localContext for vazio ENTÃO remove o bloco inteiro para evitar linhas vazias órfãs", () => {
      const files = new Map<string, string>([
        [
          ".governance/visual-prompts/my-template.prompt.md",
          "Context: {{context}}\n\nPRE-COLLECTED LOCAL CONTEXT (when available, the CLI wizard injects deterministic data here; treat as authoritative starting point and complement only if needed):\n\n{{localContext}}\n\nFooter",
        ],
      ]);
      const fs = new StubFs(files, new Set());

      const result = renderVisualPrompt(fs, "my-template", {
        context: "PR #25",
        localContext: "",
      });

      expect(result).toContain("Context: PR #25");
      expect(result).toContain("Footer");
      expect(result).not.toContain("PRE-COLLECTED LOCAL CONTEXT");
      expect(result).not.toContain("{{localContext}}");
      // Garante que não sobrou espaçamento excessivo órfão
      expect(result?.trim()).toBe("Context: PR #25\n\nFooter");
    });
  });

  describe("collectLocalContext", () => {
    it("DADO um alvo do tipo unknown QUANDO coletar contexto local ENTÃO retorna uma string vazia graciosamente", () => {
      const fs = new StubFs(new Map(), new Set());
      const result = collectLocalContext({ kind: "unknown" }, { repoRoot: "/repo", fs });
      expect(result).toBe("");
    });

    it("DADO uma spec cujas pastas e arquivos existem QUANDO coletar contexto local ENTÃO lê state, spec.md, gate summaries do decision-brief e CHANGELOG (sem tasks/NEXT)", () => {
      const files = new Map<string, string>([
        [
          ".governance/specs/0023-workflow-runtime/state.yml",
          "stage: implementation\ngate:\n  status: closed",
        ],
        [
          ".governance/specs/0023-workflow-runtime/spec.md",
          "# Spec 0023\n\n## 🎯 Objetivo\nReduzir carga cognitiva.\n\nResultado esperado:\n- Comando workflow funciona.\n",
        ],
        [".governance/specs/0023-workflow-runtime/tasks.md", "- [x] Tarefa 1\n- [/] Tarefa 2"],
        [".governance/specs/0023-workflow-runtime/NEXT.md", "Debts:\n- Corrigir bugs"],
        [
          ".governance/specs/0023-workflow-runtime/decision-brief.md",
          "# Decision Brief\n\n## Bloco A\n\nTexto de decisão.\n\n## ✅ Gate fechado — Bloco A\n\n- [x] DEC-0023-A01 — Escopo expandido\n",
        ],
        [
          "CHANGELOG.md",
          "## [Unreleased]\n\n- Spec 0023 entregue.\n- Wizard operacional.\n\n## [1.0.0]\n\n- Release anterior.",
        ],
      ]);
      const dirs = new Set<string>([
        ".governance/specs",
        ".governance/specs/0023-workflow-runtime",
      ]);
      const fs = new StubFs(files, dirs);

      const result = collectLocalContext(
        { kind: "spec", identifier: "0023" },
        { repoRoot: "/repo", fs }
      );

      expect(result).toContain("### Spec 0023-workflow-runtime Evidence");
      // state.yml incluído
      expect(result).toContain("#### state.yml");
      expect(result).toContain("stage: implementation");
      // spec.md objetivo incluído
      expect(result).toContain("#### spec.md");
      expect(result).toContain("Reduzir carga cognitiva");
      // decision-brief: apenas seções Gate fechado
      expect(result).toContain("## ✅ Gate fechado — Bloco A");
      expect(result).toContain("DEC-0023-A01");
      expect(result).not.toContain("## Bloco A\n\nTexto de decisão"); // prosa de governança excluída
      // CHANGELOG: seção completa
      expect(result).toContain("#### CHANGELOG.md");
      expect(result).toContain("Spec 0023 entregue");
      // tasks.md e NEXT.md excluídos intencionalmente (execução/diferidos, não value story)
      expect(result).not.toContain("#### tasks.md");
      expect(result).not.toContain("#### NEXT.md");
      expect(result).not.toContain("Corrigir bugs");
    });

    it("DADO uma spec cujos arquivos de especificação não existem QUANDO coletar contexto local ENTÃO retorna apenas cabeçalho ou string vazia de forma resiliente", () => {
      const dirs = new Set<string>([
        ".governance/specs",
        ".governance/specs/0023-workflow-runtime",
      ]);
      const fs = new StubFs(new Map(), dirs);

      const result = collectLocalContext(
        { kind: "spec", identifier: "0023" },
        { repoRoot: "/repo", fs }
      );

      expect(result).toContain("### Spec 0023-workflow-runtime Evidence");
      // Sem subseções de arquivos inexistentes
      expect(result).not.toContain("#### state.yml");
      expect(result).not.toContain("#### tasks.md");
    });
  });
});
