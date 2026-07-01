// render-dashboards.tsx — gera os dashboards ESTÁTICOS com os MESMOS componentes React do app (Lente 5: view única).
// Lê os db.json (a data layer, gerada por `node _lib/build.ts`) → renderToStaticMarkup → escreve os dashboard.html.
// Rode:  cd _viewer && npm run dashboards   (após `node ../_lib/build.ts`).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, type ReactElement } from "react";
import { Page, RepoDashboard, MainDashboard } from "./src/dashboard/Dashboards.tsx";
import type { RepoDb, GovernanceDb } from "./src/dashboard/types.ts";

const SIM_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = <T,>(rel: string): T =>
  JSON.parse(fs.readFileSync(path.join(SIM_ROOT, rel), "utf8")) as T;
const write = (rel: string, html: string): void => {
  const abs = path.join(SIM_ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, html, "utf8");
};
const page = (el: ReactElement): string => `<!doctype html>\n${renderToStaticMarkup(el)}`;

const gov = read<GovernanceDb>("acme-governance/.cache/db.json");

// LOCAL: cada repo projeta pra dentro (o db.json é a fonte; o componente é a view compartilhada)
for (const repo of gov.repos) {
  const db = read<RepoDb>(`${repo}/.governance/.cache/db.json`);
  write(
    `${repo}/.governance/.cache/dashboard.html`,
    page(
      createElement(
        Page,
        {
          title: `${repo} — dashboard local`,
          subtitle: "auto-contido no repo · projeta PRA DENTRO · regenera com npm run dashboards",
        },
        createElement(RepoDashboard, { db })
      )
    )
  );
  console.log(`📊 local · ${repo}`);
}

// PRINCIPAL: a governança projeta a visão geral (host)
write(
  "acme-governance/.cache/dashboard.html",
  page(
    createElement(
      Page,
      {
        title: "Dashboard principal",
        subtitle: "visão geral das iniciativas (cross-repo) · regenera com npm run dashboards",
      },
      createElement(MainDashboard, { db: gov })
    )
  )
);
console.log("📊 principal · acme-governance");
