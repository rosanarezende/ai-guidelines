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

## Continuação tri-party — 3º turno e seguintes (reviews tardios do ChatGPT)

> Após o bootstrap do PR #30 ter sido aberto, ChatGPT executou múltiplos turnos de revisão estruturada lendo os artifacts cristalizados — primeiro do PR #30 (3º turno), depois da iteração D04/obs#6 (4º turno), depois do PR #31 (5º turno). Esses turnos produziram insights que o handoff inicial + a sessão de planejamento + o próprio Copilot **não tinham gerado isoladamente**. Registrado aqui como evidência operacional de que tri-party itera e refina, não converge prematuramente.

### Obs 6 — Pipeline de promoção tem unidade nomeada faltando

**Evidência:** ChatGPT leu o decision-brief inteiro e identificou um buraco estrutural no Bloco D — Promoção. Citação direta da análise:

> Existe uma pergunta escondida que ainda não foi explicitada: **qual é a unidade promovível?** Hoje aparecem conceitos como observação, padrão, regra situacional, skill, insight, comportamento. Mas ainda não existe uma taxonomia clara entre eles. E sem isso, fica difícil responder: quando algo sobe de nível?

Essa pergunta **não emergiu** durante o handoff inicial nem durante a sessão de design da spec. Emergiu apenas quando um terceiro agente (ChatGPT) revisou os artifacts produzidos com olhar de "leitor que não estava na construção".

**Hipótese cravada (a confirmar via research):** pode existir cadeia tipo `observação → sinal recorrente → regra situacional → regra formal → ADR`, com critérios de elevação em cada degrau. Formalização emerge da research dos sistemas externos (Hermes nomeia "skill"; ai-guidelines nomeia "ADR", "CORE", "GR", "DEC", "regra situacional"; vocabulários precisam ser mapeados).

**Implicação imediata:** `[DEC-0024-D04]` cravada no decision-brief como **pré-requisito** para D01-D03 (todas pressupõem unidade nomeada). Sem D04, perguntas de promoção continuam mal-formuladas.

**Implicação metodológica:** tri-party não é só "duas opiniões + decisão humana". É **iteração contínua** onde cada turno pode revelar gaps que turnos anteriores não viram. ChatGPT como reviewer atrasado funcionou aqui porque ele veio sem o context da construção — apenas com os artifacts finais.

### Obs 7 — "Spec sobre handoff" foi recategorizada como "spec sobre governança de contexto"

**Evidência:** ChatGPT articulou em uma linha o que vinha emergindo nos turnos anteriores sem ser nomeado:

> O verdadeiro objeto da spec não é handoff. É **projeção governada**. O handoff virou apenas o primeiro consumidor.

Essa reformulação **não muda o conteúdo da spec** (já cravado: "seleção é o problema; governança é a restrição; handoff é a projeção"), mas crava nominalmente o que o slug `handoff-as-first-class` esconde. Mantemos o slug por cautela anti-rebranding-precoce; o spec.md já sinaliza que o slug pode evoluir para algo como `contextual-governance-and-handoff`.

**Implicação para Bloco E:** ChatGPT identificou Bloco E (Projeção) como "o melhor bloco" da brief porque captura o pivot conceitual (uma SSOT → múltiplos consumidores → múltiplas projeções: wizard, briefing, handoff, dashboard, agentes, humanos). Bloco E ganhou peso interpretativo sem mudança textual.

### Padrão metodológico observado neste 3º turno

ChatGPT validou afirmativamente vários pontos já cravados (research artifact como mais forte; evidence artifact com honestidade epistêmica; DECs com direção implícita evitando falsa neutralidade). Mas o **valor incremental** veio de:

1. **Identificar o gap não-falado** (unidade promovível) que nenhum turno anterior nomeou.
2. **Articular nominalmente o pivot conceitual** (governance of context vs handoff).
3. **Apontar que o risco principal não é mais escopo, é modelagem** — a research precisa cravar D04 antes de derivar implementação, ou seleção/projeção/governança ficam definidas mas o lifecycle continua sem objeto formal para promover.

### 4º turno — ChatGPT review da iteração D04/obs#6

Logo após o commit de integração (`f0cd562`), ChatGPT revisou o resultado. Pontos novos:

