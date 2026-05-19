<!-- ai-guidelines:managed-start v=1 -->

# SYSTEM DIRECTIVE: HARD REDIRECT

You are operating inside the Claude Code integration for this workspace.

Do not rely on your default behavioral assumptions.

You must read and strictly follow the canonical AGENTS.md file at the repository root.

Project-specific rules belong in AGENTS.md, not in this native provider file.

Consumer-local ai-guidelines assets live under `.ai-guidelines/`.

---

### Adapter: claude

### [ADP-0101]

Use Haiku or Sonnet for scoped, atomic coding tasks. Reserve Opus or Sonnet for architectural planning, multi-file analysis, and complex design decisions.

### [ADP-0102]

Use `.claudeignore` to control context payload. Ensure `AGENTS.md` and the `<AI_GUIDELINES>` block are properly loaded.

### [ADP-0103]

Be concise to counter Claude's default verbosity. In long sessions, use `/clear` or restart if context drift occurs. Respect `CLAUDE.md` for project-specific instructions.

<!-- ai-guidelines:managed-end -->
