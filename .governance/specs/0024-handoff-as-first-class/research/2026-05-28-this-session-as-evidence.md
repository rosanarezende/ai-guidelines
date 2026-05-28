# Research — Sessão de planejamento da 0024 como primeiro evidence artifact

> **Data:** 2026-05-28
> **Spec:** [`../spec.md`](../spec.md)
> **DECs alimentados:** `[DEC-0024-A01]`, `[DEC-0024-A02]`, `[DEC-0024-D01]`, `[DEC-0024-D02]`, `[DEC-0024-D03]`, `[DEC-0024-F01]`, `[DEC-0024-F02]`, `[DEC-0024-F03]`.

---

## Por que esta sessão é evidence artifact (não auto-referência circular)

A sessão de planejamento desta spec (2026-05-28) tem propriedade rara: **executou empiricamente o problema que a spec investiga, antes de a spec existir**. Especificamente:

1. **A owner abriu a sessão colando um handoff manual denso** (~3500 caracteres) com: contexto do projeto, 7 regras de comportamento internalizadas em sessões anteriores, modo de operação esperado, instrução de primeiro turno (Checkpoint + 4 perguntas), âncora temporal explícita (`2026-05-28+`).
2. **Claude (Sonnet 4.6) operou diferentemente do baseline:** aderência aos contratos de colaboração ([CORE-12] Checkpoint, [CORE-14] sem auto-commit, regra 6 sem memory shadow governance, regra 7 limiar de promoção) foi imediata e não-derivada — i.e., as regras NÃO foram inferidas de AGENTS.md durante a sessão; chegaram já carregadas pelo handoff.
3. **Tri-party emergiu sem ritual:** ChatGPT entrou como segunda opinião sobre a tensão da cláusula anti-paper da ADR 0023; Claude como implementador + análise; owner como decisão final. Sem combinado prévio, sem prescrição metodológica.
4. **Insights arquiteturais emergiram da interação, não da projeção:** "seleção > memória", "lifecycle = pipeline de promoção", "governance como eixo único do ai-guidelines" — todas formulações novas que NÃO estavam no handoff manual nem em AGENTS.md. Emergiram do raciocínio cruzado entre humano, Claude e ChatGPT.

Portanto: esta sessão é dado, não meta-discussão. Evidência observada do problema central da spec.

---

## Observações cravadas

### Obs 1 — Handoff manual produziu aderência operacional significativamente superior

**Evidência:** comparação intra-sessão. Sem o handoff inicial, Claude teria:

- defaultado para [GR-0201] (responder em "repository default language") deduzindo do `AGENTS.md` — sim. Mas teria perdido as 7 regras de comportamento (que não estão em AGENTS.md).
- não-internalizado regra 6 (sem shadow governance via memory) → provavelmente teria salvado memory entries sobre detalhes operacionais correntes.
- não-internalizado regra 2 (decisões estruturais implícitas → DEC) → teria proposto ações sem materializar trade-offs como DEC explícita.
- não conhecido a âncora temporal `2026-05-28+` → defaultaria para data de treinamento ou heurística genérica.

**Implicação para `[DEC-0024-A01]` (Quem faz seleção?):** quando humano faz seleção via handoff manual, a aderência é alta. Quando o agente é solto com AGENTS.md inteiro, precisa auto-selecionar — e perde regras situacionais. **Sinal forte:** seleção pelo sistema (handoff determinístico) bate auto-seleção pelo agente. Confirmar contra Hermes/Cursor.

**Implicação para `[DEC-0024-A02]` (Quando?):** o handoff aconteceu **no boot da sessão**. Toda regra entregue ali permaneceu carregada por toda a conversa. Sinal: boot-único + projeção densa = sweet spot empírico (até onde esta sessão pode testemunhar).

### Obs 2 — Pipeline de promoção do framework foi exercitado durante a sessão

