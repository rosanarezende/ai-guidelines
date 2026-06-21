import { useEffect } from "react";

import { routeTitle, type RouteId } from "@content/flowData";
import { useRoute } from "@app/routing/hooks/useRoute";
import { ActivePage } from "@app/routing/ActivePage/ActivePage";
import { SiteFooter } from "@shared/layout/SiteFooter/SiteFooter";
import { SiteHeader } from "@shared/layout/SiteHeader/SiteHeader";
import copy from "./locales/pt-BR.json";

export function AppShell(): JSX.Element {
  const [route, navigate] = useRoute();

  useEffect(() => {
    const handler = (event: Event) => navigate((event as CustomEvent<RouteId>).detail);
    window.addEventListener("site:navigate", handler);
    return () => window.removeEventListener("site:navigate", handler);
  }, [navigate]);

  useEffect(() => {
    document.title = routeTitle(route);
  }, [route]);

  return (
    <>
      <a className="skipLink" href="#conteudo">
        {copy.skipLink}
      </a>
      <SiteHeader current={route} />
      <main id="conteudo">
        <ActivePage route={route} />
      </main>
      <SiteFooter />
    </>
  );
}
