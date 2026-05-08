# NEXT — Spec 0020 npm-publication

> **Arquivo de acompanhamento contínuo.** Instanciado **sempre** no setup da spec.
> Ao final de cada fase, registre aqui apenas itens que **extrapolem o escopo**
> desta spec e precisem sobreviver até o encerramento. Se a pendência será
> resolvida antes do merge desta própria spec, ela deve ir para o `tasks.md`.
> **DELETADO no encerramento pré-merge** (fase final do `tasks.md`); itens relevantes
> migram antes para `.specify/specs/roadmap/backlog.md` ou viram issues.
>
> Fonte: `.core/process/spec-foundation.md` — política de NEXT.md.

---

## 🏛️ Débitos Adiados

> Débitos conscientes (refactors postergados, edge cases não cobertos, riscos não mitigados). Subdivididos pela fase em que foram gerados.

### Débitos da Fase 0 (Setup)

_(Nenhum débito registrado ainda)_

### Débitos da Fase 1 (Implementação)

_(Nenhum débito registrado ainda)_

### Débitos de Fases Adicionais (Publish / Review)

_(Nenhum débito registrado ainda)_

### Débitos da Fase de Review

_(Nenhum débito registrado ainda)_

---

## 💡 Insights e Descobertas

> Insights técnicos, discussões ricas ou ideias de features que apareceram durante a execução, mas estão claramente fora do escopo atual.

### 1. `.npmignore` é ignorado quando `files` está em `package.json`

- **O Contexto**: durante 1.A.7, o primeiro `npm publish --dry-run` revelou que o tarball incluía 43 arquivos `*.test.mjs` e fixtures (`__fixtures__/`) dentro de `cli/**`. Tentativa inicial de criar `.npmignore` não filtrou nada — `total files` permaneceu em 113.
- **O Insight**: quando o campo `files` está presente em `package.json`, o npm o trata como autoritativo e ignora `.npmignore` para os caminhos listados. A solução correta é usar globs com negação dentro do próprio `files` (`"!cli/**/*.test.mjs"`, `"!cli/**/__fixtures__"`), o que reduziu o tarball de 113 → 70 arquivos (133 kB → 102 kB).
- **Ação Sugerida**: pode virar uma seção curta em `docs/cli/ai-guidelines-cli.md` ou em FAQ de contribuidor, como armadilha conhecida. Não é candidata a spec própria.

---

## ✂️ Itens descartados deliberadamente

_(Nenhum item descartado ainda)_
