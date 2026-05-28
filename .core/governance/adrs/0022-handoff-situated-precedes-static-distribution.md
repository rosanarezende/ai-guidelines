# ADR 0022 — Handoff situado em estado precede distribuição pré-carregada de regras

**Status**: Proposta
**Origem histórica**: Spec 0023 sub-bloco pós-PR4 de validação empírica (2026-05-22, sessão de reflexão sobre handoff vs AGENTS.md).
**Relaciona-se com**:

- [`ADR 0018 — Governance-First, AI-as-Channel`](./0018-governance-first-ai-as-channel.md) — fundamenta a regra "nenhum LLM embutido no runtime". Este ADR 0022 preserva o invariante: handoff é geração determinística, não orquestração via modelo.
- [`ADR 0008 — Monolithic Runtime Compiler`](./0008-monolithic-runtime-compiler-governance.md) — formaliza o `<AI_GUIDELINES>` compilado in-line em `AGENTS.md` para combater Lost-in-the-Middle. Este ADR 0022 não revoga 0008; reposiciona o `AGENTS.md` como ponteiro de invocação + autoridade textual, e move a apresentação contextual para o handoff.
- [`ADR 0021 — Enforcement estrutural precede consciência comportamental`](./0021-enforcement-precedes-awareness.md) — relação complementar: 0021 fortifica a borda quando o agente sai dos trilhos; 0022 reduz a probabilidade de o agente entrar nos trilhos errados em primeiro lugar.

---

## Contexto

`ai-guidelines` passou por três deslocamentos sucessivos de problema:

**(1) Origem (2024–2025) — distribuição agnóstica de regras.** O projeto nasceu para resolver um problema técnico: garantir que cada IA usada (Claude, Copilot, Cursor, etc.) recebesse exatamente as mesmas regras. SSOT em `AGENTS.md` + automação de distribuição para os entrypoints específicos de cada IA (`.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md`, etc.). A premissa: o atrito era técnico — IAs seguiam mal instruções e divergiam entre canais.

**(2) Intermediário — governança de engenharia.** Com a evolução dos modelos, IAs passaram a seguir bem instruções claras; a inconsistência técnica caiu; CI passou a barrar mais drift; documentos ficaram organizados. O framework deixou de ser script de distribuição e virou sistema de governança de engenharia (Specs 0021, 0022, 0023 sucessivas).

**(3) Atual — desgaste mental humano na orquestração de IAs.** Durante a Spec 0023, uma nova dor emergiu, não mais técnica. Para avançar uma feature, o humano precisava lembrar a fase da spec, recuperar decisões antigas, descobrir dependências entre PRs, entender se a implementação estava autorizada, e reconstruir contexto inteiro a cada nova sessão. A governança começava a gerar exatamente o atrito que ela prometia eliminar.

A reação inicial — criar mais comandos no runtime (`workflow review`, `workflow approve`, `workflow execute`, `workflow continue`) — moveu o peso de "lembrar decisões" para "lembrar o próprio processo". Burocracia sofisticada disfarçada de framework.

ADR 0021 atacou parte do problema pelo lado do **enforcement estrutural** (L2 + L4), com o princípio `process awareness is not process enforcement`. Mas restava a outra face: **reduzir o desgaste humano antes do agente sair dos trilhos**, não apenas barrá-lo depois.

Validação empírica chegou durante o PR4-enforcement-runtime da própria Spec 0023 (2026-05-22). O owner redigiu um **handoff prompt denso** para iniciar uma sessão de IA em outra máquina/modelo (Antigravity CLI / Gemini 3 Flash). A IA receptora se localizou e seguiu processo de modo qualitativamente superior à mesma classe de sessão iniciada apenas com `AGENTS.md` estático.

A diferença observada não foi marginal. Foi de classe operacional. E é estruturalmente explicável:

- `AGENTS.md` ensina **processo** — atemporal, exaustivo, exige que o agente selecione internamente quais regras se aplicam ao próximo passo.
- O handoff entrega **estado** + **regras situacionais destacadas** + **ordem de leitura prescrita** + **primeiro turno scripted** — contexto situado no momento certo, na profundidade certa, para a pergunta certa.

A primeira abordagem é **stateless e pré-distribuída**. A segunda é **stateful e just-in-time**. As duas tratam de problemas diferentes — e a hipótese central deste ADR é que o centro de gravidade do projeto mudou da primeira para a segunda.

## Princípio

**`bootstrap de sessão IA é handoff situado em estado, não distribuição pré-carregada de regras`.**

Equivalente em inglês: **`AI session bootstrap is state-situated handoff, not pre-distributed rule sets`.**

Operacionalmente:

1. **Distribuição multi-canal vira segunda-classe.** `AGENTS.md`, `.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md` e equivalentes continuam existindo como **stubs orientativos** (≤ 10 linhas) apontando para o comando de handoff. Não são cópia integral de regras; são bootstraps de invocação.

2. **Handoff vira primeira-classe.** Um comando (`workflow handoff` ou modo expandido de `workflow continue`) gera contexto situado a partir dos artefatos vivos: estado atual da spec, ordem de leitura prescrita, regras situacionais destacadas, primeiro turno scripted.

