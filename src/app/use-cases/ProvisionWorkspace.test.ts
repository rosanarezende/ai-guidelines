import { ProvisioningFileSystem } from "../ports/ProvisioningFileSystem.js";
import { PointersConfig } from "../../domain/provisioning/ProvisioningPlan.js";
import { ProvisionWorkspace, ProvisionWorkspaceInput } from "./ProvisionWorkspace.js";

/** Filesystem em memória — fake do port (padrão DDD da casa). */
class InMemoryFs implements ProvisioningFileSystem {
  readonly files = new Map<string, string>();

  async readText(relPath: string): Promise<string | null> {
    return this.files.has(relPath) ? (this.files.get(relPath) as string) : null;
  }
  async writeText(relPath: string, content: string): Promise<void> {
    this.files.set(relPath, content);
  }
  async exists(relPath: string): Promise<boolean> {
    return this.files.has(relPath);
  }
  async ensureDir(): Promise<void> {
    // diretórios são implícitos no fake
  }
  async remove(relPath: string): Promise<void> {
    this.files.delete(relPath);
  }
}

const config: PointersConfig = {
  sdd_dir: ".ai-guidelines",
  providers: ["claude"],
  features: ["tdd"],
  lang: "pt",
};

const input: ProvisionWorkspaceInput = {
  config,
  adapterRulesByName: { claude: "RULES-CLAUDE" },
  force: false,
  prune: false,
};

describe("app/use-cases/ProvisionWorkspace (plano puro → aplicação via port)", () => {
  it("DADO consumidor pristino QUANDO execute ENTÃO escreve config + entrypoints com bloco gerenciado", async () => {
    const fs = new InMemoryFs();
    const result = await new ProvisionWorkspace(fs, false).execute(input);

    expect(result.idempotentNoop).toBe(false);
    expect(result.actions).toContain("write .ai-guidelines/config.json");
    expect(result.actions).toContain("write CLAUDE.md");
    expect(result.actions).toContain("write .claudeignore");

    const claudeMd = fs.files.get("CLAUDE.md") as string;
    expect(claudeMd).toContain("ai-guidelines:managed-start");
    expect(claudeMd).toContain("# SYSTEM DIRECTIVE: HARD REDIRECT");
    expect(claudeMd).toContain("RULES-CLAUDE");

    const cfg = JSON.parse(fs.files.get(".ai-guidelines/config.json") as string);
    expect(cfg).toEqual({
      sdd_dir: ".ai-guidelines",
      providers: ["claude"],
      features: ["tdd"],
      lang: "pt",
    });
  });

  it("DADO segunda execução idêntica ENTÃO é idempotente (no-op, sem ações)", async () => {
    const fs = new InMemoryFs();
    const uc = new ProvisionWorkspace(fs, false);
    await uc.execute(input);
    const second = await uc.execute(input);
    expect(second.idempotentNoop).toBe(true);
    expect(second.actions).toEqual([]);
  });

  it("DADO dry-run ENTÃO não escreve nada e prefixa as ações", async () => {
    const fs = new InMemoryFs();
    const result = await new ProvisionWorkspace(fs, true).execute(input);
    expect(fs.files.size).toBe(0);
    expect(result.actions.every((a) => a.startsWith("[dry-run] "))).toBe(true);
  });

  it("DADO cursor QUANDO cria .mdc ENTÃO injeta o frontmatter YAML no topo", async () => {
    const fs = new InMemoryFs();
    await new ProvisionWorkspace(fs, false).execute({
      ...input,
      config: { ...config, providers: ["cursor"] },
    });
    const mdc = fs.files.get(".cursor/rules/ai-guidelines.mdc") as string;
    expect(mdc.startsWith("---\ndescription: ai-guidelines hard redirect")).toBe(true);
    expect(mdc).toContain("ai-guidelines:managed-start");
  });

  it("DADO prune ENTÃO remove entrypoint de provider desmarcado já presente", async () => {
    const fs = new InMemoryFs();
    fs.files.set("GEMINI.md", "stale gemini entrypoint");
    const result = await new ProvisionWorkspace(fs, false).execute({ ...input, prune: true });
    expect(result.actions).toContain("prune GEMINI.md");
    expect(fs.files.has("GEMINI.md")).toBe(false);
    // o provider selecionado segue presente
    expect(fs.files.has("CLAUDE.md")).toBe(true);
  });

  it("DADO arquivo legado sem marcadores QUANDO aplica ENTÃO preserva o legado (legacy-prepended)", async () => {
    const fs = new InMemoryFs();
    fs.files.set("CLAUDE.md", "minhas regras locais antigas\n");
    const result = await new ProvisionWorkspace(fs, false).execute(input);
    expect(
      result.actions.some((a) => a.includes("prepend managed block to existing CLAUDE.md"))
    ).toBe(true);
    expect(fs.files.get("CLAUDE.md")).toContain("minhas regras locais antigas");
  });
});
