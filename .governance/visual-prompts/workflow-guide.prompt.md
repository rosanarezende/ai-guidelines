Generate a clean, minimalist development workflow diagram for a software repository that uses AI-assisted governance. Use flat design, soft pastel colors, friendly icons. Modern infographic aesthetic. Target: a developer or AI agent who wants to understand the full cycle in 30 seconds.

LANGUAGE CONSTRAINT (non-negotiable): All visible text inside the generated image MUST be in Brazilian Portuguese (pt-BR). The English text in this prompt is instructional metadata — it must NOT appear in the rendered image.

---

LAYOUT: a horizontal pipeline of 5 phases flowing left to right, with two support zones below the pipeline.

---

PIPELINE (top section — 5 phases, each as a rounded card with icon + title + 2-3 bullet points):

Phase 1 — "Planejamento" (soft blue, 📋 icon)

- Candidata no backlog
- Spec: porquê, escopo, critérios
- Branch dedicada aberta

Phase 2 — "Execução" (soft purple, ⚙️ icon)

- PRs atômicos em sequência
- CI verde a cada PR
- `continue` valida autorização

Phase 3 — "Preparo" (soft orange, 🔍 icon)

- Spec marcada como Done
- NEXT.md deletado
- Histórico e backlog atualizados

Phase 4 — "Merge" (soft green, 🔀 icon)

- Gate R8: autorização do owner
- Gate R9: branch em estado final
- `merge-stack` executa

Phase 5 — "Automação" (soft gray, 🤖 icon)

- PRs da stack fechados automaticamente
- npm publicado (se aplicável)
- GitHub Release criada (se aplicável)

Connect the phases with right-pointing arrows. Add a subtle vertical divider between Phase 4 and Phase 5 with a small label: "merge acontece aqui".

---

SUPPORT ZONE 1 (below phases 1-4, labeled "Antes do merge — trabalho humano"):
A horizontal band in cream/light yellow with a small checklist icon. Text: "Tudo que pode ser feito antes do merge deve ser feito antes. O merge é o encerramento."

SUPPORT ZONE 2 (below phase 5, labeled "Após o merge — automação"):
A horizontal band in light gray. Text: "Nenhuma ação humana necessária."

---

TOP-LEFT CORNER: a small "caminho rápido" badge (no border, just a small arrow icon + text):
"Correções pequenas: branch → PR → CI → merge (sem spec)"

---

STYLE: soft pastel palette (cream background). Each phase card has a distinct muted pastel background. Friendly rounded corners throughout. No shadows or gradients — flat design only. Typography: clean sans-serif, two weights (bold for titles, regular for bullets).