3. **Conteúdo normativo permanece em SSOT.** `AGENTS.md` (compilado in-line com `<AI_GUIDELINES>` per ADR 0008), ADRs, decision-briefs, plans, tasks, state continuam sendo autoridade textual. O handoff é **camada de apresentação contextual** sobre essa autoridade, não autoridade própria.

4. **Geração é determinística.** Handoff é montado a partir de artefatos schematized (`state.yml`, `tasks.md`, `decision-brief.md`, `active-specs.yml`, ADRs vigentes). Nenhum LLM embutido no runtime (ADR 0018 preservado).

5. **Versão simples + versão híbrida, humano escolhe.** A geração determinística cobre ~80% do handoff útil. Para o ~20% redacional (qual regra destacar, narrativa temporal, primeiro turno scripted), duas saídas coexistem:
   - **(a) Versão simples:** comando emite handoff puramente determinístico — concatenação ordenada de artefatos relevantes + estado atual + lista das regras CORE aplicáveis ao próximo passo. Suficiente para boot leve.
   - **(b) Versão híbrida:** comando emite handoff determinístico + slots TODO marcados para humano refinar antes de colar (ex.: "[TODO: 1 frase de regra destacada]", "[TODO: 1 frase de narrativa temporal]"). Combina velocidade com julgamento humano.

   O humano escolhe via flag (`--simple` / `--hybrid`) ou via wizard. Cada modo é honesto sobre sua natureza; nenhum tenta substituir o outro.

6. **Avaliação condicional de necessidade.** Handoff completo é necessário apenas em boot frio. Para continuação dentro de fluxo existente, `workflow continue` resumido basta. Wizard CLI da Spec 0023 oferece a escolha explicitamente:
   - "Continuar trabalho atual" → `continue` resumido (sessão já tem contexto)
   - "Iniciar sessão IA nova" → `handoff` completo (sessão fresca, máquina nova, IA nova, spec nova)

   Esta avaliação **não é automática**. É decisão do humano operador no momento da invocação.

7. **Handoff não introduz autoridade nova.** Não decide fluxo, não orquestra ações, não infere próximo passo, não prioriza specs. É apresentação contextual de artefatos que já existem. Princípio `feedback-lookup-not-coordination` preservado.

## Opções avaliadas

| #   | Opção                                                                                                       | Trade-off                                                                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Status quo: apenas distribuição multi-canal (AGENTS.md + adapters por IA com cópia integral de regras).** | Funciona para distribuição de regras; falha em estado. Empiricamente insuficiente (sessão handoff > sessão AGENTS.md observada).                    |
| 2   | **Handoff primeira-classe + distribuição multi-canal como stub de invocação.**                              | Situa o agente no momento certo; reduz desgaste humano; preserva SSOT agnóstico e ADR 0018. **Escolhido.**                                          |
| 3   | **Abandonar distribuição multi-canal completamente.**                                                       | Quebra IAs que dependem de bootstrap por arquivo (ex.: Cursor lê `.cursorrules` automaticamente). Viola realidade técnica dos canais.               |
| 4   | **Handoff redigido por LLM (geração via modelo embutido no runtime).**                                      | Cobre os 20% redacionais perfeitamente; **viola ADR 0018** (LLM no runtime). Inaceitável.                                                           |
| 5   | **Handoff puramente determinístico (sem slots híbridos).**                                                  | Mantém ADR 0018; perde curadoria humana onde curadoria importa (regra destacada, narrativa temporal). Aceitável mas estritamente menor que opção 2. |

## Framing canônico anti-distorção

**Linguagem aceita:**

- "boot de sessão IA situado em estado"
- "handoff just-in-time"
- "redução de desgaste cognitivo na orquestração de IAs"
- "regras situacionais destacadas"
- "AGENTS.md como ponteiro de invocação"
- "apresentação contextual de artefatos vivos"

**Linguagem rejeitada:**

- ~~AI orchestration platform~~
- ~~context management engine~~
- ~~prompt engineering framework~~
- ~~AI session manager~~
- ~~handoff automation pipeline~~
- ~~knowledge graph for AI agents~~
- ~~AI context store~~
- ~~smart onboarding for AI~~

**Critério de teste:** se a descrição do mecanismo soar como produto de orquestração de IA, voltar ao framing canônico. Se o mecanismo justificar a descrição enterprise-AI, **rejeitar o mecanismo, não o framing.**

## Consequências

- **Imediatas (próxima spec após 0023):**
  - **Candidata `handoff-as-first-class`** (slug per ADR 0017 — número alocado apenas quando o branch for criado): materializar `workflow handoff` (ou expansão de `workflow continue` com 2 níveis: resumido / completo). Decisão de comando novo vs expansão fica para a spec.
  - **Wizard CLI da Spec 0023** (sub-bloco G ou H, conforme planning) oferece "Iniciar sessão IA nova" como opção que invoca handoff. Esta integração é o vínculo prático entre as duas specs.
  - Geração das duas variantes (simples / híbrida) decidida via flag CLI ou prompt do wizard.

