---
title: Tokens baseline e teto de orçamento do <AI_GUIDELINES>
spec: 0018-rules-content-deepening
bloco: B
sub-bloco: B.0
date: 2026-04-30
status: Stage 1 — research output (sem decisões cravadas)
informa:
  - "[DEC-0018-B03] Orçamento de tokens (teto por arquivo + agregado)"
  - "[DEC-0018-B02] Colocação por categoria (universal × por-IA × opt-in)"
  - "[DEC-0018-B06] Fronteira com Spec 0011 (regra-hierarquia)"
sources:
  - https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
  - https://code.claude.com/docs/en/best-practices
  - https://platform.claude.com/docs/en/build-with-claude/token-counting
  - https://docs.anthropic.com/en/api/messages-count-tokens
  - https://research.trychroma.com/context-rot
  - https://arxiv.org/abs/2307.03172
  - https://medium.com/@cem.karaca/my-claude-md-was-eating-42-000-tokens-per-conversation-heres-how-i-fixed-it-85ffba809bd4
  - https://www.humanlayer.dev/blog/writing-a-good-claude-md
  - https://hivetrail.com/blog/agents-md-vs-claude-md-cross-tool-standard
  - https://www.mindstudio.ai/blog/context-rot-claude-code-skills-bloated-files
  - https://claude-codex.fr/en/prompting/context-rot/
  - https://www.morphllm.com/context-rot
  - https://www.mindstudio.ai/blog/what-is-claude-md-file-ai-agents
  - https://www.mindstudio.ai/blog/context-rot-ai-coding-agents-how-to-prevent
---

# Tokens baseline e teto de orçamento do `<AI_GUIDELINES>`

## 1. Sumário executivo

Este documento mede empiricamente o tamanho atual do bloco `<AI_GUIDELINES>` compilado pelo Monolith Compiler (`cli/governance/monolith/compiler.mjs`), distribui o consumo por arquivo-fonte, e compara com (i) recomendações oficiais Anthropic sobre tamanho de `CLAUDE.md`, (ii) evidência empírica de degradação por contexto longo (Liu et al. 2024 "Lost in the Middle"; Chroma "Context Rot" 2025) e (iii) trajetórias documentadas de inflação em CLAUDE.md de produção.

**Achados-chave (sem decisões cravadas):**

