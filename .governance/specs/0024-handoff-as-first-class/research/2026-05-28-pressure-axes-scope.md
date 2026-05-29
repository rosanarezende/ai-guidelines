# Research — Eixos de pressão e escopo da investigação comparativa

> **Data:** 2026-05-28
> **Spec:** [`../spec.md`](../spec.md)
> **DECs alimentados:** estrutural — define o **framework de research** que alimenta todos os DECs `[DEC-0024-*]`.

---

## Premissa

A research comparativa desta spec foi calibrada para **investigar pressões arquiteturais recorrentes**, não para catalogar features de ferramentas. A escolha vem da observação (cravada no preâmbulo do decision-brief): sistemas diferentes (Hermes, Cursor, Open Code, Anthropic Dreaming, Spec Kitty) resolvem o mesmo conjunto de pressões com lentes diferentes; o que importa para o ai-guidelines não é "como o Hermes faz X" mas "qual pressão X representa e onde mora a resposta governance-first dela".

## Camada fundacional — Bloco G (precede os eixos de pressão)

> Adicionada 2026-05-29 com a elevação da 0024 a spec fundacional de arquitetura de contexto. O Bloco G define _o que existe / como evolui / como se relaciona_; os 5 eixos abaixo operam **sobre** o que G decidir. `G00` é a **raiz** — nenhum eixo A-F estabiliza antes de G00.

**`G00` — unidade primária de modelagem.** A research **não** trata `pilar = unidade primária` como "direção provável", e sim como **uma entre hipóteses competitivas sérias**. As quatro candidatas são testadas em pé de igualdade, com obrigação explícita de **refutar**:

| Hipótese                           | Leitura                                                                                    | Sinal a buscar (Fonte B)                            |
| :--------------------------------- | :----------------------------------------------------------------------------------------- | :-------------------------------------------------- |
| `spec = unidade primária`          | status quo implícito                                                                       | o sistema organiza tudo por "spec/projeto"?         |
| `pilar = unidade primária`         | work-item kind (ADR 0010) como raiz                                                        | classifica por intenção de saída antes do artefato? |
| **`lifecycle = unidade primária`** | **contender forte** — muitos sistemas externos são lifecycle-centric, não artifact-centric | Hermes/Cursor/Spec Kitty modelam por estágio/fluxo? |
| `artefato = unidade primária`      | o documento como átomo                                                                     | é doc-driven puro?                                  |

**Disciplina de falsificação (anti-fechamento-prematuro de G00).** Existe uma hipótese favorita emergente (`unidade → pilares → taxonomia → pipeline → contrato → projeções`). Justamente por G00 ser tão fundacional — pode reinterpretar até G01-G05 —, a research **não pode virar validação da hipótese dominante**:

- As candidatas são testadas em pé de igualdade, e a lista das 4 **não é assumida exaustiva**: manter aberta a 5ª possibilidade — _unidade primária = categoria ainda não identificada_.
- **Fonte B tem papel ativo de tentar derrubar a favorita**, não de confirmá-la. G00 fecha por **sobrevivência à refutação**, não por acúmulo de confirmações.
- A research é **incompleta** se não tiver seriamente tentado refutar a favorita com ≥ 1 modelo externo alternativo (ex.: lifecycle-centric — vários sistemas externos o são).

**Risco dominante da spec (atualizado):** deixou de ser "escopo excessivo" e passou a ser **fechamento prematuro de G00**.

**Alimenta:** `[DEC-0024-G00]` (raiz), `G01` (7 pilares), `G02` (taxonomia de specs), `G03` (promotion pipeline), `G04` (contrato de boilerplate + core), `G05` (modelo de projeção).

**Duas fontes obrigatórias:** Fonte A (auditoria interna — artefatos/histórico + inventário) + Fonte B (research externa). Nenhuma DEC de G fecha só com Fonte A (anti-viés-de-confirmação).

---

## Os 5 eixos de pressão

Estrutura derivada da sessão de planejamento 2026-05-28 (refinamento via tri-party Rosana + Claude + ChatGPT sobre as 8 perguntas-pressão iniciais). Cada eixo agrupa perguntas que se reforçam mutuamente.

### Eixo 1 — Seleção

> Quem decide o que entra no contexto operacional do agente, quando e quanto.

- Quem faz seleção contextual? (agente / sistema / humano / combinação)
- Quando a seleção acontece? (boot único / per-turno / per-task / on-demand)
- Quanto contexto é descartado? (critério inclusão vs exclusão)

**Alimenta:** `[DEC-0024-A01]`, `[DEC-0024-A02]`, `[DEC-0024-A03]`.

### Eixo 2 — Persistência

> O que sobrevive entre sessões/máquinas/providers. Quem tem autoridade.

- O que persiste vs o que expira?
- Quem tem autoridade sobre persistência? (sistema / humano / híbrido)

**Alimenta:** `[DEC-0024-B01]`, `[DEC-0024-B02]`.

