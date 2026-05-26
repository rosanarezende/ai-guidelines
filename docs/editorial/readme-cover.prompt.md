<!--
  Imagem 1 — Capa principal do README do framework ai-guidelines.

  Substitui (ou refresca) `docs/assets/ai-guidelines-flow.png`. Foco:
  arquitetura de governança. Pessoa bate o olho e entende que o framework
  é útil em 5 segundos.

  Calibragem cravada nesta versão (após auditoria 2026-05-23):

  - Kernel é `.governance/registry.yml` + governance core, NÃO `AGENTS.md`.
    AGENTS.md é canal output entre vários (cf. ADR 0018).
  - Capacidades entregues (operação do ciclo, governança ativa) aparecem
    como módulos sólidos.
  - Capacidades direcionais ainda não materializadas (handoff, boilerplate
    por classe) aparecem visualmente diferenciadas (pontilhado, "em breve")
    para honestidade direcional vs. entregue (cf. ADR 0022 em Proposta).

  Histórico:
  - v1 (4:3, em produção desde 1.0.1): `docs/assets/ai-guidelines-flow.png`.
  - v2 (1:1 com órbita externa de runtime): descartada — densidade poluía.
  - v3 (4:3): retorno ao formato original; kernel correto; honestidade
    visual sobre capacidades direcionais vs. entregues.
  - v4 (esta, refino 2026-05-26 após feedback editorial): direção "editorial
    system map" > "UI architecture diagram". 5 ajustes: (1) loop com conexões
    orgânicas/atmosféricas, não geométricas; (2) kernel menor — infraestrutura
    silenciosa que não compete com o loop; (3) "Valor entregue" como outcome que
    irradia, não feature node; (4) canais multi-IA como adapters leves orbitando
    o kernel, não cards; (5) bloco de extensões respira mais, menos protagonismo.
    Pós-geração v3: (6) guard-rail de enquadramento — sem colunas de texto
    laterais (a v3 inventou uma coluna de bullets à direita); tese só no título
    superior, laterais do loop são espaço negativo. Pós-geração v4: (7) gates
    humanos com destaque — cadeados âmbar #F59E0B legíveis (sumiram na busca por
    respiração da v4); enforcement estrutural sem jargão "L2/L4" (texto operacional).
    Pós-v2: (8) recalibração — a v2 simplificou demais e perdeu legendas boas da
    v3; guard-rail anti-coluna deixou de ser binário e 3 micro-legendas voltaram
    (fluxo operacional · gates humanos · rastreabilidade ponta-a-ponta).

  Como usar:
  1. Cole o bloco entre `<prompt>` e `</prompt>` em ferramenta de geração
     de imagem (Claude com diagram tool, Gemini, Midjourney, DALL-E).
  2. Salve o resultado em `docs/assets/ai-guidelines-flow.png`.
-->

<prompt>
Diagrama editorial-tech em dark mode para o projeto ai-guidelines — framework de governança de engenharia repo-first com integração AI-agnóstica como canal opt-in.

A composição deve parecer um ecossistema operacional vivo — sofisticado, modular, arquitetural — inspirado em visual systems contemporâneos da Linear, Vercel, Raycast e mapas operacionais modernos.

Visual alinhado à identidade de rosanarezende.com:

- elegante
- técnico
- respirado
- conceitual
- sistêmico

Sem figuras humanas. Todos os textos em Português do Brasil (exceto identificadores de código em monospace, que mantêm forma original).

PROPORÇÃO: 4:3 editorial premium.

————————————————————
OBJETIVO VISUAL
————————————————————

O protagonista é o **ciclo contínuo de governança de engenharia**:

Backlog → Spec → Plano → Execução → Pull Request → Merge → Valor entregue

A imagem deve comunicar, em 5 segundos:

- transformação de intenção em entrega governada
- fluxo operacional auditável
- repositório como memória canônica
- governança que orquestra IAs como canal, não como protagonista

Respiração é mais importante que exaustividade. A pessoa precisa entender o ciclo sem esforço — não tentamos mostrar todas as capacidades aqui.

A composição NÃO deve parecer:

- pipeline DevOps tradicional
- dashboard corporativo
- fluxograma BPMN
- AI tooling diagram
- mapa de capacidades de produto SaaS
- diagrama de arquitetura de UI (boxes-and-arrows, conexões geométricas duras)
- infográfico corporativo clássico

A composição deve parecer:

