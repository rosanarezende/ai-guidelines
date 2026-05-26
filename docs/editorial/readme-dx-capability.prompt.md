<!--
  Imagem 2 — Variante B: Capability surface honesta.

  Foco: a superfície de contato real entre o humano e o framework é
  pequena, mas honesta. Não inflar para "3 comandos resolvem tudo",
  nem listar API exaustiva. 5 comandos primários respirados; demais
  capacidades vivem como referência opt-in.

  Calibragem cravada nesta versão (após auditoria 2026-05-23):

  - Sem afirmação "90% dos casos" (factualmente questionável).
  - 5 comandos primários (init, adopt, workflow, continue, update),
    não 3.
  - Comando consumer: `npx ai-guidelines`, não `yarn guidelines`.
  - Tagline "superfície mínima · profundidade opt-in" preservada.
  - Kernel correto: `.governance/`, não AGENTS.md (cf. ADR 0018).

  Específica do framework (não invocável via wizard CLI). Testa lado a
  lado com `readme-dx-flow.prompt.md` (A) e
  `readme-dx-before-after.prompt.md` (C) antes de escolher.

  Como usar:
  1. Cole o bloco `<prompt>` em IA de geração/orientação de imagem.
  2. Salve como `docs/assets/ai-guidelines-dx-capability.png`.
-->

<prompt>
Composição editorial-tech em dark mode para o projeto ai-guidelines — segunda capa do README com foco em superfície mínima honesta de capacidade.

A imagem transmite parcimônia confiante: contrato exposto, sem inflar a API. A escassez de elementos é o argumento visual — quanto menos a imagem mostra, mais ela comunica maturidade.

Visual alinhado à identidade de rosanarezende.com:

- elegante
- técnico
- respirado
- conceitual
- sistêmico

Sem figuras humanas. Todos os textos em Português do Brasil (exceto identificadores de código em monospace, que mantêm forma original).

PROPORÇÃO: 1:1 quadrado editorial premium. A simetria reforça "contrato pequeno e legível".

————————————————————
OBJETIVO VISUAL
————————————————————

Mostrar os 5 comandos primários do framework, vazio respirado em volta, capacidades opcionais como linha de horizonte sutil, kernel discreto no fundo.

A imagem comunica, em 5 segundos:

- "framework maduro tem superfície pequena"
- "5 comandos cobrem o essencial do dia-a-dia"
- "o resto é detalhe arquitetural — opt-in quando precisar"

A composição NÃO deve parecer:

- splash screen de produto SaaS
- lista de features
- documentação de API
- pricing page

A composição deve parecer:

- contrato mínimo exposto
- haiku visual
- runtime maduro respirando vazio
- "menos é mais" levado a sério

————————————————————
PALETA DARK MODE
————————————————————

Manter EXATAMENTE a paleta da Imagem 1 — continuidade visual.

Fundo: #0B1020 ou #0F172A
Texto principal: #E5E7EB
Linhas: rgba(148,163,184,0.18)
Accent principal: #5EEAD4 / #7DD3FC
Accent secundário (capacidades opcionais): #A78BFA
Glow: mínimo, atmosférico, presente apenas nos 5 comandos primários

————————————————————
COMPOSIÇÃO
————————————————————

**5 comandos primários** ocupando o centro da imagem em **layout NÃO-LINEAR obrigatório**:

CRÍTICO — calibragem visual central:

Linha horizontal de 5 cards é o padrão SaaS pricing page e MATA o argumento da parcimônia. Evite a todo custo. Use uma das disposições não-convencionais abaixo (escolha pela harmonia do conjunto):

- **Pentágono respirado**: 1 comando no topo central + 4 ao redor formando pentágono, com muito espaço entre eles.
- **Arco semi-circular**: 5 comandos dispostos em arco orgânico (não simétrico perfeito), com `init` à esquerda e `update` à direita seguindo a curvatura natural.
- **Disposição assimétrica em 2-3 camadas**: 3 comandos em uma linha superior + 2 em linha inferior deslocada, sem alinhamento rígido.
- **Constelação respirada**: 5 pontos dispostos como constelação leve, sem padrão geométrico óbvio mas com equilíbrio visual.

O argumento da "parcimônia visual" precisa ser **CARREGADO pela composição**, não apenas pelo rodapé textual. Se o layout final parece slide de produto SaaS, refazer.

Disposição escolhida deve transmitir: editorial premium · contrato fechado · respiração intencional.

`npx ai-guidelines init`
"bootstrap em projeto novo"

`npx ai-guidelines adopt`
"baseline em repo existente"

`npx ai-guidelines workflow`
"menu operacional"

`npx ai-guidelines continue`
"briefing da spec ativa · governança ativa nas pré-condições"

`npx ai-guidelines update`
"re-aplica baseline · headless"

Cada comando:

- monospace para o identificador
- subtítulo conceitual em português, pequeno
- ícone outline minimalista (rocket / wrench / compass / arrow / cycle — escolha pela harmonia)
- glow extremamente sutil em #5EEAD4
- muita respiração entre eles

**Vazio significativo ao redor**: a área da imagem fora dos 5 comandos primários deve ser predominantemente vazia. NÃO preencher com ornamentação. NÃO adicionar linhas decorativas. O vazio é o argumento.

**Linha de horizonte sutil** abaixo dos comandos, em rgba(148,163,184,0.18), com micro-labels em #A78BFA — capacidades secundárias (citadas como referência opt-in):

`providers` · `review` · `workflow publish-state` · `release-prep`

Esses elementos têm 30% do peso visual dos comandos primários. Mostram que existem, sem competir.

**Selo discreto no topo**, em #E5E7EB com baixo contraste:

"ai-guidelines · operação governada · 1.1.0"

**Selo discreto na base**, em #E5E7EB com baixo contraste:

"superfície mínima · profundidade opt-in"

————————————————————
KERNEL — APENAS SE NÃO POLUIR
————————————————————

O kernel (`.governance/registry.yml` + canais multi-IA) pode aparecer como **textura de fundo extremamente discreta** atrás dos 5 comandos primários — sombra de constelação. Se prejudicar a sensação de vazio respirado, omita por completo. A imagem não depende dele para funcionar.

NÃO colocar `AGENTS.md` como kernel — o kernel é `.governance/` (cf. ADR 0018). AGENTS.md é canal output entre vários.

NUNCA labels narrativos. NUNCA verbos dinâmicos ("sincronizando…", "distribuindo…"). A presença basta — e neste layout, ausência basta também.

————————————————————
SENSAÇÃO FINAL
————————————————————

A imagem deve transmitir:

- parcimônia confiante e honesta
- maturidade técnica que sabe o que esconder
- contrato pequeno e legível
- nada de marketing inflado

A pessoa que olha precisa sentir, sem ler nada além dos 5 comandos:

"é isso, e basta para o dia-a-dia — o resto está pronto para quando eu precisar".
</prompt>
