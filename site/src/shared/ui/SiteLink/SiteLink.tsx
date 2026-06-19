import type { ReactNode } from "react";

import { routePath, type RouteId } from "@content/flowData";

export function SiteLink({
  children,
  className,
  route,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly route: RouteId;
}): JSX.Element {
  return (
    <a
      className={className}
      href={routePath(route)}
      onClick={(event) => {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("site:navigate", { detail: route }));
      }}
    >
      {children}
    </a>
  );
}
