import { SpecLocation } from "../../domain/workflow/SpecLocation.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";

/**
 * Detecta a spec ativa via double-lookup.
 *
 * Estratégia (cf. decision-brief.md § DEC-0023-A02):
 *   1. branch name `feat/spec-NNNN-{slug}` (ou variantes `fix/`, `docs/`)
 *      → diretório slug `NNNN-{slug}`;
 *   2. se `.governance/specs/{slug}` existe → source: governance;
 *   3. senão se `.specify/specs/{slug}` existe → source: specify-legacy;
 *   4. fallback: retorna null e deixa a UI orientar o humano
 *      (não tentamos adivinhar por arquivos modificados nesta versão —
 *      evita inferência frágil; PRs futuros podem adicionar).
 */

const GOVERNANCE_ROOT = ".governance/specs";
const SPECIFY_ROOT = ".specify/specs";

const BRANCH_SLUG_REGEX = /^(?:feat|fix|docs|chore|refactor)\/spec-(\d{4})-(.+)$/;

export function deriveSlugFromBranch(branch: string | null): string | null {
  if (!branch) return null;
  const match = BRANCH_SLUG_REGEX.exec(branch);
  if (!match) return null;
  const [, num, rest] = match;
  return `${num}-${rest}`;
}

export interface DetectActiveSpecResult {
  readonly location: SpecLocation | null;
  readonly reason?: string;
}

export class DetectActiveSpec {
  constructor(private readonly fs: WorkflowFileSystem) {}

  run(): DetectActiveSpecResult {
    const branch = this.fs.currentBranch();
    const slug = deriveSlugFromBranch(branch);

    if (!slug) {
      return {
        location: null,
        reason: branch
          ? `branch "${branch}" não segue o padrão feat/spec-NNNN-slug`
          : "nenhum branch git ativo (HEAD detached ou não-repo)",
      };
    }

    const governancePath = `${GOVERNANCE_ROOT}/${slug}`;
    if (this.fs.directoryExists(governancePath)) {
      return {
        location: {
          slug,
          absolutePath: this.fs.resolveAbsolute(governancePath),
          source: "governance",
        },
      };
    }

    const specifyPath = `${SPECIFY_ROOT}/${slug}`;
    if (this.fs.directoryExists(specifyPath)) {
      return {
        location: {
          slug,
          absolutePath: this.fs.resolveAbsolute(specifyPath),
          source: "specify-legacy",
        },
      };
    }

    return {
      location: null,
      reason: `slug "${slug}" derivado do branch não foi encontrado em ${GOVERNANCE_ROOT}/ nem em ${SPECIFY_ROOT}/`,
    };
  }
}
