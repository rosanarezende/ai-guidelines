# Mongo backend example

Exemplo documental derivado para snapshots heterogêneos de nós/arestas/issues.

- `collections.json`: contrato mínimo de coleções e índices.
- `documents.jsonl`: carga determinística, uma operação lógica por linha.

Mongo não é fonte de ação; migrations precisam ser versionadas e fail-closed antes de uso operacional.
