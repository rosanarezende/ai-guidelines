LANGUAGE CONSTRAINT (read this first, treat as non-negotiable): All visible text inside the generated image MUST be in Brazilian Portuguese (pt-BR). Do NOT translate panel titles, lane labels, box labels, captions, or any text rendered in the image. The English text in this prompt is instructional metadata for you, the image generator — it MUST NOT appear in the rendered image. Examples of correct rendered text: "Governança (rule of law)" não "Governance"; "decisões cravadas alimentam runtime" não "decisions feed runtime".

Generate a clean, minimalist architecture diagram of the ai-guidelines framework. Use flat design, soft pastel colors, consistent typography. Target: technical reviewer who wants to grasp the whole shape in 30 seconds.

LAYOUT: 3 horizontal swim-lanes stacked vertically (top to bottom).

LANE 1 — title "Governança (regra do jogo)" — soft yellow background:
Boxes left-to-right, connected by arrows:

- decision-brief.md
- ADRs (0017, 0018, 0019, 0020, 0021, 0022, 0023)
- tasks.md (fronteira de autorização)
- state.yml (4 chaves: stage, gate.status, focus, next)

LANE 2 — title "Runtime (lente operacional)" — soft blue background:
Boxes left-to-right, gear icon on each, connected by arrows:

- DetectActiveSpec
- CheckExecutionAuthorized (enforcement L2)
- AssembleBriefing
- PublishState
- ListActiveSpecs

LANE 3 — title "Interface ao usuário (CLI + agentes)" — soft green background:
Boxes left-to-right, terminal/robot icons:

- workflow continue
- workflow (REPL + wizard mínimo)
- workflow publish-state
- AGENTS.md / .cursorrules / CLAUDE.md (stubs)
  Speech bubble icon on AGENTS.md indicating handoff to AI session.

VERTICAL ARROWS connecting lanes (top to bottom):

- Lane 1 → Lane 2: label "decisões cravadas alimentam o runtime"
- Lane 2 → Lane 3: label "runtime expõe ao usuário via CLI/agentes"

FEEDBACK LOOP arrow on right side, pointing from Lane 3 back to Lane 1:
label "insights emergem do uso (NEXT.md, blocos do decision-brief)".

STYLE: soft pastel palette (cream background; yellow/blue/green muted for lanes). Friendly icons (gavel for ADRs, document for state/tasks, gear for use cases, terminal for CLI, robot for agents). Modern flat infographic aesthetic; no enterprise clipart.

REMINDER (repeating because image generators often default to English): every label, title, and caption rendered INSIDE the image must be in Brazilian Portuguese (pt-BR). Module names like `DetectActiveSpec`, `CheckExecutionAuthorized`, `tasks.md`, `state.yml` keep their original technical names (those are code identifiers, not natural language).
