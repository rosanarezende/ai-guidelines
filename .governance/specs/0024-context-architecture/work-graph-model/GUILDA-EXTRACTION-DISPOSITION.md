# Guilda extraction disposition

> **Status:** disposicao operacional da extracao de Guilda a partir da Spec 0024.
> **Data:** 2026-07-09.
> **Escopo:** separar o produto vivo Guilda do historico incubado em
> `work-graph-model/governance-demo`.

## Base factual

- Repo atual: `ai-guidelines`.
- Branch da disposicao: `feat/spec-0024-artifact-taxonomy-and-model-review-contract`.
- HEAD observado antes da disposicao: `d2dcd575`.
- PR ativo observado: `#45`, draft, `mergeStateStatus: CLEAN`.
- Produto extraido: Guilda.
- Repo vivo do produto: `git@github.com:rosanarezende/guilda.git`.
- HEAD observado no repo Guilda durante esta disposicao: `2f18cabf`.
- Caminho historico arquivado neste repo:
  [`_archive/guilda-incubation-2026-07/`](_archive/guilda-incubation-2026-07/).
- Caminho antigo mantido como tombstone:
  [`governance-demo/README.md`](governance-demo/README.md).
- Matriz de preservacao QRD -> checkpoint:
  [`GUILDA-QRD-PRESERVATION-MATRIX.md`](GUILDA-QRD-PRESERVATION-MATRIX.md).

## Decisao operacional

`governance-demo/` deixou de ser workspace vivo do `ai-guidelines`.

O conteudo que estava nesse caminho agora tem dois destinos distintos:

1. **Produto vivo:** continua no repo irmao `guilda`, onde serao desenvolvidos
   Guilda Governance, `guilda flow`, Guilda Host, Guilda Workgraph e Guilda Cup.
2. **Evidencia historica:** permanece arquivada neste repo em
   `_archive/guilda-incubation-2026-07/`, para preservar a trilha da Spec 0024,
   pesquisas, QRDs, spikes, testes e implementacoes que originaram o produto.

## Por que o `work-graph-model` existiu aqui

O `work-graph-model` nao nasceu como produto separado. Ele foi criado dentro da
Spec 0024 como **laboratorio governado de modelagem** para responder uma
pergunta do proprio framework `ai-guidelines`: como representar trabalho,
decisoes, evidencias, responsabilidades, repositorios, contratos, outcomes,
revisoes e gates como um grafo tipado, derivavel e auditavel sem transformar
banco, UI ou IA em segunda fonte da verdade.

Por isso, antes da extracao para Guilda, esta frente acumulou mais do que uma
demo:

- `model.yml`: contrato conceitual do grafo de trabalho e das relacoes
  derivadas;
- research e pre-coding reviews: raciocinio de modelo, alternativas rejeitadas,
  decisoes abertas e criterio de evolucao;
- tracker e features: lentes do modelo, validacao ponta-a-ponta e divisao entre
  modelo completo e implementacao faseada;
- catalogo de integracoes: mapa de onde sistemas externos entram como evidence
  providers, importers, projections ou assistant channels;
- simulacao Acme: fixture historica para testar fluxo repo-first, file-first,
  sidecars, outcomes, contratos, incidentes e repos governados;
- runtime/app incubados: prova de que o modelo poderia virar experiencia
  operavel, que depois evoluiu para o produto Guilda.

Apagar esse material perderia informacao valiosa da Spec 0024: o motivo de cada
fronteira, o que foi provado, o que foi rejeitado, quais riscos apareceram no
dogfood e por que Guilda deve continuar separado do framework.

## Relacao com o checkpoint atual

