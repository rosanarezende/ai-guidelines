import { GitOps } from "../ports/GitOps.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";

/**
 * Use case tier 3: prepara release publicando versão.
 *
 * Cravado em `[DEC-0023-L01]` (Bloco L). Materializa o comando standalone
 * `npm run flow -- release-prep`. Padrão `plan + execute`.
 *
 * Fluxo:
 *   1. Lê versão atual de `package.json`
 *   2. Lê versão alvo de `CHANGELOG.md` `[Unreleased] — X.Y.Z` (ou override)
 *   3. Valida (tag não existe local nem remote; working tree clean)
 *   4. Detecta pre-release (versão contém `-`) → dist-tag `next` vs `latest`
 *   5. Mostra plan completo (8 steps including workflow trigger)
 *   6. Após confirmação: edita arquivos, commit, tag, push
 *   7. Push da tag dispara `.github/workflows/release.yml` em background
 *
 * **Sem auto-bump por inferência de commits.** Versão alvo vem de CHANGELOG
 * (autor humano explícito) ou flag `--version`. Per ADR 0024 Não-objetivos.
 */

const UNRELEASED_HEADER_REGEX = /^## \[Unreleased\]\s*—\s*`?([^`\n]+?)`?(?:\s|$)/m;
const PACKAGE_JSON_VERSION_REGEX = /("version"\s*:\s*)"[^"]+"/;

export interface ReleasePrepInput {
  /** Override da versão alvo (default: ler de CHANGELOG `[Unreleased]`). */
  readonly versionOverride?: string;
  /** Remote para push (default: "origin"). */
  readonly remote?: string;
  /** Data ISO (YYYY-MM-DD) usada no CHANGELOG. Default: hoje. Injetável para tests. */
  readonly today?: string;
  /** Skip working tree clean check (não recomendado; só para emergências). */
  readonly skipWorkingTreeCheck?: boolean;
}

export interface ReleasePrepPlanStep {
  readonly description: string;
}

export interface ReleasePrepPlan {
  readonly currentVersion: string;
  readonly targetVersion: string;
  readonly isPrerelease: boolean;
  readonly distTag: string;
  readonly date: string;
  readonly tag: string;
  readonly remote: string;
  readonly branch: string;
  readonly steps: ReadonlyArray<ReleasePrepPlanStep>;
}

export class ReleasePrepError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReleasePrepError";
  }
}

export class ReleasePrep {
  constructor(
    private readonly fs: WorkflowFileSystem,
    private readonly git: GitOps
  ) {}

