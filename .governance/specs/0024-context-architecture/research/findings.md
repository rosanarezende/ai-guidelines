# Findings — Spec 0024 `context-architecture`

> **O que faz:** consolida os **findings convergidos** da investigação — _o que aprendemos_, não _o que decidimos_. **Sem gate, sem decisão, sem aprovação.** O `decision-brief.md` referencia estes findings (`F-NNN`) e contém apenas o que exige julgamento humano.
>
> **Contrato:** um finding **referencia** a research-fonte (não a duplica → não vira superfície de drift; cf. lente projeção). Após `Convergido` é **imutável** (mesma semântica do DEC `Resolved`); revisões abrem um novo finding. Trilha bruta e datada vive em `research/2026-*.md`.
>
> Separação findings/decisions introduzida 2026-05-30 (ver `research/2026-05-30-findings-decisions-separation.md`).

---

## F-001 — A unidade primária é a transformação governada (não objeto, não universal)

- **Observação:** a unidade primária do framework é um **mecanismo** — `contexto humano → governança executável` — não um objeto de 1ª classe (`spec`/`pilar`/`artefato`) nem uma transformação universal.
- **Evidências:** 6 sistemas (interno + Spec Kitty, Hermes, Multica, Cursor, opencode); `research/2026-05-29-g00-research-state.md`, `research/2026-05-29-cursor-opencode.md`.
- **Contradições/limites:** o **separador fino** de classe fica aberto (→ F-003).
- **Impacto:** alimenta `[DEC-0024-G00]` (identidade C).
- **Status:** **Convergido.**

## F-002 — A fronteira humano→sistema é multi-seam, não única

- **Observação:** ≥2 seams independentes (**regras** + **execução**); a "espessura" é **por-seam**. "Julgamento cristalizado em governança versionada" é convenção cross-tool (`.cursor/rules` / `AGENTS.md` / `CLAUDE.md`) — logo não é, sozinho, o separador de classe.
- **Evidências:** `research/2026-05-29-cursor-opencode.md`.
- **Impacto:** `[DEC-0024-G00]` (a assinatura de classe é multi-seam tipada).
- **Status:** **Convergido.**

## F-003 — `terminus` é hipótese de separador fino — deferida a G01 (não coroar)

