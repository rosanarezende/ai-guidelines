---
artifact-kind: inventory
---

# PR #44 — Inventario de taxonomia de artefatos da Spec 0024

Data: 2026-06-22  
Spec: 0024 — context-architecture  
No ativo: `co-flow-continuation`  
Checkpoint ativo: `checkpoint-co-flow-continuation`  
Natureza: inventario de modelagem; narrativa de apoio; nao autoridade.

> **Nota pós-G21 (2026-06-22):** `[DEC-0024-G21]` aceitou a necessidade de
> taxonomia e de review pre-codificacao, mas **não** aceitou mover arquivos por
> tipo neste PR. A implementacao esperada no proximo PR e robusta e canônica:
> `kind`/metadado como fonte única, `research-index` reparado e verificado,
> promocao de artefatos maduros para `research-library/<domínio>`, projeções
> rotuladas como não-autoridade e `model-review` materializado como tipo
> governado ou rejeitado por DEC. Migração física de `.specify` segue para
> `dualroot-collapse`.

## 1. Por que este inventario existe

A pasta `research/` nasceu para guardar pesquisas usadas como insumo do
`decision-brief.md` e, no fechamento da spec, promover pesquisas reutilizaveis para
`research-library`.

Durante a Spec 0024, essa funcao ficou insuficiente. O trabalho passou a incluir
nos, grafos, PRs stacked, mapas visuais, dogfood, revisoes externas, status,
classificacao de drift e prompts. Como nao havia casas semanticas para tudo isso,
arquivos de naturezas diferentes foram para `research/`.

O problema deixou de ser organizacional e virou problema de governanca:

```text
research/
  = pesquisa real
  + dogfood
  + handoff
  + status
  + review pre-codificacao
  + backlog/gap
  + inventario
  + prompt
  + evidencia reutilizavel
```

Quando todas essas categorias moram no mesmo lugar, um agente pode tratar uma
narrativa antiga como contrato atual, ou um mapa util como fonte de verdade. Isso
e a mesma classe de risco dos drifts ja observados nesta spec: artefato humano
util passa a competir com `state.yml`, `tasks.md`, `decision-brief.md`, reviews,
gates e Git/GitHub.

## 2. Fronteira deste arquivo

Este inventario:

- descreve o problema de modelagem;
- classifica os tipos de artefato observados;
- propoe uma taxonomia candidata;
- lista criterios de promocao para `research-library`;
- prepara perguntas para falsificacao externa.

Este inventario nao:

- cria diretorios novos;
- move arquivos;
- altera `state.yml`, `tasks.md`, `decision-brief.md`, gates ou PR body;
- decide a taxonomia final;
- autoriza Ready, Human Gate, merge ou avancos.

## 3. Ordem de autoridade que nao muda

Quando houver divergencia:

1. `state.yml` vence para topologia, cursor e proximo movimento estrutural.
2. `tasks.md` vence para checkpoint/sub-checkpoint e checklist vigente.
3. `decision-brief.md` vence para decisoes humanas registradas.
4. `reviews/` e `gates/` vencem para findings, dispositions e Human Gate.
5. Git/GitHub vencem para branch, PR, commits e CI.
6. `assets/` e mapas sao projecoes visuais.
7. `research/` e contexto datado, nao contrato atual.

## 4. Tipos de artefato observados

| Tipo observado                   | Funcao real                                      | Autoridade                                               | Pasta atual                       | Problema atual                                            |
| -------------------------------- | ------------------------------------------------ | -------------------------------------------------------- | --------------------------------- | --------------------------------------------------------- |
| Pesquisa real                    | Investigar alternativas e fundamentar decisao    | Nenhuma direta                                           | `research/`                       | Misturada com status e reviews                            |
| Dogfood/status                   | Registrar experiencia situada e progresso datado | Nenhuma direta                                           | `research/`                       | Pode parecer contrato vigente depois de ficar stale       |
| Handoff/snapshot                 | Retomar uma sessao ou checkpoint                 | Nenhuma direta                                           | `research/`                       | Pode competir com `flow handoff`/`work` atual             |
| Inventario de modelo             | Mapear conceitos, transicoes, fontes e gaps      | Nenhuma direta                                           | `research/`                       | Pode virar SSOT se nao for reconciliado                   |
| Review pre-codificacao/modelagem | Falsificar modelo antes de implementar           | Apoio; findings precisam virar DEC/task/review governado | `research/`                       | Sem casa propria; nao e research comum nem review de gate |
| Review de gate                   | Avaliar implementacao de checkpoint sob policy   | Findings governados                                      | `reviews/`                        | Ja tem modelo proprio                                     |
| Decisao humana                   | Resolver recorte, gate ou escolha arquitetural   | Autoridade governada                                     | `decision-brief.md` / `gates/`    | Nao deve ser substituida por research                     |
| Projecao visual                  | Ajudar humanos a entender fluxo, spec ou PR      | Nenhuma; derivavel desejado                              | `assets/`                         | Pode virar SSOT se manual e nao sinalizada                |
| Prompt visual                    | Descrever imagem desejada para mapa/site/PR      | Nenhuma                                                  | PR/chat/research/assets           | Ainda sem casa clara                                      |
| Backlog/gap                      | Registrar trabalho futuro ou lacuna              | Nenhuma ate virar task/DEC/PIT                           | `research/`                       | Some em texto longo ou vira promessa implicita            |
| Conhecimento reutilizavel        | Aprendizado aplicavel a outras specs/repos       | Nenhuma ate ser promovido                                | `research/` -> `research-library` | Promocao ainda pouco operacionalizada                     |

