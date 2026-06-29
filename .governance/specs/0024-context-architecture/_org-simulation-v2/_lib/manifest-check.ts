// manifest-check.ts — CHECKS do manifesto (rodam no pre-commit). Dois invariantes da camada de CONHECIMENTO:
//  (1) ANTI-TYPO das arestas cross-repo: um `consumes` tem que casar com um `provides` real — senão a aresta some
//      CALADA. Fecha a D3 ("derivada + escape hatch + CHECK").
//  (2) FRESHNESS do `architecture`: cada lib do `architecture.stack` tem que existir nas deps do package.json
//      (anti-staleness — "metadado envelhece"). Fecha a D2. Linguagem/runtime/markup são ISENTOS (não são deps npm).
// Modelo: research/2026-06-29-manifest-shape-deliberation.md (Q2/D2 · Q3/D3).
import fs from "node:fs";
import path from "node:path";
import { FileHostRepository } from "./adapters/file/FileHostRepository.ts";
import { SIM_ROOT, exists } from "./adapters/file/io.ts";
import { deriveManifestGraph } from "./domain/derive.ts";

const host = new FileHostRepository();
const manifests = await host.listManifests();

// (1) ANTI-TYPO das arestas cross-repo
const { edges, warnings } = deriveManifestGraph(manifests);
console.log(
  `grafo cross-repo: ${edges.length} aresta(s) coordinates-with derivada(s) dos manifestos.`
);

// (2) FRESHNESS do architecture (stack vs package.json): toda lib declarada tem que existir como dependência
const EXEMPT = new Set([
  "node",
  "deno",
  "bun",
  "html",
  "css",
  "js",
  "javascript",
  "typescript",
  "ts",
  "json",
  "yaml",
  "sql",
]); // linguagem/runtime/markup — não são pacotes npm, não se validam contra deps
const stale: string[] = [];
for (const m of manifests) {
  const stack = m.architecture?.stack ?? [];
  if (stack.length === 0) continue;
  const pkgRel = `${m.repo}/package.json`;
  if (!exists(pkgRel)) {
    console.warn(`⚠️  ${m.repo}: sem package.json — architecture não verificada.`);
    continue;
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(SIM_ROOT, pkgRel), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const deps = new Set(
    [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})].map((d) =>
      d.toLowerCase()
    )
  );
  for (const tech of stack) {
    if (EXEMPT.has(tech.toLowerCase())) continue;
    if (!deps.has(tech.toLowerCase()))
      stale.push(
        `${m.repo}: architecture.stack declara "${tech}", mas o package.json não depende disso (stack stale? lib trocada/removida?).`
      );
  }
}

// veredito
let failed = false;
if (warnings.length > 0) {
  console.error(
    `\n❌ ${warnings.length} aresta(s) QUEBRADA(S) (consumes sem provides correspondente):`
  );
  for (const w of warnings) console.error(`   • ${w}`);
  failed = true;
}
if (stale.length > 0) {
  console.error(`\n❌ ${stale.length} stack(s) STALE (architecture diverge do package.json):`);
  for (const s of stale) console.error(`   • ${s}`);
  failed = true;
}
if (failed) {
  console.error(
    "\n→ corrija o manifesto (typo no consumes · lib removida do stack) ou o package.json. " +
      "Metadado de conhecimento não pode envelhecer calado — por isso é check, não doc passiva."
  );
  process.exit(1);
}
console.log("manifest-check: ok (arestas íntegras + architecture fresco).");
