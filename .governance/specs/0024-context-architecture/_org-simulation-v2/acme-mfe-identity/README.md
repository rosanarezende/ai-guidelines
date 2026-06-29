# acme-mfe-identity

> Repo simulado (**front**, backend **sqlite** — zero infra, embarcado). O **produto** vive em `src/`; a
> **governança** vive ao lado, em `.governance/` (sidecar). Papel: MFE de identidade/login.

## Estrutura

- `src/` — o produto (mínimo na sim): `index.html` + `main.js`.
- `.governance/` — a camada de governança (papéis detalhados no README da raiz da sim):
  `manifest.yml` (face EXTERNA) · `registry/<kind>.yml` (índices) · `works/` (conteúdo) ·
  `context.json` (projeção PUBLICADA — **versionada**) · `.cache/` (read-models + `governance.db` do sqlite, gitignored) ·
  `backend.yml` (`kind: sqlite`).

## Rodar

`npm run seed` (migra `.governance/` → sqlite) · `npm run build` · `npm run dashboard`. Detalhe no README da raiz.
