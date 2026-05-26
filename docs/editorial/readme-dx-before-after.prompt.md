<!--
  Imagem 2 — Variante C: Antes/depois do contexto fragmentado.

  Foco: o framework resolve fragmentação real de contexto operacional —
  instruções avulsas, memory local não-portável, decisões esquecidas em
  PRs fechados. Mostra contraste entre "sem framework" e "com framework"
  através de DENSIDADE e ORGANIZAÇÃO, não através de marketing.

  Calibragem cravada nesta versão (após auditoria 2026-05-23):

  - Painel ANTES NÃO mostra `AGENTS.md`/`CLAUDE.md`/`.cursorrules` como
    caos — são exatamente o que o framework entrega. Mostra fragmentação
    real: prompts copiados de blog, memory local de IA não-portável,
    instruções em mensagem de Slack, decisões esquecidas em PR fechado.
  - Painel DEPOIS mostra o que o framework entrega HOJE: `.governance/`
    com registry/specs/runtime, providers entrypoints sincronizados,
    enforcement L2.
  - Caption central: 2-3 alternativas para escolher na hora de gerar.
    Frase de ADR 0022 ("desgaste mental") é referência indireta, não
    tese principal — ADR 0022 ainda em Proposta.

  Específica do framework (não invocável via wizard CLI). Testa lado a
  lado com `readme-dx-flow.prompt.md` (A) e
  `readme-dx-capability.prompt.md` (B) antes de escolher.

  Como usar:
  1. Cole o bloco `<prompt>` em IA de geração/orientação de imagem.
  2. **ESCOLHA 1 das 2-3 alternativas de CAPTION INFERIOR** antes de
     enviar à IA (instruções no próprio bloco).
  3. Salve como `docs/assets/ai-guidelines-dx-before-after.png`.
-->

<prompt>
Composição editorial-tech em dark mode para o projeto ai-guidelines — segunda capa do README com foco no contraste entre contexto operacional fragmentado vs. contexto governado.

A imagem comunica visualmente que o framework resolve fragmentação real — não vende redenção. Mesmo trabalho, ritmos diferentes; o que muda é onde o contexto vive.

Visual alinhado à identidade de rosanarezende.com:

- elegante
- técnico
- respirado
- conceitual
- sistêmico

Sem figuras humanas. Todos os textos em Português do Brasil (exceto identificadores de código em monospace, que mantêm forma original).

PROPORÇÃO: 16:9 cinemática (paisagem editorial — contraste flui da esquerda para a direita).

————————————————————
OBJETIVO VISUAL
————————————————————

Dois painéis lado a lado, mesmo tamanho, mesma moldura, mesma paleta — divergindo apenas em **ritmo e organização**.

**Painel ESQUERDO — "ANTES"**: representação visual de contexto operacional fragmentado e disperso. Instruções avulsas, memory não-portável, decisões esquecidas, contexto reconstruído manualmente a cada sessão.

**Painel DIREITO — "DEPOIS"**: representação visual do mesmo material organizado em torno do repositório como memória canônica. Estado canônico vive em `.governance/`; canais multi-IA distribuem; a governança ativa protege.

Os dois painéis devem dialogar — o leitor entende, em 5 segundos, que **é o mesmo trabalho**, organizado de forma diferente.

**DENSIDADE VISUAL OBRIGATÓRIA — calibragem central da composição:**

O painel DEPOIS deve ter aproximadamente **40% menos densidade de elementos** que o painel ANTES. Se ANTES tem 8-10 fontes dispersas, DEPOIS tem 4-6 elementos respirados em volta do kernel. A diferença de **RITMO e RESPIRAÇÃO** é o argumento visual central — não apenas a diferença de organização.

- ANTES: denso, fragmentado, sem espaço negativo entre elementos. Sensação claustrofóbica controlada (não exagerada).
- DEPOIS: respirado, com vazio entre kernel e periferia. Sensação de "ar liberado".

Se os dois painéis aparecem com densidade similar, a imagem **falha** o argumento principal e deve ser regenerada.

A composição NÃO deve parecer:

- "before vs after" de produto de marketing
- comparação de plano (free vs pro)
- caricatura do mundo sem framework
- propaganda

A composição deve parecer:

- dois sistemas operacionais mostrados em estado de repouso
- comparação editorial honesta de ritmo cotidiano
- estudo visual de organização do contexto
- diagrama editorial-tech

————————————————————
PALETA DARK MODE
————————————————————

Manter EXATAMENTE a paleta da Imagem 1 — continuidade visual.

Fundo (ambos os painéis): #0B1020 ou #0F172A
Texto principal: #E5E7EB
Linhas: rgba(148,163,184,0.18)
Accent principal (DEPOIS / governado): #5EEAD4 / #7DD3FC
Accent secundário (ANTES / disperso): #A78BFA com baixa saturação
Tons de atrito (apenas no painel esquerdo): terracota suave, distribuído em pontos pequenos
Glow: ausente no painel esquerdo; presente, mínimo e atmosférico no painel direito