## 5. Taxonomia candidata

Esta e uma proposta para falsificacao, nao uma decisao.

| Categoria candidata   | Finalidade                                                                  | Pasta candidata  | Regra de autoridade                               |
| --------------------- | --------------------------------------------------------------------------- | ---------------- | ------------------------------------------------- |
| `research/`           | Pesquisa exploratoria, evidencias e comparativos que alimentam decisao      | manter           | Nunca autoriza trabalho sozinha                   |
| `dogfood/`            | Experiencias situadas, status narrativos, aprendizados de uso               | nova ou subpasta | Snapshot datado; sempre confirmar contra SSOT     |
| `model-reviews/`      | Revisoes pre-codificacao/modelagem, read-only e adversariais                | nova ou subpasta | Findings precisam virar DEC/task/review governado |
| `evidence/`           | Evidencias factuais reutilizaveis: outputs, logs curados, matrizes de prova | nova ou subpasta | Evidencia nao decide; sustenta DEC/review         |
| `backlog/` ou `gaps/` | Lacunas candidatas ainda nao promovidas para task                           | nova ou subpasta | Trabalho so nasce quando promovido                |
| `assets/`             | Mapas, imagens, htmls e prompts visuais versionados                         | manter           | Projecao visual; nunca SSOT                       |
| `reviews/`            | Reviews governados de gate/role com findings                                | manter           | Load-bearing conforme review-policy               |
| `gates/`              | Decisao humana de gate                                                      | manter           | Autoridade humana registrada                      |
| `research-library/`   | Conhecimento estabilizado e reutilizavel entre specs                        | manter global    | Promocao explicita no fechamento ou por decisao   |

Alternativa mais conservadora: manter uma unica pasta `research/`, mas exigir
frontmatter/cabecalho `kind:` em todo arquivo. Essa alternativa reduz churn de
paths, mas nao resolve tao bem a navegabilidade humana.

## 6. Criterios para promover ou mover

### Permanece em `research/`

- investigacao comparativa;
- matriz de alternativas;
- estudo tecnico que alimenta uma DEC;
- pesquisa datada que nao precisa virar contrato;
- evidencias de mercado, bibliotecas, padroes ou benchmarks.

### Deveria virar review pre-codificacao/modelagem

- falsificacao adversarial de um modelo antes de codar;
- avaliacao de mapa/inventario/topologia antes de reconciliar SSOT;
- parecer que gera findings, bloqueadores ou perguntas humanas;
- revisao que nao e TA/AR/Security de gate.

### Deveria virar dogfood/status

- relato de experiencia usando o proprio framework;
- observacao situada de atrito humano;
- status de andamento de PR/checkpoint;
- aprendizado de produto originado do uso real.

### Deveria virar backlog/gap/task

- lacuna que ainda nao e trabalho autorizado;
- feature candidata;
- melhoria percebida no uso;
- drift ainda nao modelado.

Quando o item vira trabalho executavel, ele precisa sair da narrativa e entrar em
`tasks.md`, DEC, PIT, issue/PR ou artefato governado equivalente.

### Deveria virar `research-library`

Um arquivo ou trecho e candidato a `research-library` quando:

- explica um padrao reutilizavel fora da Spec 0024;
- nao depende de um PR/branch/SHA especifico;
- pode orientar outras specs, consumidores ou repos;
- passou por revisao ou decisao suficiente para nao ser apenas opiniao situada.

Exemplos candidatos futuros:

- criterios de separacao entre projecao e entidade de primeira classe;
- modelo de PR como container e checkpoint como unidade de entrega;
- taxonomia de reviews pre-codificacao;
- criterios de promocao de artifactos visuais para mapas governados.

## 7. Inventario inicial da Spec 0024

Esta classificacao e inicial e propositalmente conservadora. Ela nao move arquivos.

