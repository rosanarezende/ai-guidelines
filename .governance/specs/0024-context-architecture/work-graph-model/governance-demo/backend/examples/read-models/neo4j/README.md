# Neo4j backend example

Exemplo completo de grafo derivado para análise de impacto cross-repo.

- `schema.cypher`: constraints/indexes mínimos.
- `graph.cypher`: carga determinística de todos os nós e arestas do read-model atual.
- `queries.cypher`: consultas típicas de coordenação, contrato e dashboard.

Neo4j é read-model por padrão: comandos precisam reler YAML/event-log antes de escrever.
