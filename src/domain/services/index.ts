import { WorkItem, WorkItemType } from "../entities";

/**
 * Interface for managing the structured registry (registry.yml).
 * Handles persistence and retrieval of the canonical state.
 */
export interface RegistryService {
  /**
   * Loads all work items from the registry.
   */
  loadAll(): Promise<WorkItem[]>;

  /**
   * Retrieves a specific work item by its ID.
   */
  getById(id: string): Promise<WorkItem | undefined>;

  /**
   * Saves or updates a work item in the registry.
   */
  save(item: WorkItem): Promise<void>;

  /**
   * Removes a work item from the registry.
   */
  delete(id: string): Promise<void>;
}

/**
 * Interface for interacting with the governance workspace filesystem (.governance/).
 * Handles folder creation, template application, and artifact management.
 */
export interface WorkspaceService {
  /**
   * Initializes the .governance/ directory structure if it doesn't exist.
   */
  initWorkspace(): Promise<void>;

  /**
   * Creates the physical storage (folders/files) for a work item.
   * Based on the item type and configured templates.
   */
  createItemWorkspace(item: WorkItem): Promise<void>;

  /**
   * Checks if the physical storage for a work item exists.
   */
  itemWorkspaceExists(item: WorkItem): Promise<boolean>;

  /**
   * Reads an artifact (e.g., spec.md) from a work item's workspace.
   */
  readArtifact(item: WorkItem, filename: string): Promise<string>;
}

/**
 * Interface for validating state transitions and business rules.
 * Implements the governance policies.
 */
export interface PolicyService {
  /**
   * Validates if a work item can transition from its current state to a new one.
   * e.g., "proposal" -> "spec" promotion rules.
   */
  validateTransition(
    item: WorkItem,
    newType: WorkItemType
  ): Promise<{ valid: boolean; errors?: string[] }>;

  /**
   * Validates if a work item satisfies all required metadata for its current type.
   */
  validateMetadata(item: WorkItem): Promise<{ valid: boolean; errors?: string[] }>;
}