| Grupo atual                       | Exemplos                                                                                                                                           | Classificacao inicial          | Acao candidata                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------- |
| Pesquisas iniciais de arquitetura | `2026-05-29-architectural-inventory.md`, `2026-05-29-g00-ontological-map.md`                                                                       | pesquisa / inventario          | avaliar trechos para `research-library` no fechamento |
| Handoffs antigos                  | `2026-05-29-handoff-next-session.md`, `2026-06-07-checkpoint-handoff-co-2.md`                                                                      | handoff/snapshot               | manter datado; nao usar como contrato atual           |
| Dogfood/status                    | `2026-06-19-checkpoint-co-flow-convergence-co-10.7-status.md`, `2026-06-21-checkpoint-co-flow-continuation-dogfood-status.md`                      | dogfood/status                 | futura subpasta ou `kind: dogfood`                    |
| Reviews externas em research      | `2026-06-21-checkpoint-co-flow-convergence-pr43-external-review.md`, `2026-06-22-checkpoint-co-flow-continuation-spec-map-falsification-review.md` | review pre-codificacao/externa | criar tipo governado separado ou subpasta             |
| Prompts de review                 | `2026-06-20-checkpoint-co-flow-convergence-pr43-external-review-prompt.md`                                                                         | prompt operacional             | futura categoria de prompts ou anexo do review        |
| Classificacao de drift            | `2026-06-21-checkpoint-co-flow-continuation-drift-classification.md`                                                                               | inventario/gap                 | linkar a tasks/DEC quando virar trabalho              |
| Modelo de mapa e lifecycle        | `2026-06-22-checkpoint-co-flow-continuation-spec-map-model.md`, `2026-06-22-checkpoint-co-flow-continuation-lifecycle-model-inventory.md`          | inventario de modelo           | so vira base apos DEC/reconciliacao                   |
| Assets visuais                    | `spec-0024-map-v2.html`, `drift-tracker.html`, imagens                                                                                             | projecao visual                | futuro `SpecMapViewModel` + sync/check                |

## 8. Invariantes desejadas

1. Todo artefato datado declara sua natureza.
2. Todo artefato sem autoridade diz explicitamente que nao e SSOT.
3. Review pre-codificacao nao fica indistinguivel de pesquisa comum.
4. Review de gate continua em `reviews/` e segue `review-policy.yml`.
5. Mapa/HTML/imagem nunca lidera `state.yml` ou `tasks.md`.
6. Backlog/gap nao vira promessa implicita; precisa de promocao explicita.
7. Pesquisa reutilizavel tem caminho de promocao para `research-library`.
8. Status antigo nao pode bloquear ou autorizar trabalho.
9. Todo arquivo que recomenda decisao aponta para onde a decisao deve ser registrada.
10. Toda reorganizacao de paths precisa ter migracao ou compatibilidade clara.

## 9. Perguntas para falsificacao externa

1. Esta taxonomia reduz ou aumenta o risco de segunda fonte de verdade?
2. Separar fisicamente `dogfood/`, `model-reviews/` e `evidence/` ajuda humanos ou
   cria burocracia?
3. Frontmatter `kind:` seria suficiente em vez de novas pastas?
4. Como impedir que `research-library` vire outro deposito sem autoridade clara?
5. Que tipo de review pre-codificacao deve gerar finding governado e qual deve ficar
   apenas como parecer narrativo?
6. Que artefatos atuais da Spec 0024 deveriam ser migrados imediatamente?
7. Quais migracoes devem esperar o fechamento da spec?
8. Como a taxonomia conversa com ADR 0026 e PIT-0001/PIT-0008?
9. O mapa visual deve consumir essa taxonomia?
10. Como garantir que agentes nao usem research antigo como contrato vigente?

## 10. Decisao futura esperada

Se esta taxonomia sobreviver a falsificacao, a decisao governada deveria registrar:

- quais categorias existem;
- quais pastas ou `kind:` serao usadas;
- qual e a ordem de autoridade;
- como uma pesquisa vira DEC, task, PIT, review ou `research-library`;
- quais artefatos atuais da Spec 0024 serao migrados;
- quais ficam onde estao por custo/beneficio;
- qual comando/check futuro valida a disciplina de artefatos.

## 11. Proxima acao recomendada

1. Submeter este inventario a falsificacao externa.
2. Comparar a recomendacao externa com a revisao do mapa V2.
3. Registrar uma DEC se a owner decidir mudar a taxonomia.
4. So entao reconciliar `state.yml`, `tasks.md`, mapa e PR body.

## 12. Fronteira explicita

Este arquivo nao resolve os bloqueadores da revisao do mapa V2. Ele apenas
documenta a causa estrutural que tornou aqueles bloqueadores provaveis: a Spec 0024
precisa diferenciar melhor artefatos de evidencia, pesquisa, review, decisao e
projecao visual.
