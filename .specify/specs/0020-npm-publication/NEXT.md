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

### 2. Placement canônico dos boilerplates SDD ainda está pendente

- **O Contexto**: a smoke do tarball expôs que o pacote publicado precisa carregar os boilerplates distribuídos ao consumidor, hoje lidos de `.specify/templates/` por `cli/features/core/templates.mjs`. A correção mínima e segura para a Spec 0020 foi incluir `.specify/templates` explicitamente no payload do npm.
- **O Débito**: a localização desses boilerplates continua semântica e fisicamente híbrida: artefato distribuído do framework vivendo sob `.specify/`, que também abriga memória de execução (`specs/`). Isso conflui com a discussão maior da Spec 0021 sobre classificação canônica de informação.
- **Ação Sugerida**: tratar a migração de `.specify/templates` para um lar canônico em `.core/` como decisão arquitetural explícita da Spec 0021, com plano de migração de referências (`README`, `.core/process/spec-foundation.md`, specs históricas e código da CLI) em bloco próprio.

### 3. Sub-bloco E (`pr-curator` como GH Action ativa) extraído para spec própria

- **O Contexto**: auditoria em `cli/features/{core,opt-in}/` durante a Fase 1 (2026-05-08) confirmou que o comando `pr-curator` **não existe** como código na CLI — apenas como documento de workflow editorial referenciado no `CHANGELOG.md` e no ADR 0009. O `plan.md` original assumia, incorretamente, que a feature já estava implementada.
- **A Decisão (2026-05-08, owner)**: `pr-curator` **não é requisito** para publicação npm — `npx ai-guidelines init` funciona independentemente dessa automação cross-repo. Sub-bloco E extraído em definitivo desta spec; escopo transferido para a spec candidata `pr-curator-action` (registrada em `roadmap/backlog.md`). ADR 0009 permanece insumo arquitetural válido para essa spec futura.
- **Reflexos aplicados**: `spec.md` (objetivo, escopo, critérios de aceite, riscos) ajustado; `plan.md` (Componente E + DoD + arquivos modificados + tabela de riscos + "Decisões revisitadas") ajustado; `tasks.md` § Sub-bloco E marcado como extraído; `roadmap/backlog.md` recebeu nova candidata `pr-curator-action`.

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