- um **mapa editorial de sistema** (editorial system map), não um diagrama técnico de arquitetura
- runtime vivo — conexões orgânicas e atmosféricas, não linhas geométricas
- ecossistema modular que respira
- arquitetura em movimento, com hierarquia clara: o loop é o protagonista; kernel e extensões recuam

————————————————————
ENQUADRAMENTO, RESPIRAÇÃO E LEGENDAS
————————————————————

- A tese vive no título superior (canto superior esquerdo): logo + 1 título + 1 frase curta.
- **Micro-legendas conceituais curtas (3-5 palavras) são bem-vindas** onde ancoram a leitura — discretas, baixo contraste, próximas do elemento que descrevem. Use estas três:
  - ancorando o loop: **"fluxo operacional · do backlog ao valor"**
  - junto aos cadeados âmbar: **"gates humanos nos pontos críticos"**
  - perto de "Valor entregue": **"rastreável e auditável de ponta a ponta"**
- **O que se proíbe é a coluna/lista de bullets densa** que compete com o loop (um bloco vertical com 4+ frases explicativas tipo "repositório como memória", "lookup ≠ coordination"). A diferença: legenda curta **ancora**; coluna de texto **compete**.
- O loop continua protagonista e respirado. Micro-legendas não viram parágrafos nem cercam o loop por todos os lados; na dúvida entre uma legenda e mais vazio, escolha a legenda só se ela esclarecer — senão, deixe o vazio.

————————————————————
PALETA DARK MODE
————————————————————

Fundo: #0B1020 ou #0F172A
Texto principal: #E5E7EB
Linhas: rgba(148,163,184,0.18)
Accent principal: #5EEAD4 / #7DD3FC
Accent secundário: #A78BFA
Governança humana (gates): #F59E0B — **presente e legível** (cadeados/marcadores âmbar visíveis nos pontos de decisão humana; nunca escondidos)
Estados "em construção / direcional": pontilhado em #A78BFA com baixa saturação
Glow: mínimo, atmosférico

————————————————————
ELEMENTO PRINCIPAL — LOOP OPERACIONAL
————————————————————

Loop arquitetural semi-radial fluido ao redor do kernel central. Etapas como nodes elegantes — não cards pesados.

**Conexões orgânicas, não diagramáticas (ajuste-chave):** as ligações entre as etapas devem parecer fluxo vivo — curvas suaves, gradientes atmosféricos, energia que circula — e **não** conectores geométricos de infográfico (sem setas duras, sem ângulos retos, sem linhas de fluxograma). A sensação é de "runtime respirando", não de "diagrama de fluxo". Prefira luz e gradiente a traço sólido.

Cada etapa:

- ícone outline minimalista
- label curta
- subtítulo técnico discreto
- pouco contorno, muita respiração

Fluxo:

Backlog
"candidatas · prioridades"

Spec
"spec.md (imutável após review)"
cadeado âmbar #F59E0B visível (gate humano — decisão explícita)

Plano
"plan.md (vivo) · decision-brief.md"

Execução
"tasks.md (execução) · branch · commits"

Pull Request
"review.md (prontidão)"
cadeado âmbar #F59E0B visível (gate humano — decisão explícita)

Merge
"release-log.md (pós-merge) · histórico"

Valor entregue
"feature em produção · auditável"

————————————————————
GATES HUMANOS — DESTAQUE (diferencial)
————————————————————

Os pontos onde **um humano decide** são um diferencial do framework e **devem permanecer visíveis** (não podem sumir na busca por respiração):

- **Spec** — cadeado âmbar: imutável após review humano.
- **Pull Request / Merge** — cadeado âmbar: merge exige autorização humana explícita (não é automático).

Os cadeados âmbar #F59E0B leem, à primeira vista, como "aqui um humano autoriza" — pequenos e elegantes, mas **legíveis e presentes**, com leve glow âmbar que os diferencia do teal/roxo do fluxo. Mensagem: governança não é automação cega; o humano mantém os gates.

————————————————————
VALOR ENTREGUE — FOCO EMOCIONAL
————————————————————

"Valor entregue" é o ponto de maior energia visual.

Representa:

- outcome operacional
- visibilidade organizacional
- entrega rastreável do backlog ao código em produção

Visual — **outcome organizacional, não feature node (ajuste-chave):**

- NÃO renderizar como um ícone/card centralizado igual às outras etapas — deve parecer um **ponto de expansão**, não um node de feature
- campo de luz que **irradia para fora**, fluxo abrindo em leque (sensação de "chegou ao mundo / virou valor")
- contraste e glow levemente maiores que o resto, mas por expansão, não por tamanho de card
- as conexões que chegam aqui se abrem e dissipam organicamente, em vez de terminar num box

