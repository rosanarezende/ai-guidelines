<!--
  Imagem — Workflow Guide: ciclo completo de uma spec em 4 momentos.

  Foco: como uma spec sai do backlog e chega ao merge — do `continue`
  ao `merge-stack` — usando os comandos do ai-guidelines.

  Narrativa: desenvolvedor retoma uma spec ativa, verifica o que falta
  fechar, prepara a branch e executa o merge. O ponto de chegada é o
  merge como encerramento — sem arrumação depois.

  Como usar:
  1. Cole o bloco `<prompt>` em IA de geração/orientação de imagem.
  2. Salve como `docs/assets/ai-guidelines-workflow-guide.png`.
-->

<prompt>
Composição editorial-tech em dark mode para o projeto ai-guidelines — narrativa visual de um ciclo completo de desenvolvimento usando os comandos do framework.

A imagem deve parecer uma sequência cinemática horizontal: o desenvolvedor retoma uma spec ativa, verifica o estado de execução, fecha a branch com tudo no lugar, e executa o merge — que encerra o ciclo sem nenhuma arrumação depois. Não é tutorial. É um caso de uso real em 4 momentos.

Visual alinhado à identidade de rosanarezende.com:

- elegante
- técnico
- respirado
- conceitual
- sistêmico

Sem figuras humanas. Todos os textos em Português do Brasil (exceto identificadores de código em monospace, que mantêm forma original).

PROPORÇÃO: 16:9 cinemática (paisagem editorial — narrativa flui da esquerda para a direita).

————————————————————
OBJETIVO VISUAL
————————————————————

Mostrar 1 ciclo típico com o framework, em **4 momentos honestos**:

1. RETOMADA: `npm run flow -- continue` — o runtime exibe o briefing da spec ativa e verifica se a execução está autorizada. Se `tasks.md` tiver tasks abertas, o runtime libera. Se não tiver, bloqueia com mensagem narrativa.
2. NAVEGAÇÃO: `npm run flow` — o wizard aparece com opções declarativas para o estágio atual da spec. As opções disponíveis dependem do estado: algumas estão ativas, outras bloqueadas por gates ainda abertos.
3. PREPARO: a branch sendo fechada antes do merge — spec marcada como Done, NEXT.md deletado, historico atualizado. Checklist visual com itens sendo marcados. Nenhum trabalho pendente na branch.
4. ENCERRAMENTO: `merge-stack unit` executa — 1 commit canônico chega em `main`, os PRs da stack são fechados automaticamente com referência ao SHA. O merge é o encerramento.

A imagem comunica, em 5 segundos:

- "o ciclo tem começo, meio e fim — e o fim acontece antes do merge, não depois"
- "cada comando tem um papel no ciclo — `continue` libera execução, `workflow` navega, `merge-stack` encerra"
- "o runtime guarda o estado da spec entre sessões — você retoma de onde parou"

A composição NÃO deve parecer:

- tutorial step-by-step com setas duras
- checklist corporativo
- dashboard de produto SaaS
- screenshot de IDE

A composição deve parecer:

- narrativa visual cinemática de um desenvolvedor trabalhando
- ciclo com começo e fim claros
- operação que respira
- 4 momentos conectados por luz e geometria, não por numeração agressiva

————————————————————
PALETA DARK MODE
————————————————————

Fundo: #0B1020 ou #0F172A
Texto principal: #E5E7EB
Linhas: rgba(148,163,184,0.18)
Accent principal (em execução / liberado): #5EEAD4 / #7DD3FC
Accent de alerta (bloqueado / pendente): terracota suave #F87171 com baixa saturação
Accent de encerramento (merge / pronto): #86EFAC (verde suave)
Glow: mínimo, atmosférico

————————————————————
COMPOSIÇÃO
————————————————————

Layout horizontal em 4 momentos com transições orgânicas:

**Momento 1 — esquerda** (~25% da largura):
Terminal com `npm run flow -- continue`. Logo abaixo, o runtime exibe o briefing da spec ativa — nome da spec, stage atual, o que está aberto em `tasks.md`. Duas ramificações sutis: caminho verde (execução liberada, tasks autorizadas) e caminho terracota (bloqueado, `tasks.md` ausente ou sem tasks abertas). A mensagem de bloqueio aparece como texto humano, não como erro corporativo. Accent principal #5EEAD4.

**Momento 2 — centro-esquerda** (~25%):
Terminal com `npm run flow`. O wizard aparece com 4-5 opções visíveis (não detalhar todas). Algumas opções têm ícone de cadeado discreto — bloqueadas porque gates de prontidão ainda estão abertos. Outras estão ativas. A sensação é de menu contextual que sabe o que está disponível no momento. Linhas finas conectam o estado do `review.md` às opções do menu.

