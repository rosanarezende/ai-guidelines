# Comandos sugeridos

## Ver comando sem criar PR

```bash
npm run continuation:create-pr -- --package .governance/specs/0024-context-architecture/pull-requests/pr-46/continuations/2026-07-14-broad-flow-falsification
```

## Criar Draft PR com autorizacao humana explicita

```bash
npm run continuation:create-pr -- --package .governance/specs/0024-context-architecture/pull-requests/pr-46/continuations/2026-07-14-broad-flow-falsification --confirm
```

## Comando gh equivalente

```bash
gh pr create --draft --title "[🛠️13️⃣➜] [Spec 0024] Falsificação ampla do lifecycle governado" --body-file "C:\Users\Rosana\dev\ai-guidelines\.governance\specs\0024-context-architecture\pull-requests\pr-46\continuations\2026-07-14-broad-flow-falsification\body.md" --base feat/spec-0024-internal-architecture-refactor-ddd-bdd --head feat/spec-0024-broad-flow-falsification
```
