# acme-mfe-support

> Repo simulado (**front**, backend **neo4j** — grafo, via Docker). O **produto** vive em `src/`; a **governança**
> vive ao lado, em `.governance/` (sidecar). Papel: MFE de suporte (ajuda sob demanda e proativa).

## Estrutura

- `src/` — o produto (mínimo na sim): `index.html` + `main.js`.
- `.governance/` — a camada de governança (papéis detalhados no README da raiz da sim):
  `manifest.yml` (face EXTERNA) · `registry/<kind>.yml` (índices) · `works/`·`explorations/` (conteúdo) ·
  `context.json` (projeção PUBLICADA — **versionada**) · `.cache/` (read-models, gitignored) · `backend.yml` (`kind: neo4j`).

## Rodar

`npm run db:up` (sobe o Neo4j) · `npm run seed` (migra → grafo) · `npm run build` · `npm run dashboard` · `npm run db:down`.
Detalhe no README da raiz. _(o host AGREGA o `context.json` publicado mesmo com o Neo4j fora — publique 1x com o banco no ar.)_
