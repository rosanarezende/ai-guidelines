import { ConstraintOriginKind } from "./Constraint.js";

/**
 * F3 — validação de ÂNCORA canônica do `source_ref` (CO-3.1 / Spec 0024).
 *
 * Provar paridade não é "o texto menciona `[ID]`": é a fonte DECLARAR aquela
 * rule/guardrail como entrada estrutural. Este validador reconhece somente o
 * heading canônico real, por `origin.kind` (NÃO pelo prefixo do ID):
 *
 *   - `rule`      → `#### [ID] TÍTULO`  (mesma forma do parser de rules,
 *                    `MarkdownRulesDirectorySource.parseRuleFile`);
 *   - `guardrail` → `### [ID] TÍTULO`   (entrada estrutural da
 *                    `governance-foundation.md`, ex.: `[GG-0001]`).
 *
 * Rejeita falsos-verdes: menção no corpo, exemplo, bloco fenced, comentário
 * HTML e ID prefixado/sufixado (`GG-00010` ≠ `GG-0001`). Heading duplicado é
 * diagnosticado como ambíguo. Edição textual fora do heading não altera o
 * veredito.
 */
export interface AnchorVerdict {
  /** Existe exatamente um heading canônico para a âncora. */
  readonly ok: boolean;
  /** Quantidade de headings canônicos encontrados. */
  readonly count: number;
  /** `count > 1` — declaração ambígua. */
  readonly ambiguous: boolean;
}

export interface SourceAnchorValidator {
  validate(text: string, anchor: string): AnchorVerdict;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validador por nível de heading ATX. O `\\s` após os `#` garante o nível
 * EXATO (`####` não casa `###` nem `#####`); `\\[ID\\]\\s+\\S` exige título.
 */
class HeadingAnchorValidator implements SourceAnchorValidator {
  constructor(private readonly level: number) {}

  validate(text: string, anchor: string): AnchorVerdict {
    const escaped = escapeRegExp(anchor);
    const heading = new RegExp(`^#{${this.level}}\\s+\\[${escaped}\\]\\s+\\S`);
    // Comentários HTML não declaram estrutura — removidos antes do scan.
    const withoutComments = text.replace(/<!--[\s\S]*?-->/g, "");
    let inFence = false;
    let count = 0;
    for (const line of withoutComments.split(/\r?\n/)) {
      const trimmed = line.trimStart();
      if (/^(```|~~~)/.test(trimmed)) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      if (heading.test(line)) count += 1;
    }
    return { ok: count === 1, count, ambiguous: count > 1 };
  }
}

export const RuleAnchorValidator: SourceAnchorValidator = new HeadingAnchorValidator(4);
export const GuardrailAnchorValidator: SourceAnchorValidator = new HeadingAnchorValidator(3);

/** Seleção pela ORIGEM declarada (`origin.kind`), nunca pelo prefixo do ID. */
export function selectAnchorValidator(kind: ConstraintOriginKind): SourceAnchorValidator {
  return kind === "rule" ? RuleAnchorValidator : GuardrailAnchorValidator;
}

export function validateSourceAnchor(
  kind: ConstraintOriginKind,
  text: string,
  anchor: string
): AnchorVerdict {
  return selectAnchorValidator(kind).validate(text, anchor);
}
