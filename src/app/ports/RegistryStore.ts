import { WorkItemId } from "../../domain/shared/types.js";
import { WorkItem, WorkItemPatch } from "../../domain/work-item/WorkItem.js";

export interface RegistryStore {
  add(item: WorkItem): void;
  update(id: WorkItemId, patch: WorkItemPatch, updatedAt: string): WorkItem;
  remove(id: WorkItemId): void;
  find(id: WorkItemId): WorkItem | undefined;
  list(): ReadonlyArray<WorkItem>;
}
