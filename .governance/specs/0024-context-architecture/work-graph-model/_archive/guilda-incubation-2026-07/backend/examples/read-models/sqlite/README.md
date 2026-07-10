# SQLite backend example

Exemplo de read-model relacional derivado. Útil para app local, filas e queries transacionais pequenas.

- `schema.sql`: tabelas mínimas para nós, arestas, issues e metadados.
- `seed.sql`: carga determinística do snapshot atual.

Comandos de escrita ainda devem reler YAML/event-log antes de agir; SQLite não vira SSOT.
