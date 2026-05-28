import { PullRequestData, StackOps } from "../ports/StackOps.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";
import { DetectActiveSpec } from "./DetectActiveSpec.js";

/**
 * Use case tier 2: abre Integration PR para a spec ativa.
 *
 * Cravado em `[DEC-0023-L01]` (Bloco L). Materializa wizard option 4
 * (`🔗 Abrir Integration PR da spec ativa`). Padrão `plan + execute`:
 *
 * 1. `plan(input)` — detecta spec, lê body file, valida pre-flight, devolve
 *    `OpenIntegrationPRPlan`. **Sem side-effect.**
 * 2. CLI mostra plan + aguarda confirmação humana
 * 3. `execute(plan)` — invoca `StackOps.createPullRequest`. **Side-effect:** PR
 *    aparece em GitHub UI.
 *
 * Body source: `<spec_dir>/integration-pr.md` (convenção cravada em DEC-L01).
 * Owner edita o arquivo na pasta da spec; CLI lê literal e usa como body do PR.
 */

const SPEC_ID_DIR_REGEX = /^(\d{4})-(.+)$/;

export interface OpenIntegrationPRInput {
  /** Path relativo ao repo root do arquivo body (default: `<spec_dir>/integration-pr.md`). */
  readonly bodyFilePath?: string;
  /** Override do título auto-gerado. */
  readonly titleOverride?: string;
  /** Base branch (default: "main"). */
  readonly base?: string;
}

export interface OpenIntegrationPRPlan {
  readonly specId: string;
  readonly specSlug: string;
  readonly title: string;
  readonly body: string;
  readonly bodyFilePath: string;
  readonly base: string;
  readonly head: string;
  /** Per CORE-09: PRs abrem como Draft; owner converte Draft→Ready depois (CORE-10). */
  readonly draft: boolean;
}

export class OpenIntegrationPRError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenIntegrationPRError";
  }
}

export class OpenIntegrationPR {
  constructor(
    private readonly fs: WorkflowFileSystem,
    private readonly stack: StackOps
  ) {}

  plan(input: OpenIntegrationPRInput = {}): OpenIntegrationPRPlan {
    // 1. Detectar spec ativa (per [DEC-0023-I01] — identity canônica por id NNNN)
    const detected = new DetectActiveSpec(this.fs).run();
    if (!detected.location) {
      throw new OpenIntegrationPRError(
        `Não foi possível detectar spec ativa: ${detected.reason ?? "razão desconhecida"}. ` +
          `Faça checkout de uma branch da stack antes de abrir Integration PR.`
      );
    }

    // 2. Parse id + slug do diretório (formato canônico NNNN-slug)
    const dirMatch = SPEC_ID_DIR_REGEX.exec(detected.location.slug);
    if (!dirMatch) {
      throw new OpenIntegrationPRError(
        `Slug do diretório "${detected.location.slug}" não segue padrão NNNN-slug.`
      );
    }
    const [, specId, specSlug] = dirMatch;

    // 3. Resolver body file path
    const specDirPrefix =
      detected.location.source === "governance" ? ".governance/specs" : ".specify/specs";
    const defaultBodyPath = `${specDirPrefix}/${detected.location.slug}/integration-pr.md`;
    const bodyFilePath = input.bodyFilePath ?? defaultBodyPath;

    if (!this.fs.fileExists(bodyFilePath)) {
      throw new OpenIntegrationPRError(
        `Body file não encontrado: "${bodyFilePath}". ` +
          `Crie o arquivo (convenção: <spec_dir>/integration-pr.md) com o body do Integration PR antes de invocar este comando.`
      );
    }
    const body = this.fs.readTextFile(bodyFilePath);
    if (body.trim() === "") {
      throw new OpenIntegrationPRError(`Body file "${bodyFilePath}" está vazio.`);
    }

    // 4. Branch corrente como head (factual, não inferência)
    const head = this.fs.currentBranch();
    if (!head) {
      throw new OpenIntegrationPRError(
        `Sem branch git ativa (HEAD detached ou não-repo). ` +
          `Faça checkout da branch terminal da stack antes de invocar.`
      );
    }

    // 5. Title (default segue convenção cravada em pr-title-conventions.md)
    const title =
      input.titleOverride ?? `[🔗] [Integration] [Spec ${specId}] Homologação final da stack`;

    return {
      specId,
      specSlug,
      title,
      body,
      bodyFilePath,
      base: input.base ?? "main",
      head,
      draft: true,
    };
  }

  execute(plan: OpenIntegrationPRPlan): PullRequestData {
    return this.stack.createPullRequest({
      title: plan.title,
      body: plan.body,
      base: plan.base,
      head: plan.head,
      draft: plan.draft,
    });
  }
}
