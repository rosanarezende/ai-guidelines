// build.ts — o RUNNER, em DUAS FASES desacopladas (Lente 5 · "banco→banco"):
//   FASE 1 (PUBLICAR): cada repo, com o SEU backend, deriva e PUBLICA sua projeção externa (context.json) + o db.json interno.
//   FASE 2 (AGREGAR):  o host lê os context.json PUBLICADOS (SEM abrir banco nenhum) + intents + manifestos → a governança.
// Assim, desenvolver a intent/governança NÃO exige subir os bancos dos repos — só LER as projeções publicadas.
// (detalhe + espectro solo→enterprise: research/2026-06-29-governance-aggregates-published-projections.md)
import fs from "node:fs";
import path from "node:path";
import { FileHostRepository } from "./adapters/file/FileHostRepository.ts";
import { SIM_ROOT, exists } from "./adapters/file/io.ts";
import { openRepository, backendOf } from "./backend.ts";
import {
  deriveDeliberation,
  deriveContext,
  deriveGovernance,
  deriveManifestGraph,
} from "./domain/derive.ts";
import { deriveRouting, deriveTagGraph } from "./domain/routing.ts";
import { loadMatcher } from "./matcher.ts";
import type { RepoContext, DeliberationView, GovernanceView } from "./domain/derive.ts";
import type { Work, Proposal } from "./domain/model.ts";

function writeDb(rel: string, data: unknown): void {
  const abs = path.join(SIM_ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
function readJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(SIM_ROOT, rel), "utf8")) as T;
}

const host = new FileHostRepository();
const repos = await host.listRepos();

// ───────────────────────── FASE 1 · PUBLICAR (cada repo usa o SEU backend) ─────────────────────────
for (const repoName of repos) {
  const { repo: r, close } = openRepository(repoName); // backend do repo (file/sqlite/neo4j/mongo)
  try {
    const works = await r.listWorks();
    const explorations = await r.listExplorations();

    const worksWithDelib: (Work & { deliberation: DeliberationView | null })[] = [];
    for (const w of works) {
      const [qs, rs, ds] = [
        await r.listQuestions(w.id),
        await r.listResearches(w.id),
        await r.listDecisions(w.id),
      ];
      const deliberation =
        qs.length > 0 || ds.length > 0
          ? deriveDeliberation(`${repoName}/${w.kind}/${w.id}`, qs, rs, ds)
          : null;
      worksWithDelib.push({ ...w, deliberation });
    }

    // INTERNO (cache: read-model auto-contido no repo) — vai pro .cache/ (regenerável, gitignored):
    writeDb(`${repoName}/.governance/.cache/db.json`, {
      repo: repoName,
      generatedAt: new Date().toISOString(),
      works: worksWithDelib,
      explorations,
    });
    // EXTERNO (a projeção PUBLICADA — o que o host agrega; portátil, backend-agnóstica):
    writeDb(`${repoName}/.governance/context.json`, deriveContext(repoName, works, explorations));
    console.log(
      `📤 ${repoName} publicou context.json (${works.length} works, ${explorations.length} exploration) [backend: ${backendOf(repoName)}]`
    );
  } catch (e) {
    console.warn(
      `⚠️  ${repoName} [${backendOf(repoName)}]: backend fora — NÃO republicou (o host usa o context.json anterior, se houver) — ${(e as Error).message.slice(0, 50)}`
    );
  } finally {
    await close();
  }
}

// ───────────────────────── FASE 2 · AGREGAR (o host lê os context.json PUBLICADOS — SEM abrir banco) ──────────────
const publishedContexts: RepoContext[] = [];
for (const repoName of repos) {
  const rel = `${repoName}/.governance/context.json`;
  if (exists(rel)) publishedContexts.push(readJson<RepoContext>(rel));
  else
    console.warn(
      `⚠️  ${repoName} ainda não publicou context.json — rode o build do repo com o backend no ar 1x (depois agrega offline)`
    );
}

const intents = await host.listIntents();
const proposals: Proposal[] = await host.listProposals();
const governance: GovernanceView[] = intents.map((intent) =>
  deriveGovernance(intent, publishedContexts)
);
const manifests = await host.listManifests();
const knowledge = deriveManifestGraph(manifests);
const { matcher, label: matcherLabel } = loadMatcher(); // Q2: léxico default; ollama-embed (LLM local) via matcher.yml
const routing = await Promise.all(
  intents.map(async (intent) => ({
    intent: intent.id,
    suggestions: await deriveRouting(intent, manifests, matcher),
  }))
);
const tagGraph = deriveTagGraph(manifests);

writeDb("acme-governance/.cache/db.json", {
  generatedAt: new Date().toISOString(),
  governance,
  repos,
  proposals,
  knowledge,
  routing,
  tagGraph,
});
console.log(
  `🗃️  acme-governance/db.json — AGREGOU ${publishedContexts.length}/${repos.length} projeções publicadas (SEM abrir banco) · ` +
    `${governance.length} intent, ${knowledge.edges.length} arestas cross-repo · matcher: ${matcherLabel}\n📊 view: cd _viewer && npm run dashboards`
);
for (const w of knowledge.warnings) console.warn(`⚠️  manifesto: ${w}`);