**Evidência:** observação operacional ("ADR 0022 estava `Proposta`; backlog dependia") → análise estrutural (tensão cláusula anti-paper) → DEC implícita (manter ADR 0023 `Proposta`, promover ADR 0022, reordenar fila) → cravamento em artefato versionado (PR #29 merged 2026-05-28). Esse é o pipeline canônico do framework: observação → decision-brief equivalent (a conversa estruturada) → cravamento → merge.

**Implicação para `[DEC-0024-D01]` (Como observações viram regras?):** o pipeline existe e funciona. A pergunta da DEC é se ele basta para regras situacionais (entregues pelo handoff) ou precisa de etapa intermediária. Esta sessão sugere que basta — mas o teste real virá quando handoff materializar e gerar regras situacionais reais.

### Obs 3 — Promoção autônoma pelo agente NÃO foi necessária para qualidade emergente

**Evidência:** Claude sugeriu trade-offs e candidatas DEC, mas NUNCA promoveu autonomamente. Toda promoção (ADR `Proposta` → `Aceita`, reordenação Now, instanciação da spec) exigiu autorização textual explícita da owner. ChatGPT operou no mesmo modo. Resultado: nenhuma decisão foi cravada sem ato humano.

**Implicação para `[DEC-0024-D02]` (Handoff promove autonomamente?):** **NÃO.** Evidência empírica forte. A qualidade da sessão veio da CURADORIA do humano sobre sugestões dos agentes, não da promoção autônoma. Cravar `[DEC-0024-D02]` como "NÃO autônomo" no gate é coerente com o observado.

### Obs 4 — Curadoria humana morou no chat estruturado

**Evidência:** owner usou AskUserQuestion (do harness Claude Code) para forçar opções explícitas em momentos-chave (reordenação backlog; modo de abertura da spec; bootstrap híbrido). Cada decisão estrutural passou por uma pergunta dirigida. Em vez de chat livre.

**Implicação para `[DEC-0024-D03]` (Onde mora a curadoria humana?):** o modelo "sistema sugere opções estruturadas; humano confirma" funcionou bem na operação. Pergunta para a spec: esse padrão deve virar regra explícita do handoff (gerar slots de decisão quando contexto sugerir múltiplas direções)? Vale investigar contra Cursor session management e Anthropic dreaming.

### Obs 5 — Governance como eixo de primeira classe distinguiu as decisões desta sessão

**Evidência:** três decisões críticas desta sessão foram resolvidas **invocando explicitamente** princípios governance-first do framework:

1. **Manter ADR 0023 como `Proposta`** — invocação direta de "promoção exige aterrissagem, não acúmulo documental" (cláusula anti-paper).
2. **Spec 0024 research-first em vez de implementação direta** — invocação de "evidência precede design" + risco de "congelar ontologia cedo".
3. **Memory web-research pre-authorized via memory file estruturado** — invocação de regra 6 (sem shadow governance via memory) para separar "permission profile" de "operational governance".

Nenhum sistema externo estudado tem essa categoria de regras como invariante de primeira classe.

**Implicação para `[DEC-0024-F01..F03]`:** o diferencial governance-first não é só posicionamento de marketing — opera na decisão real, com latência baixa. Cravar como invariante (ADR nova?) tem suporte empírico. Decisão final depende do quanto a research externa convergir em validar a singularidade.

---

## Limitações desta evidência (honestidade epistêmica)

- **N = 1 sessão.** Sem replicação ainda. Precisamos observar mais sessões antes de generalizar. Esta é a primeira sessão deliberadamente observada com este framing.
- **Operada por owner experiente.** Aderência alta porque a owner já internalizou os contratos. Sessão equivalente com contribuidor externo novo provavelmente testaria de forma diferente.
- **Mista (humana + 2 IAs).** Não isola o efeito do handoff em si do efeito da composição tri-party. Sessões futuras podem isolar via baseline-comparison.
- **Auto-relato.** Claude observando Claude tem viés. Validação externa (review da owner, contraste com ChatGPT) atenua mas não elimina.

Honestidade explícita aqui é a única defesa contra usar esta sessão como prova circular ("a 0024 funcionará porque a sessão da 0024 funcionou").

---

## Convergências com transcrições externas

Pontos onde as observações desta sessão **batem** com sinais já extraídos das transcrições em `temp/transcricoes.md`:

- **Re-explicação de convenções por sessão é problema universal** (Lucas Montano vídeo Hermes: "quantas vezes essa semana tu teve que explicar a mesma coisa pro cloud?"). Esta sessão NÃO precisou re-explicar — handoff resolveu. Convergência.
- **Skill memory tiers em Hermes** ↔ **3-tier (universal/adapter/opt-in) em ai-guidelines**: estruturas paralelas. Hermes usa para agent skills; ai-guidelines usa para regras de governança. Sinal de pressão arquitetural comum, leituras diferentes.
- **Multi-model selection per task em Cursor SDK / Open Code** ↔ **provider-agnosticism em ai-guidelines (ADR 0018)**: convergência forte de mercado. Esta sessão usou Sonnet 4.6 + ChatGPT explicitamente — tri-party é o caso prático.

## Divergências com transcrições externas

- **Hermes faz skill auto-creation em runtime; ai-guidelines crava ADR 0018 contra isso.** Esta sessão executou skill curation (cravamento de regras situacionais) sem runtime autônomo — apenas humano + agentes em conversa estruturada. Sinal: o ai-guidelines pode atingir aprendizado SEM violar ADR 0018, via curadoria conversacional + cravamento em artefato.
- **Cursor SDK organiza sessões em VMs sandboxed; ai-guidelines não tem (e provavelmente não terá) runtime stateful equivalente.** Esta sessão operou inteiramente sobre git (memória persistente sob versionamento). Sinal: a portabilidade vem de git ser SSOT, não de sandboxes proprietárias.
