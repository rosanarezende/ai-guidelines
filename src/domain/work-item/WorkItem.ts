import {
  IncidentSeverity,
  LifecycleStatus,
  ResolutionMode,
  ValueStatus,
  WorkItemId,
  WorkItemKind,
} from "../shared/types.js";

/**
 * Tipos de pilar agrupados por **categoria semântica**.
 *
 * Dense ⇒ tem par físico em `.governance/<subpasta>/...` (PR2).
 * Virtual ⇒ vive apenas no registry; nenhum IO de workspace é gerado.
 *
 * Manter a partição em tipos literais permite ao TypeScript narrow-ar
 * o `WorkItem` por discriminator (`kind`) e bloqueia, em compile-time,
 * combinações de campos cruzados (ex.: `severity` em `proposal`).
 */
export type DenseKind = "spec" | "experiment" | "spike" | "incident";
export type VirtualKind = "proposal" | "patch" | "fix";

export const DENSE_KINDS: readonly DenseKind[] = ["spec", "experiment", "spike", "incident"];
export const VIRTUAL_KINDS: readonly VirtualKind[] = ["proposal", "patch", "fix"];

export function isDenseKind(kind: WorkItemKind): kind is DenseKind {
  return (DENSE_KINDS as readonly string[]).includes(kind);
}
export function isVirtualKind(kind: WorkItemKind): kind is VirtualKind {
  return (VIRTUAL_KINDS as readonly string[]).includes(kind);
}

interface WorkItemBase {
  readonly id: WorkItemId;
  readonly title: string;
  readonly status: LifecycleStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly sourceRefs: ReadonlyArray<string>;
}

/**
 * Item denso: ocupa espaço físico em `.governance/` quando o IO existir.
 *
 * `workspacePath` é obrigatório — a categoria carrega a promessa de par
 * físico, então não faz sentido um item denso sem destino. Os campos
 * "nicho" (hypothesis/successMetrics/outcome/resolution para experiment;
 * severity para incident) permanecem opcionais aqui, mas {@link WorkItemPolicy}
 * exige presença/ausência conforme o `kind` específico.
 */
export interface DenseWorkItem extends WorkItemBase {
  readonly kind: DenseKind;
  readonly workspacePath: string;
  readonly hypothesis?: string;
  readonly successMetrics?: ReadonlyArray<string>;
  readonly outcome?: ValueStatus;
  readonly resolution?: ResolutionMode;
  readonly severity?: IncidentSeverity;
}

/**
 * Item virtual: existe somente no registry, sem par físico.
 * Não carrega campos de outros pilares — typed-out por construção.
 */
export interface VirtualWorkItem extends WorkItemBase {
  readonly kind: VirtualKind;
}

/**
 * Entidade central. Discriminated union por `kind` permite type narrowing
 * com `isDenseItem` / `isVirtualItem` sem casts.
 */
export type WorkItem = DenseWorkItem | VirtualWorkItem;

export function isDenseItem(item: WorkItem): item is DenseWorkItem {
  return isDenseKind(item.kind);
}
export function isVirtualItem(item: WorkItem): item is VirtualWorkItem {
  return isVirtualKind(item.kind);
}

/**
 * Envelope estrutural para mutações pontuais (registry.update, promotion).
 *
 * Não é um {@link WorkItem} válido por si só — é o "delta" que será
 * mesclado a um item existente. Uma promoção entre categorias
 * (`proposal → spec`) precisa que o patch carregue ao menos `kind` e
 * `workspacePath` para que o item resultante reentre no contrato dense.
 *
 * Re-validação após merge é responsabilidade do caller (use case);
 * o registry só garante imutabilidade de `id`/`createdAt` e timestamps.
 *
 * `id` e `createdAt` são aceitos no shape do patch apenas para que a
 * verificação de imutabilidade do registry possa ser exercitada com
 * mensagens determinísticas — qualquer valor diferente do atual lança.
 */
export interface WorkItemPatch {
  readonly id?: WorkItemId;
  readonly createdAt?: string;
  readonly kind?: WorkItemKind;
  readonly title?: string;
  readonly status?: LifecycleStatus;
  readonly workspacePath?: string;
  readonly sourceRefs?: ReadonlyArray<string>;
  readonly hypothesis?: string;
  readonly successMetrics?: ReadonlyArray<string>;
  readonly outcome?: ValueStatus;
  readonly resolution?: ResolutionMode;
  readonly severity?: IncidentSeverity;
}
