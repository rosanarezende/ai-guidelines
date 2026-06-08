import { SpecLocation } from "../../domain/workflow/SpecLocation.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";

/**
 * Detecta a spec ativa por **identity canônica** (id `NNNN`), não por
 * branch slug literal.
 *
 * Princípio cravado em `decision-brief.md` § [DEC-0023-I01]:
 *
 *   **Branch names são artefatos de coordenação operacional, não
 *   identificadores canônicos de spec.**
 *
 * Stack multi-PR rotineiramente carrega branches com sufixo livre
 * (`feat/spec-0023-dx-thinking`, `feat/spec-0023-enforcement-runtime`,
 * etc.); o slug canônico da spec (`workflow-runtime`) vive no nome do
 * diretório, NÃO no nome do branch. Lookup literal `branch slug →
 * diretório` quebra silenciosamente nesse cenário; lookup por id resolve
 * de forma determinística.
 *
 * Estratégia:
 *   1. extrai id `NNNN` do branch (regex `feat/spec-NNNN-<scope>`);
 *   2. procura diretórios `NNNN-*` em `.governance/specs/` (preferência
 *      declarada per [DEC-0023-A02]);
 *   3. se 0 matches lá, procura em `.specify/specs/` (legado);
 *   4. exatamente 1 match → resolve;
 *   5. 0 matches em ambos → erro narrativo orientativo;
 *   6. ≥ 2 matches em qualquer root → erro narrativo expondo identity
 *      collision (cenário inválido por construção; id é único na
 *      convenção de numeração).
 *
 * **Não consulta `specs/active.yml`.** Projection layer ≠ primary
 * resolver de identity (cf. [DEC-0023-I01] + [DEC-0023-G01]).
 */

const GOVERNANCE_ROOT = ".governance/specs";
const SPECIFY_ROOT = ".specify/specs";

const BRANCH_REGEX = /^(?:feat|fix|docs|chore|refactor)\/spec-(\d{4})-([^/]+)$/;
const DIR_ID_REGEX = /^(\d{4})-(?:.+)$/;

export interface BranchParseResult {
  readonly specId: string;
  readonly branchScope: string;
}

/**
 * Parse do nome do branch no padrão `feat/spec-NNNN-<scope>`. Retorna
 * `specId` (identidade canônica, único por construção) e `branchScope`
 * (sufixo livre — pode ser slug da spec, escopo do PR, ou recorte
 * operacional arbitrário; transitório, NÃO identifica spec).
 */
export function parseSpecBranch(branch: string | null): BranchParseResult | null {
  if (!branch) return null;
  const match = BRANCH_REGEX.exec(branch);
  if (!match) return null;
  const [, specId, branchScope] = match;
  return { specId, branchScope };
}

export interface DetectActiveSpecResult {
  readonly location: SpecLocation | null;
  /**
   * Id canônico `NNNN` extraído do branch — a fonte autoritativa de identidade
   * (per [DEC-0023-I01]). Presente sempre que o branch parseou (mesmo sem dir).
   * Consumidores devem usar ISTO em vez de re-derivar do slug do diretório.
   */
  readonly specId?: string;
  /**
   * Sufixo do branch após `NNNN-`. Informativo (transparência); pode
   * diferir do slug do diretório resolvido em stacks multi-PR.
   */
  readonly branchScope?: string;
  readonly reason?: string;
}

export class DetectActiveSpec {
  constructor(private readonly fs: WorkflowFileSystem) {}

  run(): DetectActiveSpecResult {
    const branch = this.fs.currentBranch();
    if (!branch) {
      return {
        location: null,
        reason: "nenhum branch git ativo (HEAD detached ou não-repo)",
      };
    }

    const parsed = parseSpecBranch(branch);
    if (!parsed) {
      return {
        location: null,
        reason: `branch "${branch}" não segue o padrão feat/spec-NNNN-slug`,
      };
    }

    const { specId, branchScope } = parsed;

    // Lookup por id em .governance/specs/ (preferência declarada per [DEC-0023-A02])
    const governanceMatches = this.findDirsBySpecId(specId, GOVERNANCE_ROOT);
    if (governanceMatches.length === 1) {
      const dirName = governanceMatches[0];
      return {
        location: {
          slug: dirName,
          absolutePath: this.fs.resolveAbsolute(`${GOVERNANCE_ROOT}/${dirName}`),
          source: "governance",
        },
        specId,
        branchScope,
      };
    }
    if (governanceMatches.length > 1) {
      return {
        location: null,
        specId,
        branchScope,
        reason:
          `múltiplos diretórios com id "${specId}" em ${GOVERNANCE_ROOT}/: ` +
          `${governanceMatches.join(", ")}. Identity collision — bug estrutural a corrigir.`,
      };
    }

    // Fallback de root para legado per [DEC-0023-A02]
    const specifyMatches = this.findDirsBySpecId(specId, SPECIFY_ROOT);
    if (specifyMatches.length === 1) {
      const dirName = specifyMatches[0];
      return {
        location: {
          slug: dirName,
          absolutePath: this.fs.resolveAbsolute(`${SPECIFY_ROOT}/${dirName}`),
          source: "specify-legacy",
        },
        specId,
        branchScope,
      };
    }
    if (specifyMatches.length > 1) {
      return {
        location: null,
        specId,
        branchScope,
        reason:
          `múltiplos diretórios com id "${specId}" em ${SPECIFY_ROOT}/: ` +
          `${specifyMatches.join(", ")}. Identity collision — bug estrutural a corrigir.`,
      };
    }

    return {
      location: null,
      branchScope,
      reason:
        `nenhum diretório com id "${specId}" encontrado em ${GOVERNANCE_ROOT}/ ` +
        `nem em ${SPECIFY_ROOT}/. ` +
        `Branch "${branch}" carrega o id mas o diretório canônico da spec não existe.`,
    };
  }

  private findDirsBySpecId(specId: string, root: string): string[] {
    if (!this.fs.directoryExists(root)) return [];
    const dirs = this.fs.listDirectory(root);
    return dirs.filter((d) => {
      const m = DIR_ID_REGEX.exec(d);
      return m !== null && m[1] === specId;
    });
  }
}
