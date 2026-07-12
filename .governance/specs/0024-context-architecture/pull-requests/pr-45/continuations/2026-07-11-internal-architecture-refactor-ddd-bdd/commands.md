# Comandos sugeridos

## Ver comando sem criar PR

```bash
npm run continuation:create-pr -- --package .governance/specs/0024-context-architecture/pull-requests/pr-45/continuations/2026-07-11-internal-architecture-refactor-ddd-bdd
```

## Criar Draft PR com autorizacao humana explicita

```bash
npm run continuation:create-pr -- --package .governance/specs/0024-context-architecture/pull-requests/pr-45/continuations/2026-07-11-internal-architecture-refactor-ddd-bdd --confirm
```

## Comando gh equivalente

```bash
gh pr create --draft --title "Internal architecture refactor DDD BDD" --body-file "C:\Users\Rosana\dev\ai-guidelines\.governance\specs\0024-context-architecture\pull-requests\pr-45\continuations\2026-07-11-internal-architecture-refactor-ddd-bdd\body.md" --base feat/spec-0024-artifact-taxonomy-and-model-review-contract --head feat/spec-0024-internal-architecture-refactor-ddd-bdd
```
