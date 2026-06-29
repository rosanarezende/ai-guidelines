// manifest-check.ts — CHECK (roda no pre-commit): as arestas cross-repo derivadas dos manifestos são VÁLIDAS?
// Cruza provides×consumes (deriveManifestGraph) e FALHA se algum `consumes` aponta p/ um contrato que NINGUÉM
// `provides` (typo no manifesto, ou o provedor não declarou) → senão a aresta sumiria CALADA (pior que um erro).
// Fecha a D3 ("tentativo") da deliberação do shape: arestas DERIVADAS + check anti-typo.
// Modelo: research/2026-06-29-manifest-shape-deliberation.md (Q3/D3).
import { FileHostRepository } from "./adapters/file/FileHostRepository.ts";
import { deriveManifestGraph } from "./domain/derive.ts";

const host = new FileHostRepository();
const { edges, warnings } = deriveManifestGraph(await host.listManifests());

console.log(
  `grafo cross-repo: ${edges.length} aresta(s) coordinates-with derivada(s) dos manifestos.`
);

if (warnings.length > 0) {
  console.error(
    `\n❌ ${warnings.length} aresta(s) QUEBRADA(S) (consumes sem provides correspondente):`
  );
  for (const w of warnings) console.error(`   • ${w}`);
  console.error(
    "\n→ corrija o `consumes` (typo no nome do contrato?) ou declare o `provides` no repo dono. " +
      "Uma aresta que some calada esconde acoplamento — por isso é check, não warning."
  );
  process.exit(1);
}
console.log("manifest-check: ok (nenhuma aresta quebrada).");
