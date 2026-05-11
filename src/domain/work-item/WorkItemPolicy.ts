import { GovernanceError } from "../shared/errors.js";
import { WorkItemKind, WORK_ITEM_KINDS } from "../shared/types.js";
import { isDenseKind, isVirtualKind } from "./WorkItem.js";
import { WorkItemDraft } from "./WorkItemDraft.js";

/**
 * Invariantes constantes dos pilares MECE [DEC-0021-A02].
 * Centralizados aqui para que blueprints e validações leiam o mesmo número.
 */
export const PILLAR_INVARIANTS = {
  TITLE_MIN: 5,
  HYPOTHESIS_MIN: 10,
} as const;

function ensureKindKnown(kind: string): asserts kind is WorkItemKind {
  if (!WORK_ITEM_KINDS.includes(kind as WorkItemKind)) {
    throw new GovernanceError(
      "REGISTRY_UNKNOWN_KIND",
      `Tipo de item desconhecido: '${kind}'. Apenas os 7 pilares MECE são aceitos.`
    );
  }
}

/**
 * Valida um draft contra os invariantes do pilar.
 *
 * Função pura: não lê filesystem, não toca relógio, não consulta registry.
 * Lança {@link GovernanceError} com `code` determinístico em qualquer falha;
 * o `code` é a SSOT operacional reutilizada por testes e mensagens de UI.
 */
export function assertValidDraft(draft: WorkItemDraft): void {
  ensureKindKnown(draft.kind);

  if (!draft.title || draft.title.trim().length < PILLAR_INVARIANTS.TITLE_MIN) {
    throw new GovernanceError(
      "POLICY_TITLE_TOO_SHORT",
      `O título de qualquer item deve ter no mínimo ${PILLAR_INVARIANTS.TITLE_MIN} caracteres.`
    );
  }

  // Patches são MECE e não aceitam campos de outros pilares.
  if (draft.kind === "patch") {
    if (draft.hypothesis !== undefined || draft.successMetrics !== undefined) {
      throw new GovernanceError(
        "POLICY_PATCH_REJECTS_EXPERIMENT_FIELDS",
        "Um 'patch' não aceita campos experimentais (hypothesis/successMetrics)."
      );
    }
    if (draft.severity !== undefined) {
      throw new GovernanceError(
        "POLICY_PATCH_REJECTS_INCIDENT_FIELDS",
        "Um 'patch' não aceita campos de incidente (severity)."
      );
    }
  }

  if (draft.kind === "incident" && draft.severity === undefined) {
    throw new GovernanceError(
      "POLICY_INCIDENT_REQUIRES_SEVERITY",
      "Um 'incident' exige 'severity' no momento do registro."
    );
  }

  if (draft.kind === "experiment") {
    if (!draft.hypothesis || draft.hypothesis.trim().length < PILLAR_INVARIANTS.HYPOTHESIS_MIN) {
      throw new GovernanceError(
        "POLICY_EXPERIMENT_REQUIRES_HYPOTHESIS",
        `Um 'experiment' exige 'hypothesis' com no mínimo ${PILLAR_INVARIANTS.HYPOTHESIS_MIN} caracteres.`
      );
    }
    if (!draft.successMetrics || draft.successMetrics.length === 0) {
      throw new GovernanceError(
        "POLICY_EXPERIMENT_REQUIRES_METRICS",
        "Um 'experiment' exige ao menos uma 'successMetric'."
      );
    }
  }

  // Itens densos têm par físico em '.governance/' e exigem workspacePath.
  if (isDenseKind(draft.kind) && !draft.workspacePath) {
    throw new GovernanceError(
      "POLICY_DENSE_REQUIRES_WORKSPACE",
      `Itens densos ('${draft.kind}') exigem 'workspacePath' definido.`
    );
  }

  // Itens virtuais (proposal/patch/fix) NUNCA admitem workspacePath.
  // O type system já garante isso em compile-time via discriminated union;
  // a policy bloqueia em runtime para evitar silent-drop em buildWorkItem
  // (que cairia em `isDenseKind=false` e retornaria um VirtualWorkItem sem o campo).
  if (isVirtualKind(draft.kind) && draft.workspacePath !== undefined) {
    throw new GovernanceError(
      "POLICY_VIRTUAL_REJECTS_WORKSPACE",
      `Itens virtuais ('${draft.kind}') não admitem 'workspacePath'.`
    );
  }
}
