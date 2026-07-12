import type { GovernanceSnapshot } from "@demo/contracts";
import { profileChipLabel } from "../profiles";
import type { ChecklistItem } from "./types";
import { format } from "./format";
import copy from "./_locales/pt-br.json";

export function deriveChecklist(
  snapshot: GovernanceSnapshot,
  sourcesConnected: number,
  sourcesTotal: number,
  periods: string[]
): ChecklistItem[] {
  const declaration = snapshot.profileDeclaration;
  return [
    {
      id: "profile",
      label: copy.checklist.profile.label,
      done: Boolean(declaration.profile),
      detail: format(copy.checklist.profile.detail, {
        profile: profileChipLabel(declaration.profile),
        approver: declaration["approved-by"] || copy.checklist.profile.unresolved,
        reviewAt: declaration["review-at"] || copy.checklist.profile.noDate,
      }),
    },
    {
      id: "roles",
      label: copy.checklist.roles.label,
      done: snapshot.authorities.length > 0,
      tag: copy.checklist.roles.tag,
      detail: format(copy.checklist.roles.detail, { count: String(snapshot.authorities.length) }),
    },
    {
      id: "cycle",
      label: format(copy.checklist.cycle.label, {
        period: periods[0] || copy.checklist.cycle.noPeriod,
      }),
      done: snapshot.portfolio.objectives.length > 0,
      detail: format(copy.checklist.cycle.detail, {
        objectives: String(snapshot.counts.objectives),
        targets: String(snapshot.counts.targets),
        periods: periods.join(", ") || copy.checklist.cycle.noPeriods,
      }),
    },
    {
      id: "sources",
      label: copy.checklist.sources.label,
      done: sourcesConnected === sourcesTotal && sourcesTotal > 0,
      tag: copy.checklist.sources.tag,
      detail:
        sourcesConnected === sourcesTotal
          ? format(copy.checklist.sources.allConnected, {
              connected: String(sourcesConnected),
              total: String(sourcesTotal),
            })
          : format(copy.checklist.sources.partial, {
              connected: String(sourcesConnected),
              total: String(sourcesTotal),
            }),
    },
    {
      id: "assistant",
      label: copy.checklist.assistant.label,
      done: false,
      tag: copy.checklist.assistant.tag,
      detail: copy.checklist.assistant.detail,
    },
  ];
}
