// /spikes/visual-stack — bancada interna do spike da stack visual (QRD-27).
// Página fina: monta os view-models no SERVIDOR a partir do read-model
// derivado da demo acme e delega para a view. Não entra na navegação de
// produto e não grava nada; fixtures sintéticas são geradas no cliente.
import { loadGovernanceSnapshot } from "@demo/backend";
import { queryGraphOverview } from "@demo/backend";
import {
  buildDashboardViewModel,
  buildGovernanceMaps,
  buildTableViewModel,
} from "./_model/from-snapshot";
import { buildGraphViewModel } from "./_model/from-read-model";
import VisualStackSpikeView from "./_view/VisualStackSpikeView";

export const dynamic = "force-dynamic";

export default async function VisualStackSpikePage() {
  const snapshot = await loadGovernanceSnapshot();
  const overview = await queryGraphOverview();

  return (
    <VisualStackSpikeView
      maps={buildGovernanceMaps(snapshot)}
      dashboard={buildDashboardViewModel(snapshot)}
      table={buildTableViewModel(snapshot)}
      realGraph={buildGraphViewModel({
        name: "acme (read-model real)",
        sourceRevision: overview.sourceRevision,
        nodes: overview.nodes,
        edges: overview.edges,
        nodeTypes: overview.nodeTypes,
      })}
    />
  );
}