### Eixo 3 — Promoção

> Como observações viram regras situacionais reutilizáveis. Onde mora a curadoria humana.

- Como observações viram regras?
- Handoff promove autonomamente? (resposta defensiva já presumida: NÃO por ADR 0018)
- Onde mora a curadoria humana? (PR / wizard / hook / comando explícito)

**Alimenta:** `[DEC-0024-D01]`, `[DEC-0024-D02]`, `[DEC-0024-D03]`.

### Eixo 4 — Projeção

> Mesma SSOT, múltiplas projeções por consumidor.

- A mesma SSOT gera múltiplas projeções determinísticas?
- Como cada consumidor recebe contexto? (formato + densidade)
- Formato canônico por consumidor? (markdown / HTML / handoff / slice YAML / índice)

**Alimenta:** `[DEC-0024-E01]`, `[DEC-0024-E02]`, `[DEC-0024-E03]`.

### Eixo 5 — Governança

> Autoridade final, trilha auditável, diferencial governance-first.

- Quem tem autoridade sobre o que merece ser lembrado?
- Trilha auditável de projeções? (log/artifact versionado vs efêmero)
- Governance-first como invariante? (ADR nova vs leitura emergente)

**Alimenta:** `[DEC-0024-F01]`, `[DEC-0024-F02]`, `[DEC-0024-F03]`.

---

## Critério de saída da research (declarado antes de começar)

Para evitar drift / paralysis-by-analysis, a research desta spec fecha quando **todas** as condições abaixo forem satisfeitas:

0. **Bloco G fechado (precede tudo):** `G00`-`G05` `Resolved` no gate, cada uma com evidência **Fonte A + Fonte B**; `G00` resolvida **antes** de estabilizar qualquer DEC de A-F (invariante de ordem). G00 testou seriamente as 4 hipóteses de unidade primária (incl. `lifecycle`).
1. **Cobertura mínima por eixo:** cada um dos 5 eixos (A-F) tem ≥ 1 resposta evidence-backed nos artifacts.
2. **Convergência observável:** ≥ 2 sistemas estudados convergem em ≥ 2 dessas respostas (sinal de pressão arquitetural recorrente real, não idiossincrasia de um sistema).
3. **Preâmbulo robusto:** Bloco A do decision-brief cresce para ≥ 8 observações cravadas (já 5 na instanciação; ≥ 3 adicionais durante research).

Falha em qualquer critério = research continua. Atingir todos = `[0.Research]` fecha e abre `[0.Brief]` (popular opções).

---

## Sistemas alvo declarados

Lista canônica derivada da autorização da owner (sessão 2026-05-28). Cada sistema vira ≥ 1 artifact em `research/`.

| Sistema                             | Lente predominante                 | Artifact previsto                                                |
| :---------------------------------- | :--------------------------------- | :--------------------------------------------------------------- |
| Hermes Agent                        | skill auto-creation + memory tiers | `research/2026-05-28-hermes-agent.md` (a criar)                  |
| Cursor SDK                          | harness explícito                  | `research/2026-05-28-cursor-sdk.md` (a criar)                    |
| OpenCloud / OpenCode                | provider-agnostic orchestration    | `research/2026-05-28-opencloud-opencode.md` (a criar)            |
| Anthropic Dreaming in Cloud         | curated memory review              | `research/2026-05-28-anthropic-dreaming.md` (a criar — WebFetch) |
| Spec Kitty                          | spec-driven coordination           | `research/2026-05-28-spec-kitty.md` (a criar — WebFetch)         |
| Grafos (LangGraph/AutoGen/GraphRAG) | context-as-graph                   | _(condicional — owner recupera referência específica)_           |

## Matriz pressão × sistema (a preencher conforme research progride)

> Esta matriz é o **artefato de síntese central** da research. Cada célula é preenchida com uma resposta evidence-backed extraída do artifact do sistema correspondente. Células vazias indicam que a research daquele sistema ainda não cobriu aquele eixo (ou que o sistema não tem resposta clara — também sinal relevante).

|                                    | Seleção                                                                  | Persistência                                                                  | Promoção                                          | Projeção                                                            | Governança                                                             |
| :--------------------------------- | :----------------------------------------------------------------------- | :---------------------------------------------------------------------------- | :------------------------------------------------ | :------------------------------------------------------------------ | :--------------------------------------------------------------------- |
| **Hermes Agent**                   | _(pendente)_                                                             | _(pendente)_                                                                  | _(pendente)_                                      | _(pendente)_                                                        | _(pendente)_                                                           |
| **Cursor SDK**                     | _(pendente)_                                                             | _(pendente)_                                                                  | _(pendente)_                                      | _(pendente)_                                                        | _(pendente)_                                                           |
| **OpenCloud / OpenCode**           | _(pendente)_                                                             | _(pendente)_                                                                  | _(pendente)_                                      | _(pendente)_                                                        | _(pendente)_                                                           |
| **Anthropic Dreaming**             | _(pendente)_                                                             | _(pendente)_                                                                  | _(pendente)_                                      | _(pendente)_                                                        | _(pendente)_                                                           |
| **Spec Kitty**                     | _(pendente)_                                                             | _(pendente)_                                                                  | _(pendente)_                                      | _(pendente)_                                                        | _(pendente)_                                                           |
| **Grafos** _(condicional)_         | _(pendente)_                                                             | _(pendente)_                                                                  | _(pendente)_                                      | _(pendente)_                                                        | _(pendente)_                                                           |
| **ai-guidelines (baseline atual)** | governance-pr-check + wizard fazem lookup determinístico; agente consome | git é SSOT; provider memory banida da governança; tasks.md/state.yml situados | lifecycle spec→decision-brief→ADR (humano-curado) | wizard + briefing + state.yml (3 projeções); falta handoff completo | autoridade humana via PR; trilha em git; eixo único de primeira classe |

