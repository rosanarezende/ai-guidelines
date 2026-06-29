// scaffold.ts — cria um NOVO repo simulado com o PADRÃO da governança (o PRODUTO em src/ + a GOVERNANÇA em .governance/).
// Uso:  node scaffold.ts <repo-name> <front|back> ["papel do repo"] [file|sqlite|neo4j|mongo]
// Gera: package.json · .gitignore · README.md · src/{index.html|index.js} · .governance/{manifest.yml · backend.yml · registry/.gitkeep}
// O host AUTO-DESCOBRE o repo (tem .governance/registry/). Edite o manifest + registry e rode `node _lib/build.ts`.
// (É o que viabiliza criar repos novos durante a simulação — padrão único, adoção fácil do framework.)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SIM_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [name, type = "front", role = "<o que este repo É, em 1 linha>", backend = "file"] =
  process.argv.slice(2);

if (!name || (type !== "front" && type !== "back")) {
  console.error(
    'uso: node scaffold.ts <repo-name> <front|back> ["papel"] [file|sqlite|neo4j|mongo]'
  );
  process.exit(1);
}
const dir = path.join(SIM_ROOT, name);
if (fs.existsSync(dir)) {
  console.error(`✗ ${name} já existe.`);
  process.exit(1);
}

const w = (rel: string, content: string): void => {
  const abs = path.join(dir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
};

// ── o PRODUTO (src/) — código mínimo, só pra entender o fluxo ──
if (type === "front")
  w(
    "src/index.html",
    `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${name}</title>
  </head>
  <body>
    <!-- o PRODUTO mora aqui (src/). A GOVERNANÇA vive ao lado, em .governance/ (sidecar, fora do código). -->
    <main id="app">${name} — front</main>
    <script type="module" src="./main.js"></script>
  </body>
</html>
`
  );
else
  w(
    "src/index.js",
    `// o PRODUTO mora aqui (src/). A GOVERNANÇA vive ao lado, em .governance/ (sidecar, fora do código).
// ${name} — back/host: aqui rodaria o servidor (ex.: compõe os MFEs / serve a API).
console.log("${name} — back/host up");
`
  );
if (type === "front")
  w("src/main.js", `// entry mínimo do ${name}\nconsole.log("${name} ready");\n`);

// ── a GOVERNANÇA (.governance/) — o sidecar ──
w(
  ".governance/manifest.yml",
  `# manifest.yml — a auto-declaração (camada EXTERNA): o host descobre o repo por aqui e DERIVA as arestas.
node: manifest
repo: ${name}
role: "${role}"
owner: team-<dono>
domain: <bounded context>

provides: [] # contratos que este repo OFERECE — { name, kind: component|api|event|service, status }
consumes: [] # contratos de OUTROS repos — { contract: "<repo>/<nome>", awaits? }
capabilities: [] # o que o repo SABE fazer (semântico → roteia exploration)
architecture:
  stack: [${type === "front" ? "html, js" : "node"}]
  patterns: []

references: []
created-at: ${new Date().toISOString().slice(0, 10)}
updated-at: ${new Date().toISOString().slice(0, 10)}
`
);
if (backend !== "file")
  w(
    ".governance/backend.yml",
    `# backend.yml — qual banco este repo usa pros seus INTERNOS (ausente = file). file/sqlite = zero infra; neo4j/mongo = Docker.
kind: ${backend}
`
  );
w(".governance/registry/.gitkeep", "");

// ── repo files (gitignore · readme · package.json) ──
w(
  ".gitignore",
  `# governança — derivados regeneráveis (a FONTE é o .governance/ source; o context.json é VERSIONADO = contrato)
.governance/.cache/
.governance/*.db
# produto
node_modules/
dist/
build/
`
);
w(
  "README.md",
  `# ${name}

> Repo simulado (**${type}**, backend **${backend}**). O **produto** vive em \`src/\`; a **governança** vive ao
> lado, em \`.governance/\` (sidecar). Criado via \`node _lib/scaffold.ts ${name} ${type}\`.

## Estrutura

- \`src/\` — o produto (mínimo na sim).
- \`.governance/\` — a camada de governança (ver papéis no README da raiz da sim):
  \`manifest.yml\` (face externa) · \`registry/<kind>.yml\` (índices) · \`works/\`·\`explorations/\` (conteúdo) ·
  \`context.json\` (projeção PUBLICADA — versionada) · \`.cache/\` (read-models, gitignored) · \`backend.yml\` (banco).

## Rodar

\`npm run build\` (publica + agrega) · \`npm run dashboard\` (build + view). Detalhe no README da raiz.
`
);
w(
  "package.json",
  `${JSON.stringify(
    {
      name,
      private: true,
      description: `Repo simulado (${type}). Produto em src/ + governança em .governance/.`,
      scripts: {
        dev: [
          backend === "neo4j" ? "npm run db:up" : null,
          backend !== "file" ? "npm run seed" : null,
          "npm run dashboard",
        ]
          .filter(Boolean)
          .join(" && "), // "roda o repo por completo": [db:up] + [seed] + build + view
        ...(backend === "neo4j"
          ? { "db:up": "docker compose up -d --wait", "db:down": "docker compose down" }
          : {}),
        ...(backend !== "file" ? { seed: `node ../_lib/seed.ts ${name}` } : {}),
        build: "node ../_lib/build.ts",
        dashboard: "node ../_lib/build.ts && npm --prefix ../_viewer run dashboards",
      },
    },
    null,
    2
  )}\n`
);

console.log(
  `✓ ${name} criado (${type}, backend ${backend}).\n` +
    `  Próximo: edite .governance/manifest.yml + registry/<kind>.yml e rode 'node _lib/build.ts'.`
);
