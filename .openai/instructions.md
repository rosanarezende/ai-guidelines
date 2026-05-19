<!-- ai-guidelines:managed-start v=1 -->
# SYSTEM DIRECTIVE: HARD REDIRECT

You are operating inside the OpenAI / Codex integration for this workspace.

Do not rely on your default behavioral assumptions.

You must read and strictly follow the canonical AGENTS.md file at the repository root.

Project-specific rules belong in AGENTS.md, not in this native provider file.

Consumer-local ai-guidelines assets live under `.ai-guidelines/`.

---

### Adapter: codex

### [ADP-0201]

Leverage `.github/copilot-instructions.md` for project instructions in Copilot Chat. Use structured comments and JSDoc to guide inline code completion.

### [ADP-0202]

Use `#file` references to refine context in Copilot Chat. Ensure Codex CLI loads `AGENTS.md` properly.

### [ADP-0203]

Keep files focused and imports explicit to improve inline suggestions. Strictly follow governance rules (e.g., no autonomous push) when operating autonomously.
<!-- ai-guidelines:managed-end -->
