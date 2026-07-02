# Org simulada v3 — a acme de ponta a ponta (a "virada de chave")

> **O que é:** a org-exemplo da P12 (acme — 2 objetivos · 2 áreas · 5 times · 10 repos · 3 contratos · 3 intents · 3 reativos) instanciada como **arquivos de verdade**, com **validador executável** (o começo do resolver da P11) e **apps dedicados** de visualização/iteração. Decidida pela owner em 2026-07-02: "quero começar a validar de ponta a ponta".
>
> **Autoridade:** o MODELO mora em [`../model.yml`](../model.yml) (SSOT; a P12 segue `proposed`). Esta sim **valida** o modelo — quando a sim contradiz o modelo, ou se corrige a sim, ou se abre provocação no modelo. Substitui a `_org-simulation-v2` como frente ativa (a v2 fica até decisão de arquivamento).

## O plano ponta-a-ponta (fases)

| fase | entrega                                                                                                                                                                                                                                              | status |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| F0   | fechar a fase de iteração do flow-explorer (commit selado)                                                                                                                                                                                           | ✅     |
| F1   | **a org file-first** — `acme/` com camada de negócio dedicada (`business/`), `contracts/`, `repos/`, `intents/`, `standalone/`, `outcomes/` + `_templates/` (rascunhos v3, pendentes do gate da P12)                                                 | ✅     |
| F2   | **ferramentas** — `_tools/build-graph.mjs` (org → `_apps/graph.js`: nós+arestas tipados) e `_tools/validate.mjs` (lints executáveis: refs, sinal×contrato, review derivado, deps, regra de ouro…) — _o primeiro mecanismo real da barra do red-team_ | ✅     |
| F3   | **app da owner** — `_apps/owner/` (React UMD + Cytoscape): o grafo INTEIRO navegável — zoom/pan, clique, filtros por tipo, painel de detalhes, lista de issues do validador (achar erro → clicar → corrigir no YAML → regenerar)                     | ✅     |
| F4   | **app das empresas** — `_apps/company/` : a mesma org vista pelos **perfis de governança** (grande=full · média=compact · solo) + os 2 dashboards derivados (acompanhamento e stakeholders)                                                          | ✅     |
| F5   | **rodada Codex** — revisão adversarial da v3 + do plano (prompt gerado quando a owner disparar)                                                                                                                                                      | ⬜     |
| F6   | iterar: outcomes reais publicados → resolver valida → dashboards; depois decidir o destino da `_org-simulation-v2` e a promoção da P12 no model.yml                                                                                                  | ⬜     |

## Como rodar

```bash
cd _org-simulation-v3
node _tools/validate.mjs        # lints da org (exit 1 se houver ERRO)
node _tools/build-graph.mjs     # regenera _apps/graph.js (grafo + issues embutidos)
# abrir _apps/owner/index.html e _apps/company/index.html no navegador
```

## O loop de iteração (o ponto da v3)

1. Editar os YAML de `acme/` (ou pedir ao Claude) — o SSOT da sim é o arquivo.
2. `node _tools/validate.mjs` → os erros aparecem (e também dentro do app da owner).
3. `node _tools/build-graph.mjs` → os apps refletem.
4. O que a sim provar que está errado NO MODELO vira provocação no `model.yml`.

## Decisões de desenho (v1)

- **File-first, um YAML por conceito** (`objectives.yml`, `teams.yml`…) — a divisão por entidade/pasta vem quando plugar os adapters da lib (padrão da v2).
- **Apps sem build** (React UMD + htm + Cytoscape UMD via CDN) — mesmíssimo padrão do `_map/`; iteração sem toolchain.
- **`graph.js` gerado** (window.GRAPH) em vez de fetch — `file://` não deixa fetch; mesmo truque do `data.js`.
- O validador implementa **um subconjunto honesto** das regras da P10/P11/P12 (está listado nele); o resolver completo do outcome entra quando os primeiros outcomes forem publicados (F6).