————————————————————
KERNEL DE GOVERNANÇA
————————————————————

CRÍTICO — calibragem técnica:

O kernel é `.governance/registry.yml` + governance core (taxonomia MECE de 7 pilares: spec, experiment, spike, incident, proposal, patch, fix). NÃO é `AGENTS.md`.

`AGENTS.md` é **um dos canais output** entre vários, não o centro.

Visual do kernel — **infraestrutura silenciosa, ainda menor (ajuste-chave):**

- núcleo técnico **pequeno e recuado** — deve ler como substrato, não como protagonista; **não pode competir visualmente com o loop**
- monogramado: ".governance/" ou "registry.yml"
- **o texto renderizado no kernel é APENAS `.governance/` / `registry.yml`** — NÃO escrever "MECE", "taxonomia" nem listar os 7 pilares na imagem (a taxonomia é contexto pro gerador, não label visível)
- elegante, secundário, quase translúcido — sustenta o loop por baixo sem chamar atenção
- se houver dúvida entre "kernel visível" e "loop protagonista", o loop vence: encolha o kernel

Ao redor do kernel, **canais multi-IA como adapters leves orbitando (ajuste-chave)** — não cards, não caixas: pontos/glifos pequenos em órbita discreta, peso visual equivalente entre si (nenhum é mais importante), conectados ao kernel por fios finos e atmosféricos:

- AGENTS.md
- CLAUDE.md
- GEMINI.md
- .openai/instructions.md
- .cursor/rules/
- .github/copilot-instructions.md

Sensação: "kernel governa; canais distribuem para IAs". A geometria comunica por si — não usar verbos dinâmicos ("sincronizando…", "distribuindo…"). A presença basta.

————————————————————
EXTENSÕES DO FRAMEWORK
————————————————————

Na periferia inferior: módulos editoriais discretos divididos em **dois tipos visualmente distintos**. **Este bloco deve respirar mais e ocupar menos protagonismo (ajuste-chave):** a composição principal (loop + kernel) já comunica a tese; as extensões são uma faixa leve e espaçada na base, com bastante vazio entre os módulos — nunca uma grade densa de cards.

**Entregues (sólidos, accent principal #5EEAD4):**

- Lifecycle de release
  "publish · tag · sync"
- Arquitetura da informação
  "decisões · regras de runtime · referência"
- Operação do ciclo
  "retomar a spec · publicar estado · integrar a stack"
- Governança ativa
  "runtime recusa execução fora de ordem · CI valida a estrutura"

**Direcionais — em construção (pontilhados, accent #A78BFA com baixa saturação, badge "em breve" discreto):**

- Handoff situado
  "boot de sessão IA contextual"
- Boilerplate por tipo de trabalho
  "spec · incident · experiment · ..."
- Dashboard de governança
  "visualização stakeholder"

A diferença visual entre Entregues vs. Direcionais é honestidade — em construção ≠ entregue. Os sólidos têm contorno fechado; os direcionais têm contorno pontilhado.

**TECHNICAL HINT for image generator (non-negotiable):** render Direcional cards with explicit DASHED outline — visible stroke-dasharray pattern (e.g., 4px dash + 4px gap). Solid Entregues cards use closed continuous outline. The visual distinction must be UNAMBIGUOUS at first glance, conveyed by the outline style itself — not only by the "em breve" badge text. If the generated image shows Direcional cards with the same solid contour as Entregues, the image fails this requirement and must be regenerated.

Todos com baixo peso visual (não competem com o loop principal).

————————————————————
RODAPÉ CONCEITUAL
————————————————————

Pills extremamente discretas:

- Auditável
- Repo-first
- Headless
- Multi-stack
- AI-as-channel

Baixo contraste. Sem competir.

————————————————————
SENSAÇÃO FINAL
————————————————————

A imagem deve transmitir:

- maturidade técnica
- governança repo-first
- IA como canal de primeira classe (não como protagonista)
- rigor de engenharia
- honestidade sobre o que está pronto e o que está vindo

A imagem deve fazer stakeholders sentirem, em 5 segundos:

"isso não é AI tooling — isso é um modelo operacional para engenharia governada, com IAs integradas como canal".

Detalhes operacionais (menu, comandos, governança ativa em ação) ficam para a Imagem 2 (capa DX).
</prompt>
