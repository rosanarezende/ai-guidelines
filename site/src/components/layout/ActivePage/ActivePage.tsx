import {
  dailyJourney,
  peerReviewJourney,
  startJourneys,
  teamJourney,
  type RouteId,
} from "../../../flowData";
import { ContributePage } from "../../contribute/ContributePage/ContributePage";
import { FlowOverview } from "../../flow/FlowOverview/FlowOverview";
import { HomePage } from "../../home/HomePage/HomePage";
import { JourneyPage } from "../../journey/JourneyPage/JourneyPage";
import { NotFoundPage } from "../../not-found/NotFoundPage/NotFoundPage";
import { ReferencePage } from "../../reference/ReferencePage/ReferencePage";

export function ActivePage({ route }: { readonly route: RouteId }): JSX.Element {
  if (route === "home") return <HomePage />;
  if (route === "flow") return <FlowOverview />;
  if (route === "start") {
    return (
      <JourneyPage
        intro={{
          eyebrow: "Começar",
          title: "init para projeto novo, adopt para repo existente.",
          lead: "São entradas diferentes. Depois que o repo está governado, o caminho normal vira uso diário.",
        }}
        journeys={startJourneys}
      />
    );
  }
  if (route === "daily") {
    return (
      <JourneyPage
        intro={{
          eyebrow: "Uso diário",
          title: "O guia mostra o próximo passo e evita atalhos inseguros.",
          lead: "Para quem já usa ai-guidelines no repo: trabalhar, validar, revisar, marcar pronto e preparar decisões.",
        }}
        journeys={[dailyJourney]}
      />
    );
  }
  if (route === "team") {
    return (
      <JourneyPage
        intro={{
          eyebrow: "Em time",
          title: "Antes de trabalhar, confirme a frente correta.",
          lead: "Escolher a spec certa, evitar branch errada e saber quando criar uma spec nova exige autorização.",
        }}
        journeys={[teamJourney]}
      />
    );
  }
  if (route === "peerReview") {
    return (
      <JourneyPage
        intro={{
          eyebrow: "Review entre pares",
          title: "Revisar o PR de um colega deve ser um fluxo próprio.",
          lead: "Abra o PR em worktree separado ou checkout guiado, sem misturar com sua spec atual.",
        }}
        journeys={[peerReviewJourney]}
      />
    );
  }
  if (route === "reference") return <ReferencePage />;
  if (route === "contribute") return <ContributePage />;
  return <NotFoundPage />;
}
