import type { WorkspaceRoleId } from "@demo/contracts";
import type { MembersOverview, RolesOverview } from "@/app/_domain/adoption/shellClient";
import type { ProfileId } from "@/app/_domain/adoption/model";
import copy from "./_locales/pt-br.json";

export type CreatorMode = "general" | "technical" | "business" | "facilitator";

export const roleLabels = copy.roleLabels as Record<WorkspaceRoleId, string>;

export const creatorModes: Array<{
  id: CreatorMode;
  title: string;
  description: string;
  roles: WorkspaceRoleId[];
}> = [
  {
    id: "general",
    title: copy.creatorModes.general.title,
    description: copy.creatorModes.general.description,
    roles: ["workspace-admin", "sponsor", "security-owner", "technical-owner", "source-owner"],
  },
  {
    id: "technical",
    title: copy.creatorModes.technical.title,
    description: copy.creatorModes.technical.description,
    roles: ["workspace-admin", "technical-owner", "source-owner", "security-owner"],
  },
  {
    id: "business",
    title: copy.creatorModes.business.title,
    description: copy.creatorModes.business.description,
    roles: ["sponsor", "target-definer", "cost-owner", "actual-attester"],
  },
  {
    id: "facilitator",
    title: copy.creatorModes.facilitator.title,
    description: copy.creatorModes.facilitator.description,
    roles: ["workspace-admin"],
  },
];

export function initialMode(profile: ProfileId): CreatorMode {
  return profile === "solo" ? "general" : "facilitator";
}

export function effectiveRoleIds(roles: RolesOverview | null): Set<WorkspaceRoleId> {
  return new Set(roles?.authority.map((grant) => grant.roleId) ?? []);
}

export function personName(overview: MembersOverview | null): string {
  const current = overview?.people.find((person) => person.id === overview.currentPersonId);
  return current?.displayName ?? overview?.people[0]?.displayName ?? copy.fallbackPersonName;
}
