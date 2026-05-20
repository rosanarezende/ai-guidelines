<!-- ai-guidelines-template: next-boilerplate v=1 -->

# NEXT — Spec 0023 Workflow Runtime

> **Arquivo de acompanhamento contínuo.** Itens aqui são descobertas que **extrapolam o escopo** desta spec e precisam sobreviver até o encerramento. Pendências que serão resolvidas antes do merge vão para a tasklist da sessão de implementação. **DELETADO no encerramento pré-merge**; itens relevantes migram para `.specify/specs/roadmap/backlog.md` ou viram issues.

---

## 🏛️ Débitos Adiados

### Stage B (Decision closed; PR1 em execução)

_(Sem débitos adiados no momento do gate. Itens emergentes durante PR1 entram aqui.)_

### Pós-Bloco D (lifecycle metodológico cravado; PR2-lifecycle em construção)

- **Stacking pain manual** é aceito por enquanto (`[DEC-0023-D02]` risco aceito). Reabrir se ≥ 2 ciclos consecutivos confirmarem inviabilidade.
- **Definição objetiva de "pequeno" para fast-track** deferida até observação empírica de ≥ 3 fast-tracks reais (`[DEC-0023-D05]` risco aceito).
- **Drift detection profundo no CI** explicitamente diferido (`[DEC-0023-D02]` C-completo). Reabrir como spec própria quando padrões de divergência se acumularem.

### Pós-Bloco E (enforcement estrutural cravado; visíveis com critério de revisita)

> Convenção operacional: **não usar "talvez depois" como justificativa**. Todo item deferido aqui tem (a) camada nomeada, (b) critério de revisita observável, (c) sem entrada em memória implícita.

- **L3 — hooks locais (pre-commit, pre-push)** deferido. **Critério de revisita:** L2 (`workflow continue` refuse) + L4 (`governance-pr-check` CI) comprovarem insuficientes em ≥ 2 casos reais. Cf. `[DEC-0023-E03]` + ADR 0021.
- **Drift detection semântico** (mapping arquivos↔tasks, análise de cobertura) deferido. **Critério de revisita:** ≥ 2 ciclos de stacked PRs revelarem padrões de divergência específicos que CI mínimo deixa passar. Cf. `[DEC-0023-E04]` + ADR 0020.
- **Runtime stateful complexo** (eventos, transitions, plugins) deferido. **Critério de revisita:** L2 atual (state derivado + refuse narrativo) provar insuficiente em ≥ 2 casos. Evitar engine-shape até lá. Cf. `[DEC-0023-E04]` + framing anti-distorção em `[DEC-0023-E05]`.
- **Pre-tool hooks no harness** (Claude Code settings.json hooks, equivalentes em outros providers) deferido. **Critério de revisita:** decisão própria sobre channel-specific enforcement; hoje viola ADR 0018 (acopla a provider). Cf. `[DEC-0023-E04]`.
- **Definição objetiva de "raridade" para fast-track** deferida. **Critério de revisita:** ≥ 3 fast-tracks reais observados; padrão de abuso suspeito. Cf. `[DEC-0023-E05]` + ADR 0021.

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

### 5. `tasks.md` NÃO é checklist operacional — é boundary de autorização (insight do Bloco D)

- Cravado em `[DEC-0023-D01]`. Diferença fundamental do template SDD anterior.
- Checklist operacional fino fica em `plan.md § DoD`. `tasks.md` declara apenas decomposição autorizada + escopo do boundary.
- Sem essa distinção, `tasks.md` vira instrumento de microgerenciamento; com ela, vira instrumento de governança.

### 6. PR2-lifecycle é bootstrap auto-violação declarada

- Não dá pra aplicar o modelo à sua própria introdução.
- Próxima iteração que aplica o modelo estritamente é PR3-enforcement-runtime + PR4-DX-thinking + PR5-DX-execution.
- Trilha de aprendizado preservada em `[DEC-0023-D04]` (PR1 também pre-model declarado por motivo análogo).

### 7. Convergência research lifecycle-architecture.md (taxonomy ↔ lifecycle)

- Research dedicado fechou em 299 linhas (cap absoluto 300; +49 sobre primário com justificativa).
- Convergências cravadas: (a) invariantes universais leves (accountability + traceability + outcome registration); (b) lifecycle intent categories como eixo de leitura (5 classes), não nova taxonomia; (c) runtime taxonomy-aware sem orchestration engine; (d) enforcement universal leve.
- Princípio canônico: **"governança universal não significa artifacts universais"**.
- 5 perguntas (F1–F5) cravadas como `[DEC-0023-F01..F05]` no Bloco F do decision-brief — status Pendente, opções populadas + recomendação inicial.
- F6/F7 permanecem candidates no research §9 (não promovidos a DEC para evitar consumir convergência via expansão).
- **Pós-Bloco F deferido (com critério):** PR3-enforcement-runtime aguarda Bloco F Resolved + estabilização semântica antes de iniciar implementação de runtime profundo.
