### Adaptador: Codex / Copilot (OpenAI)

> Diretrizes complementares para agentes baseados em modelos OpenAI (Codex, GPT-4o) e integrações via GitHub Copilot.
> Estas regras **complementam** (não substituem) o `global-rules.md`.

---

#### Integração com IDE

- Copilot lê automaticamente o `AGENTS.md` da raiz do repositório.
- Para instruções específicas do projeto no Copilot Chat, utilize `.github/copilot-instructions.md` — este arquivo é carregado como contexto adicional pelo Copilot.
- Utilize comentários estruturados e JSDoc para auxiliar a conclusão de código em tempo real.

#### Contexto e Ignore

- Copilot respeita o `.gitignore` do repositório por padrão.
- Para refinamentos de contexto no Copilot Chat, utilize referências diretas a arquivos via `#file`.
- Codex CLI respeita `AGENTS.md` e `.codex/instructions.md` — garanta que o bloco `<AI_GUIDELINES>` esteja presente.

#### Comportamento Observado

- Copilot inline tende a completar código baseado no contexto imediato (arquivo aberto + imports). Mantenha arquivos focados e com imports explícitos para melhores sugestões.
- Codex em modo autônomo segue instruções de `AGENTS.md` rigorosamente — garanta que as regras de governança (ex: não fazer push) estejam claras.
