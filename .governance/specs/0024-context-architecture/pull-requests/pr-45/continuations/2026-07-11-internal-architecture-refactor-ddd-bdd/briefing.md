# Briefing de continuacao — Internal architecture refactor DDD BDD

## Fatos

- Origem: PR #45
- Target sugerido: `internal-architecture-refactor-ddd-bdd`
- Base sugerida: `feat/spec-0024-artifact-taxonomy-and-model-review-contract`
- Head sugerida: `feat/spec-0024-internal-architecture-refactor-ddd-bdd`
- Preparado em: 2026-07-11

## Escopo

Este pacote prepara uma continuacao governada. Ele nao cria PR remoto por si so,
nao muda estado de Ready, nao registra Human Gate, nao faz merge e nao altera a
topologia.

O recorte deve seguir `[DEC-0024-G28]`: o PR #45 fecha a gramatica de
artefatos/evidencias, mas deixa a gramatica operacional de `G01`, parte de
`G05` e o contrato do graph snapshot derivado para
`internal-architecture-refactor-ddd-bdd`.

O proximo PR tambem deve tratar o work-graph-model como incubador historico da
Guilda e como fonte de aprendizados estruturais do framework. Antes de fechar
gramatica operacional ou snapshot, leia:

- `work-graph-model/model.yml`;
- `work-graph-model/tracker.md`;
- `work-graph-model/features.md`;
- `work-graph-model/GUILDA-QRD-PRESERVATION-MATRIX.md`.

Esses arquivos nao reativam a Guilda Governance dentro deste repositorio. Eles
servem para separar o que deve virar capacidade do framework `ai-guidelines`
daquilo que ja foi migrado para o repo Guilda como produto, UX, branding,
portal, desktop app ou roadmap proprio.

O proximo PR deve tratar como criterio de saida:

- definir a forma do grafo de governanca operacional sem criar segunda SSOT;
- declarar os nos, arestas, source-refs e hashes do snapshot derivado;
- separar projecoes atendidas pelo snapshot das projecoes que so serao
  falsificadas em `broad-flow-falsification`;
- registrar disposicao dos aprendizados relevantes da matriz Guilda: aplicado
  no framework, migrado ao repo Guilda, preservado como legado/evidencia ou
  rebaixado com justificativa;
- manter `G03` (promocao de work-items) e `F-014` (comportamento nao-linear)
  roteados para a falsificacao ampla, salvo decisao explicita em contrario.

## Proximo passo humano

1. Revisar `body.md` e este briefing.
2. Rodar `continuation:create-pr -- --package <dir>` para ver o comando.
3. Reexecutar com `--confirm` somente quando a criacao do Draft PR estiver autorizada.
