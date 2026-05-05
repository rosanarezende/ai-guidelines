### Adaptador: Gemini (Google)

> Diretrizes complementares para agentes baseados em modelos Google Gemini e a CLI Gemini.
> Estas regras **complementam** (não substituem) o `global-rules.md`.

---

#### [ADP-0301] Integração com CLI

```yaml
id: ADP-0301
scope: adapter
adapter: gemini
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [adapter, gemini, cli]
```

**Instruction (en):**
Load project-specific instructions from `GEMINI.md` and ensure `<AI_GUIDELINES>` in `AGENTS.md` is present.

**Documentação (pt-br):**

- Gemini CLI carrega automaticamente `GEMINI.md` na raiz e `~/.gemini/GEMINI.md` como config global.
- Para instruções específicas do projeto, utilize `GEMINI.md` na raiz do repositório.
- O `AGENTS.md` da raiz também é carregado — garanta que o bloco `<AI_GUIDELINES>` esteja presente.

---

#### [ADP-0302] Skills Globais

```yaml
id: ADP-0302
scope: adapter
adapter: gemini
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [adapter, gemini, skills]
```

**Instruction (en):**
Manage global skills carefully in `~/.gemini/skills/` and prune unused scripts to prevent token bloat.

**Documentação (pt-br):**
As skills globais (ferramentas personalizadas) residem em `~/.gemini/skills/`. Periodicamente, remova scripts que não utiliza ativamente, pois eles degradam a performance.

---

#### [ADP-0303] Estratégia de Ignore

```yaml
id: ADP-0303
scope: adapter
adapter: gemini
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [adapter, gemini, context]
```

**Instruction (en):**
Aggressively use `.geminiignore` to exclude build artifacts, logs, binaries, and dependencies from context, preventing token waste.

**Documentação (pt-br):**
Utilize o arquivo `.geminiignore` na raiz para evitar que arquivos de build, logs e binários poluam o contexto. Crítico para economia de tokens.

---

#### [ADP-0304] Comportamento Observado

```yaml
id: ADP-0304
scope: adapter
adapter: gemini
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [adapter, gemini, behavior]
```

**Instruction (en):**
Use checkpoints via artifacts to preserve context in long sessions. Reinforce destructive command constraints, as Gemini tends to be highly proactive.

**Documentação (pt-br):**

- Em sessões longas, use o conceito de "checkpoints" (salvar progresso em artefatos) para evitar perda de contexto.
- Gemini tende a ser proativo em executar comandos — reforce a proibição de `git push` e tarefas destrutivas.
