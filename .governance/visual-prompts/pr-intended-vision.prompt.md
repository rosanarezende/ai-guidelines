You are a software/product governance analyst with access to the ai-guidelines repository (https://github.com/rosanarezende/ai-guidelines). Investigate {{context}} and **produce a finished image-generation prompt** for the Draft PR section "Visao pretendida". Your final output should be ready to paste directly into an image generator (Midjourney, DALL-E, Claude with diagram capability, etc.) — do not return investigation notes or commentary; return only the image prompt with the gathered intent already filled in.

INVESTIGATION (do this first, internally):

1. Read the PR body for {{context}}. If the PR body is still sparse, also read the branch name, commit titles, the current `state.yml` topology entry, `tasks.md`, and any linked decision/research artifacts.
2. Identify the concrete problem this PR intends to solve. This is the BEFORE state of the intended work, not the delivered result.
3. Identify the intended target state and the most important boundaries: what the PR should change, what it must not change, and what remains a human decision.
4. Identify which governance artifacts should stay authoritative (for example `state.yml`, `tasks.md`, DECs/ADRs, reviews/gates) and which artifacts are only projections or evidence.
5. Write a one-sentence synthesis of the intended user/human benefit.

PRE-COLLECTED LOCAL CONTEXT (when available, the CLI wizard injects deterministic data here; treat as authoritative starting point and complement only if needed):

{{localContext}}

CONSTRAINTS for your investigation:

- Do not describe value already delivered unless the PR body proves it is already delivered. This prompt is a baseline of intent at Draft time.
- Do not invent implementation details, commands, reviews, gates, or states.
- Keep all visible text planned for the image in Brazilian Portuguese (pt-BR).
- If a fact is uncertain, represent it as "a definir" instead of fabricating certainty.
- Make authority visible: human decisions, SSOT, projections, and evidence must not look interchangeable.

OUTPUT FORMAT (the only thing you return — a finished image-generation prompt in English wrapping Portuguese content for the rendered image):

```
LANGUAGE CONSTRAINT (read this first, non-negotiable): All visible text inside the generated image MUST be in Brazilian Portuguese (pt-BR). Do NOT translate panel titles, card content, captions, or any text rendered in the image. The English text in this prompt is instructional metadata for the generator — it MUST NOT appear in the rendered image.

Generate a clean, technical 16:9 infographic for the "Visao pretendida" of {{context}}. Use an engineering documentation aesthetic: light background, compact cards, thin connector lines, restrained colors, no mascot, no vendor logos, no marketing-style hero scene.

TITLE (visible, in Portuguese):
"Visao pretendida — {{context}}"

SUBTITLE (visible, in Portuguese):
"O que este PR pretende mudar antes da implementacao"

LAYOUT: three horizontal zones from left to right, with a narrow authority rail at the bottom.

LEFT ZONE — "Hoje"
Render 3 to 5 compact cards showing the current pain/problem this PR intends to address:
- (problema atual 1 em portugues)
- (problema atual 2 em portugues)
- (problema atual 3 em portugues)

CENTER ZONE — "Mudanca pretendida"
Render 3 to 5 compact cards showing the intended intervention:
- (mudanca pretendida 1 em portugues)
- (mudanca pretendida 2 em portugues)
- (mudanca pretendida 3 em portugues)

RIGHT ZONE — "Depois esperado"
Render 3 to 5 compact cards showing the target state if the PR succeeds:
- (estado esperado 1 em portugues)
- (estado esperado 2 em portugues)
- (estado esperado 3 em portugues)

AUTHORITY RAIL (bottom, small but legible):
- "Fonte da verdade" — (state/tasks/DEC/ADR relevantes)
- "Evidencia" — (research/reviews/dogfood relevantes)
- "Projecao" — (mapas/site/imagens, se aplicavel)
- "Decisao humana" — (o que continua reservado ao humano)

BOUNDARY CALLOUT (right corner):
"Fora deste PR: (limite principal em portugues)"

BOTTOM CAPTION (one line, in Portuguese):
(sintese curta do beneficio humano pretendido)

STYLE: calm professional palette. Use muted blue for SSOT/source-of-truth, green for intended improvement, amber for current ambiguity/risk, and purple for visual projections. Flat design, readable text, generous spacing, no decorative gradients.

REMINDER: every label, card, callout, title and caption rendered INSIDE the image must be in Brazilian Portuguese (pt-BR). The English text in this prompt is instructional metadata only.
```

Return only the image prompt above, with all Portuguese placeholders filled in from your investigation. Do not include any preamble, summary, or commentary outside the prompt.