- O `<AI_GUIDELINES>` mínimo (núcleo + global-rules + 3 adapters, sem opt-in) já consome **≈3,3 K–3,8 K tokens** em **238 linhas / 1.906 palavras / 13.354 caracteres**. Com `quality-gates` ativo (cenário default mais comum em consumidor) sobe para **≈3,9 K–4,5 K** (281 linhas). O cenário "tudo opt-in" (qg + tdd-pt + bdd-pt) chega a **≈4,9 K–5,5 K** (381 linhas).
- Os dois maiores _drivers_ do baseline mínimo são `AGENTS-core.md.tmpl` (1.078–1.232 tokens) e `global-rules.md` (1.114–1.273 tokens) — juntos respondem por **≈64 %** do mínimo. Adapters (claude/codex/gemini) somados pesam ≈1.040–1.188 tokens (≈31 %).
- A linha de produção dominante na literatura para `CLAUDE.md` é **<200–300 linhas** (Anthropic best-practices, HumanLayer). O compilado-min está em 238 linhas; o compilado-full em 381. **O compilado-full já cruza o teto declarado de 300 linhas em pelo menos uma referência canônica — sem que nenhum item editorial novo da Spec 0018 tenha entrado.**
- A tese "mais regras = mais aderência" é refutada por evidência empírica convergente: Anthropic afirma textualmente que _"Bloated CLAUDE.md files cause Claude to ignore your actual instructions"_ ([Claude Code best practices](https://code.claude.com/docs/en/best-practices)). Liu et al. 2024 e Chroma 2025 quantificam queda de recall em função do crescimento do contexto.
- Heurísticas chars/4 (banda baixa, padrão GPT-en) e chars/3,5 (banda alta, ajuste para PT-BR de morfologia mais granular) produziram bandas que coincidem dentro de ±5 % com a regra-de-bolso de Cem Karaca (Month 3: 400 linhas → 8 K tokens, ~20 tok/linha de prosa densa). O contador canônico é a [Anthropic Token Count API](https://platform.claude.com/docs/en/build-with-claude/token-counting) — gratuita, separada de billing — usada como follow-up de validação se o owner julgar necessário.

**O que este research _não_ decide** (ficam para `[DEC-0018-B03]`):

- Qual o teto por arquivo (≤ 1 K tokens? ≤ 2 K? ≤ 3 K?).
- Qual o teto agregado (≤ 5 K? ≤ 8 K? % do contexto típico?).
- Como tratar opt-in (excluir do teto agregado? incluir no pior caso?).
- Quando a hierarquia por subdiretório (Spec 0011) se torna mandatória.

## 2. Pergunta(s) que este research responde

| Pergunta                                                                                                      | Onde nesta análise                       |
| :------------------------------------------------------------------------------------------------------------ | :--------------------------------------- |
| Quantos tokens o `<AI_GUIDELINES>` compilado consome hoje, em três cenários (mínimo, default, full)?          | § 4.1 (compostos)                        |
| Como o consumo se distribui por arquivo-fonte? Que arquivos são os _drivers_ e que arquivos são folhas leves? | § 4.2 (fontes individuais)               |
| Que tetos a literatura externa sustenta para arquivos do tipo "instructions file" (CLAUDE.md / AGENTS.md)?    | § 5 (benchmarks externos)                |
| Há evidência empírica de degradação cognitiva quando o contexto cresce, e em que faixas?                      | § 6 (context rot)                        |
| Que trajetória de crescimento outros projetos documentaram, e que sintomas indicaram que o teto foi cruzado?  | § 7 (anti-padrões)                       |
| Como esses números informam `[DEC-0018-B02]`, `[DEC-0018-B03]` e `[DEC-0018-B06]` sem antecipar decisões?     | § 8 (implicações), § 9 (opções para B03) |
| Quais limites tem a medição feita aqui, e como validá-la se necessário?                                       | § 10 (limitações)                        |

## 3. Metodologia

### 3.1 Instrumentação

A medição foi obtida invocando diretamente o `compileMonolithicAgentsContent({...})` exportado em `cli/governance/monolith/compiler.mjs:39`, com inputs lidos do estado atual da branch `feat/spec-0018-rules-content-deepening` (commit-base `7b04e96`). Três cenários foram construídos:

- **Compilado-min**: `coreTemplate` + `globalRules` + 3 `providerRules` (claude/codex/gemini), sem opt-in. Aproxima o mínimo viável quando a CLI não recebe nenhuma feature opt-in editorial.
- **Compilado-qg**: + `opt-in/quality-gates.md` (cenário mais comum em consumidor que opta por _editorial baseline_).
- **Compilado-full**: + `tdd-pt.md` + `bdd-pt.md` (consumidor PT-BR ativando metodologias).

Os arquivos `tdd-en.md`/`bdd-en.md` foram medidos individualmente (variantes EN existem mas não compõem o cenário PT-BR default).

A construção do output é uma concatenação com separadores fixos (`\n\n---\n\n`, `wrapFeatureModule`, `buildSection`), sem transformação não-trivial — _portanto_ a soma dos inputs ≈ tamanho do output (overhead apenas dos separadores e dos heading "Zona Topo/Centro/Base"). Isso foi confirmado pela medição: compilado-min (13.354 chars) ≈ soma dos 6 fontes universais (13.273 chars) + ~80 chars de overhead estrutural.

### 3.2 Heurísticas de tokens

Sem chave Anthropic configurada para chamada da [Token Count API](https://platform.claude.com/docs/en/build-with-claude/token-counting), foram aplicadas três heurísticas independentes para triangulação:

- **Tok-L (banda baixa)**: `chars / 4`. Heurística clássica derivada do tokenizador GPT em inglês. Tende a subestimar para PT-BR.
- **Tok-H (banda alta)**: `chars / 3,5`. Ajuste empírico para PT-BR (morfologia mais rica → mais sub-word splits). Triangulado com a observação de que o tokenizer da família Claude — distinto do tiktoken — produz contagens em geral próximas mas levemente diferentes ([Propel Code, "Token Counting Explained"](https://www.propelcode.ai/blog/token-counting-tiktoken-anthropic-gemini-guide-2025)).
- **Tok-W (alternativa por palavras)**: `palavras / 0,75`. Heurística OpenAI-style "1 token ≈ 0,75 palavra".

A banda **Tok-L↔Tok-H** é o intervalo declarado no resto do documento. Tok-W aparece como _sanity check_; consistentemente cai abaixo de Tok-L (porque markdown estrutural — listas, tabelas, links — gera mais tokens do que palavras "normais").

### 3.3 Validação cruzada com regra-de-bolso de produção

A regra documentada por Cem Karaca em ["My CLAUDE.md Was Eating 42,000 Tokens"](https://medium.com/@cem.karaca/my-claude-md-was-eating-42-000-tokens-per-conversation-heres-how-i-fixed-it-85ffba809bd4) traz a trajetória empírica:

| Mês   | Linhas | Tokens (medidos) | Tokens/linha |
| :---- | -----: | ---------------: | -----------: |
| Mês 1 |   ~150 |           ~2.000 |        ~13,3 |
| Mês 3 |   ~400 |           ~8.000 |        ~20,0 |
| Mês 6 |   ~800 |          ~20.000 |        ~25,0 |
| Mês 9 |  1.207 |          ~42.200 |        ~35,0 |

Observação relevante: a razão tokens/linha **cresce com o tamanho** — porque arquivos maiores tendem a acumular prosa densa (parágrafos longos) e listas aninhadas em vez de bullet curto. O baseline atual deste repo tem ratios:

| Cenário        | Linhas | Tokens (Tok-H) | Tokens/linha |
| :------------- | -----: | -------------: | -----------: |
| Compilado-min  |    238 |          3.815 |        ~16,0 |
| Compilado-qg   |    281 |          4.472 |        ~15,9 |
| Compilado-full |    381 |          5.554 |        ~14,6 |

Os ~15–16 tok/linha do baseline atual ficam **entre** Mês 1 e Mês 3 do Karaca, consistente com o fato de o framework ainda ter conteúdo deliberadamente enxuto (PT-BR mais denso compensa o estilo bullet curto). Esta consistência é evidência de que a banda Tok-L↔Tok-H aplicada aqui não está grosseiramente errada para a ordem de grandeza desejada (decisões de orçamento).

## 4. Resultados — medição instrumental

### 4.1 Cenários compilados (output do `<AI_GUIDELINES>`)

| Cenário                                 | Linhas | Palavras |  Chars |  Bytes | Tok-L | Tok-H | Tok-W |
| :-------------------------------------- | -----: | -------: | -----: | -----: | ----: | ----: | ----: |
| compilado-min (core+global+3 adapters)  |    238 |    1.906 | 13.354 | 13.668 | 3.339 | 3.815 | 2.541 |
| compilado-qg (+ quality-gates)          |    281 |    2.232 | 15.652 | 16.022 | 3.913 | 4.472 | 2.976 |
| compilado-full (+ qg + tdd-pt + bdd-pt) |    381 |    2.796 | 19.440 | 19.906 | 4.860 | 5.554 | 3.728 |

### 4.2 Fontes individuais

| Arquivo                   | Linhas | Palavras | Chars | Bytes | Tok-L | Tok-H | Tok-W | % do compilado-min (Tok-H) |
| :------------------------ | -----: | -------: | ----: | ----: | ----: | ----: | ----: | -------------------------: |
| `AGENTS-core.md.tmpl`     |     67 |      614 | 4.313 | 4.426 | 1.078 | 1.232 |   819 |                       32 % |
| `AGENTS-pointer.md.tmpl`  |      8 |       49 |   346 |   353 |    87 |    99 |    65 |                        3 % |
| `global-rules.md`         |     37 |      634 | 4.457 | 4.562 | 1.114 | 1.273 |   845 |                       33 % |
| `claude.md` (adapter)     |     24 |      167 | 1.157 | 1.187 |   289 |   331 |   223 |                        9 % |
| `codex.md` (adapter)      |     24 |      175 | 1.242 | 1.273 |   311 |   355 |   233 |                        9 % |
| `gemini.md` (adapter)     |     67 |      256 | 1.758 | 1.786 |   440 |   502 |   341 |                       13 % |
| `opt-in/quality-gates.md` |     35 |      318 | 2.204 | 2.260 |   551 |   630 |   424 |      (opt-in, fora do mín) |
| `opt-in/tdd-pt.md`        |     37 |      277 | 1.818 | 1.859 |   455 |   519 |   369 |      (opt-in, fora do mín) |
| `opt-in/bdd-pt.md`        |     55 |      283 | 1.894 | 1.949 |   474 |   541 |   377 |      (opt-in, fora do mín) |
| `opt-in/tdd-en.md`        |     35 |      218 | 1.418 | 1.422 |   355 |   405 |   291 |              (variante EN) |
| `opt-in/bdd-en.md`        |     54 |      256 | 1.715 | 1.715 |   429 |   490 |   341 |              (variante EN) |

**Totalizadores:**

- Universais (linhas 1–6 da tabela): 13.273 chars ≈ **3.539 tokens** (banda média).
- Opt-in editorial PT-BR + EN (5 arquivos): 9.049 chars ≈ **2.413 tokens** (banda média). Em consumidor, **só os ativados entram no compilado**; o pior caso "tudo PT" soma ≈1.690 tokens em opt-in.

### 4.3 Observações sobre a distribuição

- **Adapters representam 31 % do compilado-min**, dos quais `gemini.md` sozinho é 13 % (67 linhas, mais longo que `claude.md` e `codex.md` combinados em linhas, embora o tamanho em tokens seja ~50 % maior, não 200 % — gemini usa mais blocos curtos e rotulados).
- `global-rules.md` (33 %) já é o maior contribuinte unitário pós-b9efb83 — antes do merge era menor. Re-medir após reconciliação é mandatório se conteúdo for revisado em `[DEC-0018-B08]`.
- `AGENTS-pointer.md.tmpl` é desprezível (3 %, 99 tokens) — qualquer corte ali não move agulha.
- `quality-gates.md` (550–630 tokens) é o maior arquivo opt-in unitário; já está abaixo do _ceiling_ de 2 K–3 K tokens recomendado pelo MindStudio para "skill files" ([context-rot Claude Code Skills](https://www.mindstudio.ai/blog/context-rot-claude-code-skills-bloated-files)) — mas ainda assim é **2,8 ×** maior que `claude.md` ou `codex.md`.

## 5. Benchmarks externos sobre orçamento de instruções

### 5.1 Anthropic — recomendações oficiais

[Claude Code best practices](https://code.claude.com/docs/en/best-practices) (acesso 2026-04-30) declara textualmente:

> "Most best practices are based on one constraint: Claude's context window fills up fast, and performance degrades as it fills."

> "There's no required format for CLAUDE.md files, but keep it short and human-readable."

> "Bloated CLAUDE.md files cause Claude to ignore your actual instructions!"

> "If Claude keeps doing something you don't want despite having a rule against it, the file is probably too long and the rule is getting lost."

> "Treat CLAUDE.md like code: review it when things go wrong, prune it regularly, and test changes by observing whether Claude's behavior actually shifts."

O exemplo canônico mostrado no documento da Anthropic tem **6 linhas no total** (2 itens em "Code style" + 2 em "Workflow"). Não há número absoluto cravado, mas a postura editorial é "comprimir até doer".

### 5.2 Anthropic — context engineering blog (29 set 2025)

["Effective context engineering for AI agents"](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents):

> "Context [is] a finite resource with diminishing marginal returns."

> "Context rot emerges across all models as token counts increase, though some models exhibit more gentle degradation than others."

> A meta declarada: "find the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome".

Não há número absoluto, mas o framing arquitetural é claro: tratar contexto como **orçamento** (não como capacidade abundante).

### 5.3 HumanLayer

[HumanLayer "Writing a good CLAUDE.md"](https://www.humanlayer.dev/blog/writing-a-good-claude-md):

> "general consensus is that < 300 lines is best, and shorter is even better."

> "At HumanLayer, our root CLAUDE.md file is _less than sixty lines_."

### 5.4 AGENTS.md (Hivetrail / cross-tool standard)

["AGENTS.md vs CLAUDE.md"](https://hivetrail.com/blog/agents-md-vs-claude-md-cross-tool-standard):

> "frontier thinking LLMs can reliably follow roughly 150–200 instructions"

> "Every instruction in your file competes for attention on every single interaction, not just when relevant."

> Template mínimo proposto: ~25–30 linhas.

### 5.5 Claude Code Skills — budget para arquivos atômicos

[MindStudio "Context rot in Claude Code skills"](https://www.mindstudio.ai/blog/context-rot-claude-code-skills-bloated-files):

> "a practical rule of thumb is to keep it under 2,000–3,000 tokens (roughly 1,500–2,000 words)"

> "Pick a threshold — say, 2,000 tokens per file — and treat exceeding it as a signal to audit, not to expand."

> Princípio fundamental: "optimize for useful-to-total content ratio rather than absolute brevity. Document only the delta — the things that differ from sensible defaults."

### 5.6 Síntese das referências

| Referência                         | Métrica                    | Valor proposto                           | Aplicação no `ai-guidelines`                                                 |
| :--------------------------------- | :------------------------- | :--------------------------------------- | :--------------------------------------------------------------------------- |
| Anthropic best-practices           | Atitude editorial          | "keep it short"                          | Princípio guia; sem número                                                   |
| Anthropic context-engineering blog | Princípio                  | "smallest set of high-signal"            | Princípio guia; sem número                                                   |
| HumanLayer                         | Linhas para CLAUDE.md raiz | <300 (ideal <60)                         | Compilado-min está em 238 ✅ ; full em 381 ❌ (acima do ceiling de <300)     |
| AGENTS.md (Hivetrail)              | Instruções/sessão          | 150–200                                  | Item-count: global-rules tem 20 itens; com adapters/opt-in pode chegar perto |
| MindStudio (skills)                | Tokens por arquivo         | <2.000–3.000                             | Cada arquivo individual está abaixo (max é qg com 630 Tok-H) ✅              |
| Cem Karaca (CLAUDE.md trajetória)  | Watershed                  | 200 linhas é "tax on every conversation" | Compilado-min está em 238 ✅ borderline                                      |

**Observação metodológica:** as referências divergem na unidade (linhas vs tokens vs instruções) e nenhum número é universalmente sancionado pela Anthropic. Para `[DEC-0018-B03]`, a opção é (a) escolher uma unidade canônica para o framework, (b) registrar a unidade na linha de `global-rules.md` e (c) instrumentar lint para enforcement.

## 6. Evidência empírica de degradação por contexto longo

### 6.1 "Lost in the Middle" (Liu et al. 2024, TACL)

[arXiv 2307.03172](https://arxiv.org/abs/2307.03172). Achado central:

> "performance is often highest when relevant information occurs at the beginning or end of the input context, and significantly degrades when models must access relevant information in the middle of long contexts."

A curva é em **U** — informação no meio do contexto sofre degradação até para modelos explicitamente long-context. Implicação para colocação (`[DEC-0018-B02]`): o ordem de inserção dentro do `<AI_GUIDELINES>` matérize. O Monolith Compiler atual coloca:

1. **Topo**: `coreTemplate` + `globalRules` + adapters (já posicionado em vantagem).
2. **Centro**: opt-in (FEATURE\_\*) — pior posição segundo Liu et al.
3. **Base**: pointer (também vantagem por ser fim).

Regras críticas no centro (opt-in) podem ter recall menor que regras universais (topo). Esta é uma _pré-condição_ de design já presente, não um problema novo introduzido pela 0018, mas **deve ser discutida em `[DEC-0018-B02]`** quando se decidir o que é universal vs opt-in.

### 6.2 Chroma "Context Rot" (2025)

[Chroma research "Context Rot"](https://research.trychroma.com/context-rot) (acesso indireto via [Morph LLM](https://www.morphllm.com/context-rot) e [WandB](https://wandb.ai/byyoung3/ml-news/reports/Chroma-Research-Warns-of-Context-Rot-as-LLMs-Falter-with-Long-Inputs--VmlldzoxMzczMjQ4MQ)):

- 18 modelos frontier testados (GPT-4.1, Claude Opus 4, Gemini 2.5 Pro, Qwen3-235B, etc.).
- 8 comprimentos de input variados.
- Achado: degradação ocorre **em cada incremento de comprimento**, não só perto do limite anunciado.
- Citação derivada: _"A model with a 200K token window can exhibit significant degradation at 50K tokens."_
- Quanto ao posicionamento: information no meio mostra **>30 % de queda de acurácia** comparado a início/fim.

### 6.3 Trajetórias de "dumb zone" em uso real

[Claude Codex, "Context Rot"](https://claude-codex.fr/en/prompting/context-rot/) traz números observacionais (não medidos formalmente, mas convergentes):

- "Beginner users with vague prompts": dumb zone começa em **30 % de fill**.
- "Experienced users with structured prompts": dumb zone começa em **60 % de fill**.
- Tarefas simples: 60 %; tarefas complexas multi-arquivo: 30–40 %.
- Para janela 200 K: degradação aparece **entre 60 K e 150 K tokens**.

Citação (Boris Cherny): _"Claude loses precision well before the hard limit. The advertised window isn't the usable window."_

### 6.4 O que "context rot" significa para esta spec

O `<AI_GUIDELINES>` é injetado **a cada sessão**. Não é o único consumidor do contexto: ferramentas, mensagens de turno, arquivos lidos pelo agente também entram. Em uma sessão típica de Claude Code com 4–6 arquivos lidos (~10–20 K tokens cada agente médio segundo MindStudio), o `<AI_GUIDELINES>` competirá por _attention budget_ contra:

- System prompt do agente (oculto, ≈ 5–15 K tokens segundo análises de Claude Code).
- Conteúdo de arquivos abertos.
- Histórico de turnos.
- Outputs de tools (test runs, git diff).

**Heurística operacional derivada (sem decisão cravada):** se assumirmos um budget de _attention para sistema/regras_ de ~10 % de uma janela usável de 60–150 K tokens (dumb zone watershed), o teto agregado para `<AI_GUIDELINES>` cabe em **6.000–15.000 tokens**. O baseline-min atual (3,3–3,8 K) está em ~25–55 % desse teto; o full (4,9–5,5 K) em ~33–80 %. Há folga, mas **a folga encolhe rápido** se o Bloco B adicionar regras sem corte editorial.

## 7. Anti-padrões observados em CLAUDE.md de produção

### 7.1 O caso Cem Karaca (mês 9, 42 K tokens)

O autor documenta o ciclo de inflação típico:

1. **Mês 1** (150 linhas / ~2 K tokens): sinal claro, prosa concisa, tudo universal.
2. **Mês 3** (400 linhas / ~8 K tokens): "começou a ficar gordo" — incorporação de regras situacionais.
3. **Mês 6** (800 linhas / ~20 K tokens): passou a comer 19 % do contexto antes de começar a tarefa.
4. **Mês 9** (1.207 linhas / 42,2 K tokens): **40 % do contexto** consumido por CLAUDE.md.

Pós-rebalanceamento: **72 linhas / ~1,9 K tokens** — redução de 95 %. Classificação aplicada:

- **UNIVERSAL** (manter): 15 % do conteúdo original.
- **TASK-SPECIFIC** (mover para skills): 60 %.
- **DEEP-DIVE** (mover para references): 15 %.
- **OBSOLETE** (deletar): 10 %.

Implicação para Spec 0018: os números de Karaca _ratificam a tese da 0018_ — o conteúdo do b9efb83, mesmo se 100 % correto editorialmente, tem que passar pelo filtro "isto entra em **toda** sessão? Em **toda** stack? Em **todo** repo?" antes de ser promovido a universal. As mesmas perguntas estão na construção das opções de `[DEC-0018-B02]`.

### 7.2 Sintomas observáveis de teto cruzado

[MindStudio](https://www.mindstudio.ai/blog/context-rot-claude-code-skills-bloated-files) lista sinais práticos para auditoria:

1. **Instruções ignoradas** — agente sabe da regra mas usa padrão diferente. _"the instruction exists but is competing with too much surrounding noise."_
2. **Outputs genéricos** — código que parece competente mas não segue o padrão do projeto.
3. **Degradação de sessão** — agente afiado nos primeiros turnos, repetitivo a partir do 10º.
4. **Crescimento monotônico** — arquivos só ganham conteúdo, nunca passam por _audit_.
5. **Custos inexplicáveis de tokens** — correlação direta com tamanho do contexto.

Implicação editorial: `[DEC-0018-B03]` pode adotar **ceiling** + **trigger de auditoria** (vide MindStudio: "treat exceeding it as a signal to audit, not to expand"). Padrão sugerido (a confirmar): teto soft + revisão obrigatória ao cruzar.

## 8. Implicações por ponto `[DEC-*]`

### 8.1 Para `[DEC-0018-B02]` — colocação por categoria

- **Universais** entram em `global-rules.md` (zona topo do compilado, posição vantajosa segundo Liu et al.). Hoje pesa 1.114–1.273 tokens / 37 linhas.
- **Adapters por IA** entram em `claude/codex/gemini.md` (também zona topo). Pesos atuais: 289–502 tokens cada. **Trade-off**: adapter cresce linear com número de IAs suportadas (3 hoje); cada adição soma ≈300–500 tokens.
- **Opt-in editorial** entra em `opt-in/*.md` (zona centro — pior posição segundo Liu et al. para recall). O Monolith Compiler já isola via `<FEATURE_*>` tags; consumidor que não opta paga 0 tokens. **Mas a posição central impacta enforcement** mesmo quando ativado.
- **Hierarquia por subdiretório (Spec 0011)** ainda não existe; quando existir, abre uma 4ª colocação (`opt-in/<categoria>/*.md`). Isso é endereçado em `[DEC-0018-B06]`.

### 8.2 Para `[DEC-0018-B03]` — orçamento

Os dados sustentam três famílias de opções (sem cravar, vide § 9 abaixo):

- **Família A — teto absoluto agregado** (ex.: ≤ 5 K tokens compilados). Pró: simples de medir/lintar. Contra: arbitrário; ignora variabilidade entre consumidores.
- **Família B — teto absoluto por arquivo** (ex.: ≤ 1 K tokens por arquivo universal; ≤ 750 por adapter; ≤ 1,5 K por opt-in). Pró: granular; localiza inflação. Contra: agregado pode crescer mesmo com cada arquivo dentro do limite.
- **Família C — teto relativo** (ex.: agregado ≤ 5 % de janela usável de 100 K). Pró: escala com tamanho do modelo de referência. Contra: requer explicar o cálculo na documentação.
- **Família D — soft ceiling + trigger de auditoria** (ex.: ≥ 5 K = audit obrigatório, sem hard ceiling). Pró: alinhado com MindStudio; preserva flexibilidade. Contra: enforcement depende de processo, não de lint.

### 8.3 Para `[DEC-0018-B06]` — fronteira com Spec 0011

A medição informa quando a hierarquia por subdiretório (Spec 0011) deixa de ser "feature requested" e vira "necessária":

- **Trigger candidato 1**: agregado compilado ≥ X tokens (X a definir em B03; sugestivamente 6–8 K).
- **Trigger candidato 2**: número de arquivos opt-in ≥ Y (atual: 3 + 2 variantes EN; se chegar a 8–10, o cliente do framework precisa de scoping).
- **Trigger candidato 3**: instruções/regras agregadas ≥ 150 (referência AGENTS.md "150–200 instruções"). Atual: ≈ 50 itens em global-rules + adapters + qg.

Vai como débito declarado em `NEXT.md` se a 0018 não consumir os triggers; vira pré-requisito da 0011 (já registrado em `roadmap/backlog.md`).

## 9. Opções a registrar em `[DEC-0018-B03]` (sem decisão)

A síntese acima sugere as seguintes opções estruturadas para o `decision-brief.md` quando B.1.3 for executada (no Stage 1 deste mesmo passe):

### 9.1 Sub-eixo: granularidade do teto

| Opção | Granularidade                  | Pró                              | Contra                                |
| :---- | :----------------------------- | :------------------------------- | :------------------------------------ |
| A     | Apenas teto agregado           | Simples de medir e comunicar     | Ignora _drivers_ individuais inflados |
| B     | Apenas teto por arquivo        | Localiza inflação cirurgicamente | Agregado pode crescer no acúmulo      |
| C     | Ambos (por arquivo + agregado) | Defesa em profundidade           | Mais regra para manter / lintar       |

### 9.2 Sub-eixo: tipo de teto

| Opção | Tipo                             | Pró                                    | Contra                                                            |
| :---- | :------------------------------- | :------------------------------------- | :---------------------------------------------------------------- |
| A     | Hard ceiling (lint falha)        | Enforcement determinístico             | Pode bloquear PR legítimo; tendência a "comentar pra desbloquear" |
| B     | Soft ceiling + audit obrigatório | Alinhado com MindStudio; preserva flex | Enforcement por processo (humano)                                 |
| C     | Soft → Hard escalonado           | Aviso antes de bloquear                | Mais complexo; 2 thresholds                                       |

### 9.3 Sub-eixo: valores numéricos candidatos (a calibrar)

Os números abaixo são **candidatos derivados da evidência**, não recomendações cravadas. Dois pontos âncora:

- _Ancora otimista_: Anthropic best-practices + HumanLayer recomendam <60–300 linhas. Compilado-min em 238 linhas está dentro. Compilado-full em 381 linhas está acima.
- _Ancora pessimista_: o `<AI_GUIDELINES>` co-existe com sistema, mensagens, tool-output. Reservar 5–10 % de janela usável de 60–150 K tokens (dumb zone Claude Codex) ⇒ 3 K–15 K tokens de envelope.

| Opção | Teto agregado | Teto por arquivo (universal)   | Teto por arquivo (adapter) | Teto por arquivo (opt-in) |
| :---- | :------------ | :----------------------------- | :------------------------- | :------------------------ |
| A     | ≤ 4 K tokens  | ≤ 1.000 tok                    | ≤ 400 tok                  | ≤ 800 tok                 |
| B     | ≤ 6 K tokens  | ≤ 1.500 tok                    | ≤ 600 tok                  | ≤ 1.200 tok               |
| C     | ≤ 8 K tokens  | ≤ 2.000 tok                    | ≤ 800 tok                  | ≤ 1.500 tok               |
| D     | ≤ 10 K tokens | ≤ 3.000 tok (regra MindStudio) | ≤ 1.500 tok                | ≤ 3.000 tok               |

**Posição atual de cada arquivo (Tok-H):** core 1.232 (cabe em ≥ B); global-rules 1.273 (cabe em ≥ B); adapters max 502 (cabe em todas); opt-in max 630 (cabe em todas). Compilado-min 3.815 (cabe em ≥ B); compilado-full 5.554 (cabe em ≥ B; **estoura A**).

### 9.4 Sub-eixo: enforcement / instrumentação

| Opção | Enforcement                                                                            | Pró            | Contra                                              |
| :---- | :------------------------------------------------------------------------------------- | :------------- | :-------------------------------------------------- |
| A     | Manual (revisão de PR)                                                                 | Sem código     | Drift inevitável                                    |
| B     | Lint custom em `cli/governance/monolith/` que mede chars e falha se exceder Tok-H/teto | Determinístico | Heurística pode divergir de Anthropic API por ±10 % |
| C     | Lint que chama `messages.count_tokens` da Anthropic API em CI                          | Canônico       | Requer secret no CI; rate-limit; latência           |
| D     | B (heurística como gate) + C opcional (sanity check periódico)                         | Compromisso    | 2 mecanismos                                        |

## 10. Limitações da medição

1. **Heurística vs tokenizer canônico**: Tok-L/Tok-H diferem do que a Anthropic API contaria em até ~10 % (ordem de grandeza informada por [Propel Code "Token Counting Explained"](https://www.propelcode.ai/blog/token-counting-tiktoken-anthropic-gemini-guide-2025)). Para decisões com tolerância ≥ 20 %, a heurística é suficiente; para tolerância < 10 %, validar via [`messages.count_tokens`](https://docs.anthropic.com/en/api/messages-count-tokens) (gratuito, mas requer ANTHROPIC_API_KEY).
2. **Unidade-alvo**: Anthropic publica recomendações em **linhas**; MindStudio em **tokens**; AGENTS.md em **instruções**. Conversões cross-unidade são aproximadas. Recomenda-se cravar **uma** unidade primária no framework (B03) e converter as outras como derivadas.
3. **Agnosticismo de modelo**: o tokenizer da família Claude é distinto de tiktoken (GPT) e do tokenizer do Gemini. As três famílias produzem contagens diferentes para o **mesmo** texto. Para um framework "AI-agnostic", a opção pragmática é usar a banda Tok-L↔Tok-H como aproximação cross-modelo; documentar que o ceiling é "operacional", não "exato".
4. **Sessão real ≠ envelope mínimo**: o compilado-min mede o `<AI_GUIDELINES>` injetado pelo runtime. A sessão real soma system-prompt do harness, mensagens, leituras, outputs. Os tetos em § 9 referem-se ao envelope que esta spec controla; não substituem instrumentação fim-a-fim no harness (escopo Spec 0009).
5. **Não-medido**: não foi rodado eval com prompts canônicos para correlacionar tamanho × erro. Isso é escopo de `[DEC-0018-B05]` e da `research/2026-04-30-empirical-bugs-ai-code.md`.

## 11. Próximos passos

- `[DEC-0018-B03]` (Stage 1, sub-bloco B.1.3): popular o `decision-brief.md` com as opções de § 9, status `Pendente`.
- `[DEC-0018-B02]` (B.1.2): cross-ref para esta § 8.1 ao popular opções de colocação.
- `[DEC-0018-B06]` (B.1.6): cross-ref para esta § 8.3 ao popular triggers para Spec 0011.
- **Pós-gate (Stage 2)**: implementar lint de tokens conforme opção escolhida em § 9.4. Medir `<AI_GUIDELINES>` _após_ qualquer reconciliação do conteúdo b9efb83 (`[DEC-0018-B08]`) e registrar diff em `research/2026-04-30-tokens-postimpl.md` (novo arquivo, opcional).
- **Validação canônica (opcional, Stage 2)**: rodar `messages.count_tokens` da Anthropic API contra os 3 cenários compilados; documentar diff entre Tok-H e contagem oficial.

## 12. Sources

Provedores e referências oficiais:

- Anthropic Engineering, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), 29 set 2025.
- Anthropic, [Claude Code best practices](https://code.claude.com/docs/en/best-practices), acesso 2026-04-30.
- Anthropic, [Token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting).
- Anthropic, [Count tokens in a Message — API reference](https://docs.anthropic.com/en/api/messages-count-tokens).

Pesquisa empírica:

- N. F. Liu et al., [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172), TACL 2024.
- Chroma, [Context Rot: How Increasing Input Tokens Impacts LLM Performance](https://research.trychroma.com/context-rot), 2025.

Análises práticas e benchmarks de produção:

- Cem Karaca, [My CLAUDE.md Was Eating 42,000 Tokens Per Conversation](https://medium.com/@cem.karaca/my-claude-md-was-eating-42-000-tokens-per-conversation-heres-how-i-fixed-it-85ffba809bd4), Medium.
- HumanLayer, [Writing a good claude.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md).
- Hivetrail, [AGENTS.md vs CLAUDE.md: cross-tool standard](https://hivetrail.com/blog/agents-md-vs-claude-md-cross-tool-standard).
- MindStudio, [What is context rot in Claude Code skills?](https://www.mindstudio.ai/blog/context-rot-claude-code-skills-bloated-files).
- MindStudio, [What is the Claude.md File and Why Does It Matter?](https://www.mindstudio.ai/blog/what-is-claude-md-file-ai-agents).
- MindStudio, [Context rot in AI coding agents — how to prevent it](https://www.mindstudio.ai/blog/context-rot-ai-coding-agents-how-to-prevent).
- The Claude Codex, [Context rot: why 1M tokens isn't 1M useful tokens](https://claude-codex.fr/en/prompting/context-rot/).
- Morph LLM, [Context rot: why LLMs degrade as context grows](https://www.morphllm.com/context-rot).
- Propel Code, [Token Counting Explained: tiktoken, Anthropic, and Gemini](https://www.propelcode.ai/blog/token-counting-tiktoken-anthropic-gemini-guide-2025).

Cross-references internas:

- `.specify/specs/0018-rules-content-deepening/research/2026-04-30-benchmark-rules-content.md` (provedores e OSS curado).
- `.specify/specs/0018-rules-content-deepening/research/2026-04-30-empirical-bugs-ai-code.md` (informa B.1.5).
- `cli/governance/monolith/compiler.mjs` (instrumento da medição).
- `roadmap/backlog.md` (`regra-hierarquia` em "Now"; pré-requisito 0018 mergeada).
