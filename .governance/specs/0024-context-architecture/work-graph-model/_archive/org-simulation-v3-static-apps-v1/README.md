# Org simulation v3 static apps v1

Arquivo histórico dos protótipos estáticos F3/F4 da sim v3.

## Conteúdo

- `_apps/owner/`: protótipo React UMD + Cytoscape para navegar o grafo inteiro.
- `_apps/company/`: protótipo React UMD para perfis de governança e dashboards derivados.
- `_apps/vendor/`: dependências UMD vendorizadas usadas pelos protótipos estáticos.
- `_apps/graph.js`: projeção gerada usada pelos protótipos.
- `_tools/build-graph.mjs`: gerador legado de `graph.js`.
- `_tools/check-app-security.mjs`: check legado de vendor hash + CSP dos protótipos.

## Estado

Não é a superfície ativa do produto. A superfície ativa é:

- `_org-simulation-v3/_apps/governance-next/`

O runtime ativo da sim v3 fica em:

- `_org-simulation-v3/_lib/`
- `_org-simulation-v3/_tools/`

O arquivo existe para preservar aprendizado visual e decisões de supply chain dos protótipos
sem confundir o dogfood atual. `check-governance-app.mjs` e `test-adversarial.mjs` falham se
`owner`, `company`, `vendor`, `graph.js`, `build-graph.mjs` ou `check-app-security.mjs`
voltarem para a superfície ativa da v3.
