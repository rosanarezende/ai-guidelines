import type { ReactNode } from "react";

import { routes } from "@content/flowData";
import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import copy from "./locales/pt-BR.json";

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
        <nav className="flowNav" aria-label={copy.navAria}>
          {routes
            .filter((route) => route.id !== "home")
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
