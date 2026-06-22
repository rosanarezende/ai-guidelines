<!--
═════════════════════════════════════════════════════════════════════════════
PERFIL: 🧾 GOVERNANCE (contrato-base comum + perfil por tipo de PR)

Título:
  Deve seguir `.core/process/pr-title-conventions.md` — prefixo [🧾] [Spec NNNN].

Tipo do PR:
  Derivado do título e do role do nó na topologia (`state.yml § topology`).
  O `governance-pr-check` seleciona este perfil automaticamente.

Lifecycle:
  Draft/Ready é estado nativo do GitHub. Ready ≠ merge autorizado (ADR 0024).
  Antes de converter para Ready: npm run pr-ready:check -- --pr <n>

Comentários HTML:
  São parte intencional do template. Não apagar automaticamente ao preencher.
  Não usar `<details open>`.
═════════════════════════════════════════════════════════════════════════════
-->

<!--
═════════════════════════════════════════════════════════════════════════════
GOVERNANÇA VISUAL — DOIS BASELINES EM MOMENTOS DIFERENTES

Visão de valor:
- preencher ao abrir o Draft;
- mostra por que a spec existe;
- não cristaliza arquitetura ainda não decidida.

Arquitetura pretendida:
- preencher após o processo decisório;
- antes do primeiro PR de Execution;
- mostra topologia aprovada e caminho de implementação.

Visão de valor = baseline da intenção.
Arquitetura pretendida = baseline da decisão.

Nenhuma das duas seções pode ser apagada ou reescrita automaticamente
(`npm run pr-body:update` as preserva). Mudanças posteriores entram como
atualização complementar (novo `<details>` abaixo do baseline), preservando
o original.
═════════════════════════════════════════════════════════════════════════════
-->

## Visão de valor

<!-- Preencher ao abrir o Draft. Cole a imagem renderizada acima do details, quando existir. -->

<details>
<summary><strong>Prompt final — visão de valor</strong></summary>

```text
LANGUAGE CONSTRAINT: every visible word inside the generated image must be in Brazilian Portuguese (pt-BR). Do not render English labels.

Crie um infográfico técnico em 16:9, estilo documentação de engenharia, fundo claro, linhas finas, cartões compactos e leitura hierárquica.

TÍTULO:
"<título da spec ou capacidade>"

OBJETIVO VISUAL:
Mostrar por que esta spec existe e qual valor estrutural pretende gerar, sem antecipar decisões arquiteturais ainda não aprovadas.

FAIXA 1 — "Problema atual"
- <dor operacional 1>
- <dor operacional 2>
- <drift ou risco atual>
- <impacto sobre humano/agente/framework>

FAIXA 2 — "Capacidade desejada"
- <capacidade 1>
- <capacidade 2>
- <capacidade 3>
- <resultado observável esperado>

FAIXA 3 — "Mudança de experiência"

ANTES:
- <como funciona hoje>
- <trabalho manual>
- <fricção>
- <risco>

DEPOIS:
- <como deverá funcionar>
- <o que será automatizado>
- <o que continuará sob decisão humana>
- <qual será o caminho canônico>

PAINEL LATERAL — "Princípios"
- <princípio 1>
- <princípio 2>
- <princípio 3>

RODAPÉ:
"<mensagem curta que resume o valor pretendido>"

RESTRIÇÕES:
- Não mostrar topologia ainda não decidida.
- Não inventar componentes, comandos ou checkpoints.
- Não representar decisões como aprovadas se ainda forem hipóteses.
- Não usar mascotes, logos de fornecedores ou linguagem promocional.
- Não usar gradientes decorativos.
```

</details>

## Problema de governança

<!-- A dor estrutural que motiva a spec: o que falta de governança executável. -->

## Hipóteses e perguntas

<!-- O que ainda é hipótese/pergunta aberta no Draft — vira decisão no processo decisório. -->

## Processo decisório

<!-- Preencher após o gate: research → decision-brief → gate (datas, artefatos, assinaturas). -->

## Decisões consolidadas

<!-- DECs/ADRs cravados pelo processo decisório (referencie, não duplique). -->

## Arquitetura pretendida

<!-- Preencher APÓS o processo decisório, antes do primeiro PR de Execution.
     Cole a imagem renderizada acima do details, quando existir. -->