  plan(input: ReleasePrepInput = {}): ReleasePrepPlan {
    // 1. Branch corrente (factual)
    const branch = this.git.currentBranch();
    if (!branch) {
      throw new ReleasePrepError(
        `Sem branch git ativa (HEAD detached ou não-repo). Release-prep requer branch ativa.`
      );
    }

    // 2. Working tree clean (default; pode pular com flag)
    if (!input.skipWorkingTreeCheck && !this.git.isWorkingTreeClean()) {
      throw new ReleasePrepError(
        `Working tree não está clean. Commit ou stash mudanças não relacionadas antes de release-prep ` +
          `(release-prep edita package.json + CHANGELOG.md e faz commit dedicado).`
      );
    }

    // 3. Versão atual de package.json
    if (!this.fs.fileExists("package.json")) {
      throw new ReleasePrepError(`package.json não encontrado na raiz do repo.`);
    }
    const pkgRaw = this.fs.readTextFile("package.json");
    let pkg: { version?: unknown };
    try {
      pkg = JSON.parse(pkgRaw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ReleasePrepError(`package.json não é JSON válido: ${msg}`);
    }
    const currentVersion = typeof pkg.version === "string" ? pkg.version : "";
    if (!currentVersion) {
      throw new ReleasePrepError(`package.json não tem campo "version" válido.`);
    }

    // 4. Versão alvo (override OU CHANGELOG `[Unreleased]`)
    let targetVersion: string;
    if (input.versionOverride) {
      targetVersion = input.versionOverride.trim();
    } else {
      if (!this.fs.fileExists("CHANGELOG.md")) {
        throw new ReleasePrepError(
          `CHANGELOG.md não encontrado. Use flag --version <X.Y.Z> ou crie o CHANGELOG com header [Unreleased].`
        );
      }
      const changelog = this.fs.readTextFile("CHANGELOG.md");
      const match = UNRELEASED_HEADER_REGEX.exec(changelog);
      if (!match) {
        throw new ReleasePrepError(
          `CHANGELOG.md não tem header "## [Unreleased] — <version>". ` +
            `Adicione ou use --version <X.Y.Z>.`
        );
      }
      targetVersion = match[1].trim();
    }

    if (!targetVersion) {
      throw new ReleasePrepError(`Versão alvo vazia (de CHANGELOG ou override).`);
    }
    if (targetVersion === currentVersion) {
      throw new ReleasePrepError(
        `Versão alvo (${targetVersion}) é igual à atual em package.json. Bump primeiro ou ajuste CHANGELOG.`
      );
    }

    // 5. Tag duplicada (local e remoto)
    const tag = `v${targetVersion}`;
    const localTags = this.git.listTags();
    if (localTags.includes(tag)) {
      throw new ReleasePrepError(`Tag local ${tag} já existe.`);
    }
    const remote = input.remote ?? "origin";
    const remoteTags = this.git.listRemoteTags(remote);
    if (remoteTags.includes(tag)) {
      throw new ReleasePrepError(`Tag remota ${tag} já existe em ${remote}.`);
    }

    // 6. Pre-release detection (dist-tag npm)
    const isPrerelease = targetVersion.includes("-");
    const distTag = isPrerelease ? "next" : "latest";

    // 7. Data (default hoje, injetável para tests)
    const date = input.today ?? new Date().toISOString().slice(0, 10);

    return {
      currentVersion,
      targetVersion,
      isPrerelease,
      distTag,
      date,
      tag,
      remote,
      branch,
      steps: [
        { description: `Edit package.json: "version": "${currentVersion}" → "${targetVersion}"` },
        {
          description: `Edit CHANGELOG.md: "## [Unreleased] — ${targetVersion}" → "## [${targetVersion}] — ${date}"`,
        },
        { description: `git add package.json CHANGELOG.md` },
        { description: `git commit -m "chore(release): ${targetVersion}"` },
        { description: `git tag ${tag}` },
        { description: `git push ${remote} ${branch}` },
        { description: `git push ${remote} ${tag}` },
        {
          description: `(workflow .github/workflows/release.yml dispara automaticamente → publish dist-tag '${distTag}')`,
        },
      ],
    };
  }

  execute(plan: ReleasePrepPlan): void {
    // 1. Bump package.json
    const pkgRaw = this.fs.readTextFile("package.json");
    const pkgBumped = pkgRaw.replace(PACKAGE_JSON_VERSION_REGEX, `$1"${plan.targetVersion}"`);
    if (pkgBumped === pkgRaw) {
      throw new ReleasePrepError(
        `Não foi possível bumpar "version" em package.json (regex não casou). ` +
          `Verifique formato manual.`
      );
    }
    this.fs.writeTextFile("package.json", pkgBumped);

    // 2. Promover CHANGELOG [Unreleased] → [version] — date
    const clRaw = this.fs.readTextFile("CHANGELOG.md");
    const clBumped = clRaw.replace(
      UNRELEASED_HEADER_REGEX,
      `## [${plan.targetVersion}] — ${plan.date}`
    );
    if (clBumped === clRaw) {
      throw new ReleasePrepError(
        `Não foi possível atualizar CHANGELOG.md (regex de [Unreleased] não casou).`
      );
    }
    this.fs.writeTextFile("CHANGELOG.md", clBumped);

    // 3-5. Git ops locais
    this.git.add(["package.json", "CHANGELOG.md"]);
    this.git.commit(`chore(release): ${plan.targetVersion}`);
    this.git.tag(plan.tag);

    // 6-7. Push (branch primeiro, depois tag — ordem importa para o workflow
    // detectar commit + tag corretamente)
    this.git.push(plan.remote, [plan.branch]);
    this.git.push(plan.remote, [plan.tag]);

    // Step 8 (workflow trigger) acontece automaticamente — fora do escopo deste use case.
  }
}
