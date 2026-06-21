import { readFileSync } from "node:fs";
import path from "node:path";

import { FEATURE_OPTIONS } from "../../domain/provisioning/FeatureCatalog.js";
import { getSupportedProviders } from "../../domain/provisioning/ProviderCatalog.js";
import { buildRegistry } from "../registry/buildRegistry.js";
import { siteCommandSurface, siteFlowCopyPayload } from "../siteFlowCopy.js";

/**
 * Guard de fidelidade do site (fecha B1 — "site não pode mentir").
 *
 * Duas direções:
 *  1. PROJEÇÃO fiel: o que o gerador exporta == o runtime real (registry +
 *     catálogos). Sem isto, o site consumiria uma 2ª fonte de verdade.
 *  2. USO fiel: todo comando/provider/feature que o SITE exibe existe no
 *     runtime. Falsificação: `npm run flow -- comando-inexistente` no site
 *     quebra este teste.
 */

const REPO_ROOT = process.cwd();

interface PayloadShape {
  readonly commands: ReadonlyArray<{ readonly name: string }>;
  readonly catalogs: {
    readonly providers: readonly string[];
    readonly features: readonly string[];
  };
  readonly providers: Readonly<Record<string, unknown>>;
  readonly features: Readonly<Record<string, unknown>>;
}

function readSite(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf-8");
}

/**
 * Extrai tokens de comando que o SITE afirma existir: as chamadas derivadas
 * `flowCommand("x")`/`binCommand("x")` e quaisquer invocações literais
 * `npm run flow -- x` / `npx ai-guidelines x`. URLs (`package/ai-guidelines`) e
 * a invocação nua do wizard não casam (exigem ` ` + verbo após o prefixo).
 */
function siteCommandTokens(source: string): Set<string> {
  const tokens = new Set<string>();
  for (const match of source.matchAll(/\b(?:flowCommand|binCommand)\(\s*"([a-z][a-z-]*)"/g)) {
    tokens.add(match[1]);
  }
  for (const match of source.matchAll(/npm run flow --\s+([a-z][a-z-]+)/g)) {
    tokens.add(match[1]);
  }
  for (const match of source.matchAll(/npx ai-guidelines\s+([a-z][a-z-]+)/g)) {
    tokens.add(match[1]);
  }
  return tokens;
}

describe("projeção da superfície de comandos == runtime real", () => {
  it("exporta exatamente os comandos canônicos do registry", () => {
    const projected = siteCommandSurface().map((command) => command.name);
    const registry = [...buildRegistry().commandNames()];
    expect([...projected].sort()).toEqual([...registry].sort());
  });

  it("exporta a enumeração canônica de providers e features", () => {
    const payload = siteFlowCopyPayload() as PayloadShape;
    expect([...payload.catalogs.providers].sort()).toEqual([...getSupportedProviders()].sort());
    expect([...payload.catalogs.features].sort()).toEqual([...FEATURE_OPTIONS].sort());
  });

  it("descreve cada provider e feature do catálogo com copy humana", () => {
    const payload = siteFlowCopyPayload() as PayloadShape;
    for (const provider of getSupportedProviders()) {
      expect(payload.providers[provider]).toBeDefined();
    }
    for (const feature of FEATURE_OPTIONS) {
      expect(payload.features[feature]).toBeDefined();
    }
  });
});

describe("o site só exibe comandos que existem no runtime (B1)", () => {
  const sources = ["site/src/content/flowData.ts", "site/src/app/App.tsx"];
  const registryNames = new Set(buildRegistry().commandNames());

  for (const relativePath of sources) {
    it(`${relativePath} não referencia comando inexistente`, () => {
      const tokens = siteCommandTokens(readSite(relativePath));
      const unknown = [...tokens].filter((token) => !registryNames.has(token));
      expect(unknown).toEqual([]);
    });

    it(`${relativePath} não trata "providers" como comando`, () => {
      // `providers` é seleção visual, nunca um verbo (o dispatch o rejeita).
      expect(siteCommandTokens(readSite(relativePath)).has("providers")).toBe(false);
    });
  }

  it("a referência de comandos humanos cobre apenas comandos reais", () => {
    const tokens = siteCommandTokens(readSite("site/src/content/flowData.ts"));
    // sanity: a jornada/refa derivada de fato exercita comandos conhecidos.
    expect(tokens.has("init")).toBe(true);
    expect(tokens.has("adopt")).toBe(true);
    expect(tokens.has("peer-review")).toBe(true);
  });
});
