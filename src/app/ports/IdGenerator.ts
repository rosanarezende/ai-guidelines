import { WorkItemId } from "../../domain/shared/types.js";

export interface IdGenerator {
  next(): WorkItemId;
}
