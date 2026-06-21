<!--
═════════════════════════════════════════════════════════════════════════════
METADADOS GOVERNADOS DO PR

Título:
  Deve seguir `.core/process/pr-title-conventions.md`.

Tipo do PR:
  Refletido no título por emoji/convenção:
  - 🧾 governance
  - 🛠️ execution
  - 🔗 integration
  - 🚑 fast-track

Perfis de PR body (contrato-base comum + perfil por tipo):
  Este arquivo é o perfil EXECUTION (default). Os demais perfis vivem em
  .github/PULL_REQUEST_TEMPLATE/ e são selecionáveis na criação do PR via
  query param ?template=governance.md | integration.md | fast-track.md.
  O governance-pr-check seleciona o contrato pelo tipo (role na topologia
  do state.yml + label fast-track) — não exige seções de outro perfil.

Stack:
  Refletida no título, branch, base/head e `state.yml § topology`.
  Não liste todas as opções no corpo visível.

Lifecycle:
  Draft/Ready é estado nativo do GitHub.
  Não duplicar como checklist visível.
  Ready ≠ merge autorizado (cf. ADR 0024).
  Antes de converter para Ready: npm run pr-ready:check -- --pr <n>
  (sequência canônica de fechamento: WORKFLOW.md § "Fechamento de PR").

Merge:
  Se a stack estiver em modo unit, este PR NÃO autoriza merge isolado.
  Human Gate pode autorizar próximo checkpoint sem autorizar merge em main.

Comentários HTML:
  São parte intencional do template.
  Não apagar automaticamente ao preencher.
  O humano pode limpar manualmente se quiser.
═════════════════════════════════════════════════════════════════════════════
-->

<!--
═════════════════════════════════════════════════════════════════════════════
GOVERNANÇA VISUAL

Visão pretendida:
  Preencher ao abrir o Draft PR.
  Mostra o problema e a solução pretendida.
  É a BASELINE de intenção do Draft: após preenchida (imagem + prompt),
  atualizações do PR body durante a implementação devem PRESERVÁ-LA —
  nunca reescrever/apagar para refletir o estado atual. Ela existe para
  ser comparada com "Valor entregue" ao final. Se a visão mudar
  excepcionalmente (decisão da owner), adicione um
  "Prompt complementar — atualização de visão pretendida" abaixo do
  baseline, sem apagar o original.

Valor entregue:
  Preencher ao final, antes de entregar para revisão final / Human Gate.
  Mostra o antes/depois real do slice entregue.

Seções por mutabilidade (enforçado por `npm run pr-body:update` — FU-1):
  Preservada por padrão: "Visão pretendida" (baseline do Draft).
  Atualizáveis na implementação: "Resumo", "Escopo", "Test plan",
    "Validação, evidências e checklist", "Cross-refs", "Disclosure de IA".
  Preenchida ao final: "Valor entregue".

Imagens:
  A imagem renderizada é recomendada, mas o prompt final paste-ready é o
  artefato mínimo preservado quando o gerador estiver indisponível.

Prompts complementares:
  Use um `<details>` separado para cada prompt complementar.
  Não usar `<details open>`.
═════════════════════════════════════════════════════════════════════════════
-->

## Visão pretendida

<!--
Preencher ao abrir o Draft PR.

Inclua:
- imagem principal, se já existir; e/ou
- prompt final paste-ready.

Objetivo: deixar claro o que este PR pretende entregar antes da implementação.

BASELINE: depois de preenchida, esta seção é preservada até o fim do PR —
atualizações de body (manuais ou por agente) não devem reescrevê-la nem
remover a imagem/prompt originais. Mudança excepcional de visão entra como
"Prompt complementar — atualização de visão pretendida", mantendo o baseline.
-->

<!-- Cole a imagem principal aqui, quando existir. -->

<details>
<summary><strong>Prompt final — visão pretendida</strong></summary>

```text
<prompt pronto para colar no gerador>
```

</details>

## Resumo

<!--
Explique a intenção humana do PR:
- o que este PR tenta mudar;
- por que importa;
- qual fluxo humano/agente melhora.

Não duplique conteúdo de spec.md / decision-brief.md — referencie via Cross-refs.
Se houver impacto downstream (consumidores via `adopt`, breaking changes,
migração necessária), descreva explicitamente aqui.
-->

## Escopo

<details>
<summary><strong>Detalhes de escopo e limites</strong></summary>

### Dentro do escopo

-

### Fora do escopo

-

</details>

## Valor entregue

<!--
Preencher ao final, antes de entregar para revisão final / Human Gate.
Mostra o antes/depois real do slice entregue (sintomas → capacidades).
Em Draft este slot pode permanecer como placeholder.
-->

<!-- Cole a imagem principal aqui, quando existir. -->

<details>
<summary><strong>Prompt final — valor entregue</strong></summary>

```text
<prompt pronto para colar no gerador>
```

</details>

<details>
<summary><strong>Prompt complementar (opcional — um detalhe por bloco)</strong></summary>

```text
<prompt complementar, quando necessário>
```

</details>

## Test plan

<!--
Como o reviewer valida? Comandos chave + 1-2 observações.
Para runtime/wizard/UX: explique o caminho de uso real, não apenas "tests green".
Para governance: cite os artefatos que mudam de estado (DECs, ADRs, status agregado).
-->

```bash
<comandos de validação>
```

## Validação, evidências e checklist

### Evidências e gates

- Technical Audit:
- Architectural Review:
- Human Gate:
- Merge:
- CI:

### Checklist operacional

- [ ] Formatação verde
- [ ] Validação canônica verde
- [ ] Commits atômicos
- [ ] Sem secrets, credenciais ou contexto pessoal vazado
- [ ] PR body atualizado com estado real
- [ ] Fora de escopo registrado

## Cross-refs

- **Spec**:
- **ADRs aplicáveis**:
- **DECs aplicáveis**:
- **Issues/PRs relacionados**:

## Disclosure de IA

Implementação assistida por IA.

<!--
A linha acima é EDITORIAL — frase padrão do template, editável. Não é dado
governado, schema nem check. Se este PR for puro-humano, edite/remova.

Os FATOS DE PROCESSO abaixo são DERIVADOS de reviews/gates via topologia
(G07), não escritos à mão. Para PRs de spec, gere e cole dentro dos
marcadores:

  npm run disclosure
-->

<details>
<summary><strong>Disclosure derivado (fatos de processo)</strong></summary>

<!-- fatos-derivados:início -->
<!-- (cole a saída de `npm run disclosure`; vazio até haver revisão registrada em artefato) -->
<!-- fatos-derivados:fim -->

</details>

<details>
<summary><strong>Notas qualitativas (opcional — divergências, segunda opinião, nuance)</strong></summary>

<!--
Só o que a evidência derivada NÃO captura (julgamento humano):
- divergências documentadas (onde escolheu A vs B, citação do raciocínio);
- gates humanos por commit (CORE-07/14).
-->

</details>