<details>
<summary><strong>Prompt final — arquitetura pretendida</strong></summary>

```text
LANGUAGE CONSTRAINT: every visible word inside the generated image must be in Brazilian Portuguese (pt-BR). Do not render English labels.

Crie um infográfico técnico vertical ou 16:9, conforme a densidade necessária, com estética de arquitetura de engenharia: fundo claro, linhas finas, cartões compactos, hierarquia visual forte e cores discretas por status/capacidade.

TÍTULO:
"<nome da spec> — arquitetura pretendida"

SUBTÍTULO:
"<síntese da decisão estrutural>"

OBJETIVO VISUAL:
Representar a arquitetura aprovada após o processo decisório, antes do início da implementação.

BLOCO 1 — "De onde viemos"
- <item anterior 1>
- <item anterior 2>
- <item anterior 3>

Marcar:
- concluído;
- ativo;
- eliminado;
- substituído.

BLOCO 2 — "Objetivo da reestruturação"
"<objetivo arquitetural principal>"

Invariantes:
- <invariante 1>
- <invariante 2>
- <invariante 3>
- <invariante 4>

BLOCO 3 — "Topologia da spec"

Para cada nó:
- identificador;
- nome curto;
- capacidade entregue;
- responsabilidade;
- dependências;
- reuso;
- status.

Use:
- setas sólidas para dependência direta;
- setas tracejadas para reuso/dependência indireta;
- cores diferentes para concluído, ativo, planejado, próximo e eliminado.

BLOCO 4 — "O que mudou"
- <elemento eliminado>
- <elemento promovido>
- <elemento derivado>
- <elemento movido>
- <mudança de SSOT>

BLOCO 5 — "Faixa paralela"
- <item paralelo 1>
- <item paralelo 2>
- <item paralelo 3>

Marcar:
"ortogonal à topologia principal — não bloqueante"

BLOCO 6 — "Dependências e reuso"
- <dependência 1>
- <dependência 2>
- <componente reutilizado>
- <ADR relevante>

BLOCO 7 — "Como acompanhar o progresso"
- state.yml → estado dos nós
- plan.md → visão atualizada
- tasks.md → execução
- reviews/gates → evidências
- validate → contratos

BLOCO 8 — "Não reabrir"
- <decisão 1>
- <decisão 2>
- <decisão 3>

PAINEL FINAL — "Próximo passo imediato"
"<próximo nó/checkpoint autorizado>"

RODAPÉ:
"<mensagem que resume a arquitetura aprovada>"

RESTRIÇÕES:
- Usar somente decisões aprovadas em spec/ADR/state.yml.
- Não inventar nós, dependências ou status.
- state.yml § topology vence qualquer narrativa.
- Diferenciar decidido, planejado, eliminado e fora de escopo.
- Não usar mascotes, logos de fornecedores ou linguagem promocional.
- Não usar gradientes decorativos.
```

</details>

## Escopo

<details>
<summary><strong>Escopo técnico e limites</strong></summary>

<!--
Esta seção fica recolhida para manter a leitura humana focada em valor,
decisões, evidências e impactos. Agentes/revisores podem abrir para auditar
fronteiras de implementação.
-->

### Dentro do escopo

-

### Fora do escopo

-

</details>

## Evidências e falsificação

<!-- Falsifications/insights/research que sustentam (ou falsificaram) as decisões. -->

## Impactos downstream

<!-- Consumidores via adopt, breaking changes, migrações necessárias. -->

## Validação, evidências e checklist

### Evidências e gates

- Gate de research:
- Human Gate:
- CI:

### Checklist operacional

- [ ] Formatação verde
- [ ] Validação canônica verde
- [ ] Commits atômicos
- [ ] Sem secrets, credenciais ou contexto pessoal vazado
- [ ] PR body atualizado com estado real

## Cross-refs

- **Spec**:
- **ADRs aplicáveis**:
- **DECs aplicáveis**:
- **Issues/PRs relacionados**:

## Disclosure de IA

Implementação assistida por IA.

<details>
<summary><strong>Disclosure derivado (fatos de processo)</strong></summary>

<!-- fatos-derivados:início -->
<!-- (cole a saída de `npm run disclosure`; vazio até haver revisão registrada em artefato) -->
<!-- fatos-derivados:fim -->

</details>
