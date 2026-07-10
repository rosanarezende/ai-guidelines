// table-from-snapshot.ts — view-model de tabela operacional a partir do
// read-model REAL da demo acme (intents, proposals, standalone e targets).
// Separado de from-snapshot.ts para respeitar o limite de tamanho por arquivo.
import type { GovernanceSnapshot } from "@demo/contracts";
import { issueRisk, targetConfidence, targetRisk } from "./confidence";
import type { GovernanceTableRow, GovernanceTableViewModel } from "./view-models";

export function buildTableViewModel(snapshot: GovernanceSnapshot): GovernanceTableViewModel {
  const rows: GovernanceTableRow[] = [];
  const breakGlass = snapshot.operations.breakGlass;

  for (const intent of snapshot.portfolio.intents) {
    const verdict = snapshot.operations.verdicts.find((entry) => entry.intent === intent.id);
    rows.push({
      id: intent.id,
      kind: "intent",
      title: intent.title,
      owner: intent["authorized-by"],
      team: intent.team,
      repos: intent.repos,
      cycle: intent.target?.period ?? "",
      status: verdict ? `verdict: ${verdict.verdict}` : "em execução",
      confidence: verdict ? "verified" : "pending",
      risk: issueRisk(intent.id, snapshot.issues),
      evidence: verdict?.evidence?.join("; ") ?? "",
      nextStep: intent.next?.[0] ? intent.next[0].then : "aguardando decisão",
      contract: (intent["contracts-changed"] ?? []).join(", "),
      source: "acme/governance/intents",
    });
  }
  for (const proposal of snapshot.operations.proposals) {
    rows.push({
      id: proposal.id,
      kind: "proposal",
      title: proposal.title,
      owner: proposal["raised-by"],
      team: "",
      repos: [],
      cycle: "",
      status: proposal.status,
      confidence: proposal.status === "accepted" ? "verified" : "pending",
      risk: issueRisk(proposal.id, snapshot.issues),
      evidence: proposal.note ?? "",
      nextStep: proposal.status === "triaged" ? "decidir gate" : "triagem",
      contract: "",
      source: "acme/governance/intake",
    });
  }
  for (const work of snapshot.operations.standalone) {
    rows.push({
      id: work.id,
      kind: "standalone",
      title: `${work.kind}: ${work.id}`,
      owner: work.owner ?? "",
      team: "",
      repos: [work.repo],
      cycle: "",
      status: work.status ?? "aberto",
      confidence: work.verification?.result ? "verified" : "pending",
      risk: work["blocked-by"] ? "attention" : "low",
      evidence: [work.evidence?.command, work.verification?.result].filter(Boolean).join(" · "),
      nextStep: work["blocked-by"] ? `desbloquear: ${work["blocked-by"]}` : "concluir e verificar",
      contract: "",
      source: "sidecar do repo",
    });
  }
  for (const target of snapshot.targets) {
    rows.push({
      id: target.id,
      kind: "target",
      title: target.expected,
      owner: target.definer,
      team: target.node,
      repos: [],
      cycle: target.period,
      status: target.status,
      confidence: targetConfidence(target, breakGlass),
      risk: targetRisk(target, snapshot.issues),
      evidence: target.actualCount > 0 ? `${target.actualCount} outcome(s): ${target.actual}` : "",
      nextStep: target.actualCount === 0 ? "publicar outcome" : "acompanhar",
      contract: "",
      source: "acme/governance/business",
    });
  }

  return { name: "acme (read-model real)", sourceRevision: snapshot.revision, derived: true, rows };
}
