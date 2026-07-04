import rolesPtBr from "./locales/pt-br.json";
import type { ProfileId } from "../profiles";

export type RoleKey = "admin" | "payer" | "sponsor" | "security" | "technical" | "attester";

export const ROLE_CONTRACT = rolesPtBr.contract as Array<{
  key: RoleKey;
  role: string;
  desc: string;
  sensitive: boolean;
}>;

export type RoleAssignments = Record<RoleKey, string>;

export const DEFAULT_ASSIGNMENTS: RoleAssignments = {
  admin: "head-platform",
  payer: "finance-owner",
  sponsor: "sponsor-acme",
  security: "lead-sre",
  technical: "head-platform",
  attester: "lead-data",
};

export function roleWarnings(
  assignments: RoleAssignments,
  profile: ProfileId,
  authorityIds: Set<string>
): string[] {
  const warnings: string[] = [];
  if (assignments.admin === assignments.sponsor) warnings.push(rolesPtBr.warnings.adminSponsor);
  if (assignments.admin === assignments.payer) warnings.push(rolesPtBr.warnings.adminPayer);
  if (assignments.sponsor === assignments.attester) {
    warnings.push(rolesPtBr.warnings.sponsorAttester);
  }
  if (assignments.technical === assignments.attester) {
    warnings.push(rolesPtBr.warnings.technicalAttester);
  }
  if (!authorityIds.has(assignments.payer)) warnings.push(rolesPtBr.warnings.payerUnresolved);
  if (profile === "solo") warnings.push(rolesPtBr.warnings.solo);
  if (!warnings.length) warnings.push(rolesPtBr.warnings.ok);
  return warnings;
}

export const ROLE_ACCEPTANCE_NOTICE = rolesPtBr.acceptanceNotice;
