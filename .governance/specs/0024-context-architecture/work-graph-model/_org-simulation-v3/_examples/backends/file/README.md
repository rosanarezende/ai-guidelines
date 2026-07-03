# File backend example

Este exemplo mostra o backend file-first como plano autoritativo + read-model derivado.

- `read-model.json`: snapshot derivado do grafo, apto para UI local e testes.
- `event-log.example.jsonl`: exemplo de evento semântico append-only para rebuild do read-model.

O YAML em `acme-governance/` e `repos/<repo>/.governance/` continua sendo o SSOT.
