You are a software engineering analyst with access to the ai-guidelines repository (https://github.com/rosanarezende/ai-guidelines). Investigate {{context}} and **produce a finished image-generation prompt** based on what you find. Your final output should be ready to paste directly into an image generator (Midjourney, DALL-E, Claude with diagram capability, etc.) — do not return investigation notes or commentary; return only the image prompt with the gathered facts already filled in.

INVESTIGATION (do this first, internally):

1. Read the description and metadata of {{context}}. If it is a PR, read the PR body and commit messages. If it is a spec, read the spec's `decision-brief.md`, the relevant ADRs, the `NEXT.md`, and the `CHANGELOG.md` entry.
2. Identify 3 to 5 concrete operational symptoms that existed BEFORE {{context}} landed/closed. Each symptom must be observable, specific, and grounded in the artifacts — not invented.
3. Identify 3 to 5 concrete operational capabilities that exist AFTER {{context}} landed/closed. Where possible, each capability should resolve one symptom 1:1.
4. Write a one-sentence synthesis describing what the user can do now that they couldn't do before.

PRE-COLLECTED LOCAL CONTEXT (when available, the CLI wizard injects deterministic data here; treat as authoritative starting point and complement only if needed):

{{localContext}}

CONSTRAINTS for your investigation:

- Do not invent symptoms or capabilities that are not grounded in the artifacts.
- If you cannot find evidence for an item, use the literal placeholder `(insira o sintoma/capacidade aqui)` rather than fabricate.
- Keep symptoms, capabilities, and the synthesis in **Brazilian Portuguese (pt-BR)** — they will end up rendered inside an image.

OUTPUT FORMAT (the only thing you return — a finished image-generation prompt in English wrapping Portuguese content for the rendered image):

```
LANGUAGE CONSTRAINT (read this first, non-negotiable): All visible text inside the generated image MUST be in Brazilian Portuguese (pt-BR). Do NOT translate panel titles, card content, captions, or any text rendered in the image. The English text in this prompt is instructional metadata for the generator — it MUST NOT appear in the rendered image. Examples of correct rendered text: panel titles "ANTES" and "DEPOIS" (not "BEFORE" / "AFTER"); cards in Portuguese; caption in Portuguese.

Generate a clean, minimalist before/after infographic showing the value delivered by {{context}}. Use flat design, soft pastel colors, friendly icons. Modern infographic aesthetic.

LAYOUT: two side-by-side panels of equal visual weight, titled "ANTES" (left) and "DEPOIS" (right), plus a horizontal pipeline below and a one-line caption at the bottom.

ANTES panel (situação anterior a {{context}}) — render each item as a sticky-note style card with slightly desaturated colors and a question-mark or warning icon:
- (sintoma 1 em português, observável e específico)
- (sintoma 2 em português)
- ...

DEPOIS panel (situação posterior a {{context}}) — render each item as a sticky-note style card with vivid pastel colors and a checkmark or arrow icon; mirror the ANTES layout 1:1 where possible:
- (capacidade 1 em português)
- (capacidade 2 em português)
- ...

PIPELINE BOTTOM (5 horizontal chevrons in soft pastel green, left to right):
[1] Sintoma observado →
[2] DEC cravado no decision-brief →
[3] Implementado no runtime →
[4] Enforcement automático →
[5] Insight novo emerge do uso

BOTTOM CAPTION (small text, one line, in Portuguese): (uma única frase em português, foco no que o usuário consegue fazer agora que não conseguia antes)

STYLE: pastel palette (cream background; muted reds/yellows for ANTES; muted greens/blues for DEPOIS). Flat design, friendly icons (warning, gear, check, scroll, arrow).

REMINDER (repeating because image generators often default to English): every label, title, sticky-note text, and caption rendered INSIDE the image must be in Brazilian Portuguese (pt-BR). The English you see in this prompt is instructional metadata only.
```

Return only the image prompt above, with all the Portuguese placeholders (sintomas, capacidades, síntese) filled in from your investigation. Do not include any preamble, summary, or commentary outside the prompt.
