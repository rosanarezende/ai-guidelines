# Docs arquivados da governance-demo — 2026-07-05

Arquivado durante a limpeza documental da `governance-demo`.

Motivo: estes arquivos eram uteis para implementar/revisar fatias anteriores,
mas estavam competindo com os contratos vivos do app e dificultando a retomada.

## Arquivos

| Arquivo                                | Motivo do arquivo                                                              | Substituto ativo                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE-CODE-FABLE-5-HANDOFF.md`       | Handoff/prompt operacional para uma rodada externa.                            | Criar prompt novo quando necessario, a partir de `governance-demo/APP-FUNCTIONAL-SPEC.md` e `APP-ITERATION-MAP.md`. |
| `CLAUDE-FABLE-BACKEND-R0-R1-PROMPT.md` | Prompt usado para implementar R0/R1.                                           | Historico; backend atual vive em `governance-demo/backend/`, `frontend/server/` e `mock-api/`.                      |
| `BACKEND-R0-R1-FINDINGS.md`            | Diagnostico que orientou R0/R1.                                                | `governance-demo/APP-FUNCTIONAL-SPEC.md`, `APP-DECISIONS.md` e `NEXT-STEPS.md`.                                     |
| `WALKTHROUGH-ITERATION.md`             | Mapa antigo de walkthrough e anti-compactacao.                                 | `governance-demo/APP-ITERATION-MAP.md`.                                                                             |
| `app-requirements.md`                  | Requisitos amplos de app antes da `governance-demo` virar contrato de produto. | `governance-demo/APP-PRODUCT-STATEMENT.md` + `APP-FUNCTIONAL-SPEC.md`.                                              |
| `tracker-v1.md`                        | Historico detalhado da taxonomia/modelo v1.                                    | `tracker.md` + `model.yml`.                                                                                         |

Estes arquivos nao devem ser usados como autoridade atual. Se houver divergencia,
vence o documento ativo indicado na coluna "Substituto ativo".
