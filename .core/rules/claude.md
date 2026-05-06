### Adaptador: Claude (Anthropic)

> Diretrizes complementares para agentes baseados em modelos Anthropic Claude.
> Estas regras **complementam** (não substituem) o `global-rules.md`.

---

#### [ADP-0101] Model Routing

```yaml
id: ADP-0101
scope: adapter
adapter: claude
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [adapter, claude, routing]
```

**Instruction (en):**
Use Haiku or Sonnet for scoped, atomic coding tasks. Reserve Opus or Sonnet for architectural planning, multi-file analysis, and complex design decisions.

**Documentação (pt-br):**

- **Haiku / Sonnet leve:** tarefas atômicas de codificação, formatação, refatoração scoped.
- **Sonnet / Opus:** planejamento arquitetural, análise de múltiplos arquivos, decisões de design complexas.

---

#### [ADP-0102] Context e Ignore

```yaml
id: ADP-0102
scope: adapter
adapter: claude
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [adapter, claude, context]
```

**Instruction (en):**
Use `.claudeignore` to control context payload. Ensure `AGENTS.md` and the `<AI_GUIDELINES>` block are properly loaded.

**Documentação (pt-br):**

- Utilize `.claudeignore` na raiz do repositório para controlar quais arquivos a IA carrega no contexto.
- O formato segue o padrão `.gitignore`.
- Claude carrega automaticamente o `AGENTS.md` da raiz — garanta que o bloco `<AI_GUIDELINES>` esteja presente.

---

#### [ADP-0103] Comportamento Observado

```yaml
id: ADP-0103
scope: adapter
adapter: claude
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [adapter, claude, behavior]
```

**Instruction (en):**
Be concise to counter Claude's default verbosity. In long sessions, use `/clear` or restart if context drift occurs. Respect `CLAUDE.md` for project-specific instructions.

**Documentação (pt-br):**

- Claude tende a ser verboso por padrão. As Global Rules já instruem respostas sucintas — reforce se necessário com "seja conciso" no prompt.
- Em sessões longas, Claude pode perder contexto de arquivos lidos no início. Use `/clear` ou reinicie a sessão quando perceber repetição de erros.
- Claude Code respeita `CLAUDE.md` na raiz — este arquivo pode conter instruções específicas do projeto que complementam o baseline injetado.
