# acme-design-system

> Repo simulado (**front**, backend **file**). O **produto** vive em `src/`; a **governança** vive ao lado, em
> `.governance/` (sidecar). Papel: design system — componentes de UI compartilhados (form, inputs, tema).

## Estrutura

- `src/` — o produto (mínimo na sim): `index.html` + `main.js`.
- `.governance/` — a camada de governança (papéis detalhados no README da raiz da sim):
  `manifest.yml` (a face EXTERNA — o host descobre o repo por aqui) · `registry/<kind>.yml` (índices) ·
  `works/`·`explorations/` (conteúdo) · `context.json` (projeção PUBLICADA — **versionada**, é o contrato) ·
  `.cache/` (read-models db.json/dashboard.html, gitignored) · `backend.yml` (banco; ausente = **file**).

## Rodar

`npm run build` (publica `context.json` + agrega) · `npm run dashboard` (build + view). Detalhe no README da raiz.
