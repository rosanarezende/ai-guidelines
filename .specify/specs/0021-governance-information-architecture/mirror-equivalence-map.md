# Mapa de Equivalência: Mirror Legado ↔ Template Engine

> **PR3 entrega engine + guardrails; cutover do fluxo e equivalência 1:1 completa ficam em PR4 / 4.C.**

Este documento mapeia o estado da depreciação dos boilerplates legados em favor das novas `recipes` de composição atômica. O mirror legado (`.specify/templates/`) está formalmente **depreciado**, mas **mantido operacional** até a conclusão da migração no PR4.

## Tabela de Equivalência

| Boilerplate Legado (`.specify/templates/`) | Status da Recipe (`.core/governance/`)                                                                       |
| :----------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| `tasks-evidence-driven-boilerplate.md`     | **PoC recipe existe** (`recipes/tasks-evidence-driven.recipe.yml` + partials em `templates/partials/tasks/`) |
| `spec-boilerplate.md`                      | legacy (sem recipe) — equivalência completa: PR4/4.C                                                         |
| `plan-boilerplate.md`                      | legacy (sem recipe) — equivalência completa: PR4/4.C                                                         |
| `decision-brief-boilerplate.md`            | legacy (sem recipe) — equivalência completa: PR4/4.C                                                         |
| `roadmap-boilerplate.md`                   | legacy (sem recipe) — equivalência completa: PR4/4.C                                                         |
| `tasks-boilerplate.md`                     | legacy (sem recipe) — equivalência completa: PR4/4.C                                                         |
| `tasks-deterministic-boilerplate.md`       | legacy (sem recipe) — equivalência completa: PR4/4.C                                                         |
| `tasks-mixed-boilerplate.md`               | legacy (sem recipe) — equivalência completa: PR4/4.C                                                         |
| `project-config-boilerplate.md`            | legacy (sem recipe) — equivalência completa: PR4/4.C                                                         |
| `research-index-boilerplate.md`            | legacy (sem recipe) — equivalência completa: PR4/4.C                                                         |
| `next-boilerplate.md`                      | legacy (sem recipe) — equivalência completa: PR4/4.C                                                         |
