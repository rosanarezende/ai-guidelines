import { useEffect, useMemo, useState } from "react";

import { routeFromPath, routePath, type RouteId } from "@content/flowData";

export function useRoute(): [RouteId, (route: RouteId) => void] {
  const initialRoute = useMemo(() => routeFromPath(window.location.pathname), []);
  const [route, setRoute] = useState<RouteId>(initialRoute);

  function navigate(nextRoute: RouteId): void {
    window.history.pushState({}, "", routePath(nextRoute));
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    const handlePopState = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return [route, navigate];
}
