# CO-2.1 — Opcoes de graph store / banco externo

> Status: research arquitetural do PR #37. Nao decide adocao; delimita o spike
> futuro sem prender o framework ao desenho repo-first inicial.

## Pergunta

O `KnowledgeGraph` deve continuar apenas como read-model em memoria derivado de
Git/YAML/Markdown, ou o framework ganha mais potencial com um banco orientado a
grafo/consulta? A pergunta inclui as regras que hoje compilam `AGENTS.md`:
`AGENTS.md` e projecao runtime; a fonte consultavel e `.core/rules` /
`RulesCatalog`, projetada como nos `rule`.

## Opcoes avaliadas

| Opcao                                     | Fit com a arquitetura               | Vantagens                                                                                                                      | Riscos / custo                                                                                      |
| ----------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Git/YAML/Markdown + read-model em memoria | Alto para SSOT auditavel e PR-first | Portabilidade, diff humano, reproducibilidade, sem servico externo                                                             | Consulta e visualizacao pobres; agente depende de projecoes futuras                                 |
| Neo4j                                     | Alto para exploracao de relacoes    | Modelo nativo de nos/relacionamentos/caminhos; Cypher facilita perguntas como "o que esta constrangido por esta falsificacao?" | Servico externo, dependencia operacional, decisao de sync/SSOT; risco de virar segunda verdade      |
| RDF/SPARQL / triplestore                  | Medio/alto se virar ontologia       | Interoperabilidade semantica e vocabulários formais                                                                            | Mais complexo; pode antecipar ontologia antes do modelo estabilizar                                 |
| SQLite/Postgres local                     | Medio                               | Queryabilidade simples mantendo distribuicao local                                                                             | Grafo vira modelagem relacional manual; travessias ficam menos naturais                             |
| Cassandra                                 | Baixo para o problema atual         | Escala horizontal, alta disponibilidade e volume distribuido                                                                   | Baixo fit para travessia de grafo; eventual consistency e operacao distribuida antes da necessidade |

## Interpretacao

Neo4j e o candidato com maior fit conceitual para ampliar o potencial do
framework, porque o dominio ja fala em nos, arestas e travessia. Mesmo assim,
adota-lo agora como SSOT seria prematuro: a decisao importante e manter qualquer
banco externo como **projecao derivada reconstruivel**, nao como fonte primaria.

## Recomendacao

Nao instalar banco no PR #37. Fechar CO-2.1 com:

1. inventario/backfill minimo versionado;
2. `KnowledgeGraph` montavel a partir desse inventario;
3. RulesCatalog projetado como Knowledge (`CORE-*`, `GR-*`, `OPT-*`, `ADP-*`
   todos no stage `rule`, com escopo/provider como metadado);
4. check deterministico que impede o inventario de apodrecer;
5. spike futuro registrado: `knowledge-graph-store-spike`, com Neo4j como
   candidato principal e Cassandra mantido apenas como contraste de baixo fit.

Fontes consultadas:

- Neo4j Cypher Manual — core concepts: https://neo4j.com/docs/cypher-manual/25/queries/concepts/
- Neo4j graph database concepts: https://neo4j.com/docs/getting-started/appendix/graphdb-concepts/
- Apache Cassandra basics: https://cassandra.apache.org/_/cassandra-basics
- Apache Cassandra guarantees: https://cassandra.apache.org/doc/latest/cassandra/architecture/guarantees.html
