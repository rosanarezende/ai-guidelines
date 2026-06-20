import type { RouteId } from "@content/flowData";
import { ContributePage } from "@pages/contribute/ContributePage/ContributePage";
import { HomePage } from "@pages/home/HomePage/HomePage";
import { NotFoundPage } from "@pages/not-found/NotFoundPage/NotFoundPage";
import { ReferencePage } from "@pages/reference/ReferencePage/ReferencePage";

export function ActivePage({ route }: { readonly route: RouteId }): JSX.Element {
  if (route === "home") return <HomePage />;
  if (route === "reference") return <ReferencePage />;
  if (route === "contribute") return <ContributePage />;
  return <NotFoundPage />;
}