- **De médio prazo:**
  - `AGENTS.md`, `.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md` migram gradualmente para stubs (≤ 10 linhas apontando para o handoff). Migração caso-a-caso por canal, não cutover atômico — alguns canais (ex.: Cursor) podem ter restrições próprias.
  - Conteúdo normativo permanece em `AGENTS.md` + ADRs + `.core/process/` — mas deixa de ser cópia repetida em N canais.
  - Validação empírica de qual versão (simples ou híbrida) é mais usada. Após ≥ 5 sessões reais, decidir se deprecar uma delas.
  - Avaliar se handoff genérico (todos os tipos de IA) é viável ou se classes diferentes de agente (modelo frontier vs IDE assistant local) demandam versões diferentes.

- **Não-consequências (importantes):**
  - **Não elimina `AGENTS.md`.** Conteúdo permanece SSOT autoritativo; apenas a forma de distribuição muda.
  - **Não introduz LLM no runtime.** Geração permanece determinística; ADR 0018 preservado.
  - **Não é workflow engine.** Princípio `feedback-lookup-not-coordination` preservado (cf. ADR 0021 framing). Handoff apresenta contexto; não decide fluxo.
  - **Não obriga adoção universal.** Sessões com contexto preservado (mesma IA, mesma sessão, mesma spec) continuam usando `continue` resumido.
  - **Não substitui enforcement.** ADR 0021 continua válido — handoff reduz probabilidade de saída dos trilhos; enforcement garante que saída detectada seja barrada. Os dois são complementares.

## Critério de revisão

Esta ADR deve ser revisada se:

- **Handoff comando se tornar opaco/manual a ponto de demandar geração via LLM no runtime.** Reabrir balanço determinístico vs redacional; possivelmente aceitar a versão híbrida como única e descartar a simples.
- **Mais de 1 classe de IA demonstrar incompatibilidade com handoff genérico.** Reabrir necessidade de adapters por classe de modelo (frontier vs local vs IDE-assistant), não apenas por canal.
- **`AGENTS.md` como stub se mostrar insuficiente para algum canal.** Por exemplo, IAs sem capacidade de invocar shell ou ler arquivos arbitrários — reabrir estratégia de distribuição para esses canais específicos.
- **Wizard CLI da Spec 0023 não materializar handoff como opção.** Reabrir decisão de integração; sem o vínculo prático, este ADR fica desconectado da operação.
- **Linguagem rejeitada acima começar a aparecer no projeto.** Revisar framing antes que o mecanismo derive em produto de orquestração de IA.
- **A versão híbrida virar pretexto para LLM-no-runtime "que ajuda a preencher os TODOs".** Reabrir item 5 da operacionalização — os TODOs são intencionalmente trabalho humano, não trabalho deferido para modelo embutido.

Sem nenhum desses gatilhos, esta ADR permanece estável como princípio perene.

## Origem empírica

Este princípio emergiu da observação direta durante o PR4-enforcement-runtime da Spec 0023 (2026-05-22). Uma sessão de IA iniciada com handoff redigido manualmente alcançou aderência ao processo qualitativamente superior à de sessões iniciadas apenas com `AGENTS.md` + arquivos por-IA. A diferença não foi marginal; foi de classe operacional. O handoff casou regras com estado, prescreveu ordem de leitura, destacou as 4–5 regras situacionalmente relevantes ao próximo passo, e scriptou o primeiro turno do agente — todos contornos que `AGENTS.md` estático não pode fornecer porque vive fora do tempo da spec.

A história mais ampla é importante para a compreensão futura. `ai-guidelines` passou por três deslocamentos sucessivos de problema, e cada um exigiu arquitetura diferente:

1. Distribuição agnóstica de regras (origem) — resolvida com SSOT + adapters por canal.
2. Governança de engenharia (intermediário) — resolvida com Specs, ADRs, lifecycle, gates.
3. Redução de desgaste mental humano na orquestração de IAs (atual) — em resposta a este ADR.

ADR 0021 (enforcement estrutural) foi a primeira resposta arquitetural ao problema (3) pelo lado da **barreira**: agentes saindo dos trilhos são detectados e barrados. Este ADR 0022 é a primeira resposta arquitetural ao mesmo problema pelo lado da **entrada**: agentes entrando em sessão recebem contexto situado para reduzir probabilidade de saída em primeiro lugar.

Os dois princípios são ortogonais e complementares: ADR 0021 fortifica a borda; ADR 0022 simplifica a entrada. Juntos formam o eixo de operação humano-IA do framework — proteção estrutural + onboarding contextual — sem precisar de mais comandos, mais arquivos por canal, ou mais rituais.

A frase do owner que sintetiza o porquê deste ADR existir:

> O verdadeiro desafio não era controlar modelos. Era reduzir o desgaste mental de trabalhar com eles todos os dias.

`ai-guidelines` começou tentando responder uma pergunta de 2024 ("como garantir que cada IA receba as mesmas regras?"). Em 2026 a pergunta mudou ("como preservar contexto, intenção, decisões e estado operacional sem obrigar humanos a reconstruírem tudo repetidamente?"). Este ADR formaliza o reconhecimento da nova pergunta como pergunta primária do projeto.
