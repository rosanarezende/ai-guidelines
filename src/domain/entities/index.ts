/**
 * @file Defines the core entities of the governance system, representing the Ubiquitous Language.
 * These entities are based on the 6 pillars of value defined in DEC-0021-A02.
 */

/**
 * The six core types of work items in the governance registry.
 * Each represents a different intent and operational lifecycle.
 */
export type WorkItemType = "spec" | "exploration" | "fix" | "patch" | "incident" | "proposal";

/**
 * Represents the base properties common to all work items in the registry.
 */
export interface WorkItem {
  id: string; // Unique identifier (e.g., 'spec-0021', 'fix-101')
  type: WorkItemType;
  title: string;
  description: string;
  status: "open" | "in-progress" | "review" | "done" | "archived";
  owner?: string; // The person or team responsible for this item
  relatedIds?: string[]; // IDs of other work items related to this one
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 1. spec: A structured deliverable for a new feature or architectural change.
 * It requires the full RPI (Research, Plan, Implement) lifecycle.
 */
export interface Spec extends WorkItem {
  type: "spec";
  specDirectory: string; // Path to the spec files (e.g., '.governance/specs/0021-...')
}

/**
 * 2. exploration: A Proof of Concept (PoC) or technical spike.
 * The focus is on learning and safe archiving of prototypes.
 */
export interface Exploration extends WorkItem {
  type: "exploration";
  outcome: "prototype" | "research-document" | "decision-log";
  prototypeUrl?: string; // Link to a draft PR or branch
}

/**
 * 3. fix: A correction for a functional failure.
 * Requires minimal documentation (plan + tasks) for traceability.
 */
export interface Fix extends WorkItem {
  type: "fix";
  relatedIncidentId?: string; // Optional link to an incident
}

/**
 * 4. patch: Maintenance invisible to the end-user.
 * Skips heavy documentation (e.g., library updates, linting, chores).
 */
export interface Patch extends WorkItem {
  type: "patch";
}

/**
 * 5. incident: A severe issue, such as downtime or a critical CI break.
 * Distinguished by its severity and business impact.
 */
export interface Incident extends WorkItem {
  type: "incident";
  severity: "critical" | "high" | "medium" | "low";
}

/**
 * 6. proposal: A backlog seed.
 * An idea for an improvement or feature, registered without creating physical folders or lifecycles yet.
 */
export interface Proposal extends WorkItem {
  type: "proposal";
}
