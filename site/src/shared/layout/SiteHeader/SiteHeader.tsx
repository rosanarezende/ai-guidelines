import { routes, type RouteId } from "@content/flowData";
import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import copy from "./locales/pt-BR.json";

import "./SiteHeader.css";

export function SiteHeader({ current }: { readonly current: RouteId }): JSX.Element {
  return (
    <header className="siteHeader">
      <SiteLink className="brand" route="home">
        {copy.brand}
      </SiteLink>
      <nav aria-label={copy.navAria}>
        {routes
          .filter((route) => route.id !== "home")
          .map((route) => (
            <SiteLink
              className={route.id === current ? "navLink isCurrent" : "navLink"}
              key={route.id}
              route={route.id}
            >
              {route.shortLabel}
            </SiteLink>
          ))}
      </nav>
    </header>
  );
}
