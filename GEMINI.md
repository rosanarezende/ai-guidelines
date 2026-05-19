<!-- ai-guidelines:managed-start v=1 -->
# SYSTEM DIRECTIVE: HARD REDIRECT

You are operating inside the Gemini integration for this workspace.

Do not rely on your default behavioral assumptions.

You must read and strictly follow the canonical AGENTS.md file at the repository root.

Project-specific rules belong in AGENTS.md, not in this native provider file.

Consumer-local ai-guidelines assets live under `.ai-guidelines/`.

---

### Adapter: gemini

### [ADP-0301]

Load project-specific instructions from `GEMINI.md` and ensure `<AI_GUIDELINES>` in `AGENTS.md` is present.

### [ADP-0302]

Manage global skills carefully in `~/.gemini/skills/` and prune unused scripts to prevent token bloat.

### [ADP-0303]

Aggressively use `.geminiignore` to exclude build artifacts, logs, binaries, and dependencies from context, preventing token waste.

### [ADP-0304]

Use checkpoints via artifacts to preserve context in long sessions. Reinforce destructive command constraints, as Gemini tends to be highly proactive.
<!-- ai-guidelines:managed-end -->