- **Observação:** o cruzamento no seam de regras (_artefato governado executável, sem LLM no runtime_ vs _steering para geração autônoma_) **pode** ser o separador de classe real. Atraente, grounded-ish, **não falsificada** por contraste suficiente.
- **Contradições/limites:** disciplina tri-party — **não substituir uma hipótese elegante por outra**; não reabre G00.
- **Impacto:** candidata de `[DEC-0024-G01]` (`NEXT.md` #8).
- **Status:** **Aberto** (hipótese deferida).

## F-004 — A taxonomia `deterministic/mixed/evidence-driven` é projeção do crivo de julgamento por bloco

- **Observação:** a única diferença real entre os tipos é **presença/ausência de julgamento** num bloco. Drift recorrente (o `mixed` sempre atrás) é o sintoma de uma projeção tratada como entidade.
- **Evidências (impacto grounded):** runtime/registry/ADR **não dependem** da taxonomia (gating lê `review.md`; registry usa `WorkItemKind`); footprint = enum `WorkflowType` (`Recipe.ts:39-44`) + recipe/partials (G04) + doc. `research/2026-05-30-g02-taxonomy-elimination.md`.
- **Impacto:** `[DEC-0024-G02]` (direção: remover; substituir por bloco + propriedade `exige-julgamento`).
- **Status:** **Convergido.**

## F-005 — O `[DEC]` é projeção: registro persistente do julgamento, não gatilho

- **Observação:** a cadeia é `incerteza → julgamento → gate → DEC registra`. Tratar o DEC como pivô exige criar DEC-stub vazio só para marcar o gate (artefato-fantasma). A imagem das 3 camadas confirma: DEC = **Camada 2** (governança/registro); julgamento = **Camada 3** (primário).
- **Evidências:** `research/2026-05-30-unified-tasks-model.md` § Princípio; `research/2026-05-30-projection-vs-entity-lens.md`; `README.md` § "O princípio central".
- **Impacto:** `[DEC-0024-G02]` (modelo substituto); design do modelo único.
- **Status:** **Convergido.**

## F-006 — A lente "entidade vs projeção" converge em `contexto` (fixpoint — não regride ao infinito)

- **Observação:** rodada após rodada, entidades caem como projeções (handoff, taxonomia, DEC, talvez Stage/gate) — mas **`contexto` sobrevive a todas**. Contexto é a raiz que C nomeia (`contexto humano → …`) e o nome da spec (`context-architecture`). Logo o regresso da lente tem **piso**: contexto.
- **Evidências:** `research/2026-05-30-projection-vs-entity-lens.md`.
- **Impacto:** evidência adicional para C em `[DEC-0024-G00]`; alimenta `[DEC-0024-G01]`.
- **Status:** **Convergido.**

## F-007 — Handoff reinstala contexto de trabalho, mas falha no contexto operacional

- **Observação:** handoffs preservam bem _o quê/onde_ da investigação, mas omitem _como se opera_ (idioma, convenções, disciplinas, papéis) — evidência: agente retomando em inglês.
- **Evidências:** dogfooding 2026-05-29; obs #9 do preâmbulo do decision-brief.
- **Impacto:** cravado em **ADR 0022** (handoff situado precede distribuição estática); alimenta `[DEC-0024-G05]`.
- **Status:** **Convergido** (já promovido a ADR).

---

---

## Findings abertos — perguntas migradas do decision-brief (reforma 2026-05-31)

> **Decisão da owner (2026-05-31):** `DEC Open` é inválido — pergunta aberta não é decisão. As perguntas abaixo **deixaram o decision-brief** e vivem aqui como **findings abertos** até **convergirem e exigirem julgamento** — só então retornam ao brief como `[DEC] Pendente`. **G00 Resolved (C aceito, 2026-05-31):** o invariante de ordem cumpriu-se → estas perguntas são agora **investigação estrutural G01+ destravada**; **aceitar G00 NÃO as resolve** (instrução explícita do gate) — seguem **abertas**, sem reabrir G00. Contexto verbatim anterior: **git** (pré-reforma) + os research datados.

**Arquiteturais (ex-Bloco G):**

- **F-AG01 (Aberto · ex-`[DEC-0024-G01]`):** os 7 pilares MECE (ADR 0010) são a estrutura primária? Inversão `tipo→artefatos→lifecycle` vs `pilares→artefatos→lifecycle→tipo percebido`. **Reenquadrado:** a lente _estados > entidade_ (lens) sugere que "qual é a entidade?" pode ser pergunta malformada.
- **F-AG03 (Aberto · ex-G03):** promotion pipeline canônico — reconciliar promoção de work-item (ADR 0010) com a cadeia de promoção contextual (`observação→sinal→regra→ADR`). Absorve a antiga D04.
- **F-AG04 (Aberto · ex-G04):** contrato mínimo de boilerplate + core comum + **casa única dos templates** (tri-root → fonte única; drift dogfooded). Camada de materialização.
- **F-AG05 (Aberto · ex-G05):** projeções da mesma SSOT por consumidor (handoff/wizard/briefing/dashboard); `decision session`; **projeção gate-ready** por DEC (obs #10). Liga ADR 0023.

**Eixos de pressão (ex-Blocos A/B/D/E/F):**

- **F-AA01/02/03 (Seleção):** quem faz seleção contextual · quando acontece · quanto contexto é descartado.
- **F-AB01/02 (Persistência):** o que persiste vs expira · quem tem autoridade sobre persistência.
- **F-AD01/02/03/04 (Promoção):** observações→regras situacionais · handoff promove autônomo? (provável NÃO, ADR 0018/0022) · onde mora a curadoria humana · unidade canônica de promoção (consequência de G03).
- **F-AE01/02/03 (Projeção):** mesma SSOT → N projeções? · como cada consumidor recebe · formato canônico por consumidor.
- **F-AF01/02/03/04 (Governança):** autoridade sobre o que lembrar · trilha auditável de projeções · governance-first como invariante (ADR?) · invariantes sob enforcement sistêmico vs humano (caso `state.yml`/PR #31).

**Saúde técnica:**

- **F-AC01 (Aberto · ex-C01):** saúde arquitetural + dívidas dos componentes que a implementação derivada tocará (research-first; avaliação pendente — `cli` legado, coverage).

## Findings convergidos migrados do preâmbulo (reforma 2026-05-31)

> O preâmbulo "síntese empírica (não-decisional)" do brief migra para cá. Várias obs já estavam consolidadas (cross-map abaixo); as demais entram como F-008+. Verbatim: **git**.

**Cross-map (já consolidado):** obs #1/#9 → **F-007** + ADR 0022 · obs #7 → **F-004** · obs #10 → `research/2026-05-30-findings-decisions-separation.md` · obs #11 → **F-005** + `[DEC-0024-G06]` · obs #6/#8 → findings abertos `F-AG03`/`F-AG05`.

- **F-008 (Convergido):** memory feedbacks de provider **não viajam** (local-only em `~/.../memory/`) — gap de portabilidade de contexto.
- **F-009 (Convergido):** a pressão "consciência ≠ aderência" é **universal**, não única do projeto (transcrições 2026-05-28); o diferencial é a leitura **governance-first** (não memory-first/harness-first).
- **F-010 (Convergido):** o modo **tri-party** (humano + Claude + ChatGPT) emergiu sem ritual — 2º caso documentado; leitor tardio expõe pressupostos.
- **F-011 (Convergido):** o lifecycle `spec → decision-brief → ADR/regra` **já é** pipeline de promoção (mesma forma do `task→skill` do Hermes); handoff = projeção, aprendizado vive no lifecycle humano-curado (ADR 0018).
- **F-012 (Convergido):** convergências externas — markdown vence como SSOT (todos); harness é o produto, modelo é commodity; provider-agnosticism é diferencial econômico; skill-as-procedure (Hermes) vs tasks-as-boundary (ai-guidelines) = leituras da mesma pressão.
- **F-013 (Convergido):** **lacuna governance-first** — nenhum sistema estudado trata governança do **próprio processo** como eixo de 1ª classe; é o nicho do ai-guidelines (alimenta `F-AF03`).

---

---

## F-014 — Comportamento observado da spec (observação · NÃO explicação · relação com G00 indeterminada)

> **Origem:** investigação tri-party da 0024, 2026-05-30/31. **Disciplina:** preservar a separação **observação → descrição → explicação** que consumiu várias rodadas quando colapsada num passo só.

**Observado** — durante a investigação da 0024:

- decisões podem ser revisitadas;
- `execution` pode retornar para `research`;
- julgamento humano ocorre em **múltiplos pontos**;
- **diferentes artefatos** podem participar do processo decisório;
- a rastreabilidade permanece preservada durante essas transições.

O comportamento observado **não corresponde a uma esteira linear de fases sequenciais**.

**A explicação arquitetural desse comportamento permanece em investigação** — candidatas concorrentes, **nenhuma decidida**: (A) C / `[DEC-0024-G00]`; (B) trilhos + julgamento; (C) estados + artefatos + trilhos.

**Restrições explícitas (rigor — não colapsar camadas):**

- F-014 é **observação**, não explicação nem teoria. "Sistema não-linear governável" seria já uma interpretação — fora daqui.
- **Não usar F-014 como evidência a favor de `[DEC-0024-G00]`.**
- **Não usar F-014 contra `[DEC-0024-G00]`.**
- A relação F-014 ↔ G00 é **indeterminada** (consequência de C? evidência independente? mera compatibilidade? — não provado).

**Status:** Convergido **como observação**; explicação **Aberta**.

---

> **Findings abertos** dependem de research/decisão futura; só viram `[DEC] Pendente` ao convergir + exigir julgamento. **Findings convergidos** são referência estável para os DECs. Consolidação viva enquanto a 0024 está em Stage 1; no fechamento, migra com a research para o índice canônico (`researchs/`).
