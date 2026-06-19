import { useEffect } from "react";

import { ActivePage } from "./components/layout/ActivePage/ActivePage";
import { SiteFooter } from "./components/layout/SiteFooter/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader/SiteHeader";
import { routeTitle, type RouteId } from "./flowData";
import { useRoute } from "./hooks/useRoute";

export function App(): JSX.Element {
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
        Pular para o conteúdo
      </a>
      <SiteHeader current={route} />
      <main id="conteudo">
        <ActivePage route={route} />
      </main>
      <SiteFooter />
    </>
  );
}