A diferença de mood entre os painéis NÃO vem de cores brilhantes vs apagadas — vem de ORGANIZAÇÃO. Mesma paleta; ritmos diferentes.

————————————————————
PAINEL ESQUERDO — "ANTES" (contexto fragmentado)
————————————————————

CRÍTICO — calibragem de honestidade:

NÃO mostrar `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md` como caos. Esses arquivos SÃO entregas do framework — colocá-los no painel ANTES é incoerência. O painel ANTES é o mundo SEM esse tipo de organização.

Layout:

- Múltiplos pequenos quadrados representando fontes dispersas de contexto operacional, espalhadas sem grade rígida:
  - prompt copiado de post de blog em arquivo `.txt` solto
  - mensagem de Slack arquivada com instrução de IA
  - `notes.md` no desktop com decisões soltas
  - `memory/session-2024-03-...md` (memory local de provider, não-portável entre máquinas)
  - PR fechado com decisão importante no body que ninguém lembra
  - print de tela do ChatGPT salvo como referência
  - documento do Notion com convenções de equipe (fora do repo)
- Linhas tracejadas finas tentando conectar fontes similares, sem fechar (gaps deliberados).
- Pequenos ícones de IAs (Claude, ChatGPT, Cursor, Gemini, Copilot) distribuídos em torno, cada uma conectada a um subset diferente das fontes — sem padrão consistente.
- Sensação de **arquipélago**: ilhas próximas que não se comunicam totalmente.

Selo discreto no canto superior do painel:

"ANTES · contexto reconstruído a cada sessão"

NÃO mostrar humanos cansados. A densidade e os gaps tracejados comunicam o esforço — não personagens.

————————————————————
PAINEL DIREITO — "DEPOIS" (contexto governado)
————————————————————

Mesmo MATERIAL operacional (decisões, instruções, contexto), agora organizado em torno do repositório:

Layout:

- `.governance/` no centro como kernel discreto (registry.yml + governance core)
- Em volta, **artifacts vivos**:
  - `.governance/specs/<slug>/spec.md` (imutável após review)
  - `.governance/specs/<slug>/state.yml` (4 chaves)
  - `.governance/specs/<slug>/tasks.md` (execução)
  - `.governance/specs/<slug>/review.md` (prontidão de integração)
  - `.governance/specs/<slug>/release-log.md` (registro pós-merge, condicional)
  - `.governance/specs/<slug>/decision-brief.md` (gate humano)
  - `.governance/runtime/active-specs.yml` (índice público)
- Na periferia, **canais multi-IA** sincronizados, todos partindo do mesmo kernel:
  - `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.openai/instructions.md`, `.cursor/rules/`, `.github/copilot-instructions.md`
- Ícones das IAs (Claude, ChatGPT, Cursor, Gemini, Copilot) na periferia externa, conectadas ao kernel pela mesma geometria — todas a partir da mesma fonte.
- Sensação de **constelação**: pontos vinculados a um centro, com ritmo.

Selo discreto no canto superior do painel:

"DEPOIS · contexto canônico no repositório"

Glow extremamente sutil no kernel — sensação de "centro de gravidade", não brilho de produto.

————————————————————
LINHA DIVISÓRIA ENTRE OS PAINÉIS
————————————————————

Sutil, fina, em rgba(148,163,184,0.18). Não dramatiza a transição — apenas separa.

Texto pequeno entre os painéis, em #E5E7EB com baixo contraste:

"mesmo material · organização diferente"

————————————————————
CAPTION INFERIOR — ESCOLHA 1 DAS 3 ALTERNATIVAS
————————————————————

ANTES DE ENVIAR ESTE PROMPT À IA DE IMAGEM, escolha 1 das 3 captions abaixo e remova as outras 2 do prompt enviado. As três comunicam o mesmo eixo, com tons diferentes:

**Alternativa 1 — funcional e neutra (recomendada para landing pública):**

"o trabalho é o mesmo · o repositório passa a lembrar dele"

**Alternativa 2 — mais conceitual (recomendada para audiência técnica):**

"do contexto improvisado à operação governada"

**Alternativa 3 — mais direta sobre a dor (recomendada se a audiência já reconhece o problema):**

"instruções dispersas viram estado canônico no repo"

Linha única abaixo dos dois painéis, em #E5E7EB com baixo contraste, fonte editorial discreta. Não destacar; deixar como assinatura.

————————————————————
SENSAÇÃO FINAL
————————————————————

A imagem deve transmitir:

- honestidade sobre fragmentação real do contexto operacional
- contraste por organização, não por marketing
- maturidade que sabe diagnosticar antes de prescrever
- AI-as-channel: canais multi-IA aparecem nos dois painéis; o que muda é o substrato comum

A pessoa que olha precisa sentir, sem ler nada:

"é exatamente isso que eu vivo todo dia — e a direita parece possível".
</prompt>
