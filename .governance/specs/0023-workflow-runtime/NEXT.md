<!-- ai-guidelines-template: next-boilerplate v=1 -->

# NEXT — Spec 0023 Workflow Runtime

> **Arquivo de acompanhamento contínuo.** Itens aqui são descobertas que **extrapolam o escopo** desta spec e precisam sobreviver até o encerramento. Pendências que serão resolvidas antes do merge vão para a tasklist da sessão de implementação. **DELETADO no encerramento pré-merge**; itens relevantes migram para `.specify/specs/roadmap/backlog.md` ou viram issues.

---

## 🏛️ Débitos Adiados

### Stage B (Decision closed; PR1 em execução)

_(Sem débitos adiados no momento do gate. Itens emergentes durante PR1 entram aqui.)_

---

## 💡 Insights e Descobertas

### 1. Cutover de `.specify/` → `.governance/` é caso-a-caso, sem timeline

- ADR 0019 declara: novas specs em `.governance/`; specs antigas decidem caso-a-caso.
- **Não** abrir spec de migração em massa. Cada spec antiga que migra precisa de justificativa própria (acessos quebrados? referências em ADR? dogfooding de outra spec?).

### 2. PRs futuros (PR2–PR4) são candidatos, não promessa

- Cada um precisa passar pelo teste "isto reduz carga cognitiva?".
- `review-research` (PR2 candidato) só faz sentido depois que PR1 provar o modelo de briefing+menu.
- Avaliação empírica (PR4 candidato) depende de ≥ 2 specs novas usarem o runtime.

### 3. Context bundle copy-paste é a única "linguagem natural" do runtime

- Não embutir LLM. Não tentar interpretar intenção localmente além do trivial.
- O ganho conversacional vem do agente IA externo (Claude Code, Cursor), não do runtime.

### 4. Trilha legacy em `.specify/specs/0023-governance-workflow-discovery-model/` é evidência, não dívida

- Research, hipóteses, anti-patterns continuam sendo material citável.
- Não copiar para o novo path; referenciar com link relativo.
