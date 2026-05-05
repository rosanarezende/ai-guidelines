### Adaptador: Codex / Copilot (OpenAI)

> Diretrizes complementares para agentes baseados em modelos OpenAI (Codex, GPT-4o) e integrações via GitHub Copilot.
> Estas regras **complementam** (não substituem) o `global-rules.md`.

---

#### [ADP-0201] Integração com IDE

```yaml
id: ADP-0201
scope: adapter
adapter: codex
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [adapter, codex, ide]
```

**Instruction (en):**
Leverage `.github/copilot-instructions.md` for project instructions in Copilot Chat. Use structured comments and JSDoc to guide inline code completion.

**Documentação (pt-br):**

- Copilot lê automaticamente o `AGENTS.md` da raiz do repositório.
- Para instruções específicas do projeto no Copilot Chat, utilize `.github/copilot-instructions.md` — este arquivo é carregado como contexto adicional pelo Copilot.
- Utilize comentários estruturados e JSDoc para auxiliar a conclusão de código em tempo real.

---

#### [ADP-0202] Contexto e Ignore

```yaml
id: ADP-0202
scope: adapter
adapter: codex
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [adapter, codex, context]
```

**Instruction (en):**
Use `#file` references to refine context in Copilot Chat. Ensure Codex CLI loads `AGENTS.md` properly.

**Documentação (pt-br):**

- Copilot respeita o `.gitignore` do repositório por padrão.
- Para refinamentos de contexto no Copilot Chat, utilize referências diretas a arquivos via `#file`.
- Codex CLI respeita `AGENTS.md` e `.codex/instructions.md` — garanta que o bloco `<AI_GUIDELINES>` esteja presente.

---

#### [ADP-0203] Comportamento Observado

```yaml
id: ADP-0203
scope: adapter
adapter: codex
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [adapter, codex, behavior]
```

**Instruction (en):**
Keep files focused and imports explicit to improve inline suggestions. Strictly follow governance rules (e.g., no autonomous push) when operating autonomously.

**Documentação (pt-br):**

- Copilot inline tende a completar código baseado no contexto imediato (arquivo aberto + imports). Mantenha arquivos focados e com imports explícitos para melhores sugestões.
- Codex em modo autônomo segue instruções de `AGENTS.md` rigorosamente — garanta que as regras de governança (ex: não fazer push) estejam claras.
