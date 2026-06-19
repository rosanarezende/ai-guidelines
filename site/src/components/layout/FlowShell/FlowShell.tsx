import type { ReactNode } from "react";

import { routes } from "../../../flowData";
import { SiteLink } from "../../common/SiteLink/SiteLink";

import "./FlowShell.css";

export function FlowShell({
  children,
  eyebrow,
  lead,
  title,
}: {
  readonly children: ReactNode;
  readonly eyebrow: string;
  readonly lead: string;
  readonly title: string;
}): JSX.Element {
  return (
    <>
      <section className="flowHero">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
        <nav className="flowNav" aria-label="Áreas do flow">
          {routes
            .filter((route) => route.id !== "home" && route.id !== "flow")
            .map((route) => (
              <SiteLink key={route.id} route={route.id}>
                {route.label}
              </SiteLink>
            ))}
        </nav>
      </section>
      {children}
    </>
  );
}
