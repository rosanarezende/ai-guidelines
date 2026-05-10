import { WorkItem } from "../work-item/WorkItem.js";
import { WorkItemDraft } from "../work-item/WorkItemDraft.js";
import { assertValidDraft } from "../work-item/WorkItemPolicy.js";
import { promote as promotionPromote, PromotionInput, PromotionPatch } from "./PromotionPolicy.js";

/**
 * Fachada de composição das políticas puras de governança.
 *
 * Existe para dar à camada de aplicação um único colaborador estável
 * (`policies.validateNewItem` / `policies.promote`) sem que os use cases
 * conheçam a divisão interna do domínio (pilar vs. promoção vs. lifecycle).
 *
 * Cada método **delega** para uma função pura especializada — esta classe
 * intencionalmente NÃO acumula estado nem orquestração. Adições futuras
 * (lifecycle, classification, archival) devem nascer como módulos próprios
 * e plugar aqui como composição, **não** como métodos inflados — o nome
 * `GovernancePolicies` (plural) reforça essa intenção.
 */
export class GovernancePolicies {
  validateNewItem(draft: WorkItemDraft): void {
    assertValidDraft(draft);
  }

  promote(item: WorkItem, input: PromotionInput): PromotionPatch {
    return promotionPromote(item, input);
  }
}

export type { PromotionInput, PromotionPatch } from "./PromotionPolicy.js";
