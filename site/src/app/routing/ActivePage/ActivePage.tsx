import {
  dailyJourney,
  peerReviewJourney,
  startJourneys,
  teamJourney,
  type RouteId,
} from "@content/flowData";
import { ContributePage } from "@pages/contribute/ContributePage/ContributePage";
import { FlowOverview } from "@pages/flow/FlowOverview/FlowOverview";
import { HomePage } from "@pages/home/HomePage/HomePage";
import { JourneyPage } from "@features/journey/JourneyPage/JourneyPage";
import { NotFoundPage } from "@pages/not-found/NotFoundPage/NotFoundPage";
import { ReferencePage } from "@pages/reference/ReferencePage/ReferencePage";
import copy from "./locales/pt-BR.json";

export function ActivePage({ route }: { readonly route: RouteId }): JSX.Element {
  if (route === "home") return <HomePage />;
  if (route === "flow") return <FlowOverview />;
  if (route === "start") {
    return <JourneyPage intro={copy.start} journeys={startJourneys} />;
  }
  if (route === "daily") {
    return <JourneyPage intro={copy.daily} journeys={[dailyJourney]} />;
  }
  if (route === "team") {
    return <JourneyPage intro={copy.team} journeys={[teamJourney]} />;
  }
  if (route === "peerReview") {
    return <JourneyPage intro={copy.peerReview} journeys={[peerReviewJourney]} />;
  }
  if (route === "reference") return <ReferencePage />;
  if (route === "contribute") return <ContributePage />;
  return <NotFoundPage />;
}
