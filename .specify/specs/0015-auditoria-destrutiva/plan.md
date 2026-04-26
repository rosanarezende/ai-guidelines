# Plan — Spec 0015 Auditoria Destrutiva

> Spec: [`./spec.md`](./spec.md)
> Status: Active

---

## 🏗️ Design e Arquitetura

### Princípio guia

O objetivo é reduzir o ruído cognitivo e técnico do repositório, garantindo que o baseline seja o mais enxuto e acionável possível. Seguimos o princípio de que **"Memória reside no repositório, não em arquivos soltos"**. Documentação que não é regra nem guia explicativo atualizado deve ser removida ou movida para o histórico de specs.

### Componentes ou Sub-blocos

#### [A] Limpeza de `.core/docs/`

**Estado atual**:
Existem 13 arquivos/pastas em `.core/docs/`. Muitos são placeholders, obsoletos ou duplicatas de regras já existentes em `.core/rules/` ou workflows em `AGENTS.md`.

**Decisão**:
Executar as ações mapeadas em `mapping-doc-to-rules.md`:

- **DELETE**: Arquivos sem valor ou redundantes.
- **MOVE**: Arquivos que devem ser templates.
- **CONSOLIDATE**: Conteúdo residual que deve ser absorvido por regras.

**Mudanças em arquivos**:

- [DELETE] `.core/docs/cinematic-ui-boilerplates.md`
- [DELETE] `.core/docs/mcp/registry.md`
- [DELETE] `.core/docs/process/ai-review-ritual.md` (redundante com AGENTS.md)
- [DELETE] `.core/docs/process/project-init.md` (obsoleto pelo CLI)
- [DELETE] `.core/docs/skills/README.md`
- [DELETE] `design/` (herança de UI/UX não relacionada a governança)
- [MOVE] `.core/docs/projects.md.example` -> `.specify/templates/project-config-boilerplate.md`
- [REVALUATE] `.core/docs/advanced-ai-patterns.md` -> Se mantido, mover para subtópico de `ai-efficiency-guide.md` ou manter como "Advanced Docs". Decisão: Deletar se for 100% redundante ou mover para research da Spec 0008 se for apenas histórico.

#### [B] Sincronização de Roadmap e Histórico

**Estado atual**:
O Roadmap foi migrado para `.specify/specs/roadmap/`, mas o processo de fechamento de specs (Spec 0008 Sub-blocos A e B concluídos) precisa ser validado contra as novas regras de `spec-foundation.md`.

**Decisão**:

- Garantir que Spec 0008 (Phases A e B) esteja corretamente registrada no histórico se as partes concluídas permitirem (ou manter como Active se o sub-bloco C ainda for necessário). _Nota: O usuário disse que concluiu A e B, e o PR #21 foi atualizado._
- Limpar `roadmap/backlog.md` de referências a arquivos deletados.

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Componente [A] — Limpeza

- [ ] `.core/docs/cinematic-ui-boilerplates.md` deletado.
- [ ] `.core/docs/mcp/` deletado.
- [ ] `.core/docs/skills/` deletado.
- [ ] `.core/docs/process/ai-review-ritual.md` deletado.
- [ ] `.core/docs/process/project-init.md` deletado.
- [ ] `.core/docs/projects.md.example` movido para `.specify/templates/project-config-boilerplate.md`.
- [ ] `advanced-ai-patterns.md` processado (deletado ou movido).

### Componente [B] — Roadmap

- [ ] `roadmap/backlog.md` revisado: zero links para arquivos deletados.
- [ ] `roadmap/historico.md` atualizado com o status da Spec 0008 (A e B).

### Globais (toda a spec)

- [ ] `yarn check` verde.
- [ ] `yarn test` verde.

---

## 🧪 Estratégia de Testes

- **Manual**: Verificar se não há referências (links markdown) quebradas nos arquivos restantes usando grep.
- **Sanidade**: Rodar o CLI localmente para garantir que a remoção de arquivos em `.core/docs/` não quebrou o comando `adopt`.

---

## 🛠️ Arquivos modificados (esperado)

- `.core/docs/*` — Múltiplas deleções.
- `.specify/templates/project-config-boilerplate.md` — Novo (movido).
- `.specify/specs/roadmap/backlog.md` — Atualização de links.
- `.specify/specs/roadmap/historico.md` — Registro de progresso.

---

## ⚠️ Riscos técnicos (concretos)

| Risco                                | Mitigação                                                |
| :----------------------------------- | :------------------------------------------------------- |
| Deleção de conteúdo útil não mapeado | Revisão final dos arquivos antes de deletar.             |
| Links quebrados em outros docs       | Busca global por strings de nomes de arquivos deletados. |