**Momento 3 — centro-direita** (~25%):
A branch sendo preparada para o merge. Checklist visual com 5-6 itens — alguns já marcados com check, um ou dois sendo completados agora. Itens visíveis (em monospace): `spec.md → Done`, `NEXT.md deletado`, `historico.md atualizado`. Sensação de fechamento meticuloso, sem pressa, sem dívida. Accent em #86EFAC nos itens marcados.

**Momento 4 — direita** (~25%):
`merge-stack unit` executa. Um único commit chega em `main` — representado como ponto de luz em #5EEAD4 pousando na linha do `main`. Os PRs da stack aparecem como nós menores sendo fechados automaticamente em cascata, conectados ao SHA do merge por linhas finas. Badge discreto: "1 SHA · stack fechada · ciclo encerrado". Glow leve no ponto de merge.

Entre os momentos: respiração orgânica, transições suaves por luz. Nenhuma seta dura. A leitura é por geometria e luz, não por numeração agressiva.

————————————————————
TEXTO LITERAL DO TERMINAL (renderizar exatamente, sem traduzir)
————————————————————

Para reduzir alucinação do gerador, use estas linhas reais do runtime nos terminais/cartões (monospace, exatamente como saem na CLI):

- Momento 1 (prompt): `> npm run flow -- continue`
- Momento 1 (liberado): `✅ Execução autorizada — tasks abertas encontradas em tasks.md`
- Momento 1 (bloqueado): `🔒 Execução bloqueada — tasks.md ausente ou sem tasks abertas`
- Momento 2 (prompt): `> npm run flow`
- Momento 4 (encerramento): `✅ Stack mergeada · PRs fechados · 1 SHA canônico em main`

NÃO renderizar identificadores internos (`DEC-…`, `ADR-…`, `[1.H]`) no texto visível.

————————————————————
KERNEL — SECUNDÁRIO
————————————————————

`.governance/` aparece como elemento discreto na parte inferior central, conectando os 4 momentos por baixo — o substrato que preserva o estado entre sessões. Sem destaque. Pequeno selo: "ai-guidelines · ciclo governado".

————————————————————
RODAPÉ
————————————————————

Linha sutil em #E5E7EB com baixo contraste:

"retomar · navegar · preparar · encerrar · o merge é o fechamento"

————————————————————
SENSAÇÃO FINAL
————————————————————

A imagem deve transmitir:

- ciclo com começo e fim definidos
- comandos que se encadeiam naturalmente
- branch que chega pronta — sem dívida, sem arrumação depois
- merge como ato de encerramento, não de entrega parcial

A pessoa que olha precisa sentir, sem ler nada:

"trabalhar aqui tem ritmo — cada comando tem seu momento, e quando o merge acontece, está feito de verdade".

————————————————————
LÍNGUA (NÃO-NEGOCIÁVEL)
————————————————————

TODO texto renderizado na imagem deve ser em **Português do Brasil (pt-BR)**. NÃO gerar texto em inglês. A única exceção são identificadores em monospace que são literais de comando/código (`npm run flow -- handoff`, `npm run flow`, `tasks.md`, `review.md`, `spec.md`, `NEXT.md`, `merge-stack unit`, `main`) — esses mantêm a forma original. Selos, badges, títulos e legendas: sempre pt-BR.
</prompt>

---

## Sanity checklist — o que DEVE aparecer na imagem

Use para validar a imagem gerada antes de salvar em `docs/assets/ai-guidelines-workflow-guide.png`:

- [ ] **4 momentos** legíveis da esquerda para a direita, conectados por luz/geometria (não por setas duras).
- [ ] **Momento 1:** `npm run flow -- continue` + briefing da spec + duas ramificações (liberado / bloqueado).
- [ ] **Momento 2:** `npm run flow` + wizard com opções contextuais (algumas com cadeado, outras ativas).
- [ ] **Momento 3:** checklist de closure com itens visíveis (`spec.md → Done`, `NEXT.md deletado`, `historico.md atualizado`).
- [ ] **Momento 4:** `merge-stack unit` + 1 SHA em `main` + PRs da stack fechados em cascata.
- [ ] **Kernel** `.governance/` discreto na base conectando os 4 momentos.
- [ ] **Todo texto em pt-BR** (exceto literais de comando/arquivo em monospace). Zero inglês renderizado.
- [ ] Dark mode na paleta definida; sem aparência de tutorial / checklist corporativo / SaaS.
      </prompt>