O checkpoint ativo do `ai-guidelines` e
`artifact-taxonomy-and-model-review-contract` (PR #45). Ele se propoe a fechar
contratos do **framework**, nao validar a v1 do produto Guilda:

- taxonomia de artefatos (`artifact-kind` / natureza governada dos documentos);
- contrato de `pre-coding-review` / model-review antes de implementar;
- `research-index` e promocao controlada de research madura;
- distincao entre fonte autoritativa, projecao, evidencia historica e arquivo;
- fechamento de debito silencioso conforme GG-0005.

O `work-graph-model` continua relevante para esse checkpoint porque e o caso de
dogfood que revelou a necessidade desses contratos: ele misturou research,
pre-coding review, decisao, mapa, simulacao, app, testes e produto nascente ate
ficar claro que cada artefato precisava de natureza, autoridade e disposicao.

Portanto, a extracao tem duas obrigacoes simultaneas:

1. **nao carregar Guilda como produto ativo no PR #45**;
2. **nao perder o historico que justifica a taxonomia e o model-review da
   Spec 0024**.

A matriz [`GUILDA-QRD-PRESERVATION-MATRIX.md`](GUILDA-QRD-PRESERVATION-MATRIX.md)
cumpre a segunda obrigacao: ela mapeia as QRDs arquivadas de Guilda para a
taxonomia de artefatos, a fronteira de autoridade e o plano de fechamento do
checkpoint atual.

## Fronteira de autoridade

### `ai-guidelines`

Continua sendo o framework/CLI repo-first que governa especificacoes,
checkpoints, gates, handoffs, revisoes, artifact taxonomy, model-review e
governanca de engenharia.

Este repo pode continuar mantendo:

- `model.yml` como modelo conceitual do work graph;
- research e reviews que explicam a origem do modelo;
- catalogos e mapas derivados usados pela Spec 0024;
- referencias historicas ao produto que nasceu da spec.

Este repo **nao** deve mais:

- buildar Guilda;
- rodar testes de Guilda;
- publicar assets de Guilda;
- tratar `governance-demo` como app ativo;
- manter `governance-demo` como npm workspace;
- evoluir telas, tokens, auth, backend ou desktop de Guilda dentro da Spec 0024.

### `guilda`

Passa a ser o repo vivo do produto e da marca. Ele deve assumir a autoridade por:

- app desktop;
- app web/portal;
- site institucional;
- packages de dominio/contratos/UI/test-fixtures do produto;
- assets de marca e design system;
- governanca local do proprio produto;
- distribuicao, releases e dogfood do ecossistema Guilda.

## Como ler o arquivo historico

`_archive/guilda-incubation-2026-07/` e um arquivo de evidencia, nao uma fonte
ativa. Ele pode conter:

- caminhos antigos como `governance-demo/...`;
- comandos npm workspace que nao existem mais no `ai-guidelines`;
- referencias a Acme, mock-api, Next, Better Auth, Playwright e MUI usadas na
  incubacao;
- docs de produto que agora pertencem ao repo Guilda.

Quando houver conflito entre arquivo historico e documentos ativos:

1. vence o repo vivo `guilda` para produto;
2. vence `model.yml` para o modelo conceitual da Spec 0024;
3. vence `state.yml` da Spec 0024 para topologia/cursor do `ai-guidelines`;
4. vence este documento para a disposicao da extracao.

## Consequencias praticas

- `package.json` do `ai-guidelines` nao deve listar workspaces de Guilda.
- `package-lock.json` do `ai-guidelines` nao deve carregar lock de pacotes
  `acme-governance-*` ou `@demo/*` da incubacao.
- O contrato de scripts do `ai-guidelines` nao deve expor
  `format:governance-demo`.
- O PR #45 nao deve declarar readiness do app Guilda.
- O PR #45 pode declarar que preserva evidencia historica e conclui a fronteira
  de extracao.

## Proximo uso esperado

Para evoluir Guilda, abrir trabalho no repo `guilda`.

Para concluir a Spec 0024 no `ai-guidelines`, seguir apenas com os entregaveis
do framework: artifact taxonomy, model-review, research index, script contracts,
gates e reconciliacao do PR. Use
[`GUILDA-QRD-PRESERVATION-MATRIX.md`](GUILDA-QRD-PRESERVATION-MATRIX.md) como
ponte entre a evidencia de produto arquivada e esses entregaveis do framework.