- **Sub-questão dupla em D04:** a DEC pergunta "qual é a unidade?" mas implicitamente carrega "qual o mecanismo de transição entre níveis?". Sem (b), taxonomia vira classificação estática, não lifecycle operacional. Registrado como bullet expansivo do contexto de `[DEC-0024-D04]` (não fragmentado em D05 — research pode confirmar se split vale).
- **Reading hierárquico emergente:** os 5 eixos podem ter ordem de dependência (`Unidades → Promoção → Seleção → Projeção → Governança`) — D04 não seria apenas DEC dentro de Bloco D, mas decisão central da spec inteira. Registrado como **observação** em NEXT.md sem ação estrutural (defere a research; reestruturação prematura violaria "não congelar ontologia").

### 5º turno — ChatGPT review do PR #31 (CI gate `state-yml:check`)

Após PR #31 ser mergeado, ChatGPT revisou o gate. Pontos novos:

- **PR #31 é micro-caso real dos eixos da 0024:** "estado → seleção → validação → gate → enforcement". O sistema deixa de depender da memória do operador; passa a depender de seleção determinística + autoridade central. **Bug encontrado em artefato da 0024, mas correção já demonstra um dos princípios que a 0024 está tentando formalizar.**
- **Pergunta derivada estrutural:** _"state.yml é apenas o primeiro artefato governado que sofre deste problema? Quais artefatos possuem invariantes estruturais que ainda dependem de comportamento humano em vez de enforcement sistêmico?"_ Esta pergunta generaliza o caso state.yml para meta-pergunta sobre governance enforcement. Cravada como `[DEC-0024-F04]` no Bloco F.

### Mecanismo cognitivo nomeável — "leitor tardio" vs "construtor"

Os turnos 3, 4 e 5 compartilham propriedade que merece nome formal. Não é "tri-party genérico" (qualquer 2ª opinião + decisão humana). É um **mecanismo cognitivo específico** — refinamento via ChatGPT 4º turno:

```text
construtor          → defende decisões tomadas durante a construção
construtor refinado → ajusta com nova informação, mas mantém context da construção
leitor tardio       → vê apenas artefatos cristalizados, sem context da construção
```

O **leitor tardio** tende a expor:

- **pressupostos ocultos** (premissas que ficaram implícitas durante a construção)
- **unidades não nomeadas** (objetos sem taxonomia formal — ex.: "unidade promovível" do D04)
- **saltos ontológicos** (mudanças de framing não-articuladas — ex.: "spec sobre handoff" → "spec sobre governança de contexto")
- **inconsistências de modelagem** (artefatos que descrevem coisas diferentes usando o mesmo vocabulário)
- **invariantes não-enforced** (regras dependentes de comportamento humano — ex.: schema state.yml validado só em runtime)

Essa distinção entre construtor e leitor tardio **não é redutível a "duas IAs revisarem"** — é diferente de posição cognitiva (defender vs ler frio). Padrão pode acabar sendo mais importante que "tri-party" como termo. Registrar aqui sem promover a ADR ainda; aguardar 1+ caso adicional fora desta sessão (per regra 7 de promoção).

### Contagem atualizada e implicação para `[1.H.10]` da 0023

Esta sessão já registra **5 turnos tri-party distintos** (não mais 3):

1. ChatGPT como 2ª opinião sobre cláusula anti-paper da ADR 0023 (reordenação do backlog)
2. ChatGPT estruturando os 5 eixos de pressão para a research
3. ChatGPT como **leitor tardio** dos artifacts do PR #30 (identificou unidade promovível → D04)
4. ChatGPT como **leitor tardio** da iteração D04 (refinou: 2 sub-questões em D04 + reading hierárquico)
5. ChatGPT como **leitor tardio** do PR #31 (generalizou: F04 — quais outros artefatos têm o mesmo padrão)

Turnos 3-5 são todos do mesmo padrão ("leitor tardio"). Critério de `[1.H.10]` da Spec 0023 ("≥ 2 specs adicionais OU adoção espontânea") já estaria satisfeito pela própria contagem. A pergunta para encerramento de Stage 1 deixa de ser "quando promover tri-party a ADR?" e passa a ser **"qual a formulação correta?"** — provavelmente cobre construtor/leitor-tardio como mecanismo central, não tri-party genérico.

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
