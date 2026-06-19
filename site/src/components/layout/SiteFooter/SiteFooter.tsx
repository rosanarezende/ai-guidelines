import { SiteLink } from "../../common/SiteLink/SiteLink";

import "./SiteFooter.css";

export function SiteFooter(): JSX.Element {
  return (
    <footer className="siteFooter">
      <p>ai-guidelines — governança de IA multi-agente, agnóstica de modelo, IDE e linguagem.</p>
      <div className="footerLinks">
        <SiteLink route="flow">Como funciona</SiteLink>
        <SiteLink route="reference">Referência</SiteLink>
        <SiteLink route="contribute">Contribuindo</SiteLink>
        <a href="https://github.com/rosanarezende/ai-guidelines">GitHub</a>
        <a href="https://www.npmjs.com/package/ai-guidelines">npm</a>
      </div>
    </footer>
  );
}
