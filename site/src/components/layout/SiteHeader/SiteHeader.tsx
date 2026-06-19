import { routes, type RouteId } from "../../../flowData";
import { SiteLink } from "../../common/SiteLink/SiteLink";

import "./SiteHeader.css";

export function SiteHeader({ current }: { readonly current: RouteId }): JSX.Element {
  return (
    <header className="siteHeader">
      <SiteLink className="brand" route="home">
        ai-guidelines
      </SiteLink>
      <nav aria-label="Navegação principal">
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
