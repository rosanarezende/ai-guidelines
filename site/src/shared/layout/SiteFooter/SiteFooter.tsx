import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import copy from "./locales/pt-BR.json";

import "./SiteFooter.css";

export function SiteFooter(): JSX.Element {
  return (
    <footer className="siteFooter">
      <p>{copy.tagline}</p>
      <div className="footerLinks">
        <SiteLink route="home">{copy.links.home}</SiteLink>
        <SiteLink route="reference">{copy.links.reference}</SiteLink>
        <SiteLink route="contribute">{copy.links.contribute}</SiteLink>
        <a href="https://github.com/rosanarezende/ai-guidelines">{copy.links.github}</a>
        <a href="https://www.npmjs.com/package/ai-guidelines">{copy.links.npm}</a>
      </div>
    </footer>
  );
}
