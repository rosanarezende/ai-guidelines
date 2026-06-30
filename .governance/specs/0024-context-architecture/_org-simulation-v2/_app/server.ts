// server.ts — backend FINO do _app. NÃO tem modelo próprio nem banco paralelo: importa a _lib e expõe sobre HTTP.
//   • lê/grava intents e proposals direto nos ARQUIVOS .governance/ (file-first, via FileHostRepository)
//   • deriva os grafos da org (conhecimento/roteamento/tags) das derivações PURAS da _lib
// Roda: node server.ts  (o frontend vite proxia /api → :5180). A _lib resolve `yaml` do node_modules da raiz do repo.
import http from "node:http";
import { FileHostRepository } from "../_lib/adapters/file/FileHostRepository.ts";
import { deriveManifestGraph } from "../_lib/domain/derive.ts";
import { deriveRouting, deriveTagGraph, LexicalMatcher } from "../_lib/domain/routing.ts";
import type { Intent, Proposal } from "../_lib/domain/model.ts";

const PORT = 5180;
const host = new FileHostRepository();

function send(res: http.ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e as Error);
      }
    });
    req.on("error", reject);
  });
}

// o grafo da ORG: o conhecimento (repos + arestas coordinates-with) + o roteamento (advisory, léxico) + o grafo repo×tag.
async function orgGraph() {
  const manifests = await host.listManifests();
  const intents = await host.listIntents();
  const matcher = new LexicalMatcher(); // advisory + determinístico (não depende de Ollama/API pra abrir a tela)
  const routing = await Promise.all(
    intents.map(async (i) => ({
      intent: i.id,
      suggestions: await deriveRouting(i, manifests, matcher),
    }))
  );
  return {
    knowledge: deriveManifestGraph(manifests),
    routing,
    tagGraph: deriveTagGraph(manifests),
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    const path = url.pathname.replace(/^\/api/, "") || "/";
    const method = req.method ?? "GET";
    if (method === "OPTIONS") return send(res, 204, {});

    // ── intents ──
    if (path === "/intents" && method === "GET") return send(res, 200, await host.listIntents());
    if (path === "/intents" && method === "POST") {
      const b = (await readBody(req)) as Intent;
      await host.saveIntent(b);
      return send(res, 201, b);
    }
    const mIntent = path.match(/^\/intents\/([^/]+)$/);
    if (mIntent) {
      const id = decodeURIComponent(mIntent[1]);
      if (method === "GET") {
        const i = await host.getIntent(id);
        return i ? send(res, 200, i) : send(res, 404, { error: `intent "${id}" não encontrada` });
      }
      if (method === "PUT") {
        const b = (await readBody(req)) as Intent;
        const merged = { ...b, id };
        await host.saveIntent(merged);
        return send(res, 200, merged);
      }
    }

    // ── proposals ──
    if (path === "/proposals" && method === "GET")
      return send(res, 200, await host.listProposals());
    if (path === "/proposals" && method === "POST") {
      const b = (await readBody(req)) as Proposal;
      await host.saveProposal(b);
      return send(res, 201, b);
    }
    const mProp = path.match(/^\/proposals\/([^/]+)$/);
    if (mProp) {
      const id = decodeURIComponent(mProp[1]);
      if (method === "GET") {
        const p = (await host.listProposals()).find((x) => x.id === id);
        return p ? send(res, 200, p) : send(res, 404, { error: `proposta "${id}" não encontrada` });
      }
      if (method === "PUT") {
        const b = (await readBody(req)) as Proposal;
        const merged = { ...b, id };
        await host.saveProposal(merged);
        return send(res, 200, merged);
      }
    }

    // ── org (read-only, derivado) ──
    if (path === "/repos" && method === "GET") return send(res, 200, await host.listRepos());
    if (path === "/manifests" && method === "GET")
      return send(res, 200, await host.listManifests());
    if (path === "/graph" && method === "GET") return send(res, 200, await orgGraph());

    return send(res, 404, { error: `sem rota: ${method} ${path}` });
  } catch (e) {
    return send(res, 500, { error: (e as Error).message });
  }
});

server.listen(PORT, () =>
  console.log(
    `🗂️  _app server em http://localhost:${PORT} — lê/grava .governance/ via _lib (file-first)`
  )
);
