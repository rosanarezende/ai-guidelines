You are a software architecture analyst with access to the current repository (the one the user is working in). Investigate the codebase and **produce a finished image-generation prompt** that visualizes the end-to-end architecture you find. Your final output should be ready to paste directly into an image generator (Midjourney, DALL-E, Claude with diagram capability, etc.) — do not return investigation notes or commentary; return only the image prompt with the gathered structure already filled in.

INVESTIGATION (do this first, internally):

1. Identify the project's architectural layers. Look for conventions like DDD (domain / app / infrastructure / cli), MVC, hexagonal/ports-and-adapters, or whatever pattern the project actually follows. Inspect the top-level directory structure, README, and any ARCHITECTURE/ADR documents.
2. List the main components per layer (5–8 per layer is enough — pick the most representative; don't try to enumerate everything). For each component, capture a short, accurate name (use the actual symbol/file name when it exists).
3. Identify the user-facing surface: CLI commands, HTTP endpoints, library API, or whatever the project exposes externally.
4. Identify any cross-cutting governance/decision artifacts (ADRs, decision-briefs, specs, RFCs) and where they live.
5. Identify connecting flows between layers: which layer feeds which, where do decisions cravadas alimentar runtime, where does feedback loop back into governance.

CONSTRAINTS for your investigation:

- Investigate the **actual repository the user is currently in**, not a generic example. The image must reflect the real shape of _their_ project.
- Do not invent layers or components that are not present in the codebase. If a layer is empty or absent, omit it from the diagram instead of fabricating content.
- If the project does not follow a clean layered architecture, render whatever structure it actually has (modules, packages, microservices, monolith blocks). The honest shape matters more than a textbook one.
- Component names in the diagram should be the **real symbol/file names** when applicable (e.g., `DetectActiveSpec`, `UserService`, `OrderController`). Keep code identifiers in their original form; do not translate.

OUTPUT FORMAT (the only thing you return — a finished image-generation prompt in English wrapping Portuguese content for the rendered image):

```
LANGUAGE CONSTRAINT (read this first, non-negotiable): All visible text inside the generated image MUST be in Brazilian Portuguese (pt-BR), EXCEPT for code identifiers (function names, class names, file names) which keep their original form. Do NOT translate layer titles, flow labels, or captions. The English text in this prompt is instructional metadata for the generator — it MUST NOT appear in the rendered image.

Generate a clean, minimalist end-to-end architecture diagram of the current project. Use flat design, soft pastel colors, consistent typography. Target: technical reviewer who wants to grasp the whole shape in 30 seconds.

LAYOUT: horizontal swim-lanes stacked vertically (top to bottom). Render one lane per architectural layer identified during investigation (typically 2–4 lanes — adapt to the actual project shape).

For each lane:
- Title in Brazilian Portuguese describing the layer's role (e.g., "Governança", "Domínio", "Aplicação", "Infraestrutura", "Interface ao usuário").
- 5–8 boxes left-to-right with the real component names from investigation (keep code identifiers in original form).
- Connecting arrows between boxes within the lane to indicate primary flow.
- Soft pastel background distinguishing the lane (yellow / blue / green / orange — choose to taste).

VERTICAL ARROWS between lanes (top-to-bottom) describing how each layer feeds the next, with short Portuguese labels.

FEEDBACK LOOP arrow on the right side (if the project has one — e.g., insights from usage feeding back into governance/decisions), with a short Portuguese label.

STYLE: soft pastel palette (cream background; muted lane backgrounds). Friendly icons (document for spec/ADR, gear for use case, terminal for CLI, robot for agents, etc. — adapt to the project's domain). Modern flat infographic aesthetic; no enterprise clipart.

REMINDER (repeating because image generators often default to English): every layer title, flow label, and caption rendered INSIDE the image must be in Brazilian Portuguese (pt-BR). Code identifiers (`ClassName`, `function_name`, `file.ext`) keep their original form.
```

Return only the image prompt above, with all the layer titles, component lists, and flow labels filled in from your investigation of the current repository. Do not include any preamble, summary, or commentary outside the prompt.
