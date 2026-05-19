# Mapa de Equivalência: Mirror Legado ↔ Template Engine

> **PR4/4.C entregou engine activation + 1 recipe byte-equivalente.** Recipes adicionais ficam para PRs futuros, isoladas, com risco menor (a engine já roda em produção via fallback per-kind).

Este documento mapeia o estado da depreciação dos boilerplates legados em favor das novas `recipes` de composição atômica. O mirror legado (`.specify/templates/`) está formalmente **depreciado**, mas **mantido operacional** como fallback — quando uma recipe não existe para um `artifactKind`, o CLI cai no mirror automaticamente. Remoção física do mirror fica fora de escopo desta spec (exige migration path próprio).

## Tabela de Equivalência

| Boilerplate Legado (`.specify/templates/`) | Status da Recipe (`.core/governance/`)                                                                                                                                                                                                   | Origem do output no `init`/`adopt`                     |
| :----------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------- |
| `tasks-evidence-driven-boilerplate.md`     | ✅ **Recipe completa byte-equivalente** (`recipes/tasks-evidence-driven.recipe.yml` + 10 partials em `templates/partials/tasks-evidence-driven/`). Gate Jest: `src/domain/templates/TasksEvidenceDrivenEquivalence.test.ts` ([4.C.0.b]). | **engine** (com fallback ao mirror se `dist/` ausente) |
| `spec-boilerplate.md`                      | legacy (sem recipe) — equivalência completa: PR futuro                                                                                                                                                                                   | mirror                                                 |
| `plan-boilerplate.md`                      | legacy (sem recipe) — equivalência completa: PR futuro                                                                                                                                                                                   | mirror                                                 |
| `decision-brief-boilerplate.md`            | legacy (sem recipe) — equivalência completa: PR futuro                                                                                                                                                                                   | mirror                                                 |
| `roadmap-boilerplate.md`                   | legacy (sem recipe) — equivalência completa: PR futuro                                                                                                                                                                                   | mirror                                                 |
| `tasks-boilerplate.md`                     | legacy (sem recipe) — equivalência completa: PR futuro                                                                                                                                                                                   | mirror                                                 |
| `tasks-deterministic-boilerplate.md`       | legacy (sem recipe) — equivalência completa: PR futuro                                                                                                                                                                                   | mirror                                                 |
| `tasks-mixed-boilerplate.md`               | legacy (sem recipe) — equivalência completa: PR futuro                                                                                                                                                                                   | mirror                                                 |
| `project-config-boilerplate.md`            | legacy (sem recipe) — equivalência completa: PR futuro                                                                                                                                                                                   | mirror                                                 |
| `research-index-boilerplate.md`            | legacy (sem recipe) — equivalência completa: PR futuro                                                                                                                                                                                   | mirror                                                 |
| `next-boilerplate.md`                      | legacy (sem recipe) — equivalência completa: PR futuro                                                                                                                                                                                   | mirror                                                 |

## Política de Equivalência (formalizada em 4.C / Plan)

Aplicada por `cli/features/core/template-equivalence.mjs` (normalizer único + comparator):

- **E1** Canonical EOL = LF (CRLF/CR → LF).
- **E2** Newline final obrigatória (colapsa múltiplas em uma).
- **E3** Trailing whitespace por linha removido.
- **E4** Deterministic slot ordering (`recipe.canonicalOrder: slots`).
- **E5** Separador entre slots = `\n\n` (já em `AssembleArtifact.ts`); partials sem newlines líderes.
- **E6** Normalizer único compartilhado entre engine e testes.
- **E7** Byte-equivalente após normalização: barra para considerar recipe "completa".

## Output naming (R4)

A engine grava com o **mesmo filename** do mirror legado: `<destDir>/<artifactKind>-boilerplate.md`. Justificativa: prune, equivalência byte-a-byte e refs downstream continuam funcionando idênticos em ambos os caminhos.

## Engine availability

Quando `dist/` está disponível (dev install pós-`yarn build`), engine path roda para recipes presentes. Quando ausente (tarball publicado para consumidores), wrapper retorna `{ rendered: false, reason: "engine-unavailable" }` e fallback transparente para o mirror — consumer install permanece inalterado.