A linha **ai-guidelines (baseline atual)** já está preenchida porque é estado conhecido (não-research) — serve de baseline para comparação. Linhas dos sistemas externos são preenchidas via artifacts dedicados.

---

## Anti-padrões cravados (auditoria contínua durante research)

> Lista derivada dos não-objetivos do `spec.md` + advertência explícita do ChatGPT na sessão de planejamento. Qualquer artifact da research que derive para um destes anti-padrões deve ser refatorado para voltar ao framing correto.

1. **Pesquisar features ("como o Hermes implementa skill memory")** em vez de pressões ("como Hermes responde à pressão de promoção"). Sintoma: artifact com seções por funcionalidade do sistema externo. Correção: re-organizar por eixo.
2. **Promover "selection cost" ou "rules-as-catalog" a ADR antes de validar.** Síntese 2026-05-28 cravou: contorno ainda em formação. ADR seria prematuro até research consolidar.
3. **Tratar memória como objeto principal.** Memória é mecanismo; seleção é o problema. Auditoria: qualquer DEC ou artifact que coloque "memory" no centro precisa re-framing.
4. **Sugerir LLM no runtime para "preencher TODOs" do handoff.** Viola ADR 0018. Se a research apontar pressão para isso, é sinal de que o framing está errado, não que o framing precisa ceder.
5. **Conflar handoff (projeção) com learning loop (promoção).** Hermes faz as duas no mesmo runtime; ai-guidelines mantém separação canônica per ADR 0018 + 0022. Crítico para preservar identidade governance-first.

---

## Fontes primárias citáveis (até a data de instanciação)

**Vídeos comparativos** (URLs canônicas — fontes públicas auditáveis):

- **HTML é melhor que Markdown** (Lucas Montano): https://youtu.be/q1Sa7lNrhGU — argumento de projeções especializadas por consumidor (Markdown como SSOT vs HTML como projeção visual densa).
- **Hermes Agent: eu testei e não é só hype!** (Attekita Dev / Carol Tequita): https://youtu.be/6CrmA1Ll5gM — análise de skill auto-creation, 3-tier memory (session/persistent/skill), multi-model selection per task.
- **open code ta virando moda** (Lucas Montano): https://youtu.be/BfgBdef0Bmc — pressão econômica de custo de inferência; provider-agnosticism como diferencial estratégico (caso Microsoft cancelando Cloud Code).
- **por que eu migrei pro Cursor** (Lucas Montano): https://youtu.be/9YIClGLXIs4 — harness como produto ("modelo = 20%, harness = 80%"); sessões paralelas + context management; Cursor SDK anatomy.
- **por que todo mundo ta falando do Hermes** (Lucas Montano): https://youtu.be/7R-LAADt6rY — closed-loop skill learning system (5 etapas: task completion → pattern extraction → skill creation → skill refinement → periodic nudge); 3 camadas de memória; FTS5 (SQLite) para skill indexing.

**Repos a investigar via WebFetch:**

- **spec-kitty:** https://github.com/Priivacy-ai/spec-kitty (autorização web-fetch pre-aprovada).
- **Hermes Agent repo:** a localizar (NOS Research — confirmado pelas fontes acima).

**Buscas pendentes:**

- **Anthropic Dreaming in Cloud:** sem URL canônica conhecida (a buscar via WebSearch).

**Material de trabalho local** (não-citável diretamente em artefatos versionados):

- Transcrições brutas dos 5 vídeos em `temp/transcricoes.md` — mantidas para conferência durante o ciclo da spec (até encerramento da 0025); **não-versionadas por copyright** (vídeos do YouTube). Síntese estruturada e citações específicas migram para artifacts dedicados em `research/` per-sistema conforme research progride.

**Evidência da própria sessão de planejamento:**

- **Sessão 2026-05-28:** branch `feat/spec-0024-handoff-as-first-class`; tri-party Rosana Rezende + Claude Sonnet 4.6 + ChatGPT documentado em [`./2026-05-28-this-session-as-evidence.md`](./2026-05-28-this-session-as-evidence.md).
